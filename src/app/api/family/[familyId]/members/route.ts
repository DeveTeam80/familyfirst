// src/app/api/family/[familyId]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session";
import { Prisma } from "@prisma/client"; // 1. Import Prisma types

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
  context: { params: Promise<{ familyId: string }> } // ⭐ Fixed for Next.js 15
) {
  const { familyId } = await context.params; // ⭐ Await params

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
            // adjust name of avatar field to match your schema
            avatarUrl: true,
            username: true, // if present
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // normalize to a safe shape for the client
    // ⭐ Use typed members instead of any
    const payload = (members as unknown as FamilyMemberWithUser[]).map((m) => ({
      userId: m.userId,
      familyId: m.familyId,
      role: m.role, // OWNER / ADMIN / MEMBER etc (server enum)
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

    return NextResponse.json({ ok: true, family: { id: family.id, name: family.name }, members: payload });
  } catch (err) {
    console.error("[GET /api/family/:id/members] error:", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}

// POST: Add a new member (Family Tree Node) to the family

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await context.params;

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await req.json();
    const { firstName, lastName, gender, birthday, avatar, relativeId, relationType } = body;

    if (!firstName || !relativeId || !relationType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newNode = await prisma.$transaction(async (tx) => {
      // 1. Create the new Node
      const node = await tx.familyTreeNode.create({
        data: {
          firstName,
          lastName,
          gender,
          photoUrl: avatar,
          birthDate: birthday ? new Date(birthday) : null,
          familyId,
          createdBy: requesterId,
        },
      });

      // 2. Prepare Relationships
      // ⭐ FIX: Explicitly type the array using Prisma's input type
      const relationshipsToCreate: Prisma.FamilyRelationshipCreateManyInput[] = [];

      if (relationType === "children") {
        // A. Link to the selected Parent (The one you clicked)
        relationshipsToCreate.push(
          { person1Id: relativeId, person2Id: node.id, relationshipType: "PARENT" },
          { person1Id: node.id, person2Id: relativeId, relationshipType: "CHILD" }
        );

        // B. ⭐ FIX: Find if this parent has a SPOUSE and link them too
        const spouses = await tx.familyRelationship.findMany({
          where: {
            person1Id: relativeId,
            relationshipType: "SPOUSE",
          },
          select: { person2Id: true }, // Get the spouse's ID
        });

        for (const spouse of spouses) {
          relationshipsToCreate.push(
            { person1Id: spouse.person2Id, person2Id: node.id, relationshipType: "PARENT" },
            { person1Id: node.id, person2Id: spouse.person2Id, relationshipType: "CHILD" }
          );
        }
      } 
      else if (relationType === "parents") {
        // Link New Node (Parent) <-> Relative (Child)
        relationshipsToCreate.push(
          { person1Id: node.id, person2Id: relativeId, relationshipType: "PARENT" },
          { person1Id: relativeId, person2Id: node.id, relationshipType: "CHILD" }
        );
        // Note: We usually don't auto-link parents to spouses implicitly 
        // because biological parents might not be the current spouses.
      } 
      else if (relationType === "spouses") {
        // Link New Node <-> Relative
        relationshipsToCreate.push(
          { person1Id: relativeId, person2Id: node.id, relationshipType: "SPOUSE" },
          { person1Id: node.id, person2Id: relativeId, relationshipType: "SPOUSE" }
        );
      }

      // 3. Create all links
      if (relationshipsToCreate.length > 0) {
        // ⭐ FIX: Removed 'as any' cast. The array is now properly typed.
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