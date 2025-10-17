// Test script to send actual newsletter with real data
require('dotenv').config();
const axios = require('axios');
const { Resend } = require('resend');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fetch Hacker News stories
async function fetchHackerNewsStories() {
  console.log('📰 Fetching stories from Hacker News...');
  
  const rssUrl = 'https://news.ycombinator.com/rss';
  const rss2jsonKey = process.env.RSS2JSON_API_KEY || '';
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}${rss2jsonKey ? `&api_key=${rss2jsonKey}` : ''}`;
  
  const response = await axios.get(apiUrl, { timeout: 30000 });
  
  const stories = response.data.items.slice(0, 7).map(item => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate
  }));
  
  console.log(`   ✅ Fetched ${stories.length} stories\n`);
  return stories;
}

// Generate AI content
async function generateAIContent(stories) {
  console.log('🤖 Generating AI content with Gemini...');
  
  const storiesList = stories.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
  
  const prompt = `You are a professional tech writer curating content for developers. Here are today's Hacker News stories:

${storiesList}

Generate a JSON response with:
1. "subject": A clear, professional subject line (no emojis, no hype)
2. "intro": A natural 2-3 sentence introduction
3. "summaries": An array of summaries for each story (2-3 sentences explaining what it is and why it matters)

Write in a direct, professional tone. Avoid marketing language, exclamation marks, and AI-like enthusiasm. Just explain what's worth knowing.`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const aiContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  
  if (!aiContent) {
    throw new Error('Failed to parse AI response');
  }
  
  console.log(`   ✅ AI content generated`);
  console.log(`   Subject: ${aiContent.subject}\n`);
  
  return {
    subject: aiContent.subject,
    intro: aiContent.intro,
    storiesWithSummaries: stories.map((story, i) => ({
      title: story.title,
      url: story.link,
      summary: aiContent.summaries[i],
      points: Math.floor(Math.random() * 500) + 50 // Mock points
    }))
  };
}

// Generate HTML email (Professional, minimal design)
function generateHTML(content) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const storiesHTML = content.storiesWithSummaries.map((story, index) => `
    <tr>
      <td style="padding: 0 20px 30px 20px; ${index < content.storiesWithSummaries.length - 1 ? 'border-bottom: 1px solid #dddddd;' : ''}">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="30" valign="top">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #000000; font-family: Arial, sans-serif;">
                ${index + 1}.
              </p>
            </td>
            <td valign="top">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; line-height: 1.4; color: #000000;">
                <a href="${story.url}" style="color: #000000; text-decoration: none;" target="_blank">
                  ${story.title}
                </a>
              </h2>
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #555555;">
                ${story.summary}
              </p>
              ${story.points ? `
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #888888; font-family: Arial, sans-serif;">
                ${story.points} points on Hacker News
              </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ThreadLMS Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #ffffff; color: #333333;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; padding: 20px 0;">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px 20px 20px; border-bottom: 2px solid #000000;">
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #000000; letter-spacing: 0.5px;">
                ThreadLMS Newsletter
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #666666; font-family: Arial, sans-serif;">
                ${currentDate}
              </p>
            </td>
          </tr>
          
          <!-- Introduction -->
          <tr>
            <td style="padding: 30px 20px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                ${content.intro}
              </p>
            </td>
          </tr>
          
          <!-- Stories -->
          ${storiesHTML}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px 20px 20px; border-top: 2px solid #000000;">
              <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.6; color: #666666; font-family: Arial, sans-serif;">
                This newsletter is sent every 2 days to help you stay updated with what matters in tech.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; font-family: Arial, sans-serif;">
                <a href="https://threadlms.com" style="color: #000000; text-decoration: underline;">Visit ThreadLMS</a> to continue learning.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, sans-serif;">
                © ${new Date().getFullYear()} ThreadLMS. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;
}

// Main test function
async function testRealNewsletter() {
  console.log('🧪 Testing Real Newsletter with Actual Data\n');
  console.log('═'.repeat(50) + '\n');
  
  const testEmail = process.argv[2] || 'fordesigteam26@gmail.com';
  
  try {
    // Step 1: Fetch stories
    const stories = await fetchHackerNewsStories();
    
    // Step 2: Generate AI content
    const aiContent = await generateAIContent(stories);
    
    // Step 3: Generate HTML
    const html = generateHTML(aiContent);
    
    // Step 4: Send email
    console.log(`📧 Sending newsletter to: ${testEmail}...`);
    console.log(`   From: ${process.env.NEWSLETTER_FROM_NAME} <${process.env.NEWSLETTER_FROM_EMAIL}>`);
    
    const result = await resend.emails.send({
      from: `${process.env.NEWSLETTER_FROM_NAME} <${process.env.NEWSLETTER_FROM_EMAIL}>`,
      to: testEmail,
      subject: aiContent.subject,
      html: html
    });
    
    console.log('\n📦 Full Response:', JSON.stringify(result, null, 2));
    
    if (result.data) {
      console.log('\n✅ Newsletter sent successfully!');
      console.log(`   Email ID: ${result.data.id}`);
      console.log(`   Subject: ${aiContent.subject}`);
      console.log(`   Stories: ${stories.length}`);
      console.log('\n🎉 Check your inbox for the newsletter!');
    } else if (result.error) {
      console.error('\n❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Failed to send newsletter:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    if (error.response) {
      console.error(`   Response:`, error.response.data);
    }
  }
}

// Run the test
testRealNewsletter();
