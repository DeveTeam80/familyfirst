// src/app/(app)/settings/page.tsx
"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Stack,
  Alert,
  Snackbar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
} from "@mui/material";

import GroupIcon from "@mui/icons-material/Group";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockResetIcon from "@mui/icons-material/LockReset";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";

type MemberItem = {
  userId: string;
  username?: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: string; // OWNER | ADMIN | MEMBER
};

// ⭐ Skeleton Loading Components
const EmailChangeSkeleton = () => (
  <Paper sx={{ p: 2.5 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={150} height={32} />
    </Stack>
    <Stack direction="row" spacing={1}>
      <Skeleton variant="rounded" width="100%" height={40} />
      <Skeleton variant="rounded" width={100} height={40} />
    </Stack>
  </Paper>
);

const PasswordChangeSkeleton = () => (
  <Paper sx={{ p: 2.5 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={180} height={32} />
    </Stack>
    <Stack spacing={1.25}>
      <Skeleton variant="rounded" height={40} />
      <Skeleton variant="rounded" height={40} />
      <Skeleton variant="rounded" height={40} />
      <Stack direction="row" justifyContent="flex-end">
        <Skeleton variant="rounded" width={150} height={36} />
      </Stack>
    </Stack>
  </Paper>
);

const MemberListSkeleton = () => (
  <Paper sx={{ p: 2.5 }}>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={200} height={32} />
      <Box flex={1} />
      <Skeleton variant="rounded" width={80} height={32} />
    </Stack>
    <List dense>
      {[1, 2, 3].map((i) => (
        <ListItem
          key={i}
          secondaryAction={
            <Stack direction="row" spacing={1}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Stack>
          }
        >
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText
            primary={<Skeleton variant="text" width="60%" />}
            secondary={<Skeleton variant="text" width="40%" />}
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);

interface ToastState {
  severity: "success" | "error" | "info";
  text: string;
}

interface ConfirmState {
  action: "promote" | "demote";
  userId: string;
  username?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const currentUser = useSelector((s: RootState) => s.user.currentUser);
  const activeFamilyId = useSelector((s: RootState) => s.family.activeFamilyId);

  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [membersError, setMembersError] = React.useState<string | null>(null);
  
  // ⭐ Add initial loading state
  const [initialLoading, setInitialLoading] = React.useState(true);

  const [toast, setToast] = React.useState<ToastState | null>(null);
  const [confirm, setConfirm] = React.useState<ConfirmState | null>(null);

  const [processingUserId, setProcessingUserId] = React.useState<string | null>(null);

  // Forms
  const [newEmail, setNewEmail] = React.useState("");
  const [emailBusy, setEmailBusy] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [nextPassword, setNextPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordBusy, setPasswordBusy] = React.useState(false);

  // Load members
  React.useEffect(() => {
    if (!activeFamilyId) {
      setInitialLoading(false);
      return;
    }
    refreshMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFamilyId, currentUser?.id]);

  const refreshMembers = async () => {
    if (!activeFamilyId) return;

    setLoadingMembers(true);
    setMembersError(null);

    try {
      const res = await fetch(`/api/family/${encodeURIComponent(activeFamilyId)}/members`);
      if (!res.ok) throw new Error("Failed to load members");

      const json = await res.json();
      
      interface APIMember {
        userId: string;
        role: string;
        user?: {
          username?: string;
          email?: string;
          name?: string | null;
          avatarUrl?: string | null;
        };
      }

      const mapped: MemberItem[] = (json.members || []).map((m: APIMember) => ({
        userId: m.userId,
        username: m.user?.username || m.user?.email?.split("@")[0] || "",
        name: m.user?.name || null,
        email: m.user?.email || null,
        avatarUrl: m.user?.avatarUrl || null,
        role: m.role,
      }));

      setMembers(mapped);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load family members";
      setMembersError(errorMessage);
    } finally {
      setLoadingMembers(false);
      setInitialLoading(false); // ⭐ Stop initial loading
    }
  };

  // Derived permissions
  const isOwner = React.useMemo(() => {
    if (!currentUser || !members.length) return false;
    return members.some((m) => m.userId === currentUser.id && m.role === "OWNER");
  }, [members, currentUser]);

  const isAdmin = React.useMemo(() => {
    if (!currentUser || !members.length) return false;
    return members.some((m) => m.userId === currentUser.id && m.role === "ADMIN");
  }, [members, currentUser]);

  // Promote user
  const promoteToAdmin = async (userId: string) => {
    if (!activeFamilyId) return;
    setProcessingUserId(userId);

    try {
      const res = await fetch(`/api/family/${activeFamilyId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to promote");

      setToast({ severity: "success", text: json.message || "User promoted" });
      await refreshMembers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Could not promote";
      setToast({ severity: "error", text: errorMessage });
    } finally {
      setProcessingUserId(null);
    }
  };

  // Demote user (ADMIN → MEMBER)
  const demoteUser = async (userId: string) => {
    if (!activeFamilyId) return;
    setProcessingUserId(userId);

    try {
      const res = await fetch(`/api/family/${activeFamilyId}/demote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to demote");

      setToast({ severity: "success", text: json.message || "User demoted" });
      await refreshMembers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Could not demote user";
      setToast({ severity: "error", text: errorMessage });
    } finally {
      setProcessingUserId(null);
    }
  };

  const runConfirmAction = () => {
    if (!confirm) return;
    if (confirm.action === "promote") promoteToAdmin(confirm.userId);
    if (confirm.action === "demote") demoteUser(confirm.userId);
    setConfirm(null);
  };

  // Invite user → redirect
  const inviteFromTree = () => {
    router.push("/tree");
  };

  // Change email
  const handleChangeEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      setToast({ severity: "error", text: "Enter a valid email." });
      return;
    }

    setEmailBusy(true);
    try {
      const res = await fetch("/api/users/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update email");

      setToast({ severity: "success", text: json.message || "Verification sent" });
      setNewEmail("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error";
      setToast({ severity: "error", text: errorMessage });
    } finally {
      setEmailBusy(false);
    }
  };

  // Change password
  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (nextPassword.length < 8) {
      setToast({ severity: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (nextPassword !== confirmPassword) {
      setToast({ severity: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordBusy(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: currentPassword, next: nextPassword }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not update password");

      setToast({ severity: "success", text: json.message || "Password updated" });
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error";
      setToast({ severity: "error", text: errorMessage });
    } finally {
      setPasswordBusy(false);
    }
  };

  // ⭐ Show skeleton loader on initial load
  if (initialLoading) {
    return (
      <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
        <Skeleton variant="text" width={150} height={40} sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 12 }}>
            <EmailChangeSkeleton />
          </Grid>

          <Grid size={{ xs: 12, md: 12 }}>
            <PasswordChangeSkeleton />
          </Grid>

          <Grid size={{ xs: 12, md: 12 }}>
            <MemberListSkeleton />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Change Email */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <MailOutlineIcon fontSize="small" />
              <Typography variant="h6">Change email</Typography>
            </Stack>

            <form onSubmit={handleChangeEmail}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  type="email"
                  size="small"
                  label="New email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={emailBusy}
                />
                <Button variant="contained" type="submit" disabled={emailBusy}>
                  {emailBusy ? "Sending…" : "Update"}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Change Password */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <LockResetIcon fontSize="small" />
              <Typography variant="h6">Change password</Typography>
            </Stack>

            <form onSubmit={handleChangePassword}>
              <Stack spacing={1.25}>
                <TextField
                  type="password"
                  label="Current password"
                  size="small"
                  value={currentPassword}
                  disabled={passwordBusy}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <TextField
                  type="password"
                  label="New password"
                  size="small"
                  helperText="At least 8 characters"
                  value={nextPassword}
                  disabled={passwordBusy}
                  onChange={(e) => setNextPassword(e.target.value)}
                />
                <TextField
                  type="password"
                  label="Confirm new password"
                  size="small"
                  value={confirmPassword}
                  disabled={passwordBusy}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="contained" type="submit" disabled={passwordBusy}>
                    {passwordBusy ? "Processing…" : "Update Password"}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Member List */}
        <Grid size={{ xs: 12, md: 12 }}>
          {isOwner && (
            <Paper sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <GroupIcon />
                <Typography variant="h6">Manage family members</Typography>
                <Box flex={1} />
                <Button 
                  size="small" 
                  onClick={refreshMembers}
                  disabled={loadingMembers}
                >
                  {loadingMembers ? "Loading..." : "Refresh"}
                </Button>
              </Stack>

              {loadingMembers && !initialLoading ? (
                <List dense>
                  {[1, 2, 3].map((i) => (
                    <ListItem key={i}>
                      <ListItemAvatar>
                        <Skeleton variant="circular" width={40} height={40} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Skeleton variant="text" width="60%" />}
                        secondary={<Skeleton variant="text" width="40%" />}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : membersError ? (
                <Alert severity="error">{membersError}</Alert>
              ) : (
                <List dense>
                  {members.map((m) => (
                    <ListItem
                      key={m.userId}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          {/* Promote */}
                          <Tooltip title={m.role === "OWNER" ? "Owner" : "Promote to admin"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={
                                  m.role === "OWNER" ||
                                  m.role === "ADMIN" ||
                                  processingUserId === m.userId
                                }
                                onClick={() =>
                                  setConfirm({
                                    action: "promote",
                                    userId: m.userId,
                                    username: m.username,
                                  })
                                }
                              >
                                <AdminPanelSettingsIcon />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Demote ADMIN → MEMBER */}
                          {m.role === "ADMIN" && (
                            <Tooltip title="Demote to member">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={processingUserId === m.userId}
                                  onClick={() =>
                                    setConfirm({
                                      action: "demote",
                                      userId: m.userId,
                                      username: m.username,
                                    })
                                  }
                                >
                                  <PersonRemoveIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={m.avatarUrl || undefined}>
                          {m.name?.[0] || m.username?.[0] || "U"}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={m.name || m.username || m.email || m.userId}
                        secondary={`@${m.username} • ${m.role}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {!isOwner && isAdmin && (
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Invite family member
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                As an admin, you may invite members from the Family Tree page.
              </Typography>
              <Button variant="contained" onClick={inviteFromTree}>
                Go to Family Tree
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Confirm dialog */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle>
          {confirm?.action === "promote" ? "Promote to Admin?" : "Demote to Member?"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirm?.action === "promote"
              ? `Promote @${confirm.username} to admin?`
              : `Demote back to member?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={runConfirmAction}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert variant="filled" severity={toast?.severity ?? "info"}>
          {toast?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}