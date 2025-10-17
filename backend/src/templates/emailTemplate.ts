interface Story {
  title: string;
  url: string;
  summary: string;
  points?: number;
}

export function generateNewsletterHTML(
  stories: Story[],
  aiIntro: string
): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
                ${aiIntro}
              </p>
            </td>
          </tr>
          
          <!-- Stories -->
          ${stories.map((story, index) => `
          <tr>
            <td style="padding: 0 20px 30px 20px; ${index < stories.length - 1 ? 'border-bottom: 1px solid #dddddd;' : ''}">
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
          `).join('')}
          
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
  `.trim();
}
