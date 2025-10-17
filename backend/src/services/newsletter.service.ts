import axios from 'axios';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.model';
import Faculty from '../models/Faculty.model';
import NewsletterLog from '../models/NewsletterLog.model';
import { generateNewsletterHTML } from '../templates/emailTemplate';

// Initialize APIs
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface HNStory {
  title: string;
  link: string;
  pubDate: string;
}

interface AIGeneratedContent {
  subject: string;
  intro: string;
  storiesWithSummaries: Array<{
    title: string;
    url: string;
    summary: string;
    points?: number;
  }>;
}

// ============================================
// STEP 1: Fetch Hacker News Stories
// ============================================
async function fetchHackerNewsStories(): Promise<HNStory[]> {
  try {
    console.log('📰 Fetching stories from Hacker News RSS...');
    
    const rssUrl = 'https://news.ycombinator.com/rss';
    const rss2jsonKey = process.env.RSS2JSON_API_KEY || '';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}${rss2jsonKey ? `&api_key=${rss2jsonKey}` : ''}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'ThreadLMS Newsletter Bot'
      }
    });
    
    if (response.data.status !== 'ok') {
      throw new Error(`RSS2JSON API error: ${response.data.message || 'Unknown error'}`);
    }
    
    // Get top 7 stories (good balance for email length)
    const stories = response.data.items.slice(0, 7).map((item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate
    }));
    
    console.log(`✅ Fetched ${stories.length} stories successfully`);
    return stories;
    
  } catch (error: any) {
    console.error('❌ Error fetching HN stories:', error.message);
    
    // Fallback: Return some default tech news
    console.log('⚠️ Using fallback stories...');
    return [
      {
        title: 'Latest Tech Innovations from Hacker News',
        link: 'https://news.ycombinator.com',
        pubDate: new Date().toISOString()
      },
      {
        title: 'Trending Development Tools and Frameworks',
        link: 'https://news.ycombinator.com/newest',
        pubDate: new Date().toISOString()
      },
      {
        title: 'AI and Machine Learning Updates',
        link: 'https://news.ycombinator.com/show',
        pubDate: new Date().toISOString()
      }
    ];
  }
}

