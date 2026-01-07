"use client";
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stack,
  Chip,
  Typography,
  IconButton,
  alpha,
  useTheme,
  CircularProgress,
  useMediaQuery, 
} from "@mui/material";
import { Close, PhotoLibrary } from "@mui/icons-material";
import Image from "next/image";
import imageCompression from "browser-image-compression";

export default function EditPostDialog({
  open,
  content,
  setContent,
  tags,
  setTags,
  images,
  setImages,
  onCancel,
  onSave,
}: {
  open: boolean;
  content: string;
  setContent: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  images: string[];
  setImages: (v: string[]) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();
  const [compressing, setCompressing] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ⭐ NEW: Helper to upload single file to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
    // ⭐ Organize into the correct folder
    formData.append("folder", "firstfamily/posts");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) throw new Error("Failed to upload image");
    const data = await res.json();
    return data.secure_url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCompressing(true);
      const filesArray = Array.from(e.target.files);
      const newImages: string[] = [];

      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg" as const,
        };

        for (const file of filesArray) {
          try {
            console.log(`🔄 Compressing ${file.name}...`);
            const compressedFile = await imageCompression(file, options);

            console.log(`☁️ Uploading ${file.name} to Cloudinary...`);
            // ⭐ CHANGED: Upload to Cloudinary instead of reading as Base64
            const url = await uploadToCloudinary(compressedFile);

            console.log(`✅ Uploaded: ${url}`);
            newImages.push(url);
          } catch (error) {
            console.error(`❌ Error processing ${file.name}:`, error);
            // Optional: Show an error toast here
          }
        }

        setImages([...images, ...newImages]);
      } catch (error) {
        console.error("❌ Error processing images:", error);
        alert("Failed to process images. Please try again.");
      } finally {
        setCompressing(false);
        // Clear input so same file can be selected again if needed
        e.target.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const availableTags = ["Family", "Memories", "Celebration", "Update", "Question", "Event", "Announcement"];

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      fullScreen={isMobile} 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Edit Post
      </DialogTitle>

      <DialogContent dividers>
        {/* Content Field */}
        <TextField
          label="Content"
          fullWidth
          multiline
          minRows={3}
          margin="dense"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={compressing}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />

        {/* Tags Section */}
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Tags
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {/* Selected Tags */}
            {tags.map((t) => (
              <Chip
                key={t}
                label={t}
                onDelete={() => setTags(tags.filter((x) => x !== t))}
                disabled={compressing}
                size="small"
                sx={{
                  borderRadius: 2,
                  fontWeight: 500,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                }}
              />
            ))}

            {/* Available Tags to Add */}
            {availableTags
              .filter(t => !tags.includes(t))
              .map((t) => (
                <Chip
                  key={`picker-${t}`}
                  label={`+ ${t}`}
                  variant="outlined"
                  size="small"
                  onClick={() => setTags([...tags, t])}
                  disabled={compressing}
                  sx={{
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: 'primary.main',
                    }
                  }}
                />
              ))}
          </Stack>
        </Box>

        {/* Images Section */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Images
          </Typography>

          {/* Hidden File Input */}
          <input
            accept="image/*"
            type="file"
            id="edit-photo-upload"
            multiple
            style={{ display: "none" }}
            onChange={handleImageUpload}
            disabled={compressing}
          />

          {/* Upload Button */}
          <Button
            variant="outlined"
            startIcon={compressing ? <CircularProgress size={20} /> : <PhotoLibrary />}
            onClick={() => document.getElementById("edit-photo-upload")?.click()}
            fullWidth
            disabled={compressing}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              mb: 2,
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            {compressing
              ? 'Uploading images...'
              : images.length > 0
                ? `Add More Photos (${images.length} selected)`
                : 'Add Photos'
            }
          </Button>

          {/* Remove All Button */}
          {images.length > 0 && (
            <Button
              variant="text"
              color="error"
              onClick={() => setImages([])}
              fullWidth
              disabled={compressing}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Remove All Images
            </Button>
          )}

          {/* Images Preview */}
          {images.length > 0 && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Preview ({images.length} image{images.length !== 1 ? 's' : ''})
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  mt: 1,
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                {images.map((imageUrl, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: alpha(theme.palette.common.black, 0.02),
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Image
                      src={imageUrl}
                      alt={`Preview ${index + 1}`}
                      fill
                      style={{
                        objectFit: "cover",
                      }}
                      unoptimized // Since we are using Cloudinary URLs now
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
                      disabled={compressing}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: alpha(theme.palette.common.black, 0.6),
                        color: 'white',
                        padding: '4px',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.common.black, 0.8),
                        },
                      }}
                      size="small"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onCancel}
          disabled={compressing}
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
          onClick={onSave}
          disabled={(!content.trim() && images.length === 0) || compressing}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          {compressing ? 'Processing...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}