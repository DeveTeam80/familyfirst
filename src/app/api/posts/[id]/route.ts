// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Visibility } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true 
          } 
        },
        photos: true,
        reactions: {
          select: {
            userId: true,
            type: true,
          },
        },
        comments: {
          where: {
            parentId: null, // ⭐ Only get top-level comments
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
            replies: { // ⭐ Include nested replies
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // ⭐ Check visibility and permissions
    if (post.visibility === "PRIVATE") {
      // Only author can see private posts
      if (!session?.user?.id || post.authorId !== session.user.id) {
        return NextResponse.json({ error: "Not available publicly" }, { status: 403 });
      }
    }

    if (post.visibility === "FAMILY") {
      // Must be logged in and in same family
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const userFamilies = await prisma.familyMember.findMany({
        where: { userId: session.user.id },
        select: { familyId: true },
      });

      const familyIds = userFamilies.map((f) => f.familyId);

      if (!familyIds.includes(post.familyId)) {
        return NextResponse.json({ error: "Not available publicly" }, { status: 403 });
      }
    }

    // ⭐ Format response with visibility
    const response = {
      post: {
        id: post.id,
        userId: post.author?.id ?? "",
        user: post.author?.name ?? "Unknown",
        avatar: post.author?.avatarUrl ?? null,
        content: post.content ?? "",
        tags: post.tags ?? [],
        image: post.photos?.[0]?.url ?? null,
        images: post.photos?.map((p) => p.url) ?? [],
        visibility: post.visibility, // ⭐ Include visibility
        date: post.createdAt.toISOString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        likes: post.reactions.filter((r) => r.type === "LIKE").length,
        likedBy: post.reactions.filter((r) => r.type === "LIKE").map((r) => r.userId),
        comments: post.comments.map((c) => ({
          id: c.id,
          user: c.user?.name ?? "Unknown",
          userId: c.user?.id,
          avatar: c.user?.avatarUrl ?? null,
          text: c.content,
          likes: c.likes?.length || 0,
          likedBy: c.likes?.map((l) => l.userId) || [],
          createdAt: c.createdAt.toISOString(),
          replies: c.replies?.map((r) => ({ // ⭐ Include replies
            id: r.id,
            user: r.user?.name ?? "Unknown",
            userId: r.user?.id,
            avatar: r.user?.avatarUrl ?? null,
            text: r.content,
            likes: r.likes?.length || 0,
            likedBy: r.likes?.map((l) => l.userId) || [],
            createdAt: r.createdAt.toISOString(),
          })) || [],
        })),
        eventDate: post.eventDate ? post.eventDate.toISOString() : null,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("public posts GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { content, tags, imageUrls, eventDate } = body;

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};

    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (eventDate !== undefined) {
      updateData.eventDate = eventDate ? new Date(eventDate) : null;
    }

    if (imageUrls !== undefined) {
      updateData.photos = {
        deleteMany: {},
        ...(imageUrls && imageUrls.length > 0
          ? {
              create: imageUrls.map((url: string) => ({
                url: url,
                familyId: existingPost.familyId,
                cloudinaryId: "manual-update",
              })),
            }
          : {}),
      };
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        photos: true,
        reactions: {
          select: { userId: true, type: true },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: post.id,
      userId: post.author?.id || "",
      user: post.author?.name || "User",
      username: post.author?.name?.toLowerCase().replace(/\s+/g, "") || "user",
      avatar: post.author?.avatarUrl || null,
      content: post.content,
      tags: post.tags,
      image: post.photos?.[0]?.url || null,
      images: post.photos?.map((p) => p.url) || [],
      visibility: post.visibility, // ⭐ Include visibility
      eventDate: post.eventDate?.toISOString(),
      likes: post.reactions.filter((r) => r.type === "LIKE").length,
      likedBy: post.reactions.filter((r) => r.type === "LIKE").map((r) => r.userId),
      comments: post.comments.map((c) => ({
        id: c.id,
        user: c.user?.name || "User",
        avatar: c.user?.avatarUrl || null,
        text: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
      date: new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}