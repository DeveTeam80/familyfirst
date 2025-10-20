"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (changes: { name?: string; bio?: string; avatar?: string | null }) => void;
  name: string;
  setName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  avatar?: string | null;               
  setAvatar: (v: string | null) => void;  
  currentAvatar?: string | null;         
};

export default function EditProfileDialog({
  open,
  onClose,
  onSave,
  name,
  setName,
  bio,
  setBio,
  avatar,
  setAvatar,
  currentAvatar,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const triggerFile = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatar(url);
  };

  const onRemoveAvatar = () => setAvatar(null);

  const handleSave = () => {
    onSave({
      name: name.trim(),
      bio: bio.trim(),
      avatar, 
    });
  };

  const previewSrc = avatar === null ? undefined : (avatar ?? currentAvatar) || undefined;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Avatar section */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={previewSrc}
              alt={name || "Avatar"}
              sx={{ width: 84, height: 84 }}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={triggerFile}>Replace</Button>
              <Button variant="text" color="error" onClick={onRemoveAvatar} disabled={!currentAvatar && avatar !== null}>
                Remove
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onPick}
              />
            </Stack>
          </Stack>

          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="Bio"
            fullWidth
            multiline
            minRows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() && !bio.trim() && avatar === undefined}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
