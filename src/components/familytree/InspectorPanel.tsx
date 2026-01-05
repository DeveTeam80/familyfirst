import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  IconButton,
  TextField,
  Stack,
  Chip,
  Alert,
  Fade,
  Divider,
  CircularProgress,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  LocalFlorist as DeathIcon,
  Favorite as AnniversaryIcon,
} from "@mui/icons-material";
import { FamilyTreeNode } from "./types";

interface InspectorPanelProps {
  node: FamilyTreeNode | null;
  onClose: () => void;
  isAdmin: boolean;
  familyId: string;
  adminId: string;
  onEdit: () => void;
  onAddMemberClick: () => void;
}

export function InspectorPanel({
  node,
  onClose,
  isAdmin,
  familyId,
  adminId,
  onEdit,
  onAddMemberClick,
}: InspectorPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (node?.data?.email) setEmail(node.data.email);
    else setEmail("");
    setStatus(null);
  }, [node]);

  const handleSendInvite = async () => {
    if (!email || !node) {
      setStatus({ type: "error", msg: "Email is required" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus({ type: "error", msg: "Invalid email address" });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          treeNodeId: node.id,
          familyId,
          invitedBy: adminId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          type: "error",
          msg: data.error || "Failed to send invite",
        });
      } else {
        setStatus({ type: "success", msg: "Invitation sent!" });
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      setStatus({ type: "error", msg: "Unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!node) return null;

  const displayName = `${node.data["first name"] || ""} ${
    node.data["last name"] || ""
  }`.trim();
  
  const isMale = node.data.gender === "M";
  const isDeceased = !!node.data.deathDate;

  const birthDate = formatDate(node.data.birthday);
  const deathDate = formatDate(node.data.deathDate);
  const anniversaryDate = formatDate(node.data.weddingAnniversary);

  return (
    <Paper
      elevation={6}
      sx={{
        position: "absolute",
        top: isMobile ? "auto" : 20,
        bottom: isMobile ? 0 : 20,
        right: isMobile ? 0 : 20,
        left: isMobile ? 0 : "auto",
        width: isMobile ? "100%" : 360,
        maxHeight: isMobile ? "85vh" : "calc(100vh - 40px)",
        borderRadius: isMobile ? "24px 24px 0 0" : 4,
        background:
          theme.palette.mode === "dark"
            ? alpha("#121217", 0.95)
            : alpha("#ffffff", 0.95),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.1),
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
        isolation: "isolate",
        transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      }}
    >
      {/* Close Button */}
      <IconButton 
        size="small" 
        onClick={onClose} 
        sx={{ 
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 20,
          bgcolor: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(4px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          color: theme.palette.text.secondary,
          '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            color: theme.palette.text.primary
          }
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* Scrollable Content */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: "auto",
          overflowX: "hidden",
          px: 3, 
          pb: 3,
          pt: 6,
          
          // Custom Scrollbar
          '&::-webkit-scrollbar': { 
            width: '6px',
          },
          '&::-webkit-scrollbar-track': { 
            background: 'transparent',
            marginTop: '10px',
            marginBottom: '10px',
            marginRight: '2px',
          },
          '&::-webkit-scrollbar-thumb': { 
            backgroundColor: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: '10px',
            border: `2px solid transparent`,
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': { 
            backgroundColor: alpha(theme.palette.text.secondary, 0.35),
          },
          
          // Firefox scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.text.secondary, 0.2)} transparent`,
        }}
      >
        {/* Avatar & Name */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Avatar
            src={node.data.avatar}
            sx={{
              width: 88,
              height: 88,
              border: `4px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[4],
              bgcolor: isMale ? "#3b82f6" : "#ec4899",
              fontSize: "2.2rem",
              filter: isDeceased ? "grayscale(100%)" : "none",
            }}
          >
            {node.data["first name"]?.[0]}
          </Avatar>

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mt: 1.5, textAlign: "center", lineHeight: 1.2 }}
          >
            {displayName}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              icon={<PersonIcon sx={{ fontSize: "0.9rem !important" }} />}
              label={isMale ? "Male" : "Female"}
              size="small"
              sx={{ height: 24, fontSize: "0.7rem" }}
            />
            {isDeceased && (
              <Chip
                icon={<DeathIcon sx={{ fontSize: "0.9rem !important" }} />}
                label="Deceased"
                size="small"
                sx={{ 
                  height: 24, 
                  fontSize: "0.7rem", 
                  bgcolor: theme.palette.grey[800], 
                  color: "#fff",
                  '& .MuiChip-icon': { color: '#aaa' }
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Info Block (Dates) */}
        <Box 
          sx={{ 
            mt: 3, 
            width: '100%', 
            bgcolor: alpha(theme.palette.divider, 0.03),
            border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            borderRadius: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          {/* Birthday */}
          {birthDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CakeIcon fontSize="small" sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} />
              <Box>
                <Typography variant="caption" display="block" color="text.secondary" lineHeight={1} mb={0.3}>
                  Born
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {birthDate}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Death Date */}
          {deathDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DeathIcon fontSize="small" sx={{ color: theme.palette.text.secondary, opacity: 0.7 }} />
              <Box>
                <Typography variant="caption" display="block" color="text.secondary" lineHeight={1} mb={0.3}>
                  Passed Away
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {deathDate}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Anniversary */}
          {anniversaryDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AnniversaryIcon fontSize="small" sx={{ color: "#d8b4fe" }} />
              <Box>
                <Typography variant="caption" display="block" color="text.secondary" lineHeight={1} mb={0.3}>
                  Wedding Anniversary
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {anniversaryDate}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        {isAdmin && (
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={onAddMemberClick}
              startIcon={<AddIcon />}
              sx={{
                py: 1,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                fontWeight: 600,
                borderRadius: 2.5
              }}
            >
              Add Relative
            </Button>
            <Button
              variant="outlined"
              onClick={onEdit}
              fullWidth
              startIcon={<EditIcon />}
              sx={{ py: 1, borderRadius: 2.5, borderWidth: '1.5px', fontWeight: 600 }}
            >
              Edit Profile
            </Button>
          </Stack>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Invite Section */}
        {isAdmin ? (
          <Stack spacing={2}>
            {!isDeceased ? (
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.primary"
                  sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <EmailIcon fontSize="small" color="action" />
                  Invite Family Member
                </Typography>
                
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.default, 0.5)
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSendInvite}
                    disabled={loading || !email}
                    endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                    sx={{
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      py: 1
                    }}
                  >
                    {loading ? "Sending..." : "Send Invite"}
                  </Button>
                </Stack>

                {status && (
                  <Fade in>
                    <Alert severity={status.type} sx={{ mt: 2, borderRadius: 2 }}>
                      {status.msg}
                    </Alert>
                  </Fade>
                )}
              </Box>
            ) : (
              <Alert 
                severity="info" 
                variant="filled"
                icon={<DeathIcon fontSize="small" />}
                sx={{ 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                  color: theme.palette.text.secondary,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                Invitations are disabled for deceased members.
              </Alert>
            )}
          </Stack>
        ) : (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            View Only Mode. Contact admin to edit.
          </Alert>
        )}
      </Box>
    </Paper>
  );
}