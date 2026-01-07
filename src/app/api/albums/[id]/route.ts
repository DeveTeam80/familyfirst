import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary"; // 👈 Import Cloudinary

// GET single album with photos
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Fixed Type
) {
  const { id } = await params; // ⭐ Await params

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        photos: {
          include: {
            photo: {
              include: {
                uploader: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        calendarEvent: {
          select: {
            id: true,
            title: true,
            startTime: true,
            eventType: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    );
  }
}

// PATCH update album
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Fixed Type
) {
  const { id } = await params; // ⭐ Await params

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Allow Owner OR Admin to edit? (Currently just Owner)
    if (album.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, tags, coverImage } = body;

    const updated = await prisma.album.update({
      where: { id },
      data: {
        title,
        description,
        tags,
        coverImage,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { photos: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  }
}

// DELETE album
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Fixed Type
) {
  const { id } = await params; // ⭐ Await params

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const album = await prisma.album.findUnique({
      where: { id },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    if (album.createdBy !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ⭐ NEW: Cloudinary Cleanup Logic
    // We must delete the specific folder we created for this album
    const folderPath = `firstfamily/albums/${id}`; 
    
    try {
      console.log(`🗑️ Cleaning up Cloudinary folder: ${folderPath}`);
      
      // 1. Delete all images inside the folder
      await cloudinary.api.delete_resources_by_prefix(folderPath);
      
      // 2. Delete the folder itself
      await cloudinary.api.delete_folder(folderPath);
      
    } catch (cleanupError) {
      console.error("Failed to cleanup Cloudinary folder:", cleanupError);
      // We continue anyway to ensure the DB record is deleted
    }

    // Delete from DB
    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json(
      { error: "Failed to delete album" },
      { status: 500 }
    );
  }
}