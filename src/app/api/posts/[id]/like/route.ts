// src/app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Changed to Promise
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // ⭐ Await params

    // Check if already liked
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          userId: session.user.id,
          postId: id,
        },
      },
    });

    if (existingReaction) {
      // Unlike
      await prisma.reaction.delete({
        where: {
          postId_userId: {
            userId: session.user.id,
            postId: id,
          },
        },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.reaction.create({
        data: {
          userId: session.user.id,
          postId: id,
          type: "LIKE",
        },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}