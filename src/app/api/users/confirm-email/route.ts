// src/app/api/user/confirm-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || undefined;
    if (!token) {
      const redirectUrl = new URL('/email-confirmed', request.url);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('msg', encodeURIComponent('Missing token'));
      return NextResponse.redirect(redirectUrl);
    }

    const record = await prisma.emailChange.findUnique({ where: { token } });
    if (!record) {
      const redirectUrl = new URL('/email-confirmed', request.url);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('msg', encodeURIComponent('Invalid token'));
      return NextResponse.redirect(redirectUrl);
    }
    if (record.usedAt) {
      const redirectUrl = new URL('/email-confirmed', request.url);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('msg', encodeURIComponent('Token already used'));
      return NextResponse.redirect(redirectUrl);
    }
    if (record.expiresAt < new Date()) {
      const redirectUrl = new URL('/email-confirmed', request.url);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('msg', encodeURIComponent('Token expired'));
      return NextResponse.redirect(redirectUrl);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { email: record.newEmail, emailVerified: new Date() },
      }),
      prisma.emailChange.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Success -> redirect to friendly page
    const successUrl = new URL('/email-confirmed', request.url);
    successUrl.searchParams.set('status', 'ok');
    successUrl.searchParams.set('msg', encodeURIComponent('Email confirmed and updated'));
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("confirm-email error", err);
    const redirectUrl = new URL('/email-confirmed', request.url);
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('msg', encodeURIComponent('Internal error'));
    return NextResponse.redirect(redirectUrl);
  }
}
