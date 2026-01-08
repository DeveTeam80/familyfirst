// src/app/api/albums/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// ✅ Define proper types for the where clause
interface AlbumWhereClause {
    calendarEvent?: {
        eventType: string;
    };
    tags?: {
        has: string;
    };
}

// GET all albums
// GET all albums
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType");
    const tag = searchParams.get("tag");

    const where: AlbumWhereClause = {};
    
    if (eventType && eventType !== "all") {
      where.calendarEvent = {
        eventType: eventType
      };
    }
    
    if (tag && tag !== "all") {
      where.tags = { has: tag };
    }

    const albums = await prisma.album.findMany({
      where,
      // ⭐ CHANGE: Use 'select' instead of 'include' for total control
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        
        // 👇 CRITICAL: Explicitly select the ID for permission checks
        createdBy: true, 

        // Relations
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        calendarEvent: {
          select: {
            id: true,
            title: true,
            startTime: true,
            eventType: true,
          },
        },
        photos: {
          take: 1,
          orderBy: { addedAt: "desc" },
          select: {
            photo: { select: { url: true } },
          },
        },
        _count: {
          select: { photos: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Optional: Log the first album to server console to verify data
    if (albums.length > 0) {
      console.log("🔥 [API] Album Data Sample:", { 
        id: albums[0].id, 
        createdBy: albums[0].createdBy 
      });
    }

    // Transform to flatten cover image (optional but cleaner for frontend)
    const formattedAlbums = albums.map(album => ({
        ...album,
        coverImage: album.coverImage || album.photos[0]?.photo.url || null,
    }));

    return NextResponse.json(formattedAlbums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

// POST create new album
export async function POST(req: NextRequest) {
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

        let body;
        try {
            body = await req.json();
        } catch (error) { // ✅ Changed from 'e' to 'error'
            console.error("JSON parse error:", error);
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { title, description, tags, coverImage, calendarEventId, familyId } = body;

        // Get user's family if not provided
        const targetFamilyId = familyId || (
            await prisma.familyMember.findFirst({
                where: { userId: user.id },
                select: { familyId: true },
            })
        )?.familyId;

        if (!targetFamilyId) {
            return NextResponse.json({ error: "No family found" }, { status: 400 });
        }

        const album = await prisma.album.create({
            data: {
                title,
                description,
                tags: tags || [],
                coverImage,
                calendarEventId: calendarEventId || null,
                familyId: targetFamilyId,
                createdBy: user.id,
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
                calendarEvent: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        eventType: true,
                    },
                },
                _count: {
                    select: { photos: true },
                },
            },
        });

        return NextResponse.json(album);
    } catch (error) {
        console.error("Error creating album:", error);
        return NextResponse.json(
            { error: "Failed to create album" },
            { status: 500 }
        );
    }
}