// src/app/api/tree/node/[id]/account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nodeId = params?.id;
    if (!nodeId) {
      return NextResponse.json({ error: "Missing node id" }, { status: 400 });
    }

    // Tell TS exactly what shape we expect back from Prisma
    type NodeWithUser = Prisma.FamilyTreeNodeGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            username: true; // only if username exists on your model
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
            username: true, // OK if column exists; returns null if missing
          },
        },
      },
    })) as NodeWithUser | null;

    if (!node) {
      return NextResponse.json({ error: "Tree node not found" }, { status: 404 });
    }

    if (node.user) {
      // return the username if present, else fallback to name / id
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
