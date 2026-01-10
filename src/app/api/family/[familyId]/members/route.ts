// src/app/api/family/[familyId]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session";
import { Prisma } from "@prisma/client";

// ⭐ Add proper interface for family member with user
interface FamilyMemberWithUser {
  userId: string;
  familyId: string;
  role: string;
  status: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    username: string | null;
  } | null;
}

// GET: Fetch all members of a family
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await context.params;

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // confirm family exists (optional)
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // fetch members with related user data
    const members = await prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            username: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // normalize to a safe shape for the client
    const payload = (members as unknown as FamilyMemberWithUser[]).map((m) => ({
      userId: m.userId,
      familyId: m.familyId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      user: {
        id: m.user?.id,
        name: m.user?.name,
        email: m.user?.email,
        avatarUrl: m.user?.avatarUrl ?? null,
        username: m.user?.username ?? (m.user?.email?.split("@")[0] ?? null),
      },
    }));

    return NextResponse.json({ 
      ok: true, 
      family: { id: family.id, name: family.name }, 
      members: payload 
    });
  } catch (err) {
    console.error("[GET /api/family/:id/members] error:", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}

// POST: Add a new member (Family Tree Node) to the family
// POST: Add a new member (Family Tree Node) to the family
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await context.params;

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      gender,
      birthday,
      avatar,
      deathDate,
      weddingAnniversary,
      relativeId,
      relationType,
    } = body;

    if (!firstName || !relativeId || !relationType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parseDate = (dateString: string | undefined | null) => {
      if (!dateString) return null;
      return new Date(dateString);
    };

    const newNode = await prisma.$transaction(async (tx) => {
      // 1. Create the new Node
      const node = await tx.familyTreeNode.create({
        data: {
          firstName,
          lastName: lastName || null,
          gender: gender || "M",
          photoUrl: avatar || null,
          birthDate: parseDate(birthday),
          deathDate: parseDate(deathDate),
          weddingAnniversary: parseDate(weddingAnniversary),
          familyId,
          createdBy: requesterId,
        },
      });

      // 2. Prepare Relationships
      const relationshipsToCreate: Prisma.FamilyRelationshipCreateManyInput[] = [];

      // =========================================================
      // SCENARIO A: Adding a CHILD to a parent
      // =========================================================
      if (relationType === "children") {
        // 1. Link to the selected Parent
        relationshipsToCreate.push(
          { person1Id: relativeId, person2Id: node.id, relationshipType: "PARENT" },
          { person1Id: node.id, person2Id: relativeId, relationshipType: "CHILD" }
        );

        // 2. Auto-Link to the Spouse of the selected parent (The other parent)
        const spouses = await tx.familyRelationship.findMany({
          where: { person1Id: relativeId, relationshipType: "SPOUSE" },
          select: { person2Id: true },
        });

        for (const spouse of spouses) {
          relationshipsToCreate.push(
            { person1Id: spouse.person2Id, person2Id: node.id, relationshipType: "PARENT" },
            { person1Id: node.id, person2Id: spouse.person2Id, relationshipType: "CHILD" }
          );
        }
      } 
      
      // =========================================================
      // SCENARIO B: Adding a PARENT to a child
      // =========================================================
      else if (relationType === "parents") {
        // 1. Link New Node (Parent) <-> Relative (Child)
        relationshipsToCreate.push(
          { person1Id: node.id, person2Id: relativeId, relationshipType: "PARENT" },
          { person1Id: relativeId, person2Id: node.id, relationshipType: "CHILD" }
        );

        // 2. Find if there is already an existing parent
        const existingParents = await tx.familyRelationship.findMany({
          where: { person2Id: relativeId, relationshipType: "PARENT" },
          select: { person1Id: true },
        });

        if (existingParents.length === 1) {
          const existingParentId = existingParents[0].person1Id;
          
          // 3. Auto-link parents as SPOUSES
          const existingSpouseLink = await tx.familyRelationship.findFirst({
            where: { person1Id: node.id, person2Id: existingParentId, relationshipType: "SPOUSE" },
          });

          if (!existingSpouseLink) {
            relationshipsToCreate.push(
              { person1Id: node.id, person2Id: existingParentId, relationshipType: "SPOUSE" },
              { person1Id: existingParentId, person2Id: node.id, relationshipType: "SPOUSE" }
            );
            console.log(`✅ Auto-linked parents as spouses: ${node.id} ↔ ${existingParentId}`);
          }

          // 4. ⭐ NEW: Auto-link new parent to ALL SIBLINGS
          // Find all children of the *existing parent* (these are siblings of relativeId)
          const siblings = await tx.familyRelationship.findMany({
            where: { 
              person1Id: existingParentId, 
              relationshipType: "PARENT",
              person2Id: { not: relativeId } // Exclude the child we already linked above
            },
            select: { person2Id: true }
          });

          for (const sibling of siblings) {
            relationshipsToCreate.push(
              { person1Id: node.id, person2Id: sibling.person2Id, relationshipType: "PARENT" }, // New Parent -> Sibling
              { person1Id: sibling.person2Id, person2Id: node.id, relationshipType: "CHILD" }   // Sibling -> New Parent
            );
            console.log(`✅ Auto-linked new parent to sibling: ${sibling.person2Id}`);
          }
        }
      } 
      
      // =========================================================
      // SCENARIO C: Adding a SPOUSE
      // =========================================================
      else if (relationType === "spouses") {
        // 1. Create bidirectional spouse relationship
        relationshipsToCreate.push(
          { person1Id: relativeId, person2Id: node.id, relationshipType: "SPOUSE" },
          { person1Id: node.id, person2Id: relativeId, relationshipType: "SPOUSE" }
        );

        // 2. ⭐ NEW: Auto-link new spouse to EXISTING CHILDREN
        // Find all children of the existing partner (relativeId)
        const existingChildren = await tx.familyRelationship.findMany({
          where: { person1Id: relativeId, relationshipType: "PARENT" },
          select: { person2Id: true }
        });

        for (const child of existingChildren) {
          relationshipsToCreate.push(
            { person1Id: node.id, person2Id: child.person2Id, relationshipType: "PARENT" }, // New Spouse -> Child
            { person1Id: child.person2Id, person2Id: node.id, relationshipType: "CHILD" }   // Child -> New Spouse
          );
          console.log(`✅ Auto-linked new spouse to existing child: ${child.person2Id}`);
        }
      }

      // 3. Create all links
      if (relationshipsToCreate.length > 0) {
        await tx.familyRelationship.createMany({
          data: relationshipsToCreate,
        });
      }

      return node;
    });

    return NextResponse.json(newNode);
  } catch (err) {
    console.error("[POST Error]:", err);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}