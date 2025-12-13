// src/app/api/family/[familyId]/demote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  context: { params: { familyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const requesterId = session.user.id;
    const { familyId } = context.params;

    const body = await req.json().catch(() => null);
    const targetUserId = body?.userId;

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (targetUserId === requesterId) {
      return NextResponse.json(
        { error: "You cannot demote yourself" },
        { status: 400 }
      );
    }

    // Check requester role
    const requesterMembership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: { userId: requesterId, familyId },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the family owner can demote members" },
        { status: 403 }
      );
    }

    // Check target membership
    const targetMembership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: { userId: targetUserId, familyId },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Target user is not a member of this family" },
        { status: 404 }
      );
    }

    if (targetMembership.role === "OWNER") {
      return NextResponse.json(
        { error: "Owner cannot be demoted" },
        { status: 400 }
      );
    }

    // Update → demote to MEMBER
    await prisma.familyMember.update({
      where: {
        userId_familyId: { userId: targetUserId, familyId },
      },
      data: { role: "MEMBER" },
    });

    return NextResponse.json({
      success: true,
      message: "User demoted to MEMBER successfully",
    });
  } catch (err: any) {
    console.error("DEMOTE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
