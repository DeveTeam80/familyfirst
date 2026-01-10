"use client";

import React, { useState } from "react";
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

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newAlbumId: string) => void;
}

export default function CreateAlbumDialog({
  open,
  onClose,
  onSuccess,
}: CreateAlbumDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[],
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter an album title");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: formData.tags,
        }),
      });

      if (!response.ok) throw new Error("Failed to create album");

      const newAlbum = await response.json();
      onSuccess(newAlbum.id);
      
      handleReset();
      onClose();
    } catch (error) {
      console.error("Error creating album:", error);
      alert("Failed to create album");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: "",
      description: "",
      tags: [],
    });
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          Create New Album
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            label="Album Title"
            fullWidth
            required
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
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
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.title.trim()}
        >
          {loading ? "Creating..." : "Create Album"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}