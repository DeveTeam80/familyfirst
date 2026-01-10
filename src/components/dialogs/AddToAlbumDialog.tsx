"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    CircularProgress,
    Box,
    Snackbar,
    Alert,
    alpha,
    useTheme,
    Stack,
    Chip,
} from "@mui/material";
import { PhotoLibrary, CheckCircle } from "@mui/icons-material";
import Image from "next/image";

interface Album {
    id: string;
    title: string;
    coverImage: string | null;
    _count?: { photos: number };
    createdAt?: string;
    photos?: Array<{ photo: { url: string } }>;
}

interface AddToAlbumDialogProps {
    open: boolean;
    onClose: () => void;
    photoIds: string[]; // The photos we want to add
}

export default function AddToAlbumDialog({ open, onClose, photoIds }: AddToAlbumDialogProps) {
    const theme = useTheme();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch albums when dialog opens
    useEffect(() => {
        if (open) {
            setLoading(true);
            setError(null);

            fetch("/api/albums")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch albums");
                    return res.json();
                })
                .then((data) => {
                    // Sort by newest first
                    const sorted = data.sort(
                        (a: Album, b: Album) =>
                            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    );
                    setAlbums(sorted);
                })
                .catch((err) => {
                    console.error("Error loading albums:", err);
                    setError("Failed to load albums");
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    const handleSelectAlbum = async (album: Album) => {
        if (importing) return;
        setImporting(album.id);
        setError(null);

        try {
            const res = await fetch(`/api/albums/${album.id}/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photoIds }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Import failed");
            }

            const result = await res.json();
            const added = result.count;
            const requested = result.totalRequested || photoIds.length;
            const duplicates = requested - added;

            let msg = `Saved to "${album.title}"!`;
            if (duplicates > 0) {
                msg = `Added ${added} new photo${added !== 1 ? 's' : ''}. (${duplicates} already existed)`;
            }
            setSuccess(true);

            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Save to album error:", err);
            setError(err instanceof Error ? err.message : "Failed to save photos");
        } finally {
            setImporting(null);
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={importing ? undefined : onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: "80vh",
                    },
                }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <PhotoLibrary color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Save to Album
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {photoIds.length} photo{photoIds.length !== 1 ? "s" : ""} selected
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0 }}>
                    {loading ? (
                        <Box sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary">
                                Loading albums...
                            </Typography>
                        </Box>
                    ) : error ? (
                        <Box sx={{ p: 6, textAlign: "center" }}>
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    ) : albums.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: "center" }}>
                            <PhotoLibrary sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No albums found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Create an album first to save photos
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {albums.map((album, index) => (
                                <React.Fragment key={album.id}>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            onClick={() => handleSelectAlbum(album)}
                                            disabled={!!importing}
                                            sx={{
                                                py: 2,
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                },
                                                "&.Mui-disabled": {
                                                    opacity: 0.5,
                                                },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    variant="rounded"
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        bgcolor: "grey.200",
                                                        mr: 1,
                                                    }}
                                                >
                                                    {album.coverImage || (album.photos?.[0]?.photo?.url) ? (
                                                        <Image
                                                            src={album.coverImage || album.photos![0].photo.url}
                                                            alt={album.title}
                                                            fill
                                                            style={{ objectFit: "cover" }}
                                                            sizes="56px"
                                                        />
                                                    ) : (
                                                        <PhotoLibrary sx={{ fontSize: 32, color: "grey.400" }} />
                                                    )}
                                                </Avatar>
                                            </ListItemAvatar>

                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" fontWeight={600} noWrap>
                                                        {album.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                                        <Chip
                                                            label={`${album._count?.photos || 0} photos`}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: "0.7rem" }}
                                                        />
                                                    </Stack>
                                                }
                                            />

                                            {importing === album.id ? (
                                                <CircularProgress size={24} sx={{ ml: 2 }} />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        borderRadius: "50%",
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: "primary.main",
                                                        transition: "all 0.2s",
                                                        "&:hover": {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                        },
                                                    }}
                                                >
                                                    <PhotoLibrary fontSize="small" />
                                                </Box>
                                            )}
                                        </ListItemButton>
                                    </ListItem>
                                    {index < albums.length - 1 && (
                                        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={success}
                autoHideDuration={1500}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity="success"
                    icon={<CheckCircle />}
                    sx={{
                        borderRadius: 2,
                        boxShadow: 4,
                    }}
                >
                    Photos saved to album!
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
}