// src/app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notifyPostLike } from "@/lib/notifications"; // ⭐ Add import

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // ⭐ Get post details first (needed for notification)
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

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

      // ⭐ Send notification to post author
      if (post.authorId && post.authorId !== session.user.id) {
        await notifyPostLike({
          postId: id,
          postAuthorId: post.authorId,
          likerUserId: session.user.id,
          likerName: session.user.name || "Someone",
          likerAvatar: session.user.image || undefined,
        });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}