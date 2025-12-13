// src/app/api/user/confirm-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;
    const newPassword = body?.newPassword;
    if (!token || typeof token !== "string") return NextResponse.json({ error: "Missing token" }, { status: 400 });
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const record = await prisma.passwordReset.findUnique({ where: { token } });
    if (!record) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    if (record.usedAt) return NextResponse.json({ error: "Token already used" }, { status: 410 });
    if (record.expiresAt < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 410 });

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash: newHash } }),
      prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true, message: "Password set" });
  } catch (err) {
    console.error("confirm-password error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
