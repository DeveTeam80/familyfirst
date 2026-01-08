"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "@/store/userSlice";

export default function SessionRefresher() {
  const dispatch = useDispatch();

  useEffect(() => {
    // The function that fetches the latest user data
    const revalidateUser = async () => {
      try {
        // This hits your existing endpoint which queries the DB directly
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          // Force Redux to update with the fresh role/data from DB
          // Adjust 'data.user' based on your actual API structure
          if (data.user) {
             dispatch(setCurrentUser(data.user)); 
             console.log("🔄 Session silently refreshed. Role:", data.user.role || data.memberships?.[0]?.role);
          }
        }
      } catch (err) {
        console.error("Silent refresh failed", err);
      }
    };

    // 1. Check immediately on mount (fixes stale hydration)
    revalidateUser();

    // 2. Check whenever user focuses the window (comes back to the tab)
    const onFocus = () => revalidateUser();
    window.addEventListener("focus", onFocus);

    // 3. Optional: Poll every 5 minutes (300000ms)
    const interval = setInterval(revalidateUser, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [dispatch]);

  return null; // This component renders nothing
}