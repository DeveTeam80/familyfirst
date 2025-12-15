// src/components/feed/ImageCarousel.tsx
"use client";

import * as React from "react";
import { Box, IconButton, useTheme, alpha } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";

interface ImageCarouselProps {
  images: string[];
  onImageClick?: (index: number) => void;
  aspectRatio?: number;
}

export default function ImageCarousel({
  images,
  onImageClick,
  aspectRatio = 1,
}: ImageCarouselProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);

  // Minimum swipe distance (in px) to trigger slide change
  const minSwipeDistance = 50;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrevious(),
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
  });

  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(currentIndex);
    }
  };

  if (images.length === 0) return null;

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <Box
        onClick={handleImageClick}
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: `${(1 / aspectRatio) * 100}%`,
          borderRadius: 2,
          overflow: "hidden",
          cursor: "pointer",
          mt: 2,
          mb: 2,
          bgcolor: alpha(theme.palette.common.black, 0.02),
        }}
      >
        <Image
          src={images[0]}
          alt="Post image"
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, 600px"
          priority
        />
      </Box>
    );
  }

  // Multiple images - Instagram-style carousel
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        mt: 2,
        mb: 2,
        userSelect: "none",
      }}
    >
      {/* Main carousel container */}
      <Box
        {...swipeHandlers}
        onClick={handleImageClick}
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: `${(1 / aspectRatio) * 100}%`,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: alpha(theme.palette.common.black, 0.02),
          cursor: "pointer",
        }}
      >
        {/* Image slides */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {images.map((image, index) => (
            <Box
              key={index}
              sx={{
                minWidth: "100%",
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              <Image
                src={image}
                alt={`Slide ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 600px"
                priority={index === 0}
              />
            </Box>
          ))}
        </Box>

        {/* Navigation arrows - Desktop only */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                sx={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                  backdropFilter: "blur(8px)",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  display: { xs: "none", sm: "flex" },
                  "&:hover": {
                    bgcolor: theme.palette.common.white,
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  transition: "all 0.2s",
                  zIndex: 2,
                }}
              >
                <ChevronLeft sx={{ fontSize: 20 }} />
              </IconButton>
            )}

            {currentIndex < images.length - 1 && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                  backdropFilter: "blur(8px)",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  display: { xs: "none", sm: "flex" },
                  "&:hover": {
                    bgcolor: theme.palette.common.white,
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  transition: "all 0.2s",
                  zIndex: 2,
                }}
              >
                <ChevronRight sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </>
        )}

        {/* Dots indicator - Instagram style */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              sx={{
                width: index === currentIndex ? 24 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor:
                  index === currentIndex
                    ? theme.palette.common.white
                    : alpha(theme.palette.common.white, 0.5),
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: `0 1px 3px ${alpha(
                  theme.palette.common.black,
                  0.3
                )}`,
                "&:hover": {
                  bgcolor:
                    index === currentIndex
                      ? theme.palette.common.white
                      : alpha(theme.palette.common.white, 0.7),
                },
              }}
            />
          ))}
        </Box>

        {/* Counter - bottom right */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            px: 1.5,
            py: 0.5,
            borderRadius: 20,
            bgcolor: alpha(theme.palette.common.black, 0.6),
            backdropFilter: "blur(8px)",
            color: theme.palette.common.white,
            fontSize: "0.75rem",
            fontWeight: 600,
            zIndex: 2,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.2)}`,
          }}
        >
          {currentIndex + 1} / {images.length}
        </Box>
      </Box>

      {/* Swipe hint - shows briefly on mobile */}
      {images.length > 1 && currentIndex === 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            px: 2,
            py: 0.5,
            borderRadius: 20,
            bgcolor: alpha(theme.palette.common.black, 0.6),
            backdropFilter: "blur(8px)",
            color: theme.palette.common.white,
            fontSize: "0.7rem",
            fontWeight: 600,
            zIndex: 2,
            display: { xs: "block", sm: "none" },
            animation: "fadeOut 3s ease-in-out forwards",
            "@keyframes fadeOut": {
              "0%": { opacity: 1 },
              "70%": { opacity: 1 },
              "100%": { opacity: 0 },
            },
          }}
        >
          ← Swipe →
        </Box>
      )}
    </Box>
  );
}