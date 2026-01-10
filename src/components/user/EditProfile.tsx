"use client";
import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import { Close, CheckCircle } from "@mui/icons-material";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (changes: {
    name?: string;
    bio?: string;
    location?: string;
    avatar?: string | null;
    birthday?: string | null;
    anniversary?: string | null;
  }) => Promise<void>;
  name: string;
  setName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  avatar: string | null | undefined;
  setAvatar: (value: string | null | undefined) => void;
  currentAvatar?: string | null;
  birthday: string | null;
  setBirthday: (value: string | null) => void;
  anniversary: string | null;
  setAnniversary: (value: string | null) => void;
}

export default function EditProfileDialog({
  open,
  onClose,
  onSave,
  name,
  setName,
  bio,
  setBio,
  avatar,
  setAvatar,
  currentAvatar,
  birthday,
  setBirthday,
  anniversary,
  setAnniversary,
}: EditProfileDialogProps) {
  const theme = useTheme();
  const [saving, setSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    // Validate
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Call the parent's save function (which hits the API)
      await onSave({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatar: avatar === undefined ? null : avatar,
        birthday,
        anniversary,
      });

      // ✅ Show success feedback
      setShowSuccess(true);

      // ✅ Close dialog after brief delay to show success state
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 800);

    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
      setError(null);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            Edit Profile
            <IconButton onClick={handleClose} size="small" disabled={saving}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <TextField
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={saving}
              multiline
              rows={3}
              fullWidth
              placeholder="Tell your family about yourself..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <TextField
              label="Birthday"
              type="date"
              value={birthday || ""}
              onChange={(e) => setBirthday(e.target.value || null)}
              disabled={saving}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <TextField
              label="Anniversary"
              type="date"
              value={anniversary || ""}
              onChange={(e) => setAnniversary(e.target.value || null)}
              disabled={saving}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleClose}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : showSuccess ? (
                <CheckCircle />
              ) : null
            }
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              minWidth: 120,
              bgcolor: showSuccess ? 'success.main' : 'primary.main',
              '&:hover': {
                bgcolor: showSuccess ? 'success.dark' : 'primary.dark',
              },
              transition: 'all 0.3s',
            }}
          >
            {saving ? "Saving..." : showSuccess ? "Saved!" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setShowSuccess(false)}
          sx={{
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </>
  );
}