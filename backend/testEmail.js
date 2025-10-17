// Quick test script to verify Resend email configuration
// Run with: node testEmail.js

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🧪 Testing Resend Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Configuration:');
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   FROM_EMAIL: ${process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev'}`);
  console.log(`   FROM_NAME: ${process.env.NEWSLETTER_FROM_NAME || 'ThreadLMS Newsletter'}\n`);

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in .env file!');
    process.exit(1);
  }

  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'test@example.com';
  
  console.log(`📧 Sending test email to: ${testEmail}\n`);

  try {
    const result = await resend.emails.send({
      from: `${process.env.NEWSLETTER_FROM_NAME || 'ThreadLMS Newsletter'} <${process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: testEmail,
      subject: 'Test Email from ThreadLMS',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your Resend configuration is working.</p>
        <p>If you received this, your email setup is correct!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      `
    });

    console.log('\n📦 Full Response:', JSON.stringify(result, null, 2));

    if (result.error) {
      console.error('\n❌ Error details:', result.error);
    } else if (result.data) {
      console.log('\n✅ Email sent successfully!');
      console.log(`   Email ID: ${result.data.id}`);
      console.log('\n🎉 Your Resend configuration is working correctly!');
      console.log('   Check your inbox (and spam folder) for the test email.');
    }

  } catch (error) {
    console.error('\n❌ Failed to send email:');
    console.error(`   Error: ${error.message}`);
    
    if (error.response?.data) {
      console.error('\n   API Response:', error.response.data);
    }
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Tip: Make sure your RESEND_API_KEY is correct.');
      console.error('   Get your API key from: https://resend.com/api-keys');
    }
  }
}

// Run the test
testEmail();
