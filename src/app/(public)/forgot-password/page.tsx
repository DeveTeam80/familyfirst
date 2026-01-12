// src/app/(public)/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  alpha,
  useTheme,
  InputAdornment,
} from "@mui/material";
import {
  Email as EmailIcon,
  LockReset as LockResetIcon,
  CheckCircle,
  ArrowBack,
} from "@mui/icons-material";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
      } else {
        setSuccess(true);
        // Don't clear email so user can see what they entered
      }
    } catch (err) {
      console.error("❌ Forgot password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
          theme.palette.secondary.main,
          0.1
        )} 100%)`,
        py: 4,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          maxWidth: 450,
          width: "100%",
          borderRadius: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 2,
              background: success
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {success ? (
              <CheckCircle sx={{ fontSize: 40 }} />
            ) : (
              <LockResetIcon sx={{ fontSize: 40 }} />
            )}
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {success ? "Check Your Email" : "Reset Password"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {success
              ? "We've sent password reset instructions"
              : "Enter your email to receive reset instructions"}
          </Typography>
        </Box>

        {success ? (
          /* Success State */
          <Stack spacing={3}>
            <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Email sent successfully!
              </Typography>
              <Typography variant="caption">
                Check your inbox at <strong>{email}</strong> for password reset instructions.
                The link will expire in 1 hour.
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                <strong>Didn&apos;t receive the email?</strong>
                <br />
                • Check your spam/junk folder
                <br />
                • Make sure you entered the correct email
                <br />• Wait a few minutes and check again
              </Typography>
            </Alert>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Try Another Email
              </Button>
              <Button
                variant="contained"
                fullWidth
                component={Link}
                href="/login"
                sx={{
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Back to Login
              </Button>
            </Stack>
          </Stack>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {/* Email */}
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="your.email@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "action.active" }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Error Message */}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Info */}
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="caption">
                  Enter the email address associated with your account and we&apos;ll send you a
                  link to reset your password.
                </Typography>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Sending Email...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              {/* Back to Login */}
              <Button
                component={Link}
                href="/login"
                startIcon={<ArrowBack />}
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              >
                Back to Login
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}