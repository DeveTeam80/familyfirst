import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMagicToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { InviteEmail } from "@/emails/InviteEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, treeNodeId, familyId, invitedBy } = body;

    if (!email || !treeNodeId || !familyId || !invitedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Check if invite already exists and active
    const existing = await prisma.invitation.findFirst({
      where: {
        email,
        familyId,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An invite is already pending for this user." },
        { status: 400 }
      );
    }

    // 2. Generate magic token
    const token = generateMagicToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    // 3. Create invitation entry
    const invitation = await prisma.invitation.create({
      data: {
        familyId,
        email,
        treeNodeId,
        inviteCode: token, // using token as invite code
        invitedBy,
        expiresAt,
        status: "PENDING",
      },
    });

    // 4. Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?code=${token}`;

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { name: true },
    });

    // 5. Send email
    await sendEmail({
      to: email,
      subject: `You're invited to join ${family?.name} on Family First`,
      html: InviteEmail({
        name: email.split("@")[0],
        familyName: family?.name || "Your Family",
        inviteUrl,
      }),
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
