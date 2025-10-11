"use client";
import * as React from "react";
import { Box, Avatar, TextField, Stack, Chip, Button, Menu, MenuItem } from "@mui/material";
import { Image, Event, Tag } from "@mui/icons-material";

type Props = {
  content: string;
  setContent: (v: string) => void;
  selectedImage: string | null;
  setSelectedImage: (v: string | null) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  onOpenEvent: () => void;
  onPost: () => void;
};

export default function PostComposer({
  content,
  setContent,
  selectedImage,
  setSelectedImage,
  selectedTags,
  setSelectedTags,
  onOpenEvent,
  onPost,
}: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleTagDelete = (tag: string) =>
    setSelectedTags(selectedTags.filter((t) => t !== tag));

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
    setAnchorEl(null);
  };

  return (
    <>
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar alt="User" src="/avatar.png" />
        <TextField
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Hidden Image Upload */}
      <input
        accept="image/*"
        type="file"
        id="photo-upload"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
          }
        }}
      />

      {/* Tag Chips */}
      {selectedTags.length > 0 && (
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
          {selectedTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleTagDelete(tag)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <Box mt={2}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: 300,
              borderRadius: 12,
              objectFit: "cover",
            }}
          />
        </Box>
      )}

      {/* Post Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Stack direction="row" spacing={1}>
          <Button variant="text" startIcon={<Image />} onClick={() => document.getElementById("photo-upload")?.click()}>
            Add Photo
          </Button>
          <Button variant="text" startIcon={<Event />} onClick={onOpenEvent}>
            Add Event
          </Button>
          <Button variant="text" startIcon={<Tag />} onClick={(e) => setAnchorEl(e.currentTarget)}>
            Add Tag
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            {["Conversation", "Event", "Giveaway", "Announcement"].map((tag) => (
              <MenuItem key={tag} onClick={() => handleTagSelect(tag)}>
                {tag}
              </MenuItem>
            ))}
          </Menu>
        </Stack>

        <Button variant="contained" sx={{ borderRadius: 3 }} onClick={onPost}>
          Post
        </Button>
      </Box>
    </>
  );
}
