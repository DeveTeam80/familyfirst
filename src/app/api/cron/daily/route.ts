// src/app/api/cron/daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { 
  cleanupOldNotifications, 
  checkDailyBirthdays, 
  checkDailyAnniversaries 
} from "@/lib/notifications";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60s for multiple tasks

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting daily maintenance...");

    // Run all tasks in parallel
    const [deletedCount, _bd, _an] = await Promise.all([
      cleanupOldNotifications(),
      checkDailyBirthdays(),
      checkDailyAnniversaries()
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        notificationsCleaned: deletedCount,
        birthdaysChecked: true,
        anniversariesChecked: true
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Daily cron error:", error);
    return NextResponse.json(
      { error: "Failed to run daily tasks" },
      { status: 500 }
    );
  }
}

// Keep GET for manual testing in dev
export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Use POST in production" }, { status: 405 });
  }
  
  // Re-use logic for dev test
  const [deletedCount] = await Promise.all([
    cleanupOldNotifications(),
    checkDailyBirthdays(),
    checkDailyAnniversaries()
  ]);

  return NextResponse.json({
    success: true,
    message: "Manual daily trigger complete",
    cleaned: deletedCount
  });
}