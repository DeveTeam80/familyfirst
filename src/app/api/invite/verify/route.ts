// src/app/api/invite/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { inviteCode: code },
      include: {
        family: { select: { name: true, avatarUrl: true } },
        treeNode: {
          select: {
            firstName: true,
            lastName: true,
            birthDate: true,
            gender: true,
            photoUrl: true,
          },
        },
        inviter: {
          select: { name: true, avatarUrl: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invite code", valid: false },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "Invite code has expired", valid: false },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "Invite already accepted", valid: false },
        { status: 409 }
      );
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered. Please login instead.", valid: false },
        { status: 409 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        familyName: invitation.family.name,
        familyAvatar: invitation.family.avatarUrl,
        invitedBy: invitation.inviter.name,
        inviterAvatar: invitation.inviter.avatarUrl,
        treeNode: invitation.treeNode,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json(
      { error: "Failed to verify invite code", valid: false },
      { status: 500 }
    );
  }
}