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

    const nodes = await prisma.familyTreeNode.findMany({
      where: { familyId },
      select: {
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
          },
        },
        relationshipsTo: {
          select: {
            relationshipType: true,
            person1Id: true,
          },
        },
      },
    });

    // ⭐ FIX: Format dates properly to preserve month and day
    const formatDate = (date: Date | null) => {
      if (!date) return undefined;
      
      // Return full ISO date string (YYYY-MM-DD)
      return date.toISOString().split('T')[0];
    };

    // Transform to family-chart format
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
          // ⭐ FIX: Send full date string in YYYY-MM-DD format
          birthday: formatDate(node.birthDate),
          photoUrl: node.photoUrl,
          avatar: node.photoUrl ?? undefined,
          gender: node.gender === "F" ? "F" : "M",
          deathDate: formatDate(node.deathDate),
          weddingAnniversary: formatDate(node.weddingAnniversary),
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