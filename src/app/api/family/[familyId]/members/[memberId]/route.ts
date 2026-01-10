// src/app/api/family/[familyId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session";
import cloudinary, { getPublicIdFromUrl } from "@/lib/cloudinary"; // 👈 Import helper

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
      avatar, // This is the NEW URL
      deathDate, 
      weddingAnniversary 
    } = body;

    // ⭐ NEW: Cloudinary Cleanup Logic
    // If we have a new avatar, and there was an old one, and they are different...
    if (avatar && existingNode.photoUrl && avatar !== existingNode.photoUrl) {
       const publicId = getPublicIdFromUrl(existingNode.photoUrl);
       if (publicId) {
          try {
             await cloudinary.uploader.destroy(publicId);
          } catch (e) {
             console.error("Failed to delete old member photo", e);
          }
       }
    }

    // 3. Update in Database
    const updatedNode = await prisma.familyTreeNode.update({
      where: { id: memberId },
      data: {
        firstName,
        lastName,
        gender,
        photoUrl: avatar,
        birthDate: birthday ? new Date(birthday) : null,
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

// DELETE: Remove a member
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ familyId: string; memberId: string }> }
) {
  const { familyId, memberId } = await context.params;

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // 1. Fetch the node FIRST to get the photo URL
    const node = await prisma.familyTreeNode.findUnique({
       where: { id: memberId },
       select: { id: true, photoUrl: true, familyId: true } 
    });

    if (!node || node.familyId !== familyId) {
       return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ⭐ NEW: Cloudinary Cleanup Logic
    if (node.photoUrl) {
       const publicId = getPublicIdFromUrl(node.photoUrl);
       if (publicId) {
          // Fire and forget (don't await blocking the UI response if you want speed, 
          // but awaiting ensures cleanliness)
          await cloudinary.uploader.destroy(publicId).catch(err => 
             console.error("Failed to delete member photo", err)
          );
       }
    }

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