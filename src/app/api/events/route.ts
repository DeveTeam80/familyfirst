import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// GET all events with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("eventType");

    const where: any = {};

    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    if (eventType && eventType !== "all") {
      where.eventType = eventType;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        album: {
          include: {
            _count: {
              select: { photos: true },
            },
          },
        },
        posts: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            posts: true,
            attendees: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST create new event
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

    const body = await req.json();
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      eventType,
      tags,
      coverImage,
      attendeeIds,
      isRecurring,
      recurrenceRule,
      timezone,
      allDay,
      familyId,
    } = body;

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

    // Create event
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location,
        eventType,
        tags: tags || [],
        coverImage,
        isRecurring: isRecurring || false,
        recurrenceRule,
        timezone: timezone || "UTC",
        allDay: allDay || false,
        familyId: targetFamilyId,
        creatorId: user.id,
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
      },
    });

    // Add creator as attendee (GOING status)
    await prisma.eventAttendee.create({
      data: {
        eventId: event.id,
        userId: user.id,
        status: "GOING",
        respondedAt: new Date(),
      },
    });

    // Add other attendees with NO_RESPONSE status
    if (attendeeIds && attendeeIds.length > 0) {
      await prisma.eventAttendee.createMany({
        data: attendeeIds.map((userId: string) => ({
          eventId: event.id,
          userId,
          status: "NO_RESPONSE",
        })),
        skipDuplicates: true,
      });
    }

    // Optionally create default album for event
    await prisma.album.create({
      data: {
        title: `${title} Photos`,
        description: `Photo album for ${title}`,
        calendarEventId: event.id,
        coverImage,
        tags: tags || [],
        familyId: targetFamilyId,
        createdBy: user.id,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}