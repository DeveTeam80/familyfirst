// src/app/api/family/[familyId]/tree/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { RelationshipType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  const { familyId } = await params;

  try {
    const membership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: user.id,
          familyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 }
      );
    }

    // ⭐ OPTIMIZED: Use select instead of include to fetch only needed fields
    const nodes = await prisma.familyTreeNode.findMany({
      where: { familyId },
      select: {
        // Only fetch fields we actually use
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        deathDate: true,
        weddingAnniversary: true,
        photoUrl: true,
        relationshipsFrom: {
          select: {
            relationshipType: true,
            person2Id: true,
            // Don't fetch id, createdAt, person1Id - we don't need them
          },
        },
        relationshipsTo: {
          select: {
            relationshipType: true,
            person1Id: true,
            // Don't fetch id, createdAt, person2Id - we don't need them
          },
        },
      },
    });

    // Transform to family-chart format (same as before)
    const formatted = nodes.map((node) => {
      const parents = new Set<string>();
      const children = new Set<string>();
      const spouses = new Set<string>();

      // Process Outgoing Relationships
      for (const rel of node.relationshipsFrom) {
        if (rel.relationshipType === RelationshipType.PARENT) {
          children.add(rel.person2Id);
        } else if (rel.relationshipType === RelationshipType.SPOUSE) {
          spouses.add(rel.person2Id);
        }
      }

      // Process Incoming Relationships
      for (const rel of node.relationshipsTo) {
        if (rel.relationshipType === RelationshipType.PARENT) {
          parents.add(rel.person1Id);
        } else if (rel.relationshipType === RelationshipType.SPOUSE) {
          spouses.add(rel.person1Id);
        }
      }

      return {
        id: node.id,
        userId: node.userId,
        data: {
          "first name": node.firstName,
          "last name": node.lastName ?? undefined,
          birthday: node.birthDate
            ? node.birthDate.getFullYear().toString()
            : undefined,
          avatar: node.photoUrl ?? undefined,
          gender: node.gender === "F" ? "F" : "M",
          deathDate: node.deathDate 
            ? node.deathDate.toISOString().split('T')[0] 
            : undefined,
          weddingAnniversary: node.weddingAnniversary 
            ? node.weddingAnniversary.toISOString().split('T')[0] 
            : undefined,
        },
        rels: {
          parents: parents.size ? [...parents] : undefined,
          children: children.size ? [...children] : undefined,
          spouses: spouses.size ? [...spouses] : undefined,
        },
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching family tree:", error);
    return NextResponse.json(
      { error: "Failed to fetch family tree" },
      { status: 500 }
    );
  }
}