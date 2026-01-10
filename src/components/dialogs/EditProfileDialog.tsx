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
  CircularProgress,
} from "@mui/material";
import imageCompression from "browser-image-compression";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (changes: { 
    name?: string; 
    bio?: string; 
    avatar?: string | null; 
    location?: string;
    birthday?: string | null; // ✅ Added
    anniversary?: string | null; // ✅ Added
  }) => void;
  name: string;
  setName: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  avatar?: string | null;
  setAvatar: (v: string | null) => void;
  currentAvatar?: string | null;
  birthday?: string | null; // ✅ Added
  setBirthday?: (v: string | null) => void; // ✅ Added
  anniversary?: string | null; // ✅ Added
  setAnniversary?: (v: string | null) => void; // ✅ Added
};

const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return "";
  return dateString.split("T")[0]; 
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
  birthday,
  setBirthday,
  anniversary,
  setAnniversary,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const triggerFile = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Store the file for upload
    setSelectedFile(f);

    // Create blob URL for preview
    const url = URL.createObjectURL(f);
    setAvatar(url);
  };

  const onRemoveAvatar = () => {
    setAvatar(null);
    setSelectedFile(null);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/jpeg" as const,
      };

      const compressedFile = await imageCompression(file, options);
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
      formData.append("folder", "firstfamily/avatars");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("❌ Upload error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);

      let finalAvatarUrl = avatar;

      // If there's a selected file (blob URL), upload it first
      if (selectedFile && avatar?.startsWith('blob:')) {
        finalAvatarUrl = await uploadToCloudinary(selectedFile);
      }

      // Call onSave with all fields
      onSave({
        name: name.trim(),
        bio: bio.trim(),
        avatar: finalAvatarUrl,
        birthday: birthday || null, // ✅ Include birthday
        anniversary: anniversary || null, // ✅ Include anniversary
      });

      // Clean up
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  const previewSrc = avatar === null ? undefined : (avatar ?? currentAvatar) || undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Edit Profile
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Avatar section */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={previewSrc}
              alt={name || "Avatar"}
              sx={{ width: 84, height: 84 }}
            >
              {name?.[0]}
            </Avatar>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={triggerFile}
                disabled={uploading}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Replace
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={onRemoveAvatar}
                disabled={(!currentAvatar && avatar !== null) || uploading}
                size="small"
                sx={{ borderRadius: 2 }}
              >
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

          {uploading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Uploading image...
              </Typography>
            </Box>
          )}

          {/* Name */}
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Bio */}
          <TextField
            label="Bio"
            fullWidth
            multiline
            minRows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={uploading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* ✅ Birthday Field */}
          <TextField
            label="Birthday"
            type="date"
            fullWidth
            // ⭐ Use helper here!
            value={formatDateForInput(birthday)} 
            onChange={(e) => setBirthday?.(e.target.value || null)}
            disabled={uploading}
            InputLabelProps={{ shrink: true }}
            helperText="Your birthday"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          

          {/* ✅ FIXED ANNIVERSARY FIELD */}
          <TextField
            label="Anniversary"
            type="date"
            fullWidth
            // ⭐ Use helper here!
            value={formatDateForInput(anniversary)} 
            onChange={(e) => setAnniversary?.(e.target.value || null)}
            disabled={uploading}
            InputLabelProps={{ shrink: true }}
            helperText="Your anniversary"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={uploading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={(!name.trim() && !bio.trim() && avatar === undefined && !birthday && !anniversary) || uploading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          {uploading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}