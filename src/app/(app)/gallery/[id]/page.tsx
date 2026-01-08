"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
// 👇 Redux Imports
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAdmin } from "@/store/userSlice";

import {
  Box,
  Typography,
  Button,
  ImageList,
  ImageListItem,
  Stack,
  Chip,
  IconButton,
  Dialog,
  Fade,
  alpha,
  useTheme,
  useMediaQuery,
  Skeleton,
  Breadcrumbs,
  Link,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  TextField,
  InputAdornment,
  Collapse,
  Avatar,
  Tooltip,
  Badge,
  Divider,
} from "@mui/material";
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  Close,
  Download,
  CalendarToday,
  Tag,
  MoreVert,
  Delete,
  PhotoAlbum,
  ContentCopy,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import Image from "next/image";
import BulkUploadDialog from "@/components/gallery/BulkUploadDialog";

// ✅ Updated Interface to include IDs for permissions
interface PhotoItem {
  photo: {
    id: string;
    url: string;
    caption?: string | null;
    tags?: string[];
    uploadedBy: string; // 👈 Needed for permission check
    uploader?: {
      id: string;
      name: string | null;
      username: string | null;
    };
  };
  caption?: string | null;
  addedAt: string;
}

interface AlbumImage {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  tags: string[];
  createdAt: string;
  uploadedBy: string; // 👈 Mapped from API
  user: {
    id: string;
    name: string | null;
    username: string | null;
  };
}

