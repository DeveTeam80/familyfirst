"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Chip,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const TAG_OPTIONS = [
  "Family",
  "Celebration",
  "Travel",
  "Kids",
  "Pets",
  "Food",
  "Nature",
  "Sports",
  "Birthday",
  "Wedding",
  "Anniversary",
  "Reunion",
  "Vacation",
  "Holiday",
  "Graduation",
];

interface EditAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  albumId: string | null;
  onSuccess: () => void;
}

interface AlbumData {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
}

export default function EditAlbumDialog({
  open,
  onClose,
  albumId,
  onSuccess,
}: EditAlbumDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[],
  });

  // Fetch album data when dialog opens
  useEffect(() => {
    if (open && albumId) {
      fetchAlbumData();
    }
  }, [open, albumId]);

  const fetchAlbumData = async () => {
    if (!albumId) return;

    setFetching(true);
    try {
      const response = await fetch(`/api/albums/${albumId}`);
      if (!response.ok) throw new Error("Failed to fetch album");

      const album: AlbumData = await response.json();

      setFormData({
        title: album.title || "",
        description: album.description || "",
        tags: album.tags || [],
      });
    } catch (error) {
      console.error("Error fetching album:", error);
      alert("Failed to load album data");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter an album title");
      return;
    }

    if (!albumId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: formData.tags,
        }),
      });

      if (!response.ok) throw new Error("Failed to update album");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating album:", error);
      alert("Failed to update album");
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          Edit Album
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {fetching ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <TextField
              label="Album Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              disabled={loading}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={loading}
              placeholder="Describe this album..."
            />

            <Box>
              <Box sx={{ mb: 1, fontWeight: 600 }}>Tags</Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {TAG_OPTIONS.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => handleTagToggle(tag)}
                    color={formData.tags.includes(tag) ? "primary" : "default"}
                    variant={formData.tags.includes(tag) ? "filled" : "outlined"}
                    disabled={loading}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading || fetching}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || fetching || !formData.title.trim()}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}