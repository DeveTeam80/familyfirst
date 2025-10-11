"use client";
import * as React from "react";
import { Box, TextField, Typography, Stack } from "@mui/material";

type Comment = { id: string; user: string; text: string };

export default function CommentBox({
  openForPostId,
  postId,
  comments,
  value,
  setValue,
  onSubmit,
}: {
  openForPostId: string | null;
  postId: string;
  comments: Comment[];
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
}) {
  if (openForPostId !== postId) return null;

  return (
    <Box mt={1}>
      <TextField
        fullWidth
        size="small"
        placeholder="Write a comment..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit();
        }}
      />
      <Stack mt={1}>
        {comments.map((c) => (
          <Typography key={c.id} variant="body2" sx={{ ml: 2 }}>
            <strong>{c.user}: </strong> {c.text}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
