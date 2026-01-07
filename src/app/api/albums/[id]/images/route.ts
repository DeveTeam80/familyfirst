// src/app/api/albums/[id]/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

interface ImageUpload {
  url: string;
  cloudinaryId?: string;
  caption?: string | null;
  title?: string;
  description?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: albumId } = await params;
    
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
      where: { id: albumId },
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
    const { images } = body as { images: ImageUpload[] };

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Images array is required" },
        { status: 400 }
      );
    }

    const maxOrderResult = await prisma.albumPhoto.aggregate({
      where: { albumId },
      _max: { order: true },
    });
    
    const currentOrder = (maxOrderResult._max.order || 0) + 1;

    const createdPhotos = await Promise.all(
      images.map(async (img: ImageUpload, index: number) => {
        const photo = await prisma.photo.create({
          data: {
            url: img.url,
            cloudinaryId: img.cloudinaryId || "uploaded",
            caption: img.caption || null,
            familyId: album.familyId,
            uploadedBy: user.id,
          },
        });

        const albumPhoto = await prisma.albumPhoto.create({
          data: {
            albumId,
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

    if (!album.coverImage && images.length > 0) {
      await prisma.album.update({
        where: { id: albumId },
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