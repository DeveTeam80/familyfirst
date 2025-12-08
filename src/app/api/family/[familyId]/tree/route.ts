// src/app/api/family/[familyId]/tree/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  // Require authentication
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  const { familyId } = params;

  try {
    // Check if user is member of this family
    const membership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: user.id,
          familyId: familyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 }
      );
    }

    // Fetch tree data
    const treeNodes = await prisma.familyTreeNode.findMany({
      where: { familyId },
      include: {
        relationshipsFrom: true,
        relationshipsTo: true,
      },
    });

    return NextResponse.json(treeNodes);
  } catch (error) {
    console.error("Error fetching tree:", error);
    return NextResponse.json(
      { error: "Failed to fetch family tree" },
      { status: 500 }
    );
  }
}