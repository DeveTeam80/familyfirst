// src/app/(auth)/register/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Divider,
  alpha,
  useTheme,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import Link from "next/link";

interface InviteData {
  email?: string;
  familyName?: string;
  inviterId?: string;
}

/* -----------------------
   Register Form Component
   ----------------------- */
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  // ⭐ Get invite code from URL: /register?code=FAM-XY7K9A
  const inviteCode = searchParams.get("code");

  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Verify invite code on mount
  useEffect(() => {
    const verifyInviteCode = async () => {
      if (!inviteCode) {
        setVerifyingCode(false);
        setCodeValid(false);
        setError("No invitation code provided. Registration requires an invitation.");
        return;
      }

      try {
        const res = await fetch(`/api/invite/verify?code=${inviteCode}`);
        const data = await res.json();

        if (!res.ok) {
          setCodeValid(false);
          setError(data.error || "Invalid or expired invitation code.");
        } else {
          setCodeValid(true);
          setInviteData(data);
          // Pre-fill email
          if (data.email) {
            setFormData((prev) => ({ ...prev, email: data.email }));
          }
        }
      } catch (err) {
        console.error("❌ Code verification error:", err);
        setCodeValid(false);
        setError("Failed to verify invitation. Please try again.");
      } finally {
        setVerifyingCode(false);
      }
    };

    verifyInviteCode();
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          inviteCode, // ⭐ Send invite code
        }),
      });

      const data = await res.json();

      // src/app/(auth)/register/page.tsx - in handleSubmit
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        // ✅ Pass email in URL so login page can pre-fill it
        router.push(`/login?email=${encodeURIComponent(formData.email)}&registered=true`);
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifyingCode) {
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
        }}
      >
        <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: "100%", borderRadius: 3, textAlign: "center" }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" fontWeight={600}>
            Verifying Invitation...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we verify your invitation code.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Invalid code state
  if (!codeValid) {
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
        }}
      >
        <Paper elevation={4} sx={{ p: 4, maxWidth: 500, width: "100%", borderRadius: 3, textAlign: "center" }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
            }}
          >
            <ErrorIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Invalid Invitation
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Registration requires a valid invitation
            </Typography>
            <Typography variant="caption">
              Please contact your family administrator to receive an invitation link.
            </Typography>
          </Alert>
          <Button variant="outlined" component={Link} href="/login" fullWidth sx={{ borderRadius: 2 }}>
            Return to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  // Valid code - show registration form
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
      <Paper elevation={4} sx={{ p: 4, maxWidth: 500, width: "100%", borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <CheckCircle sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Complete Registration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You&apos;ve been invited to join <strong>{inviteData?.familyName || "the family"}</strong>
          </Typography>
        </Box>

        {/* Success Badge */}
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>
            Invitation verified successfully!
          </Typography>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* Name Fields */}
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "action.active" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={loading}
              />
            </Stack>

            {/* Email */}
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading || !!inviteData?.email}
              helperText={inviteData?.email ? "Email from invitation" : ""}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password */}
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              helperText="Must be at least 8 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm Password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }} />

        {/* Login Link */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: theme.palette.primary.main,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

/* -----------------------
   Main Page with Suspense
   ----------------------- */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}