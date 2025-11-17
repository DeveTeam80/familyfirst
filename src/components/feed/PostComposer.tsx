"use client";
import * as React from "react";
import { 
  Box, 
  Avatar, 
  TextField, 
  Stack, 
  Chip, 
  Button, 
  Menu, 
  MenuItem,
  IconButton,
  Typography,
  Paper,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { 
  Image, 
  Event, 
  Tag,
  Close,
  PhotoLibrary,
} from "@mui/icons-material";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleTagDelete = (tag: string) =>
    setSelectedTags(selectedTags.filter((t) => t !== tag));

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
    setAnchorEl(null);
  };

  const availableTags = ["Family", "Memories", "Celebration", "Update", "Question", "Event", "Announcement"];
  const canPost = Boolean(content?.trim() || selectedImage);

  return (
    <Paper
      elevation={0}
      sx={{
        border: '2px solid',
        borderColor: isFocused ? 'primary.main' : 'divider',
        borderRadius: 3,
        p: isMobile ? 2 : 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'background.paper',
        '&:hover': {
          borderColor: isFocused ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
        },
      }}
    >
      {/* Main Input Area */}
      <Box display="flex" gap={isMobile ? 1 : 2} mb={2}>
        <Avatar 
          alt="User" 
          src="/avatar.png"
          sx={{
            width: isMobile ? 36 : 48,
            height: isMobile ? 36 : 48,
            border: '2px solid',
            borderColor: 'divider',
          }}
        />
        <TextField
          fullWidth
          multiline
          rows={isMobile ? 2 : 3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Share something with your family..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent',
                borderWidth: 0,
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: isMobile ? '10px 12px' : '12px 16px',
            },
          }}
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

      {/* Image Preview */}
      {selectedImage && (
        <Box 
          sx={{ 
            position: 'relative',
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: alpha(theme.palette.common.black, 0.02),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: isMobile ? 250 : 400,
              objectFit: "cover",
              display: 'block',
            }}
          />
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: alpha(theme.palette.common.black, 0.6),
              color: 'white',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.black, 0.8),
              },
              padding: isMobile ? '6px' : '8px',
            }}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <Stack 
          direction="row" 
          spacing={0.5} 
          mb={2} 
          flexWrap="wrap" 
          useFlexGap
        >
          {selectedTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleTagDelete(tag)}
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 500,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                height: isMobile ? 24 : 'auto',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '& .MuiChip-deleteIcon': {
                  color: 'primary.main',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  '&:hover': {
                    color: 'primary.dark',
                  },
                },
              }}
            />
          ))}
        </Stack>
      )}

      {/* Action Buttons */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        gap={isMobile ? 1 : 2}
        flexWrap="wrap"
      >
        <Stack direction="row" spacing={isMobile ? 0.5 : 1} flexWrap="wrap" useFlexGap>
          {isMobile ? (
            <>
              <IconButton
                size="small"
                onClick={() => document.getElementById("photo-upload")?.click()}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <PhotoLibrary fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={onOpenEvent}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Event fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Tag fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoLibrary />}
                onClick={() => document.getElementById("photo-upload")?.click()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  px: 2,
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Photo
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Event />}
                onClick={onOpenEvent}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  px: 2,
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Event
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Tag />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  px: 2,
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Tag
              </Button>
            </>
          )}

          {/* Tag Menu */}
          <Menu 
            anchorEl={anchorEl} 
            open={Boolean(anchorEl)} 
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              elevation: 3,
              sx: {
                borderRadius: 2,
                mt: 1,
                minWidth: isMobile ? 150 : 200,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                SELECT TAGS
              </Typography>
            </Box>
            {availableTags.map((tag) => (
              <MenuItem
                key={tag}
                onClick={() => handleTagSelect(tag)}
                disabled={selectedTags.includes(tag)}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
                }}
              >
                <Chip 
                  label={tag} 
                  size="small" 
                  sx={{ 
                    mr: 1,
                    pointerEvents: 'none',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                  }} 
                />
                <Typography variant="body2">{tag}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Stack>

        <Button
          variant="contained"
          onClick={onPost}
          disabled={!canPost}
          size={isMobile ? "small" : "medium"}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: isMobile ? 3 : 4,
            py: isMobile ? 0.75 : 1,
            boxShadow: canPost ? 2 : 0,
            transition: 'all 0.2s',
            color: '#ffffff !important',
            '&:hover': {
              transform: canPost ? 'translateY(-2px)' : 'none',
              boxShadow: canPost ? 4 : 0,
              color: '#ffffff !important',
            },
            '&.Mui-disabled': {
              backgroundColor: alpha(theme.palette.action.disabled, 0.12),
              color: `${alpha('#ffffff', 0.5)} !important`,
            },
          }}
        >
          Post
        </Button>
      </Box>
    </Paper>
  );
}