// src/app/api/tree/node/[id]/account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nodeId } = await params;
    if (!nodeId) {
      return NextResponse.json({ error: "Missing node id" }, { status: 400 });
    }

    type NodeWithUser = Prisma.FamilyTreeNodeGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            username: true;
          };
        };
      };
    }>;

    const node = (await prisma.familyTreeNode.findUnique({
      where: { id: nodeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    })) as NodeWithUser | null;

    if (!node) {
      return NextResponse.json({ error: "Tree node not found" }, { status: 404 });
    }

    if (node.user) {
      return NextResponse.json({
        exists: true,
        user: {
          id: node.user.id,
          name: node.user.name,
          email: node.user.email,
          username: node.user.username ?? null,
        },
      });
    }

    return NextResponse.json({ exists: false, user: null });
  } catch (err) {
    console.error("Error checking node account:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ⭐ NEW: Manual linking with date sync
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: nodeId } = await params;
    if (!nodeId) {
      return NextResponse.json({ error: "Missing node id" }, { status: 400 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Perform linking and date sync in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get tree node with dates
      const node = await tx.familyTreeNode.findUnique({
        where: { id: nodeId },
        select: {
          id: true,
          birthDate: true,
          deathDate: true,
          weddingAnniversary: true,
          userId: true,
        },
      });

      if (!node) {
        throw new Error("Tree node not found");
      }

      if (node.userId) {
        throw new Error("Tree node already linked to an account");
      }

      // Sync dates to user account
      const dateFields: {
        birthday?: Date | null;
        weddingAnniversary?: Date | null;
        deathDay?: Date | null;
      } = {};

      if (node.birthDate) {
        dateFields.birthday = node.birthDate;
      }
      if (node.weddingAnniversary) {
        dateFields.weddingAnniversary = node.weddingAnniversary;
      }
      if (node.deathDate) {
        dateFields.deathDay = node.deathDate;
      }

      // Update user with dates
      const user = await tx.user.update({
        where: { id: userId },
        data: dateFields,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          birthday: true,
          weddingAnniversary: true,
          deathDay: true,
        },
      });

      // Link tree node to user
      await tx.familyTreeNode.update({
        where: { id: nodeId },
        data: {
          userId: userId,
          isAccountHolder: true,
        },
      });

      return { user, node };
    });

    return NextResponse.json({
      success: true,
      message: "Account linked and dates synced successfully",
      user: result.user,
    });
  } catch (err) {
    console.error("Error linking account:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}