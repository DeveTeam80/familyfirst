"use client";
import * as React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Chip, Stack, Typography } from "@mui/material";

export default function ShareDialog({
  open,
  user,
  content,
  tags,
  postId,
  onClose,
}: {
  open: boolean;
  user?: string;
  content?: string;
  tags?: string[];
  postId?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share Post</DialogTitle>
      <DialogContent dividers>
        {user && <Typography variant="subtitle2">{user}</Typography>}
        {content && (
          <Typography variant="body2" sx={{ my: 1 }}>
            {content}
          </Typography>
        )}
        {tags && (
          <Stack direction="row" spacing={1}>
            {tags.map((t) => (
              <Chip key={t} label={t} size="small" />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (!postId) return;
            navigator.clipboard.writeText(`${location.origin}/post/${postId}`);
            onClose();
          }}
        >
          Copy Link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
