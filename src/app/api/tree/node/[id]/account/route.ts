// src/app/api/tree/node/[id]/account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Changed to Promise
) {
  try {
    const { id: nodeId } = await params; // ⭐ Await params
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