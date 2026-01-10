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
  Box,
  FormControlLabel,
  Checkbox,
  Avatar,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import imageCompression from "browser-image-compression";
import { FamilyTreeNode } from "./types";

interface EditMemberDialogProps {
  open: boolean;
  onClose: () => void;
  node: FamilyTreeNode | null;
  onSave: (updatedNode: FamilyTreeNode) => void;
}

export function EditMemberDialog({
  open,
  onClose,
  node,
  onSave,
}: EditMemberDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: null as Dayjs | null,
    gender: "M" as "M" | "F",
    isDeceased: false,
    deathDate: null as Dayjs | null,
    weddingAnniversary: null as Dayjs | null,
    avatar: "",
  });

  useEffect(() => {
    if (node) {
      setFormData({
        firstName: node.data["first name"] || "",
        lastName: node.data["last name"] || "",
        birthday: node.data.birthday ? dayjs(node.data.birthday) : null,
        gender: node.data.gender || "M",
        isDeceased: !!node.data.deathDate,
        deathDate: node.data.deathDate ? dayjs(node.data.deathDate) : null,
        weddingAnniversary: node.data.weddingAnniversary
          ? dayjs(node.data.weddingAnniversary)
          : null,
        avatar: node.data.avatar || "",
      });
    }
    // Reset file selection when dialog opens
    setSelectedFile(null);
    setUploading(false);
  }, [node, open]);

  const hasSpouse = node?.rels?.spouses && node.rels.spouses.length > 0;

  // Trigger file input
  const triggerFileInput = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFormData({ ...formData, avatar: previewUrl });
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatar: "" });
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Upload to Cloudinary
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
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
      );
      formData.append("folder", "firstfamily/family_tree");

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
    if (!node) return;

    try {
      setUploading(true);

      let finalAvatarUrl = formData.avatar;

      // If there's a new file selected and it's a blob URL, upload it
      if (selectedFile && formData.avatar.startsWith("blob:")) {
        finalAvatarUrl = await uploadToCloudinary(selectedFile);
      }

      const updatedNode: FamilyTreeNode = {
        ...node,
        data: {
          ...node.data,
          "first name": formData.firstName,
          "last name": formData.lastName,
          birthday: formData.birthday
            ? formData.birthday.format("YYYY-MM-DD")
            : undefined,
          gender: formData.gender,
          deathDate:
            formData.isDeceased && formData.deathDate
              ? formData.deathDate.format("YYYY-MM-DD")
              : undefined,
          weddingAnniversary: formData.weddingAnniversary
            ? formData.weddingAnniversary.format("YYYY-MM-DD")
            : undefined,
          avatar: finalAvatarUrl,
        },
      };

      onSave(updatedNode);
      onClose();
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to upload avatar or save changes. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Details</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Avatar Upload */}
            <Stack 
              direction={isMobile ? "column" : "row"} 
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
              <Stack direction={isMobile ? "row" : "column"} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  size="small"
                  fullWidth={isMobile}
                >
                  Replace
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={handleRemoveAvatar}
                  disabled={!formData.avatar || uploading}
                  size="small"
                  fullWidth={isMobile}
                >
                  Remove
                </Button>
              </Stack>
            </Stack>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />

            {uploading && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Uploading image...
                </Typography>
              </Box>
            )}

            {/* Names */}
            <Stack direction={isMobile ? "column" : "row"} spacing={2}>
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

            {/* Basic Info */}
            <Stack direction={isMobile ? "column" : "row"} spacing={2}>
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
              sx={{ mt: 0.5, color: "text.secondary" }}
            />

            {/* Conditional Date Fields */}
            <Stack direction={isMobile ? "column" : "row"} spacing={2}>
              {/* Show Death Date only if deceased is checked */}
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

              {/* ⭐ Wedding Anniversary - Fixed positioning */}
              {hasSpouse && (
                <Box sx={{ width: "100%" }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <DatePicker
                      label="Wedding Anniversary"
                      value={formData.weddingAnniversary}
                      onChange={(newValue) =>
                        setFormData({ ...formData, weddingAnniversary: newValue })
                      }
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          helperText: isMobile ? "💍 Auto-synced for both spouses" : undefined,
                        } 
                      }}
                      disabled={uploading}
                    />
                    
                    {/* Info Icon - Only show on desktop, positioned OUTSIDE */}
                    {!isMobile && (
                      <Tooltip 
                        title="This date will be automatically updated for both spouses since wedding anniversaries are shared." 
                        arrow
                        placement="right"
                      >
                        <IconButton 
                          size="small" 
                          sx={{ 
                            mt: 1,
                            color: "primary.main",
                            opacity: 0.7,
                            '&:hover': { opacity: 1 }
                          }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Stack>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: isMobile ? 2 : 3, 
          pb: isMobile ? 2 : 3,
          pt: 2,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 0,
        }}
      >
        <Button 
          onClick={onClose} 
          sx={{ color: "text.secondary" }} 
          disabled={uploading}
          fullWidth={isMobile}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formData.firstName || uploading}
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          {uploading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}