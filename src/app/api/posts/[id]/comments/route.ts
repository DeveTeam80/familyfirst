// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notifyNewComment } from "@/lib/notifications"; // ⭐ Add import

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
    const body = await request.json();
    const { text, parentId } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }

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

    const comment = await prisma.comment.create({
      data: {
        content: text.trim(),
        userId: session.user.id,
        postId: id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        likes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            likes: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // ⭐ Send notification to post author (only if not commenting on own post)
    if (post.authorId && post.authorId !== session.user.id) {
      await notifyNewComment({
        postId: id,
        postAuthorId: post.authorId,
        commenterId: session.user.id,
        commenterName: session.user.name || "Someone",
        commenterAvatar: session.user.image || undefined,
        commentText: text.trim(),
      });
    }

    return NextResponse.json({
      id: comment.id,
      user: comment.user?.name || "User",
      userId: comment.user?.id,
      avatar: comment.user?.avatarUrl || null,
      text: comment.content,
      likes: comment.likes.length,
      likedBy: comment.likes.map(l => l.userId),
      replies: comment.replies.map(r => ({
        id: r.id,
        user: r.user?.name || "User",
        userId: r.user?.id,
        avatar: r.user?.avatarUrl || null,
        text: r.content,
        likes: r.likes.length,
        likedBy: r.likes.map(l => l.userId),
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}