// src/app/api/invite/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";

interface SendInviteBody {
  email: string;
  treeNodeId: string;
  familyId: string;
  invitedBy: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendInviteBody;
    const { email, treeNodeId, familyId, invitedBy } = body;

    if (!email || !treeNodeId || !familyId || !invitedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. User should login instead." },
        { status: 409 }
      );
    }

    // ⭐ TEMP FIX: Check if tree node exists, if not create it
    let treeNode = await prisma.familyTreeNode.findUnique({
      where: { id: treeNodeId },
      include: { family: { select: { name: true } } },
    });

    if (!treeNode) {
      console.warn(`⚠️ Tree node ${treeNodeId} not found in DB. Creating temporary node...`);
      
      // Create family if it doesn't exist
      let family = await prisma.family.findUnique({
        where: { id: familyId },
      });

      if (!family) {
        family = await prisma.family.create({
          data: {
            id: familyId,
            name: "Demo Family",
            inviteCode: generateInviteCode(),
            createdBy: invitedBy,
          },
        });
      }

      // Create tree node
      treeNode = await prisma.familyTreeNode.create({
        data: {
          id: treeNodeId,
          familyId,
          firstName: "Unknown",
          lastName: "Member",
          createdBy: invitedBy,
        },
        include: { family: { select: { name: true } } },
      });

      console.log(`✅ Created temporary tree node: ${treeNode.id}`);
    }

    if (treeNode.familyId !== familyId) {
      return NextResponse.json(
        { error: "Tree node does not belong to this family" },
        { status: 400 }
      );
    }

    if (treeNode.userId) {
      return NextResponse.json(
        { error: "This family member already has an account" },
        { status: 409 }
      );
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email,
        familyId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        {
          error: "An active invite is already pending for this user",
          inviteCode: existingInvite.inviteCode,
          expiresAt: existingInvite.expiresAt,
        },
        { status: 409 }
      );
    }

    // Generate invite code
    const inviteCode = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        familyId,
        email,
        treeNodeId,
        inviteCode,
        invitedBy,
        expiresAt,
        status: "PENDING",
      },
      include: {
        family: { select: { name: true } },
        treeNode: {
          select: { firstName: true, lastName: true },
        },
        inviter: { select: { name: true } },
      },
    });

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?code=${inviteCode}`;

    // Send email
    await sendInvitationEmail({
      to: email,
      recipientName: invitation.treeNode?.firstName || email.split("@")[0],
      familyName: invitation.family.name,
      inviterName: invitation.inviter.name,
      inviteUrl,
      expiresAt: invitation.expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully ✅",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        inviteCode: invitation.inviteCode,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation. Please try again." },
      { status: 500 }
    );
  }
}