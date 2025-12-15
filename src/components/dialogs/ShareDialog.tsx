"use client";
import * as React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Chip,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function ShareDialog({
  open,
  user,
  content,
  tags,
  postId,
  onClose,
}: {
  open: boolean;
  user?: string;
  content?: string;
  tags?: string[];
  postId?: string;
  onClose: () => void;
}) {
  const [isPublic, setIsPublic] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const [snack, setSnack] = React.useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info",
  });

  const publicUrl = React.useMemo(() => {
    if (!postId) return "";
    return `${location.origin}/post/${postId}`;
  }, [postId]);

  // Fetch visibility on open
  React.useEffect(() => {
    if (!open || !postId) return;
    setFetching(true);

    (async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        setIsPublic(data?.post?.visibility === "PUBLIC");
      } catch (_e) {
        console.error("Failed to load post visibility");
      } finally {
        setFetching(false);
      }
    })();
  }, [open, postId]);

  const toggleVisibility = async (next: boolean) => {
    if (!postId) return;

    setLoading(true);
    const oldState = isPublic;
    setIsPublic(next); // optimistic

    try {
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next ? "PUBLIC" : "FAMILY" }),
      });

      if (!res.ok) throw new Error();
      setSnack({
        open: true,
        message: next ? "Made public" : "Restricted to family",
        severity: "success",
      });
    } catch {
      setIsPublic(oldState); // revert ui
      setSnack({
        open: true,
        message: "Failed to update post visibility",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!isPublic) {
      setSnack({
        open: true,
        message: "Make the post public to copy link",
        severity: "error",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      setSnack({ open: true, message: "Link copied", severity: "success" });
    } catch {
      setSnack({
        open: true,
        message: "Unable to copy link",
        severity: "error",
      });
    }
  };

  const openInNewTab = () => {
    if (isPublic) window.open(publicUrl, "_blank");
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Share Post</DialogTitle>

        <DialogContent dividers>
          {/* Preview */}
          {user && <Typography variant="subtitle2">{user}</Typography>}
          {content && (
            <Typography variant="body2" sx={{ my: 1 }}>
              {content}
            </Typography>
          )}
          {tags && (
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {tags.map((t) => (
                <Chip key={t} label={`#${t}`} size="small" />
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Visibility toggle */}
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(_, v) => toggleVisibility(v)}
                  disabled={loading || fetching}
                />
              }
              label={
                <Typography fontWeight={700}>
                  {isPublic ? "Public (anyone can view)" : "Family only"}
                </Typography>
              }
            />

            {loading && <CircularProgress size={20} />}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Public posts can be viewed without logging in.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* URL field */}
          <TextField
            value={isPublic ? publicUrl : "Make post public to generate link"}
            fullWidth
            size="small"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <>
                  <Tooltip title="Open" arrow>
                    <span>
                      <IconButton size="small" disabled={!isPublic} onClick={openInNewTab}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Copy" arrow>
                    <span>
                      <IconButton size="small" disabled={!isPublic} onClick={copyLink}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              ),
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            disabled={!isPublic}
            onClick={() => {
              copyLink();
              onClose();
            }}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
