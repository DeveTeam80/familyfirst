// src/app/api/albums/[id]/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// POST bulk upload images to album
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      where: { id: params.id },
      include: { 
        calendarEvent: {
          select: { id: true }
        }
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const body = await req.json();
    const { images } = body; // Array of { url, title?, description?, caption? }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Images array is required" },
        { status: 400 }
      );
    }

    // Get the current max order in this album
    const maxOrderResult = await prisma.albumPhoto.aggregate({
      where: { albumId: params.id },
      _max: { order: true },
    });
    
    let currentOrder = (maxOrderResult._max.order || 0) + 1;

    // Create photos and link to album
    const createdPhotos = await Promise.all(
      images.map(async (img: any, index: number) => {
        // First create the photo
        const photo = await prisma.photo.create({
          data: {
            url: img.url,
            cloudinaryId: img.cloudinaryId || "uploaded",
            caption: img.caption || null,
            familyId: album.familyId,
            uploadedBy: user.id,
          },
        });

        // Then create the album-photo relationship
        const albumPhoto = await prisma.albumPhoto.create({
          data: {
            albumId: params.id,
            photoId: photo.id,
            caption: img.caption || null,
            order: currentOrder + index,
            addedBy: user.id,
          },
          include: {
            photo: true,
          },
        });

        return albumPhoto;
      })
    );

    // Update album cover if not set
    if (!album.coverImage && images.length > 0) {
      await prisma.album.update({
        where: { id: params.id },
        data: { coverImage: images[0].url },
      });
    }

    return NextResponse.json({
      success: true,
      count: createdPhotos.length,
      photos: createdPhotos,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}