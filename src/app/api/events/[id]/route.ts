// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// GET single event with all related data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is Promise
) {
  try {
    const { id: eventId } = await params; // ✅ Await params
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId }, // ✅ Use awaited eventId
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
            photos: {
              take: 10,
              orderBy: { addedAt: "desc" },
              include: {
                photo: true,
              },
            },
            _count: {
              select: { photos: true },
            },
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
            comments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PATCH update event
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is Promise
) {
  try {
    const { id: eventId } = await params; // ✅ Await params
    
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

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId }, // ✅ Use awaited eventId
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is creator or has GOING status
    const isAttendee = await prisma.eventAttendee.findFirst({
      where: {
        eventId, // ✅ Use awaited eventId
        userId: user.id,
        status: "GOING",
      },
    });

    if (event.creatorId !== user.id && !isAttendee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      isRecurring,
      recurrenceRule,
      allDay,
    } = body;

    const updated = await prisma.calendarEvent.update({
      where: { id: eventId }, // ✅ Use awaited eventId
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        eventType,
        tags,
        coverImage,
        isRecurring,
        recurrenceRule,
        allDay,
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
          select: {
            posts: true,
            attendees: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE event
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is Promise
) {
  try {
    const { id: eventId } = await params; // ✅ Await params
    
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

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId }, // ✅ Use awaited eventId
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.creatorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId }, // ✅ Use awaited eventId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}