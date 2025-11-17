"use client";

import * as React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Box,
  ImageList,
  ImageListItem,
  Typography,
  Dialog,
  IconButton,
  Paper,
  Chip,
  Stack,
  useTheme,
  alpha,
  useMediaQuery,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FavoriteBorder,
  Favorite,
  Download as DownloadIcon,
} from "@mui/icons-material";

function useMasonryCols() {
  const [cols, setCols] = React.useState(3);
  React.useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 600) return 1;
      if (w < 900) return 2;
      if (w < 1200) return 3;
      return 4;
    };
    const apply = () => setCols(compute());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return cols;
}

export default function GalleryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const posts = useSelector((s: RootState) => s.posts.items);
  
  const images = React.useMemo(
    () =>
      posts
        .filter((p) => !!p.image)
        .map((p) => ({
          id: p.id,
          src: p.image as string,
          alt: p.content || p.tags?.join(", ") || "Photo",
          user: p.user,
          date: p.date,
          likes: p.likes || 0,
          tags: p.tags || [],
        })),
    [posts]
  );

  const cols = useMasonryCols();

  // Lightbox
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const handleOpen = (i: number) => {
    setIndex(i);
    setOpen(true);
    setImageLoaded(false);
  };
  
  const handleClose = () => {
    setOpen(false);
    setImageLoaded(false);
  };

  const prev = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setImageLoaded(false);
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  
  const next = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setImageLoaded(false);
    setIndex((i) => (i + 1) % images.length);
  };

  const handleDownload = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const img = images[index];
    if (img) {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = `family-photo-${img.id}.jpg`;
      link.click();
    }
  };

  // Arrow keys in lightbox
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Family Gallery
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {images.length} {images.length === 1 ? 'photo' : 'photos'} • Tap to view full size
        </Typography>
      </Paper>

      {images.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: 'divider',
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No photos yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start posting photos to build your family gallery! 📸
          </Typography>
        </Paper>
      ) : (
        <ImageList
          variant="masonry"
          cols={cols}
          gap={isMobile ? 8 : 12}
        >
          {images.map((img, i) => (
            <Zoom in={true} key={img.id} style={{ transitionDelay: `${i * 50}ms` }}>
              <ImageListItem 
                onClick={() => handleOpen(i)} 
                sx={{ 
                  cursor: "zoom-in",
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 2,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                    '& .overlay': {
                      opacity: 1,
                    },
                  },
                }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  style={{
                    width: "100%",
                    display: "block",
                    borderRadius: 8,
                  }}
                />
                
                {/* Hover Overlay */}
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    p: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                    {img.user}
                  </Typography>
                  {img.tags.length > 0 && (
                    <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                      {img.tags.slice(0, 2).map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.65rem',
                            backgroundColor: alpha(theme.palette.primary.main, 0.8),
                            color: 'white',
                          }} 
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              </ImageListItem>
            </Zoom>
          ))}
        </ImageList>
      )}

      {/* Enhanced Lightbox */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.95)",
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Box
          onClick={handleClose}
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: isMobile ? 1 : 2,
          }}
        >
          {/* Top Bar */}
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
              zIndex: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
              {index + 1} / {images.length}
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={handleDownload}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: 'white',
                  '&:hover': { bgcolor: alpha('#fff', 0.2) },
                }}
                size={isMobile ? "small" : "medium"}
              >
                <DownloadIcon />
              </IconButton>
              
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: 'white',
                  '&:hover': { bgcolor: alpha('#fff', 0.2) },
                }}
                size={isMobile ? "small" : "medium"}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Navigation Buttons */}
          {!isMobile && images.length > 1 && (
            <>
              <IconButton
                onClick={prev}
                sx={{
                  position: "fixed",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: alpha('#fff', 0.1),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { 
                    bgcolor: alpha('#fff', 0.2),
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  transition: 'all 0.2s',
                  zIndex: 1,
                }}
                size="large"
              >
                <ChevronLeftIcon fontSize="large" />
              </IconButton>

              <IconButton
                onClick={next}
                sx={{
                  position: "fixed",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: alpha('#fff', 0.1),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { 
                    bgcolor: alpha('#fff', 0.2),
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  transition: 'all 0.2s',
                  zIndex: 1,
                }}
                size="large"
              >
                <ChevronRightIcon fontSize="large" />
              </IconButton>
            </>
          )}

          {/* Image */}
          {images[index] && (
            <Fade in={imageLoaded} timeout={300}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[index].src}
                alt={images[index].alt}
                onLoad={() => setImageLoaded(true)}
                style={{
                  maxWidth: isMobile ? "95vw" : "90vw",
                  maxHeight: isMobile ? "70vh" : "75vh",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </Fade>
          )}

          {/* Bottom Info Bar */}
          {images[index] && (
            <Box
              sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                p: isMobile ? 2 : 3,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {images[index].user}
                </Typography>
                {images[index].alt && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha('#fff', 0.8),
                      mb: 1,
                    }}
                  >
                    {images[index].alt}
                  </Typography>
                )}
                
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {images[index].tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                  
                  {images[index].likes > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                      <Favorite sx={{ fontSize: 16, color: 'error.main' }} />
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {images[index].likes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          )}

          {/* Mobile Navigation */}
          {isMobile && images.length > 1 && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                onClick={prev}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: alpha('#fff', 0.2) },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              
              <IconButton
                onClick={next}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: alpha('#fff', 0.2) },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}