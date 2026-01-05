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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCompressing(true);
      const filesArray = Array.from(e.target.files);
      const newImages: string[] = [];
      
      try {
        // Compression options
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg" as const,
        };

        for (const file of filesArray) {
          try {
            console.log(`🔄 Compressing ${file.name}...`);
            
            // Compress the image
            const compressedFile = await imageCompression(file, options);
            
            console.log(
              `✅ ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(
                compressedFile.size / 1024 / 1024
              ).toFixed(2)} MB`
            );

            // Convert to base64 for preview
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.readAsDataURL(compressedFile);
            });

            const base64 = await base64Promise;
            newImages.push(base64);
          } catch (error) {
            console.error(`❌ Error compressing ${file.name}:`, error);
            // If compression fails, use original file
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.readAsDataURL(file);
            });
            const base64 = await base64Promise;
            newImages.push(base64);
          }
        }

        setImages([...images, ...newImages]);
      } catch (error) {
        console.error("❌ Error processing images:", error);
        alert("Failed to process images. Please try again.");
      } finally {
        setCompressing(false);
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
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Edit Post
        </Typography>
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
              ? 'Compressing images...' 
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
                  // Custom scrollbar
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.text.secondary, 0.2),
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: alpha(theme.palette.text.secondary, 0.35),
                  },
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