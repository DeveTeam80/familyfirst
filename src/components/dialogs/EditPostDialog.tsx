"use client";
import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Stack, Chip, Typography } from "@mui/material";

export default function EditPostDialog({
  open,
  content,
  setContent,
  tags,
  setTags,
  image,                 // string | null | undefined (undefined = unchanged)
  setImage,
  currentImage,          // existing image from post (for preview)
  onCancel,
  onSave,
}: {
  open: boolean;
  content: string;
  setContent: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  image: string | null | undefined;
  setImage: (v: string | null | undefined) => void;
  currentImage?: string | null;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Edit Post</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={3}
          margin="dense"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>Tags</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {tags.map((t) => (
              <Chip key={t} label={t} onDelete={() => setTags(tags.filter((x) => x !== t))} />
            ))}
            {["Conversation", "Event", "Giveaway", "Announcement"].map((t) => (
              <Chip
                key={`picker-${t}`}
                label={`+ ${t}`}
                variant="outlined"
                onClick={() => {
                  if (!tags.includes(t)) setTags([...tags, t]);
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Image</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              onClick={() => {
                const el = document.createElement("input");
                el.type = "file";
                el.accept = "image/*";
                el.onchange = (evt: any) => {
                  const f = evt?.target?.files?.[0];
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setImage(url); // replace
                  }
                };
                el.click();
              }}
            >
              Replace Image
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={() => setImage(null)}
              disabled={!currentImage && image !== null}
            >
              Remove Image
            </Button>
            <Typography variant="caption" color="text.secondary">
              (Leave unchanged if you don’t pick anything)
            </Typography>
          </Stack>

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">Preview</Typography>
            <Box mt={1}>
              {image === null ? (
                <Typography variant="body2" color="text.secondary">Image will be removed</Typography>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(image ?? currentImage) || undefined}
                  alt="Preview"
                  style={{ width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 12 }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onSave} disabled={!content.trim() && !(image !== undefined)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
