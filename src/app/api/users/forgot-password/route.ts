// src/app/api/users/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

// ⭐ SECURITY: Rate limiting - max 3 requests per email per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3;

// ⭐ SECURITY: Clean up old unused tokens (>24 hours)
async function cleanupOldTokens() {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  await prisma.passwordReset.deleteMany({
    where: {
      createdAt: { lt: yesterday },
      usedAt: null,
    },
  });
}

// ⭐ VALIDATION: Check email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // ⭐ VALIDATION: Email format
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // ⭐ EDGE CASE: Prevent malicious inputs
    if (/[<>]/.test(emailLower)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // ⭐ SECURITY: Check rate limit
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentRequests = await prisma.passwordReset.count({
      where: {
        user: { email: emailLower },
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentRequests >= MAX_ATTEMPTS) {
      // Still return success to prevent email enumeration
      console.log(`⚠️ Rate limit hit for ${emailLower}`);
      return NextResponse.json({
        success: true,
        message: "If that email exists, we sent a reset link",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    // ⚠️ SECURITY: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${emailLower}`);
      return NextResponse.json({
        success: true,
        message: "If that email exists, we sent a reset link",
      });
    }

    // ⭐ EDGE CASE: User has no password (OAuth-only account)
    if (!user.passwordHash) {
      console.log(`Password reset requested for OAuth-only account: ${emailLower}`);
      // Still return success but don't send email
      return NextResponse.json({
        success: true,
        message: "If that email exists, we sent a reset link",
      });
    }

    // Generate secure reset token (32 bytes = 256 bits)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // ⭐ CLEANUP: Remove old unused tokens for this user
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Save token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || "User",
      resetUrl,
    });

    console.log(`✅ Password reset email sent to ${emailLower}`);

    // ⭐ BACKGROUND: Clean up old tokens globally (don't await - run async)
    cleanupOldTokens().catch((err) => 
      console.error("Token cleanup error:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}