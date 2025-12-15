// src/hooks/useAuthSync.ts
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import {
  setCurrentUser,
  setLoading,
  clearCurrentUser,
} from "@/store/userSlice";

// Type for the API response
interface ApiUserResponse {
  user: {
    id: string;
    username?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
  };
}

// Extended session user type
interface ExtendedUser {
  username?: string;
  name?: string | null;
  email?: string | null;
}

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

          const { user } = (await res.json()) as ApiUserResponse;

          // ✅ Compute a canonical username
          const backendUsername = user.username;
          const sessionUser = session.user as ExtendedUser;
          const sessionUsername =
            sessionUser.username ||
            sessionUser.name?.toLowerCase().replace(/\s+/g, "") ||
            sessionUser.email?.split("@")[0];

          const username = backendUsername || sessionUsername || "user";
          const name = user.name || sessionUser.name || username || "User";

          dispatch(
            setCurrentUser({
              id: user.id,
              username,
              name,
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