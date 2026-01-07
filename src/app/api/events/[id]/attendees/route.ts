// src/app/api/events/[id]/attendees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// POST add attendees to event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is now a Promise
) {
  try {
    const { id: eventId } = await params; // ✅ Await params
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs array is required" },
        { status: 400 }
      );
    }

    await prisma.eventAttendee.createMany({
      data: userIds.map((userId: string) => ({
        eventId, // ✅ Use awaited eventId
        userId,
        status: "NO_RESPONSE",
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding attendees:", error);
    return NextResponse.json(
      { error: "Failed to add attendees" },
      { status: 500 }
    );
  }
}

// PATCH update attendee status (RSVP)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is now a Promise
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

    const body = await req.json();
    const { status } = body; // GOING, MAYBE, NOT_GOING

    const attendee = await prisma.eventAttendee.upsert({
      where: {
        eventId_userId: {
          eventId, // ✅ Use awaited eventId
          userId: user.id,
        },
      },
      update: {
        status,
        respondedAt: new Date(),
      },
      create: {
        eventId, // ✅ Use awaited eventId
        userId: user.id,
        status,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json(attendee);
  } catch (error) {
    console.error("Error updating RSVP:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}