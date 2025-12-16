// src/app/(app)/layout.tsx
"use client";

import * as React from "react";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

// Components & Providers
import Header from "@/components/Header";
import Providers from "../providers";

// Hooks & Store
import { useAuthSync } from "@/hooks/useAuthSync";
import { setActiveFamily, fetchMembers, selectActiveFamilyId } from "@/store/familySlice";
import { AppDispatch } from "@/store";

// --- Notification Logic (From File B) ---
export const notificationEmitter = {
  listeners: new Set<(postId: string) => void>(),
  emit(postId: string) {
    this.listeners.forEach((listener) => listener(postId));
  },
  subscribe(listener: (postId: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

// --- Types & Interfaces ---
interface LayoutProps {
  children: React.ReactNode;
}

interface Membership {
  familyId: string;
  role: string;
}

interface AuthMeResponse {
  memberships?: Membership[];
  family?: {
    id: string;
    role: string;
  };
}

/**
 * Top-level AppLayout that supplies Providers and runs client-side initialization.
 */
export default function AppLayout({ children }: LayoutProps) {
  return (
    <Providers>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Providers>
  );
}

function AppLayoutContent({ children }: LayoutProps) {
  const { session, status } = useAuthSync(); // syncs session to redux
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const activeFamilyId = useSelector(selectActiveFamilyId);

  // --- Notification Handler (From File B) ---
  const handleNotificationClick = useCallback((postId: string) => {
    console.log("📱 Notification clicked for post:", postId);
    // Emit event that Feed page will listen to
    notificationEmitter.emit(postId);
  }, []);

  // --- Auth Redirect Logic ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // --- Family Initialization Logic ---
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    // If already set, do nothing
    if (activeFamilyId) {
      console.log("[AppLayout] activeFamilyId already set:", activeFamilyId);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        console.log("[AppLayout] fetching /api/auth/me to initialize families");
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!mounted) return;

        if (!res.ok) {
          console.warn("[AppLayout] /api/auth/me returned", res.status);
          return;
        }

        const json: AuthMeResponse = await res.json();
        const memberships =
          json?.memberships ??
          (json?.family ? [{ familyId: json.family.id, role: json.family.role }] : []);

        console.log("[AppLayout] memberships from /api/auth/me:", memberships);

        if (!Array.isArray(memberships) || memberships.length === 0) {
          console.log("[AppLayout] no family memberships found for user");
          return;
        }

        // Prefer OWNER role if present
        const owner = memberships.find(
          (m: Membership) => (m.role || "").toUpperCase() === "OWNER"
        );
        const familyId = (owner?.familyId ?? memberships[0].familyId) as string;

        if (!familyId) {
          console.warn("[AppLayout] could not determine familyId:", memberships);
          return;
        }

        console.log("[AppLayout] selecting familyId:", familyId);
        dispatch(setActiveFamily(familyId));
        dispatch(fetchMembers(familyId));
      } catch (err) {
        console.error("[AppLayout] failed to initialize family:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [status, session, dispatch, activeFamilyId]);

  // --- Loading State ---
  if (status === "loading") {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If not authenticated (or session absent), return null; redirect effect will run.
  if (!session) {
    return null;
  }

  // --- Render Header with Notification Handler ---
  return (
    <Header onNotificationClick={handleNotificationClick}>
      {children}
    </Header>
  );
}