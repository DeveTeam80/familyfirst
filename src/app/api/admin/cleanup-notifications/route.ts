// src/app/api/admin/cleanup-notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cleanupOldNotifications } from "@/lib/notifications";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add simple auth token for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await cleanupOldNotifications();

    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: `Cleaned up ${count} old notifications`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup notifications" },
      { status: 500 }
    );
  }
}

// GET method for manual testing (no auth required in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Use POST in production" }, { status: 405 });
  }

  try {
    const count = await cleanupOldNotifications();

    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: `Cleaned up ${count} old notifications`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup notifications" },
      { status: 500 }
    );
  }
}