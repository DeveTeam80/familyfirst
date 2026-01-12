// src/app/(public)/reset-password/page.tsx
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
  alpha,
  useTheme,
  InputAdornment,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  Lock as LockIcon,
  CheckCircle,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff,
  Check,
  Close,
} from "@mui/icons-material";
import Link from "next/link";

// ⭐ Password strength checker
function getPasswordStrength(password: string): { 
  score: number; 
  label: string; 
  color: string;
  checks: {
    length: boolean;
    letter: boolean;
    number: boolean;
    special: boolean;
  }
} {
  const checks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  if (checks.length) score += 25;
  if (checks.letter) score += 25;
  if (checks.number) score += 25;
  if (checks.special) score += 25;

  let label = "Weak";
  let color = "#f44336";
  
  if (score >= 75) {
    label = "Strong";
    color = "#4caf50";
  } else if (score >= 50) {
    label = "Medium";
    color = "#ff9800";
  }

  return { score, label, color, checks };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const passwordStrength = getPasswordStrength(formData.password);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setTokenValid(false);
        setError("No reset token provided. Please request a new password reset link.");
        return;
      }

      try {
        const res = await fetch(`/api/users/verify-reset-token?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setTokenValid(false);
          setError(data.error || "Invalid or expired reset token.");
        } else {
          setTokenValid(true);
          setExpiresIn(data.expiresIn);
        }
      } catch (err) {
        console.error("❌ Token verification error:", err);
        setTokenValid(false);
        setError("Failed to verify reset token. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ⭐ VALIDATION: Client-side checks
    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
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

    if (!passwordStrength.checks.letter || !passwordStrength.checks.number) {
      setError("Password must contain at least one letter and one number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("❌ Reset password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
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
            Verifying Reset Link...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we verify your password reset link.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Invalid token state
  if (!tokenValid) {
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
            Invalid Reset Link
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              This reset link is invalid or has expired
            </Typography>
            <Typography variant="caption">
              Password reset links expire after 1 hour for security reasons.
              Please request a new reset link.
            </Typography>
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              component={Link}
              href="/forgot-password"
              fullWidth
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Request New Link
            </Button>
            <Button
              variant="contained"
              component={Link}
              href="/login"
              fullWidth
              sx={{
                borderRadius: 2,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Back to Login
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Success state
  if (success) {
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
        <Paper elevation={4} sx={{ p: 4, maxWidth: 450, width: "100%", borderRadius: 3, textAlign: "center" }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: "auto",
              mb: 3,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            }}
          >
            <CheckCircle sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Password Reset Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your password has been successfully reset.
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You can now sign in with your new password. Redirecting to login...
            </Typography>
          </Alert>
          <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="caption">
              <strong>Security Note:</strong> All your active sessions have been logged out.
              You&apos;ll need to sign in again with your new password.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            component={Link}
            href="/login"
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            Continue to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  // Valid token - show reset form
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
            <LockIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Create New Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a strong password for your account
          </Typography>
        </Box>

        {/* Expiry Warning */}
        {expiresIn !== null && expiresIn < 15 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="caption">
              ⏰ This reset link expires in <strong>{expiresIn} minutes</strong>
            </Typography>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* New Password */}
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="New Password"
              required
              autoFocus
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength.score} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 1,
                    backgroundColor: alpha(passwordStrength.color, 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: passwordStrength.color,
                    }
                  }} 
                />
                <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {passwordStrength.checks.length ? (
                      <Check sx={{ fontSize: 16, color: "success.main" }} />
                    ) : (
                      <Close sx={{ fontSize: 16, color: "error.main" }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      At least 8 characters
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {passwordStrength.checks.letter ? (
                      <Check sx={{ fontSize: 16, color: "success.main" }} />
                    ) : (
                      <Close sx={{ fontSize: 16, color: "error.main" }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      At least one letter
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {passwordStrength.checks.number ? (
                      <Check sx={{ fontSize: 16, color: "success.main" }} />
                    ) : (
                      <Close sx={{ fontSize: 16, color: "error.main" }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      At least one number
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Confirm Password */}
            <TextField
              fullWidth
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm New Password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={loading}
              error={formData.confirmPassword !== "" && formData.password !== formData.confirmPassword}
              helperText={
                formData.confirmPassword !== "" && formData.password !== formData.confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
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
              disabled={loading || passwordStrength.score < 50}
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
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}