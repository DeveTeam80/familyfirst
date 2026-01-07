// src/app/api/invite/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      );
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
            birthDate: true,
            deathDate: true,
            weddingAnniversary: true,
          },
        },
      },
    });

    // Check if invitation exists
    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invite.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    if (
      invite.status === "EXPIRED" ||
      (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    ) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Check if cancelled
    if (invite.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This invitation has been cancelled" },
        { status: 400 }
      );
    }

    // Return invitation details including dates
    return NextResponse.json({
      valid: true,
      email: invite.email,
      familyId: invite.familyId,
      familyName: invite.family.name,
      treeNodeId: invite.treeNodeId,
      treeNodeFirstName: invite.treeNode?.firstName ?? null,
      treeNodeLastName: invite.treeNode?.lastName ?? null,
      treeNodeName: invite.treeNode
        ? `${invite.treeNode.firstName} ${invite.treeNode.lastName || ""}`.trim()
        : null,
      // ⭐ NEW: Include dates from tree node
      birthDate: invite.treeNode?.birthDate ?? null,
      weddingAnniversary: invite.treeNode?.weddingAnniversary ?? null,
      deathDate: invite.treeNode?.deathDate ?? null,
    });
  } catch (error) {
    console.error("❌ Invitation verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation code" },
      { status: 500 }
    );
  }
}