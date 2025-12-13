// src/hooks/useAuthSync.ts
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import {
  setCurrentUser,
  setLoading,
  clearCurrentUser,
} from "@/store/userSlice";

export function useAuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === "loading") {
      dispatch(setLoading(true));
      return;
    }

    if (status === "unauthenticated" || !session?.user) {
      dispatch(clearCurrentUser());
      return;
    }

    if (status === "authenticated") {
      const syncUser = async () => {
        try {
          const res = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
          });

          if (!res.ok) {
            console.warn("Failed to load /api/auth/me");
            dispatch(setLoading(false));
            return;
          }

          const { user } = await res.json();
          // user: whatever your backend returns

          // ✅ Compute a canonical username
          const backendUsername = (user as any).username;
          const sessionUsername =
            (session.user as any).username ||
            session.user.name?.toLowerCase().replace(/\s+/g, "") ||
            session.user.email?.split("@")[0];

          const username = backendUsername || sessionUsername || "user";

          dispatch(
            setCurrentUser({
              id: user.id,
              username, // ✅ always set
              name: user.name,
              email: user.email,
              avatar: user.avatarUrl ?? null,
              bio: user.bio ?? "",
              location: user.location ?? "",
            })
          );
        } catch (err) {
          console.error("Auth sync error:", err);
        } finally {
          dispatch(setLoading(false));
        }
      };

      syncUser();
    }
  }, [session, status, dispatch]);

  return { session, status };
}
