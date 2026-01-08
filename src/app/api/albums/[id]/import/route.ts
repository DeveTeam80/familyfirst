import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { photoIds } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "No photos selected" }, { status: 400 });
    }

    // 1. Verify Album exists
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    // 2. Validate Photos Exist (Fixes Case #2: Deleted Source Crash)
    const validPhotos = await prisma.photo.findMany({
      where: { id: { in: photoIds } },
      include: { post: true }
    });

    if (validPhotos.length === 0) {
      return NextResponse.json({ error: "No valid photos found to import" }, { status: 400 });
    }

    // 3. Self-Healing Loop (Fixing Missing Uploaders)
    for (const photo of validPhotos) {
      if (!photo.uploadedBy && photo.post?.authorId) {
        // Check if author still exists to avoid FK error
        const authorExists = await prisma.user.findUnique({ where: { id: photo.post.authorId }});
        if (authorExists) {
             await prisma.photo.update({
                where: { id: photo.id },
                data: { uploadedBy: photo.post.authorId },
             });
        }
      }
    }

    // 4. Calculate Order (Fixes Case #3: Jumbled Sorting)
    const lastPhoto = await prisma.albumPhoto.findFirst({
        where: { albumId },
        orderBy: { order: 'desc' },
        select: { order: true }
    });
    const nextOrder = (lastPhoto?.order ?? 0) + 1;

    // 5. Prepare Data
    const data = validPhotos.map((photo, index) => ({
      albumId,
      photoId: photo.id,
      addedBy: session.user.id,
      order: nextOrder + index, // Increment order for each new photo
    }));

    // 6. Insert (Handles Case #1: Duplicates)
    const result = await prisma.albumPhoto.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ 
        success: true, 
        count: result.count, // Actual number inserted (excluding duplicates)
        totalRequested: photoIds.length 
    });

  } catch (error) {
    console.error("Error importing photos:", error);
    return NextResponse.json(
      { error: "Failed to import photos" },
      { status: 500 }
    );
  }
}