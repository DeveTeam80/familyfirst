// src/emails/InviteEmail.ts

interface InviteEmailProps {
  recipientName: string;
  familyName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}

export function InviteEmail({
  recipientName,
  familyName,
  inviterName,
  inviteUrl,
  expiresAt,
}: InviteEmailProps): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Invitation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #4a5568;
      margin-bottom: 30px;
    }
    .family-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }
    .info-box {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      font-size: 14px;
      color: #4a5568;
      margin: 4px 0;
    }
    .info-box strong {
      color: #1a202c;
    }
    .footer {
      background: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      font-size: 14px;
      color: #718096;
      margin: 8px 0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .expiry-warning {
      background: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 12px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .expiry-warning p {
      font-size: 14px;
      color: #c53030;
      font-weight: 500;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 20px 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .greeting {
        font-size: 18px;
      }
      .message {
        font-size: 15px;
      }
      .cta-button {
        padding: 14px 32px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>You're Invited!</h1>
      <p>Join your family on FirstFamily</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi ${recipientName},</p>
      
      <p class="message">
        <strong>${inviterName}</strong> has invited you to join 
        <span class="family-badge">${familyName}</span> 
        on FirstFamily — your family's private digital home.
      </p>

      <p class="message">
        Connect with your relatives, share photos and memories, explore your family tree, 
        and stay updated on family events. All in one beautiful, private space.
      </p>

      <div style="text-align: center;">
        <a href="${inviteUrl}" class="cta-button">
          Accept Invitation
        </a>
      </div>

      <div class="info-box">
        <p><strong>What you'll get:</strong></p>
        <p>• Access to your family tree</p>
        <p>• Private family photo gallery</p>
        <p>• Shared family recipes</p>
        <p>• Family calendar & events</p>
        <p>• Private family feed</p>
      </div>

      <div class="expiry-warning">
        <p>This invitation expires on ${expiryDate}</p>
      </div>

      <p class="message" style="margin-top: 30px; font-size: 14px; color: #718096;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>FirstFamily</strong><br/>
        Bringing families closer, one memory at a time
      </p>
      <p style="margin-top: 16px;">
        <a href="https://firstfamily.in">Visit FirstFamily</a>
      </p>
      <p style="margin-top: 8px; font-size: 12px;">
        © ${new Date().getFullYear()} FirstFamily. All rights reserved.<br/>
        firstfamily.in
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}