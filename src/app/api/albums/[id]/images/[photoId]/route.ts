import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  // 1. Await Params (Next.js 15)
  const { id: albumId, photoId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the Link Record (AlbumPhoto)
    // We need to see the link between this specific album and the photo
    const albumPhoto = await prisma.albumPhoto.findUnique({
      where: {
        albumId_photoId: { albumId, photoId },
      },
      include: {
        album: true,
        photo: {
          include: {
            _count: { select: { albums: true } }, // Check how many albums use this
          }
        },
      },
    });

    if (!albumPhoto) {
      return NextResponse.json({ error: "Photo not found in album" }, { status: 404 });
    }

    // 3. Permissions Check
    // - Uploader can always delete their own photo
    // - Album Owner can remove any photo from THEIR album
    // - Admin/Owner can delete anything
    
    // Fetch user role for Admin check
    const membership = await prisma.familyMember.findFirst({
        where: { userId: session.user.id, familyId: albumPhoto.album.familyId },
        select: { role: true }
    });
    
    const isAdmin = membership?.role === 'ADMIN' || membership?.role === 'OWNER';
    const isUploader = albumPhoto.photo.uploadedBy === session.user.id;
    const isAlbumOwner = albumPhoto.album.createdBy === session.user.id;

    if (!isUploader && !isAlbumOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Remove the Link (Unlink from THIS album)
    // This happens regardless of whether we delete the file later.
    await prisma.albumPhoto.delete({
      where: {
        albumId_photoId: { albumId, photoId },
      },
    });

    // 5. "Smart Delete" Check: Should we destroy the file?
    // Destroy IF: It has NO Post parent AND it is NOT in any other albums
    // (Note: _count.albums included the one we just deleted, so we check if it was 1)
    
    const hasPostParent = !!albumPhoto.photo.postId;
    const wasInOnlyThisAlbum = albumPhoto.photo._count.albums === 1;

    if (!hasPostParent && wasInOnlyThisAlbum) {
      console.log("🗑️ Photo is now an orphan. Destroying file...");
      
      // Delete from Cloudinary
      if (albumPhoto.photo.cloudinaryId && 
          !["uploaded", "manual-update"].includes(albumPhoto.photo.cloudinaryId)) {
        await cloudinary.api.delete_resources([albumPhoto.photo.cloudinaryId]);
      }

      // Delete the Photo record itself from DB
      await prisma.photo.delete({
        where: { id: photoId },
      });
      
      return NextResponse.json({ success: true, message: "Photo permanently deleted" });
    }

    return NextResponse.json({ success: true, message: "Photo removed from album (kept in storage)" });

  } catch (error) {
    console.error("Error removing photo:", error);
    return NextResponse.json({ error: "Failed to remove photo" }, { status: 500 });
  }
}