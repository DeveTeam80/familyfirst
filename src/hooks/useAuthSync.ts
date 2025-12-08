// src/hooks/useAuthSync.ts
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";
import { setCurrentUser, setLoading, clearCurrentUser } from "@/store/userSlice";

export function useAuthSync() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === "loading") {
      dispatch(setLoading(true));
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Convert session user to UserProfile format
      const userProfile = {
        id: session.user.id || "",
        username: session.user.name?.toLowerCase().replace(/\s+/g, "") || 
                  session.user.email?.split("@")[0] || "user",
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: session.user.image || null,
        bio: "",
        location: "",
      };

      dispatch(setCurrentUser(userProfile));
    } else {
      dispatch(clearCurrentUser());
    }
  }, [session, status, dispatch]);

  return { session, status };
}