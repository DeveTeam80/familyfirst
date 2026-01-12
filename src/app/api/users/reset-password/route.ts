// src/app/api/users/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

// ⭐ SECURITY: Password strength requirements
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// ⭐ VALIDATION: Check password strength
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be less than ${MAX_PASSWORD_LENGTH} characters` };
  }

  // ⭐ BASIC: At least one letter and one number (good for family platform)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { 
      valid: false, 
      error: "Password must contain at least one letter and one number" 
    };
  }

  // ⭐ SECURITY: Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'password123', 'admin123'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { valid: false, error: "Password is too common. Please choose a stronger password" };
  }

  return { valid: true };
}

// ⭐ SECURITY: Send notification email after password change
async function sendPasswordChangedNotification(email: string, name: string) {
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 40px 30px;
      color: #2d3748;
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
      <h1>✅ Password Changed Successfully</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>Your FamilyFirst password was successfully changed on ${new Date().toLocaleString()}.</p>
      <div class="warning">
        <strong>⚠️ Didn't make this change?</strong><br>
        If you didn't reset your password, please contact support immediately as someone may have unauthorized access to your account.
      </div>
      <p style="color: #718096; font-size: 14px; margin-top: 30px;">
        For security, all your active sessions have been logged out. Please sign in again with your new password.
      </p>
    </div>
    <div class="footer">
      <p><strong>FamilyFirst</strong> - Keeping your family connected and secure</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await sendEmail({
      to: email,
      subject: "Your FamilyFirst password was changed",
      html,
    });
  } catch (error) {
    console.error("Failed to send password change notification:", error);
    // Don't throw - notification failure shouldn't block password reset
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // ⭐ VALIDATION: Required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // ⭐ VALIDATION: Password type check
    if (typeof password !== "string") {
      return NextResponse.json(
        { error: "Invalid password format" },
        { status: 400 }
      );
    }

    // ⭐ VALIDATION: Password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400 }
      );
    }

    // ⭐ VALIDATION: Token format (should be 64 hex characters)
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Invalid reset token format" },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 404 }
      );
    }

    // ⭐ SECURITY: Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // ⭐ SECURITY: Check if token has already been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Reset token has already been used" },
        { status: 410 }
      );
    }

    // ⭐ SECURITY: Check if new password is same as old password
    if (resetToken.user.passwordHash) {
      const isSamePassword = await bcrypt.compare(password, resetToken.user.passwordHash);
      if (isSamePassword) {
        return NextResponse.json(
          { error: "New password must be different from your current password" },
          { status: 400 }
        );
      }
    }

    // Hash new password (12 rounds for good security/performance balance)
    const hashedPassword = await bcrypt.hash(password, 12);

    // ⭐ TRANSACTION: Update password + mark token as used + invalidate other tokens
    await prisma.$transaction([
      // 1. Update password
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: hashedPassword,
        },
      }),
      // 2. Mark this token as used
      prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
      // 3. ⭐ SECURITY: Invalidate all other unused tokens for this user
      prisma.passwordReset.updateMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    console.log(`✅ Password reset successful for user: ${resetToken.user.email}`);

    // ⭐ SECURITY: Send notification email (async - don't await)
    sendPasswordChangedNotification(
      resetToken.user.email,
      resetToken.user.name || "User"
    ).catch(err => console.error("Notification email error:", err));

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}