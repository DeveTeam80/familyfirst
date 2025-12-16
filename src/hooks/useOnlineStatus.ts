// src/hooks/useOnlineStatus.ts
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function useOnlineStatus() {
  const { data: session } = useSession();
const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounting = useRef(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    isUnmounting.current = false;

    const updateStatus = async (isOnline: boolean) => {
      try {
        // Use sendBeacon for beforeunload to ensure it fires
        if (!isOnline && typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob(
            [JSON.stringify({ isOnline: false })],
            { type: 'application/json' }
          );
          navigator.sendBeacon('/api/user/online-status', blob);
        } else {
          await fetch("/api/user/online-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isOnline }),
            keepalive: true,
          });
        }
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    // Set online immediately
    updateStatus(true);

    // ⭐ Heartbeat every 30 seconds (more frequent = better accuracy)
    heartbeatRef.current = setInterval(() => {
      if (!isUnmounting.current) {
        updateStatus(true);
      }
    }, 30 * 1000); // 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!isUnmounting.current) {
        updateStatus(!document.hidden);
      }
    };

    // Handle beforeunload - set flag and use sendBeacon
    const handleBeforeUnload = () => {
      isUnmounting.current = true;
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      
      // Use sendBeacon for reliability
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ isOnline: false })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/user/online-status', blob);
      }
    };

    // Handle page freeze/hidden (better than beforeunload on mobile)
    const handlePageHide = () => {
      isUnmounting.current = true;
      updateStatus(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    // Cleanup
    return () => {
      isUnmounting.current = true;
      
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      
      // Final offline update
      updateStatus(false);
    };
  }, [session]);
}