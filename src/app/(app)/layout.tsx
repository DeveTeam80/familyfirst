// src/app/(app)/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import Header from "@/components/Header";
import Providers from "../providers";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useDispatch, useSelector } from "react-redux";
import { setActiveFamily, fetchMembers, selectActiveFamilyId } from "@/store/familySlice";
import { AppDispatch } from "@/store";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Top-level AppLayout that supplies Providers and runs client-side initialization.
 * - Providers wraps Redux/Theme/etc.
 * - AppLayoutContent waits for session and initializes family membership data.
 */
export default function AppLayout({ children }: LayoutProps) {
  return (
    <Providers>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Providers>
  );
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

function AppLayoutContent({ children }: LayoutProps) {
  const { session, status } = useAuthSync(); // syncs session to redux
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>(); // ⭐ Use typed dispatch
  const activeFamilyId = useSelector(selectActiveFamilyId);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // When session is ready, initialize family membership state once.
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
        // Expect backend to return `family` or `memberships` shape.
        // We'll support both `family` (single) and `memberships` (array).
        const memberships = json?.memberships ?? (json?.family ? [{ familyId: json.family.id, role: json.family.role }] : []);

        console.log("[AppLayout] memberships from /api/auth/me:", memberships);

        if (!Array.isArray(memberships) || memberships.length === 0) {
          console.log("[AppLayout] no family memberships found for user");
          return;
        }

        // Prefer OWNER role if present
        const owner = memberships.find((m: Membership) => (m.role || "").toUpperCase() === "OWNER");
        const familyId = (owner?.familyId ?? memberships[0].familyId) as string;

        if (!familyId) {
          console.warn("[AppLayout] could not determine familyId from memberships:", memberships);
          return;
        }

        console.log("[AppLayout] selecting familyId:", familyId, "dispatching setActiveFamily and fetchMembers");
        dispatch(setActiveFamily(familyId));
        dispatch(fetchMembers(familyId)); // ⭐ Now properly typed with AppDispatch
      } catch (err) {
        console.error("[AppLayout] failed to initialize family:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [status, session, dispatch, activeFamilyId]);

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

  // if not authenticated (or session absent) we return null; redirect effect will run.
  if (!session) {
    return null;
  }

  // session present -> show header + children
  return <Header>{children}</Header>;
}