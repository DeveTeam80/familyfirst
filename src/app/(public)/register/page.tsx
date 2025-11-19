// src/app/(public)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Chip,
  CircularProgress,
} from "@mui/material";
import { CheckCircle, Person, Email, Lock } from "@mui/icons-material";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!inviteCode);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  // Verify invite code on mount
  useEffect(() => {
    if (inviteCode) {
      verifyInvite();
    }
  }, [inviteCode]);

  const verifyInvite = async () => {
    setVerifying(true);
    setError("");

    try {
      const res = await fetch(`/api/invite/verify?code=${inviteCode}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid invite code");
        return;
      }

      setInviteData(data.invitation);
      setFormData((prev) => ({
        ...prev,
        email: data.invitation.email,
        name: data.invitation.treeNode
          ? `${data.invitation.treeNode.firstName} ${data.invitation.treeNode.lastName || ""}`.trim()
          : "",
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to verify invite code");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          inviteCode: inviteCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Success! Redirect to login or auto-login
      router.push("/login?registered=true");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          maxWidth: 500,
          width: "100%",
          p: 4,
          borderRadius: 3,
        }}
      >
        <Typography variant="h4" fontWeight={700} mb={1} textAlign="center">
          {inviteData ? "Join Your Family" : "Create Account"}
        </Typography>

        {inviteData && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "success.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "success.200",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                src={inviteData.familyAvatar}
                sx={{ width: 56, height: 56 }}
              />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {inviteData.familyName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Invited by {inviteData.invitedBy}
                </Typography>
              </Box>
            </Box>

            {inviteData.treeNode && (
              <Chip
                icon={<CheckCircle />}
                label={`Your position: ${inviteData.treeNode.firstName} ${inviteData.treeNode.lastName || ""}`}
                color="success"
                size="small"
              />
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Person sx={{ mr: 1, color: "action.active" }} />,
            }}
          />

          <TextField
            fullWidth
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!inviteData} // Disabled if from invite
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Email sx={{ mr: 1, color: "action.active" }} />,
            }}
          />

          <TextField
            fullWidth
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            helperText="Minimum 8 characters"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: "action.active" }} />,
            }}
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: "action.active" }} />,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
          Already have an account?{" "}
          <Button variant="text" onClick={() => router.push("/login")}>
            Login
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}