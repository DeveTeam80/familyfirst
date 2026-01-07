import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: albumId, photoId } = await params;

    // 1. Get the photo details
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    // 2. Delete from Cloudinary
    // Check if we have a valid ID
    if (photo.cloudinaryId && photo.cloudinaryId !== "uploaded" && photo.cloudinaryId !== "manual-update") {
        await cloudinary.uploader.destroy(photo.cloudinaryId);
    }

    // 3. Delete from DB (Cascade removes AlbumPhoto entry)
    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing photo:", error);
    return NextResponse.json({ error: "Failed to remove photo" }, { status: 500 });
  }
}