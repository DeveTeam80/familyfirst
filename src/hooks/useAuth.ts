// src/hooks/useAuth.ts
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

interface Family {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
}

interface AuthState {
  user: User | null;
  family: Family | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    family: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    // Fetch current user and family info
    fetchAuthState();
  }, []);

  const fetchAuthState = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setAuthState({
          user: data.user,
          family: data.family,
          isAdmin: data.family?.role === "ADMIN",
          loading: false,
        });
      } else {
        setAuthState({
          user: null,
          family: null,
          isAdmin: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching auth state:", error);
      setAuthState({
        user: null,
        family: null,
        isAdmin: false,
        loading: false,
      });
    }
  };

  return authState;
}   