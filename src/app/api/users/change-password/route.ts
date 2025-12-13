// src/app/api/user/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { getUserIdFromRequest } from "@/lib/session";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const current = body?.current;
    const next = body?.next;
    if (!next || typeof next !== "string" || next.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // If user has password -> require current and update
    if (user.passwordHash) {
      if (!current || typeof current !== "string") {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const ok = await bcrypt.compare(current, user.passwordHash);
      if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 403 });

      const newHash = await bcrypt.hash(next, BCRYPT_ROUNDS);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

      // Optionally: invalidate sessions by your chosen method (tokenVersion or clear cookie)
      return NextResponse.json({ ok: true, message: "Password changed" });
    }

    // User has no password (magic-link-only) -> issue single-use token and email set-password link
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const setPasswordUrl = `${baseUrl}/set-password?token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || "",
      resetUrl: setPasswordUrl,
    });

    return NextResponse.json({ ok: true, message: "Password setup link sent to your email" });
  } catch (err) {
    console.error("change-password error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
