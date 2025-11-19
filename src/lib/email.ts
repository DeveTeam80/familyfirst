// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
  cc,
  bcc,
}: SendEmailOptions) {
  try {
    const fromEmail = from || process.env.RESEND_FROM_EMAIL || "FirstFamily <noreply@firstfamily.com>";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo && { replyTo }),
      ...(cc && { cc: Array.isArray(cc) ? cc : [cc] }),
      ...(bcc && { bcc: Array.isArray(bcc) ? bcc : [bcc] }),
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("✅ Email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail({
  to,
  recipientName,
  familyName,
  inviterName,
  inviteUrl,
  expiresAt,
}: {
  to: string;
  recipientName: string;
  familyName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}) {
  const { InviteEmail } = await import("@/emails/InviteEmail");

  return sendEmail({
    to,
    subject: `You're invited to join ${familyName} on FirstFamily`,
    html: InviteEmail({
      recipientName,
      familyName,
      inviterName,
      inviteUrl,
      expiresAt,
    }),
  });
}

/**
 * Send welcome email after registration
 */
export async function sendWelcomeEmail({
  to,
  name,
  familyName,
}: {
  to: string;
  name: string;
  familyName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      margin: 0;
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
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
      color: #2d3748;
    }
    .content h2 {
      color: #1a202c;
      margin-top: 0;
    }
    .content ul {
      line-height: 1.8;
      padding-left: 20px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      color: #718096;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to FirstFamily!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name}!</h2>
      <p>Welcome to <strong>${familyName}</strong> on FirstFamily! 🌳</p>
      <p>You're now part of your family's digital home. Here's what you can do:</p>
      <ul>
        <li>📸 Share photos and memories</li>
        <li>🌳 Explore your family tree</li>
        <li>📅 Stay updated on family events</li>
        <li>👨‍👩‍👧‍👦 Connect with relatives</li>
        <li>🍳 Share and discover family recipes</li>
      </ul>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/feed" class="button">
          Get Started →
        </a>
      </div>
    </div>
    <div class="footer">
      <p><strong>FirstFamily</strong> - Bringing families closer, one memory at a time</p>
      <p style="margin-top: 10px;">© ${new Date().getFullYear()} FirstFamily. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to ${familyName} on FirstFamily! 🎉`,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      margin: 0;
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
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
      color: #2d3748;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .warning {
      background: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
      color: #c53030;
    }
    .footer {
      background: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      color: #718096;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Reset Your Password</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your password for FirstFamily. Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">
          Reset Password →
        </a>
      </div>
      <div class="warning">
        <strong>⏰ This link expires in 1 hour</strong>
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 30px;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      <p><strong>FirstFamily</strong> - Bringing families closer</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: "Reset your FirstFamily password 🔒",
    html,
  });
}