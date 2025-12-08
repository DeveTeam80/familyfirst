// src/app/api/invite/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Invitation code is required" }, { status: 400 });
    }

    // Find invitation by invite code
    const invite = await prisma.invitation.findUnique({
      where: { inviteCode: code },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        treeNode: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Check if invitation exists
    if (!invite) {
      return NextResponse.json({ error: "Invalid invitation code" }, { status: 404 });
    }

    // Check if already accepted
    if (invite.status === "ACCEPTED") {
      return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 });
    }

    // Check if expired
    if (invite.status === "EXPIRED" || (invite.expiresAt && new Date(invite.expiresAt) < new Date())) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    // Check if cancelled
    if (invite.status === "CANCELLED") {
      return NextResponse.json({ error: "This invitation has been cancelled" }, { status: 400 });
    }

    // Return invitation details
    return NextResponse.json({
      valid: true,
      email: invite.email,
      familyId: invite.familyId,
      familyName: invite.family.name,
      treeNodeId: invite.treeNodeId,
      treeNodeName: invite.treeNode
        ? `${invite.treeNode.firstName} ${invite.treeNode.lastName || ""}`.trim()
        : null,
    });
  } catch (error) {
    console.error("❌ Invitation verification error:", error);
    return NextResponse.json({ error: "Failed to verify invitation code" }, { status: 500 });
  }
}