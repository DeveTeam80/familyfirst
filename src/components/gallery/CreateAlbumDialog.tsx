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
  MenuItem,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

const EVENT_OPTIONS = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Reunion",
  "Vacation",
  "Holiday",
  "Graduation",
  "Baby Shower",
  "Other",
];

const TAG_OPTIONS = [
  "Family",
  "Celebration",
  "Travel",
  "Kids",
  "Pets",
  "Food",
  "Nature",
  "Sports",
];

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  // 👇 UPDATED: Accepts the new album ID
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
    event: "",
    occasion: "",
    date: null as Dayjs | null,
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
          ...formData,
          date: formData.date?.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to create album");

      // 👇 CAPTURE THE NEW ALBUM DATA
      const newAlbum = await response.json();

      // 👇 PASS THE ID BACK TO PARENT
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
      event: "",
      occasion: "",
      date: null,
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
            rows={2}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <TextField
            select
            label="Event Type"
            fullWidth
            value={formData.event}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, event: e.target.value }))
            }
          >
            <MenuItem value="">None</MenuItem>
            {EVENT_OPTIONS.map((event) => (
              <MenuItem key={event} value={event}>
                {event}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Occasion (optional)"
            fullWidth
            placeholder="e.g., John's 50th Birthday"
            value={formData.occasion}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, occasion: e.target.value }))
            }
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Event Date (optional)"
              value={formData.date}
              onChange={(newValue) =>
                setFormData((prev) => ({ ...prev, date: newValue }))
              }
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <Box>
            <Box sx={{ mb: 1 }}>Tags</Box>
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