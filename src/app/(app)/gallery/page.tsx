"use client";

import React, { useEffect, useState, useMemo } from "react";
// 👇 Redux Imports
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAdmin } from "@/store/userSlice";

import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  IconButton,
  alpha,
  useTheme,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Collapse,
  useMediaQuery,
  Badge,
  Fab,
  Zoom,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Add,
  PhotoLibrary,
  MoreVert,
  Edit,
  Delete,
  Upload,
  CalendarToday,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ViewModule,
  ViewComfy,
  ViewList,
  ChevronRight,
  Person,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CreateAlbumDialog from "@/components/gallery/CreateAlbumDialog";
import BulkUploadDialog from "@/components/gallery/BulkUploadDialog";
import EditAlbumDialog from "@/components/gallery/EditAlbumDialog";

interface Album {
  id: string;
  title: string;
  description: string | null;
  event: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[];
  createdAt: string;
  createdBy: string;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  photos: {
    photo: {
      url: string;
    };
  }[];
  _count: {
    photos: number;
  };
}

type ViewMode = "grid" | "compact" | "list";

export default function GalleryPage() {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // 👇 Redux State
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // Menu States
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAlbum, setMenuAlbum] = useState<Album | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Add this state near other dialog states (around line 85)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAlbumId, setEditAlbumId] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await fetch("/api/albums");
      if (response.ok) {
        const data = await response.json();
        setAlbums(data);
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    albums.forEach((album) => {
      album.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [albums]);

  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      const matchesSearch =
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = selectedTag ? album.tags.includes(selectedTag) : true;

      return matchesSearch && matchesTag;
    });
  }, [albums, searchQuery, selectedTag]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, album: Album) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setMenuAlbum(album);
  };

  // Add this handler function (around line 160, after handleDeleteAlbum)
  const handleEditAlbum = () => {
    if (!menuAlbum) return;
    setEditAlbumId(menuAlbum.id);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSuccess = () => {
    fetchAlbums();
    setEditAlbumId(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuAlbum(null);
  };

  const handleUploadToAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setUploadDialogOpen(true);
    handleMenuClose();
  };

  const handleCreateSuccess = (newAlbumId: string) => {
    fetchAlbums();
    setTimeout(() => {
      setSelectedAlbumId(newAlbumId);
      setUploadDialogOpen(true);
    }, 500);
  };

  const handleDeleteAlbum = async () => {
    if (!menuAlbum) return;

    if (!confirm(`Delete album "${menuAlbum.title}"? This will remove all images in this album.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${menuAlbum.id}`, { method: "DELETE" });
      if (response.ok) {
        fetchAlbums();
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Failed to delete album");
    } finally {
      handleMenuClose();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
  };

  // 👇 PERMISSION CHECK (With Debugging)
  const isMenuAlbumCreator = Boolean(
    menuAlbum && currentUser && (
      menuAlbum.createdBy === currentUser.id || // Reliable ID check
      menuAlbum.creator?.id === currentUser.id  // Fallback
    )
  );

  const canEditMenuAlbum = isAdmin || isMenuAlbumCreator;
  const canDeleteMenuAlbum = isAdmin || isMenuAlbumCreator;

  // Debugging logs (Check your browser console F12 if buttons don't show)
  // console.log("DEBUG PERMISSIONS:", { 
  //   isAdmin, 
  //   userId: currentUser?.id, 
  //   albumCreator: menuAlbum?.createdBy,
  //   canDelete: canDeleteMenuAlbum 
  // });

  const hasActiveFilters = searchQuery !== "" || selectedTag !== null;
  const activeFilterCount = (searchQuery ? 1 : 0) + (selectedTag ? 1 : 0);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
        <Skeleton variant="rectangular" height={isMobile ? 100 : 60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={isMobile ? 2 : 3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={isMobile ? 200 : 250} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, sm: 3 }, py: 3, pb: isMobile ? 10 : 3 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
            Family Albums
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredAlbums.length} album{filteredAlbums.length !== 1 ? "s" : ""} • Organize your memories
          </Typography>
        </Box>

        {!isMobile && (
          <Stack direction="row" spacing={1} alignItems="center">
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{ bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}` }}
            >
              <ToggleButton value="grid" aria-label="grid view">
                <ViewModule fontSize="small" />
              </ToggleButton>
              <ToggleButton value="compact" aria-label="compact view">
                <ViewComfy fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ViewList fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>

            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "primary" : "default"}
              sx={{
                bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : "background.paper",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Badge badgeContent={activeFilterCount} color="error">
                <FilterListIcon />
              </Badge>
            </IconButton>
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
              Create Album
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Mobile Controls */}
      {isMobile && (
        <Stack direction="row" spacing={1} mb={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            fullWidth
            sx={{
              bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : "transparent",
            }}
          >
            <Badge badgeContent={activeFilterCount} color="error" sx={{ mr: 1 }}>
              <span>Filters</span>
            </Badge>
          </Button>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{ bgcolor: "background.paper" }}
          >
            <ToggleButton value="grid">
              <ViewModule fontSize="small" />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewList fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      {/* Search & Filter Section */}
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
            <Stack direction="row" spacing={1}>
              <TextField
                placeholder="Search albums..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                sx={{ bgcolor: "background.paper" }}
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
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearFilters}
                  sx={{ minWidth: "auto", px: 2 }}
                >
                  <CloseIcon fontSize="small" />
                </Button>
              )}
            </Stack>

            {allTags.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                  Filter by Tag:
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
                    label={`All (${albums.length})`}
                    clickable
                    size="small"
                    color={selectedTag === null ? "primary" : "default"}
                    variant={selectedTag === null ? "filled" : "outlined"}
                    onClick={() => setSelectedTag(null)}
                  />
                  {allTags.map((tag) => {
                    const count = albums.filter((a) => a.tags.includes(tag)).length;
                    return (
                      <Chip
                        key={tag}
                        label={`${tag} (${count})`}
                        clickable
                        size="small"
                        color={selectedTag === tag ? "primary" : "default"}
                        variant={selectedTag === tag ? "filled" : "outlined"}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      </Collapse>

      {/* Albums Display */}
      {filteredAlbums.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            backgroundColor: alpha(theme.palette.background.default, 0.5),
            borderRadius: 3,
          }}
        >
          {albums.length > 0 ? (
            <>
              <SearchIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: "text.secondary", mb: 2 }} />
              <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary" gutterBottom>
                No matching albums found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Try adjusting your filters
              </Typography>
              <Button onClick={handleClearFilters} startIcon={<CloseIcon />}>
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <PhotoLibrary sx={{ fontSize: { xs: 48, sm: 64 }, color: "text.secondary", mb: 2 }} />
              <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary" gutterBottom>
                No albums yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Create your first album to start organizing memories
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Create First Album
              </Button>
            </>
          )}
        </Card>
      ) : viewMode === "list" ? (
        /* ✨ LIST VIEW */
        <Card sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
          <List sx={{ p: 0 }}>
            {filteredAlbums.map((album, index) => (
              <React.Fragment key={album.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" onClick={(e) => handleMenuOpen(e, album)}>
                      <MoreVert />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => router.push(`/gallery/${album.id}`)}
                    sx={{
                      py: 2,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    {/* Album Cover */}
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 80,
                          height: 80,
                          mr: 2,
                          bgcolor: "grey.200",
                        }}
                      >
                        {album.coverImage || (album.photos && album.photos.length > 0) ? (
                          <Image
                            src={album.coverImage || album.photos[0].photo.url}
                            alt={album.title}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="80px"
                          />
                        ) : (
                          <PhotoLibrary sx={{ fontSize: 40, color: "grey.400" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>

                    {/* Album Info */}
                    <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography variant="h6" fontWeight={600} noWrap>
                          {album.title}
                        </Typography>
                        <Chip
                          label={`${album._count?.photos || 0} photos`}
                          size="small"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      </Stack>

                      {album.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 1,
                          }}
                        >
                          {album.description}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        {album.date && (
                          <Chip
                            label={new Date(album.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            size="small"
                            icon={<CalendarToday sx={{ fontSize: 14 }} />}
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                        )}
                        {album.tags?.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant={selectedTag === tag ? "filled" : "outlined"}
                            color={selectedTag === tag ? "primary" : "default"}
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                        ))}
                        {album.tags && album.tags.length > 3 && (
                          <Chip
                            label={`+${album.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                        )}
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                        <Person sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          {album.creator?.name || album.creator?.username || "Unknown"}
                        </Typography>
                      </Stack>
                    </Box>

                    <ChevronRight sx={{ color: "text.secondary" }} />
                  </ListItemButton>
                </ListItem>
                {index < filteredAlbums.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      ) : (
        /* GRID & COMPACT VIEWS */
        <Grid container spacing={isMobile ? 2 : 3}>
          {filteredAlbums.map((album) => (
            <Grid size={{ xs: 12, sm: viewMode === "compact" ? 12 : 6, md: viewMode === "compact" ? 6 : 4 }} key={album.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: viewMode === "compact" && !isMobile ? "row" : "column",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 8,
                  },
                  "&:active": {
                    transform: "scale(0.98)",
                  },
                }}
                onClick={() => router.push(`/gallery/${album.id}`)}
              >
                {/* Cover Image */}
                <Box
                  sx={{
                    position: "relative",
                    width: viewMode === "compact" && !isMobile ? 200 : "100%",
                    minWidth: viewMode === "compact" && !isMobile ? 200 : undefined,
                    paddingTop: viewMode === "compact" && !isMobile ? 0 : "66.67%",
                    height: viewMode === "compact" && !isMobile ? "100%" : undefined,
                    bgcolor: "grey.200",
                    flexShrink: 0,
                  }}
                >
                  {album.coverImage || (album.photos && album.photos.length > 0) ? (
                    <Image
                      src={album.coverImage || album.photos[0].photo.url}
                      alt={album.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes={isMobile ? "100vw" : viewMode === "compact" ? "200px" : "400px"}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PhotoLibrary sx={{ fontSize: { xs: 48, sm: 64 }, color: "grey.400" }} />
                    </Box>
                  )}

                  <Chip
                    label={`${album._count?.photos || 0} ${isMobile ? "" : "photos"}`}
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      bgcolor: alpha("#000", 0.75),
                      backdropFilter: "blur(8px)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: isMobile ? "0.7rem" : "0.75rem",
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, album)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: alpha("#fff", 0.9),
                      backdropFilter: "blur(8px)",
                      "&:hover": { bgcolor: "white" },
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>

                {/* Content */}
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography
                      variant={isMobile ? "body1" : "h6"}
                      fontWeight={600}
                      gutterBottom
                      noWrap={viewMode === "compact"}
                    >
                      {album.title}
                    </Typography>

                    {album.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: isMobile || viewMode === "compact" ? 2 : 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontSize: isMobile ? "0.875rem" : "0.875rem",
                        }}
                      >
                        {album.description}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {album.date && (
                        <Chip
                          label={new Date(album.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          size="small"
                          icon={<CalendarToday sx={{ fontSize: 14 }} />}
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                      {album.tags?.slice(0, isMobile ? 2 : 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant={selectedTag === tag ? "filled" : "outlined"}
                          color={selectedTag === tag ? "primary" : "default"}
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      ))}
                      {album.tags && album.tags.length > (isMobile ? 2 : 3) && (
                        <Chip
                          label={`+${album.tags.length - (isMobile ? 2 : 3)}`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      By {album.creator?.name || album.creator?.username || "Unknown"}
                    </Typography>
                  </CardActions>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Album Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>

        {/* Everyone can upload */}
        <MenuItem onClick={() => menuAlbum && handleUploadToAlbum(menuAlbum.id)}>
          <ListItemIcon>
            <Upload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Upload Images</ListItemText>
        </MenuItem>

        {/* Edit: Only Creator or Admin */}
        {canEditMenuAlbum && (
          <MenuItem onClick={handleEditAlbum}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Album</ListItemText>
          </MenuItem>
        )}

        {/* Delete: Only Creator or Admin */}
        {canDeleteMenuAlbum && (
          <MenuItem onClick={handleDeleteAlbum}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: "error.main" }}>Delete Album</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Mobile FAB */}
      {isMobile && (
        <Zoom in={true}>
          <Fab
            color="primary"
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <Add />
          </Fab>
        </Zoom>
      )}

      {/* Dialogs */}
      <CreateAlbumDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <EditAlbumDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditAlbumId(null);
        }}
        albumId={editAlbumId}
        onSuccess={handleEditSuccess}
      />

      {selectedAlbumId && (
        <BulkUploadDialog
          open={uploadDialogOpen}
          onClose={() => {
            setUploadDialogOpen(false);
            setSelectedAlbumId(null);
          }}
          albumId={selectedAlbumId}
          onUploadComplete={fetchAlbums}
        />
      )}
    </Box>
  );
}