import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// POST /api/albums/[id]/import
// Body: { photoIds: string[] }
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

    // Optional: Check if user is Admin/Owner if you want to restrict this
    // const membership = await prisma.familyMember.findFirst(...)

    const body = await req.json();
    const { photoIds } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "No photos selected" }, { status: 400 });
    }

    // 1. Verify Album exists
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // 2. Link Photos (using createMany with skipDuplicates is safest/fastest)
    // Note: SQLite doesn't support skipDuplicates with createMany, but Postgres does.
    // If using Postgres:
    const data = photoIds.map((photoId) => ({
      albumId,
      photoId,
      addedBy: session.user.id,
    }));

    await prisma.albumPhoto.createMany({
      data,
      skipDuplicates: true, // This prevents crashing if image is already in album
    });

    return NextResponse.json({ success: true, count: data.length });

  } catch (error) {
    console.error("Error importing photos:", error);
    return NextResponse.json(
      { error: "Failed to import photos" },
      { status: 500 }
    );
  }
}