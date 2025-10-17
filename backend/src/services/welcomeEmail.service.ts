import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'RESEND_API_KEY');

interface WelcomeEmailParams {
  email: string;
  fullName: string;
  role: string;
}

export const sendWelcomeEmail = async ({ email, fullName, role }: WelcomeEmailParams): Promise<void> => {
  try {
    const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.NEWSLETTER_FROM_NAME || 'ThreadLMS Newsletter';

    console.log(`📧 Attempting to send welcome email to: ${email}`);
    console.log(`   From: ${fromName} <${fromEmail}>`);

    const htmlContent = generateWelcomeEmailHTML(fullName, role, email);

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: 'Welcome to ThreadLMS Newsletter!',
      html: htmlContent,
    });

    console.log(`✅ Welcome email sent successfully!`);
    console.log(`   Email ID: ${result.data?.id}`);
    console.log(`   Recipient: ${email}`);
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:');
    console.error(`   Recipient: ${email}`);
    console.error(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.error(`   API Response:`, error.response.data);
    }
    // Don't throw error - we don't want to break registration if email fails
  }
};

const generateWelcomeEmailHTML = (fullName: string, role: string, email: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ThreadLMS Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Welcome to ThreadLMS!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${fullName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Welcome to ThreadLMS! We're excited to have you as ${role === 'faculty' ? 'a faculty member' : 'a student'} in our learning community.
              </p>

              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                As a member of ThreadLMS, you've been <strong>automatically subscribed</strong> to our tech newsletter. Here's what you can expect:
              </p>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; margin-bottom: 10px;">
                    <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #667eea;">📬 Every 2 Days</strong><br>
                      <span style="color: #666666; font-size: 14px;">Curated tech news delivered at 9:00 AM IST</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="height: 10px;"></td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; margin-bottom: 10px;">
                    <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #667eea;">🤖 AI-Curated</strong><br>
                      <span style="color: #666666; font-size: 14px;">Top 5-7 stories from Hacker News with AI summaries</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="height: 10px;"></td>
                </tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea;">
                    <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.5;">
                      <strong style="color: #667eea;">💯 Always Free</strong><br>
                      <span style="color: #666666; font-size: 14px;">No subscription fees, included with your account</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                You'll receive your first newsletter within the next 2 days. Stay tuned!
              </p>

              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <em>Pro tip: Add ${process.env.NEWSLETTER_FROM_EMAIL || 'onboarding@resend.dev'} to your contacts to ensure our newsletters never land in spam.</em>
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <a href="https://threadlms.com" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Start Learning
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px; line-height: 1.6;">
                This email was sent to <strong>${email}</strong> because you registered for ThreadLMS.
              </p>
              <p style="margin: 0; color: #999999; font-size: 13px;">
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
};
