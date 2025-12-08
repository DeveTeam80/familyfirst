// src/app/(public)/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import Providers from "../providers";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <PublicLayoutContent>{children}</PublicLayoutContent>
    </Providers>
  );
}

function PublicLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/feed");
    }
  }, [status, session, router]);

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

  if (session) {
    return null;
  }

  return <>{children}</>;
}