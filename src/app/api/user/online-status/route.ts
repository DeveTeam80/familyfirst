// src/app/api/user/online-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// ⭐ CRITICAL: Users are considered offline if no heartbeat for 2 minutes
const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

// POST - Update online status
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { isOnline } = await request.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnline: isOnline ?? true,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating online status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

// ⭐ NEW: GET endpoint to check who's actually online
export async function GET() {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() - OFFLINE_THRESHOLD_MS);

    // Get users who had heartbeat within last 2 minutes
    const onlineUsers = await prisma.user.findMany({
      where: {
        lastSeenAt: {
          gte: threshold,
        },
        isOnline: true,
      },
      select: {
        id: true,
        username: true,
        lastSeenAt: true,
      },
    });

    // ⭐ Auto-cleanup: Mark stale users as offline
    await prisma.user.updateMany({
      where: {
        isOnline: true,
        lastSeenAt: {
          lt: threshold,
        },
      },
      data: {
        isOnline: false,
      },
    });

    return NextResponse.json({ 
      onlineUsers,
      count: onlineUsers.length,
    });
  } catch (error) {
    console.error("Error fetching online users:", error);
    return NextResponse.json(
      { error: "Failed to fetch online users" },
      { status: 500 }
    );
  }
}