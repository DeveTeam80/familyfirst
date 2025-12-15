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
  Menu,
  Drawer,
  Divider,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Favorite,
  Download as DownloadIcon,
  FilterList,
  Check,
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
import Image from "next/image";

type GalleryImage = {
  id: string | number;
  src: string;
  alt: string;
  user?: string;
  date?: string | number;
  likes: number;
  tags: string[];
  event?: string;
  occasion?: string;
};

interface PostType {
  id: string;
  images?: string[];
  image?: string | null;
  content?: string | null;
  tags?: string[];
  user?: string;
  date?: string;
  likes?: number;
  event?: string;
  occasion?: string;
}

const TAG_OPTIONS = [
  "Family",
  "Memories",
  "Celebration",
  "Update",
  "Question",
  "Event",
  "Announcement",
];

export default function GalleryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const posts = useSelector((s: RootState) => s.posts.items);

  /** 1. Build baseImages from ALL images in posts (multi-image aware) */
  const baseImages: GalleryImage[] = React.useMemo(
    () =>
      (posts || []).flatMap((p: PostType) => {
        const allImages: string[] =
          Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : p.image && typeof p.image === 'string'
              ? [p.image]
              : [];

        if (!allImages.length) return [];

        return allImages.map((imgUrl: string, index: number) => ({
          id: `${p.id}-${index}`,
          src: imgUrl,
          alt: p.content || p.tags?.join(", ") || "Photo",
          user: p.user,
          date: p.date,
          likes: p.likes || 0,
          tags: p.tags || [],
          event: p.event || p.tags?.[0] || "",
          occasion: p.occasion || p.tags?.[1] || "",
        }));
      }),
    [posts]
  );

  console.log("📸 posts:", posts);
  console.log("📸 baseImages (flattened):", baseImages);

  /** 2. Sort & filter state */
  const [sortOrder, setSortOrder] = React.useState<"latest" | "oldest">("latest");
  const [filterName, setFilterName] = React.useState<string | "all">("all");
  const [filterEvent, setFilterEvent] = React.useState<string | "all">("all");
  const [filterTag, setFilterTag] = React.useState<string | "all">("all");

  /** 3. Filter + sort derived images */
  const images: GalleryImage[] = React.useMemo(() => {
    let arr = [...baseImages];

    if (filterName !== "all") {
      arr = arr.filter(
        (img) =>
          img.user &&
          img.user.toLowerCase() === filterName.toLowerCase()
      );
    }

    if (filterEvent !== "all") {
      arr = arr.filter(
        (img) =>
          img.event &&
          img.event.toLowerCase() === filterEvent.toLowerCase()
      );
    }

    if (filterTag !== "all") {
      arr = arr.filter((img) => img.tags?.includes(filterTag));
    }

    arr.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === "latest" ? db - da : da - db;
    });

    console.log("🖼️ Sorted & Filtered Gallery Data:", {
      sortOrder,
      filterName,
      filterEvent,
      filterTag,
      total: arr.length,
      data: arr,
    });

    return arr;
  }, [baseImages, sortOrder, filterName, filterEvent, filterTag]);

  /** 4. Filter UI state */
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<
    { top: number; left: number } | null
  >(null);

  const clearFilters = () => {
    setFilterName("all");
    setFilterEvent("all");
    setFilterTag("all");
  };

  const uniqueNames = React.useMemo(
    () =>
      Array.from(
        new Set(
          baseImages
            .map((img) => img.user)
            .filter((n): n is string => !!n && n.trim().length > 0)
        )
      ),
    [baseImages]
  );

  const uniqueEvents = React.useMemo(
    () =>
      Array.from(
        new Set(
          baseImages
            .map((img) => img.event)
            .filter((e): e is string => !!e && e.trim().length > 0)
        )
      ),
    [baseImages]
  );

  const cols = useMasonryCols();

  /** 5. Lightbox */
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
      const link = document.createElement("a");
      link.href = img.src;
      link.download = `family-photo-${img.id}.jpg`;
      link.click();
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, images.length]);

  /** 6. UI */

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Top bar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2, mt: 1 }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
            Family Gallery
          </Typography>
        </Box>

        <IconButton
          onClick={() => {
            if (isMobile) {
              setDrawerOpen(true);
            } else {
              setMenuPosition({
                top: 100, // adjust if you want higher/lower
                left: window.innerWidth / 2, // center horizontally
              });
            }
          }}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.18),
            },
          }}
        >
          <FilterList />
        </IconButton>
      </Stack>

      {/* Desktop centered horizontal filter menu */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={
          menuPosition
            ? { top: menuPosition.top, left: menuPosition.left }
            : undefined
        }
        open={Boolean(menuPosition)}
        onClose={() => setMenuPosition(null)}
        PaperProps={{
          sx: {
            p: 1.5,
            transform: "translateX(-50%)", // center around anchorPosition.left
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            maxWidth: 700,
          }}
        >
          {/* Sort */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", color: "text.secondary" }}
            >
              Sort
            </Typography>
            <Chip
              size="small"
              label="Latest"
              onClick={() => setSortOrder("latest")}
              color={sortOrder === "latest" ? "primary" : "default"}
              icon={sortOrder === "latest" ? <Check fontSize="small" /> : undefined}
            />
            <Chip
              size="small"
              label="Oldest"
              onClick={() => setSortOrder("oldest")}
              color={sortOrder === "oldest" ? "primary" : "default"}
              icon={sortOrder === "oldest" ? <Check fontSize="small" /> : undefined}
            />
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Name */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", color: "text.secondary" }}
            >
              Name
            </Typography>
            <Chip
              size="small"
              label="All"
              onClick={() => setFilterName("all")}
              color={filterName === "all" ? "primary" : "default"}
              icon={filterName === "all" ? <Check fontSize="small" /> : undefined}
            />
            {uniqueNames.map((name) => (
              <Chip
                key={name}
                size="small"
                label={name}
                onClick={() => setFilterName(name)}
                color={filterName === name ? "primary" : "default"}
                icon={filterName === name ? <Check fontSize="small" /> : undefined}
              />
            ))}
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Event */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", color: "text.secondary" }}
            >
              Event
            </Typography>
            <Chip
              size="small"
              label="All"
              onClick={() => setFilterEvent("all")}
              color={filterEvent === "all" ? "primary" : "default"}
              icon={filterEvent === "all" ? <Check fontSize="small" /> : undefined}
            />
            {uniqueEvents.map((ev) => (
              <Chip
                key={ev}
                size="small"
                label={ev}
                onClick={() => setFilterEvent(ev)}
                color={filterEvent === ev ? "primary" : "default"}
                icon={filterEvent === ev ? <Check fontSize="small" /> : undefined}
              />
            ))}
          </Stack>

          <Divider orientation="vertical" flexItem />

          {/* Tags */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="caption"
              sx={{ textTransform: "uppercase", color: "text.secondary" }}
            >
              Tags
            </Typography>
            <Chip
              size="small"
              label="All"
              onClick={() => setFilterTag("all")}
              color={filterTag === "all" ? "primary" : "default"}
              icon={filterTag === "all" ? <Check fontSize="small" /> : undefined}
            />
            {TAG_OPTIONS.map((tag) => (
              <Chip
                key={tag}
                size="small"
                label={tag}
                onClick={() => setFilterTag(tag)}
                color={filterTag === tag ? "primary" : "default"}
                icon={filterTag === tag ? <Check fontSize="small" /> : undefined}
              />
            ))}
          </Stack>

          {(filterName !== "all" ||
            filterEvent !== "all" ||
            filterTag !== "all") && (
              <>
                <Divider orientation="vertical" flexItem />
                <Chip
                  size="small"
                  label="Clear"
                  onClick={clearFilters}
                  color="error"
                  variant="outlined"
                />
              </>
            )}
        </Box>
      </Menu>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px 16px 0 0",
            p: 2,
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Filters & Sorting
        </Typography>

        <List dense>
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", color: "text.secondary", mt: 1 }}
          >
            Sort by date
          </Typography>
          <ListItemButton onClick={() => setSortOrder("latest")}>
            <ListItemText primary="Latest" />
            {sortOrder === "latest" && <Check fontSize="small" />}
          </ListItemButton>
          <ListItemButton onClick={() => setSortOrder("oldest")}>
            <ListItemText primary="Oldest" />
            {sortOrder === "oldest" && <Check fontSize="small" />}
          </ListItemButton>

          <Divider sx={{ my: 1 }} />

          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", color: "text.secondary", mt: 1 }}
          >
            Filter by name
          </Typography>
          <ListItemButton onClick={() => setFilterName("all")}>
            <ListItemText primary="All" />
            {filterName === "all" && <Check fontSize="small" />}
          </ListItemButton>
          {uniqueNames.map((name) => (
            <ListItemButton key={name} onClick={() => setFilterName(name)}>
              <ListItemText primary={name} />
              {filterName === name && <Check fontSize="small" />}
            </ListItemButton>
          ))}

          <Divider sx={{ my: 1 }} />

          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", color: "text.secondary", mt: 1 }}
          >
            Filter by event
          </Typography>
          <ListItemButton onClick={() => setFilterEvent("all")}>
            <ListItemText primary="All" />
            {filterEvent === "all" && <Check fontSize="small" />}
          </ListItemButton>
          {uniqueEvents.map((ev) => (
            <ListItemButton key={ev} onClick={() => setFilterEvent(ev)}>
              <ListItemText primary={ev} />
              {filterEvent === ev && <Check fontSize="small" />}
            </ListItemButton>
          ))}

          <Divider sx={{ my: 1 }} />

          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", color: "text.secondary", mt: 1 }}
          >
            Filter by tags
          </Typography>
          <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label="All"
              onClick={() => setFilterTag("all")}
              color={filterTag === "all" ? "primary" : "default"}
              size="small"
            />
            {TAG_OPTIONS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => setFilterTag(tag)}
                color={filterTag === tag ? "primary" : "default"}
                size="small"
              />
            ))}
          </Box>

          {(filterName !== "all" ||
            filterEvent !== "all" ||
            filterTag !== "all") && (
              <ListItemButton onClick={clearFilters} sx={{ mt: 1 }}>
                <ListItemText
                  primary="Clear filters"
                  primaryTypographyProps={{ color: "error.main" }}
                />
              </ListItemButton>
            )}
        </List>
      </Drawer>

      {/* 7. Show fallback only if there are truly no posts with images */}
      {baseImages.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "2px dashed",
            borderColor: "divider",
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
        <ImageList variant="masonry" cols={cols} gap={isMobile ? 8 : 12}>
          {images.map((img, i) => (
            <Zoom in={true} key={img.id} style={{ transitionDelay: `${i * 50}ms` }}>
              <ImageListItem
                onClick={() => handleOpen(i)}
                sx={{
                  cursor: "zoom-in",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 2,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: `0 8px 24px ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                    "& .overlay": {
                      opacity: 1,
                    },
                  },
                }}
              >
                <Image
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
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)",
                    opacity: 0,
                    transition: "opacity 0.3s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "white", fontWeight: 600 }}
                  >
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
                            fontSize: "0.65rem",
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.8
                            ),
                            color: "white",
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

      {/* Lightbox */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.95)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <Box
          onClick={handleClose}
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
              zIndex: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography
              variant="body2"
              sx={{ color: "white", fontWeight: 600 }}
            >
              {index + 1} / {images.length}
            </Typography>

            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={handleDownload}
                sx={{
                  bgcolor: alpha("#fff", 0.1),
                  color: "white",
                  "&:hover": { bgcolor: alpha("#fff", 0.2) },
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
                  bgcolor: alpha("#fff", 0.1),
                  color: "white",
                  "&:hover": { bgcolor: alpha("#fff", 0.2) },
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
                  bgcolor: alpha("#fff", 0.1),
                  color: "white",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    bgcolor: alpha("#fff", 0.2),
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  transition: "all 0.2s",
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
                  bgcolor: alpha("#fff", 0.1),
                  color: "white",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    bgcolor: alpha("#fff", 0.2),
                    transform: "translateY(-50%) scale(1.1)",
                  },
                  transition: "all 0.2s",
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
              <Image
                src={images[index].src}
                alt={images[index].alt}
                onLoad={() => setImageLoaded(true)}
                width={1200}
                height={800}
                style={{
                  maxWidth: isMobile ? "95vw" : "90vw",
                  maxHeight: isMobile ? "70vh" : "75vh",
                  objectFit: "contain",
                  borderRadius: 8,
                  width: "auto",
                  height: "auto",
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
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box sx={{ maxWidth: 800, mx: "auto" }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: "white",
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
                      color: alpha("#fff", 0.8),
                      mb: 1,
                    }}
                  >
                    {images[index].alt}
                  </Typography>
                )}

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  {images[index].tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                        color: "white",
                        backdropFilter: "blur(10px)",
                        fontSize: "0.75rem",
                      }}
                    />
                  ))}

                  {images[index].likes > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        ml: 1,
                      }}
                    >
                      <Favorite sx={{ fontSize: 16, color: "error.main" }} />
                      <Typography variant="caption" sx={{ color: "white" }}>
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
                position: "fixed",
                bottom: 80,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 1,
                zIndex: 2,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                onClick={prev}
                sx={{
                  bgcolor: alpha("#fff", 0.1),
                  color: "white",
                  backdropFilter: "blur(10px)",
                  "&:hover": { bgcolor: alpha("#fff", 0.2) },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>

              <IconButton
                onClick={next}
                sx={{
                  bgcolor: alpha("#fff", 0.1),
                  color: "white",
                  backdropFilter: "blur(10px)",
                  "&:hover": { bgcolor: alpha("#fff", 0.2) },
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