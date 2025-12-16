// src/app/api/notifications/stream/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const UPDATE_INTERVAL = 5000; // 5 seconds
const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000; // ⭐ 2 minutes - match with online-status route

// Type for session user
interface SessionUser {
  id?: string;
}

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = sessionUser?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let updateInterval: NodeJS.Timeout;
  let heartbeatInterval: NodeJS.Timeout;
  let isAlive = true;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        if (!isAlive) return;
        const message = `data: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Failed to send SSE event:', error);
          isAlive = false;
        }
      };

      sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

      // Mark user as online
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline: true,
          lastSeenAt: new Date(),
        },
      }).catch(console.error);

      // Heartbeat
      heartbeatInterval = setInterval(() => {
        sendEvent({ type: 'heartbeat' });
      }, HEARTBEAT_INTERVAL);

      // Updates
      updateInterval = setInterval(async () => {
        if (!isAlive) return;

        try {
          const notifications = await prisma.notification.findMany({
            where: {
              userId: userId,
              isRead: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          });

          const unreadCount = notifications.length;

          // ⭐ CRITICAL FIX: Use 2-minute threshold instead of 5 minutes
          const now = new Date();
          const threshold = new Date(now.getTime() - OFFLINE_THRESHOLD_MS);
          
          const userFamilies = await prisma.familyMember.findMany({
            where: { userId: userId },
            select: { familyId: true },
          });

          const familyIds = userFamilies.map((f) => f.familyId);

          // ⭐ CRITICAL FIX: Only check lastSeenAt threshold, not isOnline flag
          const onlineMembers = await prisma.user.findMany({
            where: {
              familyMemberships: {
                some: {
                  familyId: { in: familyIds },
                },
              },
              id: { not: userId },
              // ⭐ Only show users with recent heartbeat
              lastSeenAt: { gte: threshold },
            },
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isOnline: true,
              lastSeenAt: true,
            },
            orderBy: {
              lastSeenAt: 'desc',
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
          }).catch(console.error);

          sendEvent({
            type: 'update',
            timestamp: new Date().toISOString(),
            notifications: notifications.map(n => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              relatedId: n.relatedId,
              relatedType: n.relatedType,
              actorId: n.actorId,
              actorName: n.actorName,
              actorAvatar: n.actorAvatar,
              isRead: n.isRead,
              createdAt: n.createdAt.toISOString(),
            })),
            unreadCount,
            onlineMembers: onlineMembers.map(m => ({
              id: m.id,
              name: m.name,
              avatar: m.avatarUrl,
              online: true, // ⭐ All members here are truly online (passed threshold)
              lastSeen: m.lastSeenAt?.toISOString(),
            })),
          });

          // ⭐ Update current user's lastSeenAt
          await prisma.user.update({
            where: { id: userId },
            data: { lastSeenAt: new Date() },
          }).catch(console.error);

        } catch (error) {
          console.error('SSE update error:', error);
        }
      }, UPDATE_INTERVAL);
    },

    cancel() {
      isAlive = false;
      clearInterval(updateInterval);
      clearInterval(heartbeatInterval);

      prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline: false,
          lastSeenAt: new Date(),
        },
      }).catch(console.error);

      console.log(`SSE connection closed for user: ${userId}`);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}