interface AlbumDetails {
  id: string;
  title: string;
  description: string | null;
  event: string | null;
  occasion: string | null;
  date: string | null;
  tags: string[];
  createdBy: string; // 👈 Needed for permission check
  creator: {
    name: string | null;
    username: string | null;
  };
  images: AlbumImage[];
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // 🔒 Redux State
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);

  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // ⭐ Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUploader, setSelectedUploader] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Menus & Notifications
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  const fetchAlbum = useCallback(async () => {
    try {
      const response = await fetch(`/api/albums/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        
        const formattedAlbum: AlbumDetails = {
          id: data.id,
          title: data.title,
          description: data.description,
          event: data.calendarEvent?.title || null,
          occasion: null,
          date: data.calendarEvent?.startTime || data.createdAt,
          tags: data.tags || [],
          createdBy: data.createdBy, // 👈 Store creator ID
          creator: data.creator,
          images: (data.photos || []).map((item: PhotoItem) => ({
            id: item.photo.id,
            url: item.photo.url,
            title: item.caption,
            description: item.photo.caption,
            tags: item.photo.tags || [],
            createdAt: item.addedAt,
            uploadedBy: item.photo.uploader?.id || item.photo.uploadedBy || "", // 👈 Store uploader ID
            user: item.photo.uploader || { id: "", name: "Unknown", username: "unknown" },
          })),
        };
        setAlbum(formattedAlbum);
      } else {
        router.push("/gallery");
      }
    } catch (error) {
      console.error("Error fetching album:", error);
      router.push("/gallery");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  // ⭐ Get Unique Uploaders with Photo Counts
  const uploaderStats = useMemo(() => {
    if (!album) return [];
    const stats = new Map<string, { name: string; count: number }>();
    
    album.images.forEach((img) => {
      const name = img.user.name || img.user.username || "Unknown";
      if (stats.has(name)) {
        stats.get(name)!.count++;
      } else {
        stats.set(name, { name, count: 1 });
      }
    });
    
    return Array.from(stats.values()).sort((a, b) => b.count - a.count);
  }, [album]);

  // ⭐ Filter AND Sort Logic
  const filteredImages = useMemo(() => {
    if (!album) return [];

    const result = album.images.filter((img) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        (img.title && img.title.toLowerCase().includes(searchLower)) ||
        (img.description && img.description.toLowerCase().includes(searchLower)) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchLower));

      // Uploader filter
      const uploaderName = img.user.name || img.user.username || "Unknown";
      const matchesUploader = selectedUploader ? uploaderName === selectedUploader : true;

      return matchesSearch && matchesUploader;
    });

    // 2. Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [album, searchQuery, selectedUploader, sortOrder]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, imgId: string) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedImageId(imgId);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedImageId(null);
  };

  const handleDeleteImage = async () => {
    if (!selectedImageId || !album) return;
    
    // We don't need a confirm here if the logic is safe, but it's good UX
    if (!confirm("Remove this photo from the album?")) return;

    const originalImages = [...album.images];
    const newImages = album.images.filter((img) => img.id !== selectedImageId);
    setAlbum({ ...album, images: newImages }); // Optimistic Update
    handleCloseMenu();

    try {
      // Calls the Smart Delete API
      const response = await fetch(`/api/albums/${album.id}/images/${selectedImageId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setSnackbarMsg("Photo removed from album");
    } catch (error) {
      console.error("Delete failed", error);
      setAlbum({ ...album, images: originalImages }); // Revert
      setSnackbarMsg("Failed to remove photo");
    }
  };

  const handleSetCover = async () => {
    if (!selectedImageId || !album) return;
    const img = album.images.find((i) => i.id === selectedImageId);
    if (!img) return;
    handleCloseMenu();

    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: img.url }),
      });
      if (!response.ok) throw new Error("Failed to update cover");
      setSnackbarMsg("Album cover updated!");
    } catch (error) {
      console.error("Update failed", error);
      setSnackbarMsg("Failed to update album cover");
    }
  };

  const handleCopyLink = () => {
    if (!selectedImageId || !album) return;
    const img = album.images.find((i) => i.id === selectedImageId);
    if (img) {
      navigator.clipboard.writeText(img.url);
      setSnackbarMsg("Link copied to clipboard");
    }
    handleCloseMenu();
  };

  const handleDownload = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (!album || !filteredImages[lightboxIndex]) return;
    const img = filteredImages[lightboxIndex];
    const link = document.createElement("a");
    link.href = img.url;
    link.download = `${album.title}-${lightboxIndex + 1}.jpg`;
    link.click();
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setImageLoaded(false);
  };

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
    setImageLoaded(false);
  }, []);

  const handlePrevImage = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setImageLoaded(false);
    setLightboxIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  }, [filteredImages.length]);

  const handleNextImage = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setImageLoaded(false);
    setLightboxIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  }, [filteredImages.length]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedUploader(null);
  };

  // 👇 Permission Check Helpers
  const canManageAlbum = album ? (isAdmin || album.createdBy === currentUser?.id) : false;
  
  const getSelectedPhoto = () => {
    if (lightboxOpen) return filteredImages[lightboxIndex];
    if (selectedImageId) return album?.images.find(i => i.id === selectedImageId);
    return null;
  };

  const selectedPhoto = getSelectedPhoto();
  const canDeleteCurrentPhoto = selectedPhoto ? (
    isAdmin || 
    album?.createdBy === currentUser?.id || 
    selectedPhoto.uploadedBy === currentUser?.id
  ) : false;

  const hasActiveFilters = searchQuery !== "" || selectedUploader !== null;

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseLightbox();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, handleCloseLightbox, handlePrevImage, handleNextImage]);

  const cols = isMobile ? 2 : isTablet ? 3 : 4;

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!album) return null;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/gallery"
          onClick={(e) => {
            e.preventDefault();
            router.push("/gallery");
          }}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <PhotoAlbum fontSize="small" />
          Gallery
        </Link>
        <Typography color="text.primary" fontWeight={600}>
          {album.title}
        </Typography>
      </Breadcrumbs>

      {/* Album Header */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.12
          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box flex={1}>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} gutterBottom>
              {album.title}
            </Typography>
            {album.description && (
              <Typography variant="body1" color="text.secondary" mb={2} sx={{ maxWidth: 600 }}>
                {album.description}
              </Typography>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1}>
              {album.event && (
                <Chip
                  label={album.event}
                  icon={<Tag fontSize="small" />}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {album.date && (
                <Chip
                  label={new Date(album.date).toLocaleDateString()}
                  icon={<CalendarToday fontSize="small" />}
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block">
              Created by <strong>{album.creator?.name || "Unknown"}</strong> • {album.images.length}{" "}
              photo{album.images.length !== 1 ? "s" : ""}
            </Typography>
          </Box>

          <Stack direction={{ xs: "row", sm: "column", md: "row" }} spacing={1}>
            {isTablet && (
              <Tooltip title="Toggle Filters">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  color={showFilters ? "primary" : "default"}
                  sx={{
                    bgcolor: showFilters
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "background.paper",
                  }}
                >
                  <Badge color="error" variant="dot" invisible={!hasActiveFilters}>
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
              fullWidth={isMobile}
            >
              Upload
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ⭐ Filter & Sort Section */}
      <Collapse in={showFilters || !isTablet}>
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2}>
            {/* Search & Sort Row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              {/* Search */}
              <TextField
                placeholder="Search captions, descriptions, tags..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                sx={{ maxWidth: { sm: 350 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery("")}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Sort Button */}
              <Tooltip
                title={`Sorted by: ${sortOrder === "asc" ? "Oldest First" : "Newest First"}`}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  startIcon={sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />}
                  sx={{ minWidth: 150, whiteSpace: "nowrap" }}
                >
                  {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                </Button>
              </Tooltip>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<CloseIcon />}
                  color="error"
                >
                  Clear
                </Button>
              )}

              <Box flex={1} />

              {/* Results Count */}
              <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                Showing <strong>{filteredImages.length}</strong> of{" "}
                <strong>{album.images.length}</strong>
              </Typography>
            </Stack>

            <Divider />

            {/* Uploader Filter Pills */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                Filter by Uploader:
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  overflowX: "auto",
                  pb: 0.5,
                  "&::-webkit-scrollbar": { height: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: alpha(theme.palette.text.primary, 0.2),
                    borderRadius: 3,
                  },
                }}
              >
                <Chip
                  label={`All (${album.images.length})`}
                  clickable
                  color={selectedUploader === null ? "primary" : "default"}
                  variant={selectedUploader === null ? "filled" : "outlined"}
                  onClick={() => setSelectedUploader(null)}
                  icon={<PersonIcon />}
                  size="small"
                />
                {uploaderStats.map((stat) => (
                  <Chip
                    key={stat.name}
                    label={`${stat.name} (${stat.count})`}
                    clickable
                    color={selectedUploader === stat.name ? "primary" : "default"}
                    variant={selectedUploader === stat.name ? "filled" : "outlined"}
                    onClick={() =>
                      setSelectedUploader(selectedUploader === stat.name ? null : stat.name)
                    }
                    avatar={
                      <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: 'primary.main' }}>
                        {stat.name[0].toUpperCase()}
                      </Avatar>
                    }
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Collapse>

      {/* Images Grid */}
      {filteredImages.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          {album.images.length > 0 ? (
            <>
              <SearchIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No photos match your filters
              </Typography>
              <Button variant="outlined" onClick={handleClearFilters} startIcon={<CloseIcon />}>
                Clear All Filters
              </Button>
            </>
          ) : (
            <>
              <PhotoAlbum sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No photos yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Upload First Photos
              </Button>
            </>
          )}
        </Box>
      ) : (
        <ImageList variant="masonry" cols={cols} gap={isMobile ? 8 : 12}>
          {filteredImages.map((img, index) => (
            <ImageListItem
              key={img.id}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                cursor: "pointer",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                  "& .img-actions": { opacity: 1 },
                  "& .img-overlay": { opacity: 1 },
                },
              }}
            >
              <Box onClick={() => handleOpenLightbox(index)}>
                <Image
                  src={img.url}
                  alt={img.title || `Photo ${index + 1}`}
                  width={400}
                  height={400}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  loading="lazy"
                />
              </Box>

              {/* Bottom Overlay with User Info */}
              <Box
                className="img-overlay"
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1.5,
                  opacity: 0,
                  transition: "opacity 0.2s",
                  background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                  color: "white",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: "0.7rem" }}>
                    {(img.user.name || img.user.username || "U")[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="caption" fontWeight={600}>
                    {img.user.name || img.user.username || "Unknown"}
                  </Typography>
                </Stack>
                {img.title && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {img.title}
                  </Typography>
                )}
              </Box>

              {/* Top Actions */}
              <Box
                className="img-actions"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  p: 0.5,
                  opacity: 0,
                  transition: "opacity 0.2s",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    color: "white",
                    bgcolor: alpha("#000", 0.3),
                    "&:hover": { bgcolor: alpha("#000", 0.5) },
                  }}
                  onClick={(e) => handleOpenMenu(e, img.id)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Image Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 8,
          sx: { minWidth: 200 },
        }}
      >
        {/* Set Cover: Only Admin or Owner */}
        {canManageAlbum && (
          <MenuItem onClick={handleSetCover}>
            <ListItemIcon>
              <PhotoAlbum fontSize="small" />
            </ListItemIcon>
            <ListItemText>Set as Album Cover</ListItemText>
          </MenuItem>
        )}
        
        {/* Copy Link: Everyone */}
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
        
        <Divider />
        
        {/* Delete: Admin, Owner, or Uploader */}
        {canDeleteCurrentPhoto && (
          <MenuItem onClick={handleDeleteImage} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Remove Photo</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        fullScreen
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.97)",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <Box
          onClick={handleCloseLightbox}
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
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
              background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 700 }}>
                {lightboxIndex + 1} / {filteredImages.length}
              </Typography>
              {filteredImages[lightboxIndex]?.title && (
                <Typography variant="caption" sx={{ color: alpha("#fff", 0.8) }}>
                  {filteredImages[lightboxIndex].title}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={(e) => {
                  if (filteredImages[lightboxIndex]) {
                    handleOpenMenu(e, filteredImages[lightboxIndex].id);
                  }
                }}
                sx={{
                  color: "white",
                  bgcolor: alpha("#fff", 0.15),
                  "&:hover": { bgcolor: alpha("#fff", 0.25) },
                }}
              >
                <MoreVert />
              </IconButton>
              <IconButton
                onClick={handleDownload}
                sx={{
                  color: "white",
                  bgcolor: alpha("#fff", 0.15),
                  "&:hover": { bgcolor: alpha("#fff", 0.25) },
                }}
              >
                <Download />
              </IconButton>
              <IconButton
                onClick={handleCloseLightbox}
                sx={{
                  color: "white",
                  bgcolor: alpha("#fff", 0.15),
                  "&:hover": { bgcolor: alpha("#fff", 0.25) },
                }}
              >
                <Close />
              </IconButton>
            </Stack>
          </Box>

          {/* Navigation Arrows */}
          {!isMobile && filteredImages.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: "fixed",
                  left: 24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "white",
                  bgcolor: alpha("#fff", 0.15),
                  backdropFilter: "blur(10px)",
                  "&:hover": { bgcolor: alpha("#fff", 0.25) },
                }}
                size="large"
              >
                <ChevronLeft fontSize="large" />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: "fixed",
                  right: 24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "white",
                  bgcolor: alpha("#fff", 0.15),
                  backdropFilter: "blur(10px)",
                  "&:hover": { bgcolor: alpha("#fff", 0.25) },
                }}
                size="large"
              >
                <ChevronRight fontSize="large" />
              </IconButton>
            </>
          )}

          {/* Main Image */}
          {filteredImages[lightboxIndex] && (
            <Fade in={imageLoaded} timeout={300}>
              <Box sx={{ position: "relative", maxWidth: "95vw", maxHeight: "85vh" }}>
                <Image
                  src={filteredImages[lightboxIndex].url}
                  alt={filteredImages[lightboxIndex].title || ""}
                  width={1600}
                  height={1200}
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    maxWidth: "95vw",
                    maxHeight: "85vh",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  priority
                />
              </Box>
            </Fade>
          )}

          {/* Bottom Info Bar */}
          {filteredImages[lightboxIndex] && (
            <Box
              sx={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                color: "white",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {(
                    filteredImages[lightboxIndex].user.name ||
                    filteredImages[lightboxIndex].user.username ||
                    "U"
                  )[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {filteredImages[lightboxIndex].user.name ||
                      filteredImages[lightboxIndex].user.username ||
                      "Unknown"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha("#fff", 0.7) }}>
                    {new Date(filteredImages[lightboxIndex].createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Upload Dialog */}
      <BulkUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        albumId={album.id}
        onUploadComplete={fetchAlbum}
      />

      {/* Snackbar */}
      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg(null)}
        message={snackbarMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}