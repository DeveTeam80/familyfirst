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
} from "@mui/material";
import { Close, PhotoLibrary } from "@mui/icons-material";

export default function EditPostDialog({
  open,
  content,
  setContent,
  tags,
  setTags,
  images,  // Changed from image
  setImages,  // Changed from setImage
  onCancel,
  onSave,
}: {
  open: boolean;
  content: string;
  setContent: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  images: string[];  // Changed from image: string | null | undefined
  setImages: (v: string[]) => void;  // Changed from setImage
  onCancel: () => void;
  onSave: () => void;
}) {
  const theme = useTheme();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages: string[] = [];
      
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === filesArray.length) {
            setImages([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
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
          />
          
          {/* Upload Button */}
          <Button
            variant="outlined"
            startIcon={<PhotoLibrary />}
            onClick={() => document.getElementById("edit-photo-upload")?.click()}
            fullWidth
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
            {images.length > 0 ? `Add More Photos (${images.length} selected)` : 'Add Photos'}
          </Button>

          {/* Remove All Button */}
          {images.length > 0 && (
            <Button
              variant="text"
              color="error"
              onClick={() => setImages([])}
              fullWidth
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(index)}
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
          disabled={!content.trim() && images.length === 0}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}