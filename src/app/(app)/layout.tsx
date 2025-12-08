// src/app/(app)/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import { Box, CircularProgress } from "@mui/material";
import Providers from "../providers";
import { useAuthSync } from "@/hooks/useAuthSync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Providers>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { session, status } = useAuthSync(); // ⭐ This syncs session to Redux
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  if (!session) {
    return null;
  }

  return <Header>{children}</Header>;
}