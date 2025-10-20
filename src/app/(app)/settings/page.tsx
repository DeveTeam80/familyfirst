"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockResetIcon from "@mui/icons-material/LockReset";
import GroupIcon from "@mui/icons-material/Group";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

const changeEmail = (payload: { newEmail: string }) => ({ type: "user/changeEmail", payload });
const changePassword = (payload: { current: string; next: string }) => ({ type: "user/changePassword", payload });
const inviteMember = (payload: { email: string }) => ({ type: "family/inviteMember", payload });
const removeMember = (payload: { username: string }) => ({ type: "family/removeMember", payload });
const promoteToAdmin = (payload: { username: string }) => ({ type: "family/promoteToAdmin", payload });

export default function SettingsPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((s: RootState) => s.user.currentUser);
  const profiles = useSelector((s: RootState) => s.user.profiles);

  const familyId = useSelector((s: RootState) => s.family.activeFamilyId);
  const familyMembers: Array<{ username: string; role: "admin" | "member"; email?: string; name?: string }> =
    useSelector((s: RootState) => s.family.membersByFamily[familyId] || []);

  const isAdmin = !!currentUser && familyMembers.find(m => m.username === currentUser.username)?.role === "admin";

  return (
    <Box sx={{ p: 3, maxWidth: 980, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 12}}>
          <ChangeEmailCard onSubmit={(newEmail) => dispatch(changeEmail({ newEmail }))} />
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <ChangePasswordCard onSubmit={(current, next) => dispatch(changePassword({ current, next }))} />
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <InviteMemberCard onInvite={(email) => dispatch(inviteMember({ email }))} />
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <ManageMembersCard
            members={familyMembers}
            profiles={profiles}
            isAdmin={isAdmin}
            onRemove={(username) => dispatch(removeMember({ username }))}
            onPromote={(username) => dispatch(promoteToAdmin({ username }))}
            currentUsername={currentUser?.username}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

/* ===================== Change Email ===================== */

function ChangeEmailCard({ onSubmit }: { onSubmit: (newEmail: string) => void }) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setToast("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      onSubmit(email.trim());
      setToast("Email update requested.");
      setEmail("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <MailOutlineIcon fontSize="small" />
        <Typography variant="h6">Change email</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        We’ll send a verification link to your new email.
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            type="email"
            label="New email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
          />
          <Button type="submit" variant="contained" disabled={busy}>
            Update
          </Button>
        </Stack>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)}>
        <Alert severity="info" variant="filled">{toast}</Alert>
      </Snackbar>
    </Paper>
  );
}

/* ===================== Change Password ===================== */

function ChangePasswordCard({ onSubmit }: { onSubmit: (current: string, next: string) => void }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      setToast("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setToast("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      onSubmit(current, next);
      setToast("Password update requested.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <LockResetIcon fontSize="small" />
        <Typography variant="h6">Change password</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your current password and choose a new one.
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField
            label="Current password"
            type="password"
            size="small"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <TextField
            label="New password"
            type="password"
            size="small"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            helperText="At least 8 characters"
          />
          <TextField
            label="Confirm new password"
            type="password"
            size="small"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={busy}>
              Update Password
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)}>
        <Alert severity="info" variant="filled">{toast}</Alert>
      </Snackbar>
    </Paper>
  );
}

/* ===================== Invite Member ===================== */

function InviteMemberCard({ onInvite }: { onInvite: (email: string) => void }) {
  const [email, setEmail] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setToast("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      onInvite(email.trim());
      setToast("Invite sent (pending backend).");
      setEmail("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <PersonAddAlt1Icon fontSize="small" />
        <Typography variant="h6">Invite family member</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Send an email invite to join this private space.
      </Typography>

      <Box component="form" onSubmit={submit}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="contained" type="submit" disabled={busy}>
            Invite
          </Button>
        </Stack>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)}>
        <Alert severity="success" variant="filled">{toast}</Alert>
      </Snackbar>
    </Paper>
  );
}

/* ===================== Manage Members (admin) ===================== */

function ManageMembersCard({
  members,
  profiles,
  isAdmin,
  onRemove,
  onPromote,
  currentUsername,
}: {
  members: Array<{ username: string; role: "admin" | "member"; email?: string; name?: string }>;
  profiles: RootState["user"]["profiles"];
  isAdmin: boolean;
  currentUsername?: string;
  onRemove: (username: string) => void;
  onPromote: (username: string) => void;
}) {
  const [confirm, setConfirm] = React.useState<{ type: "remove" | "promote"; username: string } | null>(null);

  const resolveName = (u: string) => profiles[u]?.name || u;
  const resolveEmail = (u: string) => profiles[u]?.email || members.find(m => m.username === u)?.email || "";

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <GroupIcon fontSize="small" />
        <Typography variant="h6">Manage family members</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isAdmin
          ? "As an admin, you can remove members or grant admin rights."
          : "Only admins can remove members or grant admin rights."}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 1.5 }}>
        <Typography variant="caption" color="text.secondary">Member</Typography>
        <Typography variant="caption" color="text.secondary">Role</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>Actions</Typography>

        <Divider sx={{ gridColumn: "1 / -1", my: 0.5 }} />

        {members.map((m) => {
          const isSelf = currentUsername === m.username;
          return (
            <React.Fragment key={m.username}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {resolveName(m.username)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{m.username} {resolveEmail(m.username) && `• ${resolveEmail(m.username)}`}
                </Typography>
              </Box>

              <Box>
                <Chip
                  label={m.role === "admin" ? "Admin" : "Member"}
                  size="small"
                  color={m.role === "admin" ? "primary" : "default"}
                  variant="outlined"
                />
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Tooltip title={isAdmin ? "Make admin" : "Admin only"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setConfirm({ type: "promote", username: m.username })}
                      disabled={!isAdmin || m.role === "admin"}
                    >
                      <AdminPanelSettingsIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title={isAdmin ? (isSelf ? "You can’t remove yourself" : "Remove member") : "Admin only"}>
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setConfirm({ type: "remove", username: m.username })}
                      disabled={!isAdmin || isSelf}
                    >
                      {isSelf ? <DeleteIcon fontSize="small" /> : <PersonRemoveIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </React.Fragment>
          );
        })}
      </Box>

      {/* Confirm dialogs */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle>
          {confirm?.type === "remove" ? "Remove member?" : "Make admin?"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            {confirm?.type === "remove"
              ? `This will remove @${confirm.username} from the family space. They’ll lose access until invited again.`
              : `@${confirm?.username} will have admin access (invite/remove members, manage settings).`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          {confirm?.type === "remove" ? (
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                if (confirm) onRemove(confirm.username);
                setConfirm(null);
              }}
            >
              Remove
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                if (confirm) onPromote(confirm.username);
                setConfirm(null);
              }}
            >
              Make Admin
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
