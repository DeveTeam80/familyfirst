// src/app/email-confirmed/page.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";

export default function EmailConfirmedPage() {
  const search = useSearchParams();
  const router = useRouter();

  const status = search?.get("status") || "ok";
  const rawMsg = search?.get("msg") || "";
  // decode the message that the server put into the URL
  const msg = rawMsg ? decodeURIComponent(rawMsg) : (status === "ok" ? "Email confirmed and updated" : "An issue occurred");

  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    // Navigate somewhere sensible after closing
    router.push("/"); // change to '/feed' or another route if you prefer
  };

  return (
    <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {status === "ok" ? "Email updated" : "Email confirmation"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 1 }}>
            {status === "ok" ? (
              <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>{msg}</Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              {status === "ok"
                ? "Your account email address has been updated. You may now use the new address to sign in and receive notifications."
                : "There was a problem verifying your email. If the link has expired, please request an email change again from your Settings page."}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
