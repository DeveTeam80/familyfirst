// app/tree/page.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
} from "@mui/material";

export default function FamilyTreePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Show the dedication modal only on the first redirect from registration
  const isFirst = searchParams.get("first") === "1";
  const [open, setOpen] = React.useState(isFirst);

  const handleClose = () => {
    setOpen(false);
    // Remove the `first=1` from the URL but stay on /tree
    const url = new URL(window.location.href);
    url.searchParams.delete("first");
    router.replace(url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""));
  };

  // In a real app, you'd render your actual tree component here,
  // filtered to the logged-in user (e.g., from cookie/session).
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Family Tree</Typography>

      {/* Placeholder "your tree centered around you" section */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          minHeight: 360,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Typography color="text.secondary">
          {/* Replace with your <FamilyTree currentUserId="me" /> */}
          (Your interactive family tree appears here…)
        </Typography>
      </Paper>

      {/* One-time dedication modal */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>In Loving Memory</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 1.5 }}>
            This private family space was created in honor of our grandfather.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We built this app to celebrate his life, keep our family connected,
            and help future generations know where they come from.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Continue to Family Tree
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