// ============================================
// STEP 2: Generate AI Content with Gemini
// Using gemini-1.5-flash (cheaper model)
// ============================================
async function generateAIContent(stories: HNStory[]): Promise<AIGeneratedContent> {
  try {
    console.log('🤖 Generating AI summaries with Gemini 2.0 Flash Lite...');
    
    // Use gemini-2.0-flash-lite for maximum cost efficiency
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    });
    
    const storiesList = stories.map((s, i) => 
      `${i + 1}. ${s.title}\n   URL: ${s.link}`
    ).join('\n\n');
    
    const prompt = `
You are a professional tech writer curating a newsletter for developers and students at ThreadLMS.

Here are ${stories.length} stories from Hacker News:
${storiesList}

Write in a clear, professional tone that respects the reader's intelligence. Avoid marketing language, excessive enthusiasm, or AI-like phrasing.

Tasks:
1. Create a straightforward email subject line (max 60 characters, no emojis unless truly necessary)
2. Write a natural 2-3 sentence introduction that briefly contextualizes today's selection
3. For each story, write a 2-3 sentence summary that:
   - Explains the core idea or development
   - Notes why it might matter to developers
   - Uses direct, clear language (like you're explaining to a colleague)

Return response in this EXACT JSON format (no markdown, no code blocks):
{
  "subject": "Your subject line here",
  "intro": "Your introduction here",
  "stories": [
    {
      "title": "Story title from input",
      "summary": "Your summary here"
    }
  ]
}

Guidelines:
- Write like a human, not a marketing bot
- Avoid phrases like "exciting", "amazing", "cutting-edge", "revolutionize"
- No exclamation marks unless absolutely warranted
- Skip the hype - just explain what's interesting and why
- Be concise and informative
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
      }
    }
    
    const parsed = JSON.parse(jsonText);
    
    // Validate response
    if (!parsed.subject || !parsed.intro || !Array.isArray(parsed.stories)) {
      throw new Error('Invalid AI response structure');
    }
    
    // Combine original stories with AI summaries
    const storiesWithSummaries = stories.map((story, index) => ({
      title: story.title,
      url: story.link,
      summary: parsed.stories[index]?.summary || 'Check out this interesting tech story from Hacker News.',
      points: undefined // We don't extract points for simplicity
    }));
    
    console.log(`✅ AI content generated successfully`);
    console.log(`   Subject: "${parsed.subject}"`);
    
    return {
      subject: parsed.subject,
      intro: parsed.intro,
      storiesWithSummaries
    };
    
  } catch (error: any) {
    console.error('❌ Error generating AI content:', error.message);
    console.log('⚠️ Using fallback content...');
    
    // Fallback: Simple generic summaries
    return {
      subject: 'Tech Highlights from Hacker News',
      intro: "Here are today's top stories from Hacker News. Each selection covers notable developments in software, tools, and industry trends worth your attention.",
      storiesWithSummaries: stories.map(s => ({
        title: s.title,
        url: s.link,
        summary: "This story has been trending in the developer community. Read more to understand its implications and relevance to current tech practices."
      }))
    };
  }
}

// ============================================
// STEP 3: Send Emails in Batches
// ============================================
async function sendEmailsInBatches(
  emails: string[],
  subject: string,
  html: string
): Promise<void> {
  const BATCH_SIZE = 50; // Resend batch limit
  const totalBatches = Math.ceil(emails.length / BATCH_SIZE);
  
  console.log(`📤 Sending emails to ${emails.length} recipients in ${totalBatches} batches...`);
  
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      // Send emails individually in this batch to avoid Resend API limitations
      const sendPromises = batch.map(email =>
        resend.emails.send({
          from: `${process.env.NEWSLETTER_FROM_NAME} <${process.env.NEWSLETTER_FROM_EMAIL}>`,
          to: email,
          subject: subject,
          html: html,
          tags: [
            { name: 'type', value: 'newsletter' },
            { name: 'automated', value: 'true' },
            { name: 'batch', value: batchNumber.toString() }
          ]
        })
      );
      
      await Promise.all(sendPromises);
      
      console.log(`   ✅ Batch ${batchNumber}/${totalBatches} sent (${batch.length} emails)`);
      
      // Rate limiting: wait 1 second between batches to avoid API limits
      if (i + BATCH_SIZE < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error: any) {
      console.error(`   ❌ Failed to send batch ${batchNumber}:`);
      console.error(`      Error: ${error.message}`);
      if (error.response?.data) {
        console.error(`      API Response:`, error.response.data);
      }
      // Continue with other batches even if one fails
    }
  }
  
  console.log('✅ All batches processed');
}

// ============================================
// MAIN: Generate and Send Newsletter
// ============================================
export async function generateAndSendNewsletter(): Promise<{
  success: boolean;
  recipientCount: number;
  message: string;
}> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 NEWSLETTER GENERATION STARTED');
  console.log('='.repeat(60));
  console.log(`⏰ Time: ${new Date().toLocaleString()}\n`);
  
  try {
    // Step 1: Fetch Hacker News stories
    const stories = await fetchHackerNewsStories();
    
    if (stories.length === 0) {
      throw new Error('No stories fetched');
    }
    
    // Step 2: Generate AI content
    const { subject, intro, storiesWithSummaries } = await generateAIContent(stories);
    
    // Step 3: Generate HTML email
    console.log('🎨 Generating HTML email template...');
    const html = generateNewsletterHTML(storiesWithSummaries, intro);
    console.log('✅ HTML template generated');
    
    // Step 4: Get all user emails from MongoDB
    console.log('📧 Fetching user emails from database...');
    
    // Get both students and faculty
    const [students, faculty] = await Promise.all([
      User.find({ email: { $exists: true, $ne: '' } }).select('email').lean(),
      Faculty.find({ email: { $exists: true, $ne: '' } }).select('email').lean()
    ]);
    
    const allUsers = [...students, ...faculty];
    
    const emails = allUsers
      .map((u: any) => u.email)
      .filter((email: string) => {
        // Basic email validation
        return email && 
               typeof email === 'string' && 
               email.includes('@') && 
               email.includes('.') &&
               email.length > 5;
      })
      // Remove duplicates
      .filter((email: string, index: number, self: string[]) => 
        self.indexOf(email) === index
      );
    
    console.log(`✅ Found ${emails.length} valid email addresses`);
    console.log(`   Students: ${students.length}, Faculty: ${faculty.length}`);
    
    if (emails.length === 0) {
      console.log('⚠️ No users to send to. Newsletter cancelled.');
      
      await NewsletterLog.create({
        sentDate: new Date(),
        subject,
        recipientCount: 0,
        storiesCount: storiesWithSummaries.length,
        status: 'failed',
        errorMessage: 'No recipients found'
      });
      
      return {
        success: false,
        recipientCount: 0,
        message: 'No recipients found'
      };
    }
    
    // Step 5: Send emails in batches
    await sendEmailsInBatches(emails, subject, html);
    
    // Step 6: Log success to database
    console.log('💾 Logging newsletter to database...');
    await NewsletterLog.create({
      sentDate: new Date(),
      subject,
      recipientCount: emails.length,
      storiesCount: storiesWithSummaries.length,
      status: 'success'
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ NEWSLETTER SENT SUCCESSFULLY`);
    console.log(`   Recipients: ${emails.length}`);
    console.log(`   Stories: ${storiesWithSummaries.length}`);
    console.log(`   Subject: "${subject}"`);
    console.log('='.repeat(60) + '\n');
    
    return {
      success: true,
      recipientCount: emails.length,
      message: 'Newsletter sent successfully'
    };
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ NEWSLETTER GENERATION FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(60) + '\n');
    
    // Log failure to database
    try {
      await NewsletterLog.create({
        sentDate: new Date(),
        subject: 'Failed to generate',
        recipientCount: 0,
        storiesCount: 0,
        status: 'failed',
        errorMessage: error.message
      });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
    
    return {
      success: false,
      recipientCount: 0,
      message: error.message
    };
  }
}
