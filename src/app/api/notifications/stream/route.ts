// src/app/api/notifications/stream/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const UPDATE_INTERVAL = 5000; // 5 seconds

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let updateInterval: NodeJS.Timeout;
  let heartbeatInterval: NodeJS.Timeout;
  let isAlive = true;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
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
        where: { id: session.user.id },
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
              userId: session.user.id,
              isRead: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          });

          const unreadCount = notifications.length;

          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          const userFamilies = await prisma.familyMember.findMany({
            where: { userId: session.user.id },
            select: { familyId: true },
          });

          const familyIds = userFamilies.map((f) => f.familyId);

          const onlineMembers = await prisma.user.findMany({
            where: {
              familyMemberships: {
                some: {
                  familyId: { in: familyIds },
                },
              },
              id: { not: session.user.id },
              OR: [
                { isOnline: true },
                { lastSeenAt: { gte: fiveMinutesAgo } },
              ],
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
              online: m.isOnline,
              lastSeen: m.lastSeenAt?.toISOString(),
            })),
          });

          await prisma.user.update({
            where: { id: session.user.id },
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
        where: { id: session.user.id },
        data: { 
          isOnline: false,
          lastSeenAt: new Date(),
        },
      }).catch(console.error);

      console.log(`SSE connection closed for user: ${session.user.id}`);
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