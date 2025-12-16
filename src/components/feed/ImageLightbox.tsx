// src/components/feed/ImageLightbox.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  Box,
  IconButton,
  useTheme,
  alpha,
  Typography,
  Stack,
  useMediaQuery,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Download as DownloadIcon,
} from "@mui/icons-material";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex,
  open,
  onClose,
}: ImageLightboxProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [isZoomed, setIsZoomed] = React.useState(false);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  };

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;
      
      if (event.key === "ArrowLeft") {
        handlePrevious();
      } else if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "Escape") {
        onClose();
      }
    },
    [open, currentIndex, images.length]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: alpha(theme.palette.common.black, 0.95),
          backdropFilter: "blur(20px)",
        },
      }}
      TransitionComponent={Zoom}
      transitionDuration={300}
    >
      {/* Header */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          background: `linear-gradient(180deg, ${alpha(
            theme.palette.common.black,
            0.8
          )} 0%, transparent 100%)`,
          p: isMobile ? 1.5 : 2,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="body2"
            sx={{
              color: "white",
              fontWeight: 600,
              px: 1,
              py: 0.5,
              bgcolor: alpha(theme.palette.common.white, 0.1),
              borderRadius: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            {currentIndex + 1} / {images.length}
          </Typography>

          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={handleDownload}
              sx={{
                color: "white",
                bgcolor: alpha(theme.palette.common.white, 0.1),
                backdropFilter: "blur(10px)",
                "&:hover": {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              onClick={onClose}
              sx={{
                color: "white",
                bgcolor: alpha(theme.palette.common.white, 0.1),
                backdropFilter: "blur(10px)",
                "&:hover": {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Main Image Area */}
      <Box
        {...swipeHandlers}
        onClick={() => setIsZoomed(!isZoomed)}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: isZoomed ? "zoom-out" : "zoom-in",
          overflow: "hidden",
        }}
      >
        <Fade in={open} timeout={300}>
          <Box
            sx={{
              position: "relative",
              width: isZoomed ? "150%" : "90%",
              height: isZoomed ? "150%" : "90%",
              maxWidth: isZoomed ? "none" : "1200px",
              maxHeight: isZoomed ? "none" : "800px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Image
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              fill
              style={{
                objectFit: isZoomed ? "contain" : "contain",
              }}
              priority
              sizes="100vw"
            />
          </Box>
        </Fade>
      </Box>

      {/* Navigation Buttons - Desktop Only */}
      {!isMobile && images.length > 1 && (
        <>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            sx={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              bgcolor: alpha(theme.palette.common.white, 0.1),
              backdropFilter: "blur(10px)",
              width: 56,
              height: 56,
              "&:hover": {
                bgcolor: alpha(theme.palette.common.white, 0.2),
                transform: "translateY(-50%) scale(1.1)",
              },
              transition: "all 0.2s",
            }}
          >
            <ChevronLeft sx={{ fontSize: 32 }} />
          </IconButton>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            sx={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              bgcolor: alpha(theme.palette.common.white, 0.1),
              backdropFilter: "blur(10px)",
              width: 56,
              height: 56,
              "&:hover": {
                bgcolor: alpha(theme.palette.common.white, 0.2),
                transform: "translateY(-50%) scale(1.1)",
              },
              transition: "all 0.2s",
            }}
          >
            <ChevronRight sx={{ fontSize: 32 }} />
          </IconButton>
        </>
      )}

      {/* Thumbnail Strip - Bottom */}
      {images.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: isMobile ? 1.5 : 2,
            background: `linear-gradient(0deg, ${alpha(
              theme.palette.common.black,
              0.8
            )} 0%, transparent 100%)`,
            zIndex: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: "auto",
              pb: 1,
              px: 1,
              "&::-webkit-scrollbar": {
                height: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: alpha(theme.palette.common.white, 0.1),
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: alpha(theme.palette.common.white, 0.3),
                borderRadius: "3px",
                "&:hover": {
                  background: alpha(theme.palette.common.white, 0.5),
                },
              },
            }}
          >
            {images.map((img, index) => (
              <Box
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                sx={{
                  position: "relative",
                  width: isMobile ? 60 : 80,
                  height: isMobile ? 60 : 80,
                  flexShrink: 0,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "2px solid",
                  borderColor:
                    currentIndex === index
                      ? theme.palette.primary.main
                      : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: currentIndex === index ? 1 : 0.6,
                  "&:hover": {
                    opacity: 1,
                    transform: "scale(1.05)",
                  },
                }}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="80px"
                />
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Swipe Hint - Mobile Only */}
      {isMobile && images.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            opacity: 0.3,
            animation: "fadeInOut 2s ease-in-out infinite",
            "@keyframes fadeInOut": {
              "0%, 100%": { opacity: 0 },
              "50%": { opacity: 0.3 },
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "white",
              bgcolor: alpha(theme.palette.common.black, 0.6),
              px: 2,
              py: 1,
              borderRadius: 2,
              backdropFilter: "blur(10px)",
              fontWeight: 600,
            }}
          >
            ← Swipe to browse →
          </Typography>
        </Box>
      )}
    </Dialog>
  );
}