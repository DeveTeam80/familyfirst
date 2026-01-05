// src/app/api/family/[familyId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session";

// PUT: Update a specific family member
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ familyId: string; memberId: string }> }
) {
  const { familyId, memberId } = await context.params;

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // 1. Check if member exists
    const existingNode = await prisma.familyTreeNode.findUnique({
      where: { id: memberId },
    });

    if (!existingNode || existingNode.familyId !== familyId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { 
      firstName, 
      lastName, 
      gender, 
      birthday, 
      avatar, 
      deathDate, 
      weddingAnniversary 
    } = body;

    // 3. Update in Database
    const updatedNode = await prisma.familyTreeNode.update({
      where: { id: memberId },
      data: {
        firstName,
        lastName,
        gender,
        photoUrl: avatar,
        birthDate: birthday ? new Date(birthday) : null,
        // ⭐ Handle new dates
        deathDate: deathDate ? new Date(deathDate) : null,
        weddingAnniversary: weddingAnniversary ? new Date(weddingAnniversary) : null,
      },
    });

    return NextResponse.json(updatedNode);
  } catch (err) {
    console.error("[PUT /members/:id] error:", err);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a member (Bonus: You will need this eventually!)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ familyId: string; memberId: string }> }
) {
  const { familyId, memberId } = await context.params;

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    await prisma.$transaction(async (tx) => {
       // Delete relationships first
       await tx.familyRelationship.deleteMany({
         where: {
           OR: [{ person1Id: memberId }, { person2Id: memberId }],
         },
       });

       // Delete the node
       await tx.familyTreeNode.delete({
         where: { id: memberId },
       });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /members/:id] error:", err);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}