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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

function useMasonryCols() {
  const [cols, setCols] = React.useState(3);
  React.useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 600) return 2;
      if (w < 900) return 3;
      if (w < 1200) return 3;
      return 3;
    };
    const apply = () => setCols(compute());
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  return cols;
}

export default function GalleryPage() {
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
        })),
    [posts]
  );

  const cols = useMasonryCols();

  // Lightbox
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const handleOpen = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const prev = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  // Arrow keys in lightbox
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Gallery
      </Typography>

      {images.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No photos yet. Start posting to see them here.
        </Typography>
      ) : (
        <ImageList
          variant="masonry"
          cols={cols}
          gap={8}
          sx={{
            "& img": { borderRadius: 2 },
          }}
        >
          {images.map((img, i) => (
            <ImageListItem key={img.id} onClick={() => handleOpen(i)} sx={{ cursor: "zoom-in" }}>
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                style={{
                  width: "100%",
                  display: "block",
                }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Lightbox */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.92)",
          },
        }}
      >
        <Box
          onClick={handleClose}
          sx={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            p: 2,
          }}
        >
          {/* Close */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            sx={{
              position: "fixed",
              top: 16,
              right: 16,
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <CloseIcon htmlColor="#fff" />
          </IconButton>

          {/* Prev */}
          <IconButton
            onClick={prev}
            sx={{
              position: "fixed",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <ChevronLeftIcon htmlColor="#fff" />
          </IconButton>

          {/* Next */}
          <IconButton
            onClick={next}
            sx={{
              position: "fixed",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <ChevronRightIcon htmlColor="#fff" />
          </IconButton>

          {/* Image */}
          {images[index] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[index].src}
              alt={images[index].alt}
              style={{
                maxWidth: "95vw",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          )}

          {/* Caption */}
          {images[index] && (
            <Typography
              variant="body2"
              sx={{
                position: "fixed",
                bottom: 16,
                left: 16,
                right: 16,
                textAlign: "center",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {images[index].user ? `by ${images[index].user}` : ""}
            </Typography>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
