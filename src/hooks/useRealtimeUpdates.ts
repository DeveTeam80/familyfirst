// src/hooks/useRealtimeUpdates.ts
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  isRead: boolean;
  createdAt: string;
}

export interface OnlineMember {
  id: string;
  name: string;
  avatar?: string;
  online: boolean;
  lastSeen?: string;
}

export function useRealtimeUpdates() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
          } else if (data.type === 'update') {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
            setOnlineMembers(data.onlineMembers || []);
          }
        } catch (error) {
          console.error('SSE parse error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE error:', error);
        setConnected(false);
        eventSource?.close();

        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [session]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          markAllAsRead: !notificationId,
        }),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    onlineMembers,
    connected,
    markAsRead,
  };
}