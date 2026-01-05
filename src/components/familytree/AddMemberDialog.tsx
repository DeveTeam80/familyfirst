import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import imageCompression from "browser-image-compression";
import { FamilyTreeNode, RelationType } from "./types";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  relativeNode: FamilyTreeNode | null;
  relationType: RelationType | null;
  specificRole: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (data: any) => void;
}

export function AddMemberDialog({
  open,
  onClose,
  relativeNode,
  relationType,
  specificRole,
  onAdd,
}: AddMemberDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "M" as "M" | "F",
    birthday: null as Dayjs | null,
    isDeceased: false,
    deathDate: null as Dayjs | null,
    weddingAnniversary: null as Dayjs | null,
    avatar: "",
  });

  useEffect(() => {
    if (open) {
      let initialGender: "M" | "F" = "M";
      if (specificRole === "daughter" || specificRole === "mother") {
        initialGender = "F";
      } else if (specificRole === "son" || specificRole === "father") {
        initialGender = "M";
      } else if (specificRole === "spouse" && relativeNode) {
        initialGender = relativeNode.data.gender === "M" ? "F" : "M";
      }

      setFormData({
        firstName: "",
        lastName: "",
        gender: initialGender,
        birthday: null,
        avatar: "",
        isDeceased: false,
        deathDate: null,
        weddingAnniversary: null,
      });
      setSelectedFile(null);
      setUploading(false);
    }
  }, [open, specificRole, relativeNode]);

  const triggerFile = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setSelectedFile(f);
    const url = URL.createObjectURL(f);
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const onRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: "" }));
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

      console.log("🔄 Compressing image...");
      const compressedFile = await imageCompression(file, options);
      console.log(
        `✅ Compressed: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(
          compressedFile.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
      );
      formData.append("folder", "familyfirst/avatars");

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
      console.log("✅ Upload successful:", data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("❌ Upload error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);

      let finalAvatarUrl = formData.avatar;

      if (selectedFile && formData.avatar.startsWith("blob:")) {
        console.log("🔄 Uploading avatar to Cloudinary...");
        finalAvatarUrl = await uploadToCloudinary(selectedFile);
      }

      const payload = {
        ...formData,
        avatar: finalAvatarUrl,
        birthday: formData.birthday
          ? formData.birthday.format("YYYY-MM-DD")
          : undefined,
        deathDate:
          formData.isDeceased && formData.deathDate
            ? formData.deathDate.format("YYYY-MM-DD")
            : undefined,
        weddingAnniversary: formData.weddingAnniversary
          ? formData.weddingAnniversary.format("YYYY-MM-DD")
          : undefined,
        relativeId: relativeNode?.id,
        relationType: relationType,
      };

      onAdd(payload);
      onClose();
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to upload avatar or add member. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getTitle = () => {
    const rawName =
      relativeNode?.data?.["first name"] ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (relativeNode?.data as any)?.firstName;

    const name = rawName || "Relative";

    if (specificRole) {
      const role = specificRole.charAt(0).toUpperCase() + specificRole.slice(1);
      return `Add ${role} to ${name}`;
    }
    return "Add Member";
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{getTitle()}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Avatar Upload */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
            >
              <Avatar
                src={formData.avatar || undefined}
                alt={formData.firstName || "Avatar"}
                sx={{ width: 84, height: 84 }}
              >
                {formData.firstName?.[0]}
              </Avatar>
              <Stack direction="column" spacing={1}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={triggerFile}
                    disabled={uploading}
                    size="small"
                  >
                    Replace
                  </Button>
                  <Button
                    variant="text"
                    color="error"
                    onClick={onRemoveAvatar}
                    disabled={!formData.avatar || uploading}
                    size="small"
                  >
                    Remove
                  </Button>
                </Stack>
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Uploading image...
                </Typography>
              </Box>
            )}

            {/* Names */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled={uploading}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled={uploading}
              />
            </Stack>

            {/* Birthday & Gender */}
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Birthday"
                value={formData.birthday}
                onChange={(newValue) =>
                  setFormData({ ...formData, birthday: newValue })
                }
                slotProps={{ textField: { fullWidth: true } }}
                disabled={uploading}
              />
              <TextField
                select
                fullWidth
                label="Gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as "M" | "F",
                  })
                }
                disabled={uploading}
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
              </TextField>
            </Stack>

            {/* Deceased Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDeceased}
                  onChange={(e) =>
                    setFormData({ ...formData, isDeceased: e.target.checked })
                  }
                  color="primary"
                  disabled={uploading}
                />
              }
              label="Deceased / Passed Away"
              sx={{ mt: 1, color: "text.secondary" }}
            />

            {/* Conditional Date Fields */}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              {/* Death Date - Only show if deceased */}
              {formData.isDeceased && (
                <DatePicker
                  label="Date of Death"
                  value={formData.deathDate}
                  onChange={(newValue) =>
                    setFormData({ ...formData, deathDate: newValue })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                  disableFuture
                  disabled={uploading}
                />
              )}

              {/* Anniversary - Show if spouse is involved */}
              {(relationType === "spouses" || specificRole === "spouse") && (
                <DatePicker
                  label="Wedding Anniversary"
                  value={formData.weddingAnniversary}
                  onChange={(newValue) =>
                    setFormData({ ...formData, weddingAnniversary: newValue })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                  disabled={uploading}
                />
              )}
            </Stack>
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formData.firstName || uploading}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          {uploading ? "Adding..." : "Add Member"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}