import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { RelationshipType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  // 🔐 Require authentication
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { user } = auth;
  const { familyId } = await params;

  try {
    // 👥 Ensure user belongs to the family
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

    // 🌳 Fetch all nodes with relationships
    const nodes = await prisma.familyTreeNode.findMany({
      where: { familyId },
      include: {
        relationshipsFrom: true,
        relationshipsTo: true,
      },
    });

    // 🔁 Transform → family-chart format (NO duplicates)
    const formatted = nodes.map((node) => {
      const parents = new Set<string>();
      const children = new Set<string>();
      const spouses = new Set<string>();

      // Incoming → parents
      for (const rel of node.relationshipsTo) {
        if (rel.relationshipType === RelationshipType.PARENT) {
          parents.add(rel.person1Id);
        }
      }

      // Outgoing → children
      for (const rel of node.relationshipsFrom) {
        if (rel.relationshipType === RelationshipType.PARENT) {
          children.add(rel.person2Id);
        }
      }

      // SPOUSE (declare once only, stable direction)
      for (const rel of node.relationshipsFrom) {
        if (
          rel.relationshipType === RelationshipType.SPOUSE &&
          node.id < rel.person2Id
        ) {
          spouses.add(rel.person2Id);
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
