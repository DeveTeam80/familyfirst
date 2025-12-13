// src/app/api/user/change-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getUserIdFromRequest } from "@/lib/session";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const raw = (body?.newEmail || "").trim();
    const newEmail = raw.toLowerCase();
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Prevent change to an already-registered email
    const inUse = await prisma.user.findUnique({ where: { email: newEmail } });
    if (inUse) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.emailChange.create({
      data: {
        userId,
        newEmail,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/api/user/confirm-email?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: newEmail,
      subject: "Confirm your new email address",
      html: `<p>Please confirm your new email by clicking the link below:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
    });

    return NextResponse.json({ ok: true, message: "Verification email sent to the new address" });
  } catch (err) {
    console.error("change-email error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
