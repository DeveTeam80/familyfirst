// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary"; // Import the helper

// Type for session user
interface SessionUser {
  id?: string;
}

// Type for update data
interface PostUpdateData {
  content?: string;
  tags?: string[];
  eventDate?: Date | null;
  photos?: {
    deleteMany: Record<string, never>;
    create?: Array<{
      url: string;
      familyId: string;
      cloudinaryId: string;
    }>;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Changed to Promise
) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as SessionUser | undefined;

  try {
    const { id } = await params; // ⭐ Await params
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
            parentId: null,
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check visibility and permissions
    if (post.visibility === "PRIVATE") {
      if (!sessionUser?.id || post.authorId !== sessionUser.id) {
        return NextResponse.json({ error: "Not available publicly" }, { status: 403 });
      }
    }

    if (post.visibility === "FAMILY") {
      if (!sessionUser?.id) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const userFamilies = await prisma.familyMember.findMany({
        where: { userId: sessionUser.id },
        select: { familyId: true },
      });

      const familyIds = userFamilies.map((f) => f.familyId);

      if (!familyIds.includes(post.familyId)) {
        return NextResponse.json({ error: "Not available publicly" }, { status: 403 });
      }
    }

    // Format response with visibility
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
        visibility: post.visibility,
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
          replies: c.replies?.map((r) => ({
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
  { params }: { params: Promise<{ id: string }> } // ⭐ Changed to Promise
) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // ⭐ Await params
    const body = await request.json();
    const { content, tags, imageUrls, eventDate } = body;

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: PostUpdateData = {};

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
      visibility: post.visibility,
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

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch Post + Photos + Check Album Usage
    const post = await prisma.post.findUnique({
      where: { id },
      include: { 
        photos: {
          include: { 
            _count: { select: { albums: true } } // 👈 Vital: Check if used in albums
          }
        } 
      }, 
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 2. Permission Check: Author OR Admin/Owner
    const isAuthor = post.authorId === session.user.id;
    
    const membership = await prisma.familyMember.findFirst({
        where: { userId: session.user.id, familyId: post.familyId },
        select: { role: true }
    });
    const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Smart Photo Cleanup
    if (post.photos && post.photos.length > 0) {
      for (const photo of post.photos) {
        if (photo._count.albums > 0) {
          // ✅ Case A: Photo IS in an album -> SAVE IT
          // We detach it from the post so it stays in the gallery
          await prisma.photo.update({
            where: { id: photo.id },
            data: { postId: null } // Detach from post
          });
        } else {
          // ❌ Case B: Photo is NOT in an album -> DESTROY IT
          
          // Delete from Cloudinary
          if (photo.cloudinaryId && !["uploaded", "manual-update"].includes(photo.cloudinaryId)) {
             await cloudinary.api.delete_resources([photo.cloudinaryId]);
          }
          
          // Delete from Database (Explicitly, to be safe)
          await prisma.photo.delete({ where: { id: photo.id } });
        }
      }
    }

    // 4. Finally, Delete the Post
    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}