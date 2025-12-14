// src/hooks/useOnlineStatus.ts
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function useOnlineStatus() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const updateStatus = async (isOnline: boolean) => {
      try {
        await fetch("/api/user/online-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline }),
          keepalive: true,
        });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    // Set online
    updateStatus(true);

    // Heartbeat every 2 minutes
    const heartbeat = setInterval(() => {
      updateStatus(true);
    }, 2 * 60 * 1000);

    // Handle page visibility
    const handleVisibilityChange = () => {
      updateStatus(!document.hidden);
    };

    // Handle beforeunload
    const handleBeforeUnload = () => {
      updateStatus(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateStatus(false);
    };
  }, [session]);
}