// src/app/(app)/tree/page.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  alpha,
  useMediaQuery,
  Stack,
  FormControlLabel,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  CheckCircle,
  Person,
} from "@mui/icons-material";
import { familyTreeData } from "@/data/familyTree";

/* -----------------------
   Type Definitions
   ----------------------- */
interface FamilyTreeNodeData {
  "first name": string;
  "last name"?: string;
  birthday?: string;
  avatar?: string;
  gender?: "M" | "F";
  email?: string;
}

interface FamilyTreeNode {
  id: string;
  data: FamilyTreeNodeData;
  rels?: {
    spouses?: string[];
    children?: string[];
    father?: string;
    mother?: string;
  };
}

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  node: FamilyTreeNode | null;
  familyId?: string;
  adminId?: string;
}

/* -----------------------
   Family Tree Chart Component
   ----------------------- */
function FamilyTreeChart({
  isAdmin,
  isMobile,
  theme,
  onNodeClick,
}: {
  isAdmin: boolean;
  isMobile: boolean;
  theme: any;
  onNodeClick?: (node: FamilyTreeNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const f3ChartInstance = useRef<any>(null);
  const chartDataRef = useRef<FamilyTreeNode[]>([]);

  const createChart = useCallback(
    (f3: any, data: FamilyTreeNode[]) => {
      if (!containerRef.current) return;

      // Store data reference for click handler
      chartDataRef.current = data;

      const f3Chart = f3
        .createChart("#FamilyChart", data)
        .setTransitionTime(800)
        .setCardXSpacing(isMobile ? 200 : 280)
        .setCardYSpacing(isMobile ? 140 : 180)
        .setSingleParentEmptyCard(isAdmin, { label: "ADD" })
        .setShowSiblingsOfMain(true)
        .setOrientationVertical();

      const f3Card = f3Chart
        .setCardHtml()
        .setCardDisplay([["first name", "last name"], ["birthday"]])
        .setMiniTree(true)
        .setStyle("imageCircle")
        .setOnHoverPathToMain();

      // ⭐ FIXED: Click handler that extracts actual node from event
      try {
        f3Card.setOnCardClick((eventOrNode: any) => {
          console.log("🔍 Click event received:", eventOrNode);

          let nodeData: FamilyTreeNode | null = null;

          // Check if it's a PointerEvent or regular Event
          if (eventOrNode instanceof Event || eventOrNode?.type) {
            console.log("📍 Event detected, extracting node from DOM...");
            
            // Get the clicked element
            const target = (eventOrNode.currentTarget || eventOrNode.target) as HTMLElement;
            
            // Search up the DOM tree for node ID
            let element: HTMLElement | null = target;
            let attempts = 0;
            const maxAttempts = 10;

            while (element && !nodeData && attempts < maxAttempts) {
              // Try various data attributes
              const nodeId =
                element.getAttribute("data-id") ||
                element.getAttribute("data-node-id") ||
                element.getAttribute("id") ||
                element.dataset?.id;

              if (nodeId) {
                console.log("✅ Found node ID:", nodeId);
                // Find the actual node data from our stored reference
                nodeData = chartDataRef.current.find((n) => n.id === nodeId) || null;
                if (nodeData) {
                  console.log("✅ Found node data:", nodeData);
                  break;
                }
              }

              element = element.parentElement;
              attempts++;
            }

            // Fallback: Try to extract from innerText
            if (!nodeData && target.innerText) {
              const nameMatch = target.innerText.split("\n")[0]?.trim();
              if (nameMatch) {
                nodeData = chartDataRef.current.find(
                  (n) => `${n.data["first name"]} ${n.data["last name"] || ""}`.trim() === nameMatch
                ) || null;
              }
            }
          } else if (eventOrNode?.id && eventOrNode?.data) {
            // Already a node object
            console.log("✅ Direct node object received");
            nodeData = eventOrNode as FamilyTreeNode;
          }

          if (nodeData && onNodeClick) {
            console.log("🎯 Calling onNodeClick with:", nodeData);
            onNodeClick(nodeData);
          } else {
            console.warn("⚠️ Could not extract node data from click event");
          }
        });
      } catch (err) {
        console.warn("⚠️ setOnCardClick not supported:", err);
      }

      if (isAdmin) {
        const f3EditTree = f3Chart
          .editTree()
          .fixed(true)
          .setFields(["first name", "last name", "birthday", "avatar", "gender"])
          .setEditFirst(true)
          .setCardClickOpen(f3Card);

        f3EditTree.setEdit();
      }

      f3Chart.updateTree({ initial: true });
      f3ChartInstance.current = f3Chart;
    },
    [isAdmin, isMobile, onNodeClick]
  );

  const loadFamilyChart = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      containerRef.current.innerHTML = "";

      const f3Module = await import("family-chart");
      const f3 = f3Module.default || f3Module;

      const data = familyTreeData as FamilyTreeNode[];
      createChart(f3, data);
    } catch (error) {
      console.error("❌ Error loading family chart:", error);
    }
  }, [createChart]);

  useEffect(() => {
    loadFamilyChart();
  }, [loadFamilyChart]);

  const bgColor = theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff";
  const textColor = theme.palette.mode === "dark" ? "#fff" : "#333";

  return (
    <div
      className="f3 f3-cont"
      id="FamilyChart"
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bgColor,
        color: textColor,
      }}
    />
  );
}

/* -----------------------
   Invite Dialog Component
   ----------------------- */
function InviteDialog({
  open,
  onClose,
  node,
  familyId = "demo-family", // TODO: Get from context
  adminId = "demo-admin", // TODO: Get from session
}: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (node?.data?.email) {
      setEmail(node.data.email);
    } else {
      setEmail("");
    }
    setError("");
    setSuccess("");
  }, [node]);

  const handleSendInvite = async () => {
    if (!email || !node) {
      setError("Email and node are required");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("📤 Sending invite with payload:", {
        email,
        treeNodeId: node.id,
        familyId,
        invitedBy: adminId,
      });

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
        setError(data.error || `Failed to send invite (${res.status})`);
      } else {
        setSuccess("✅ Invite sent successfully!");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error sending invite:", err);
      setError("Unexpected error while sending invite");
    } finally {
      setLoading(false);
    }
  };

  if (!node) return null;

  const displayName = `${node.data["first name"] || ""} ${node.data["last name"] || ""}`.trim() || node.id;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Invite {displayName}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send an invitation email to this family member so they can register and access their
          profile.
        </Typography>

        {/* Selected Member Info */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            bgcolor: alpha("#667eea", 0.1),
            border: "1px solid",
            borderColor: alpha("#667eea", 0.3),
            borderRadius: 2,
          }}
        >
          <Avatar
            src={node.data.avatar}
            sx={{
              width: 56,
              height: 56,
              bgcolor: node.data.gender === "M" ? "#3b82f6" : "#ec4899",
            }}
          >
            {node.data["first name"]?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {displayName}
            </Typography>
            {node.data.birthday && (
              <Typography variant="caption" color="text.secondary">
                Born: {node.data.birthday}
              </Typography>
            )}
            <Box sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={node.data.gender === "M" ? "Male" : "Female"}
                sx={{
                  bgcolor: node.data.gender === "M" 
                    ? alpha("#3b82f6", 0.2) 
                    : alpha("#ec4899", 0.2),
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Email Input */}
        <TextField
          fullWidth
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          disabled={loading}
          InputProps={{
            startAdornment: <EmailIcon sx={{ mr: 1, color: "action.active" }} />,
          }}
        />

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={loading || !email}
          onClick={handleSendInvite}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5568d3 0%, #6a3f8d 100%)",
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Sending...
            </>
          ) : (
            "Send Invite"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* -----------------------
   Main Page Component
   ----------------------- */
export default function FamilyTreePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isAdmin, setIsAdmin] = useState(true);
  const [selectedNode, setSelectedNode] = useState<FamilyTreeNode | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleAdminToggle = () => {
    setIsAdmin((prev) => !prev);
  };

  const handleNodeClick = useCallback((node: FamilyTreeNode) => {
    console.log("🎯 Node clicked in parent:", node);

    // Validate node has required data
    if (!node || !node.id) {
      console.warn("⚠️ Invalid node clicked:", node);
      return;
    }

    setSelectedNode(node);
    setInviteOpen(true);
  }, []);

  const handleCloseInvite = useCallback(() => {
    setInviteOpen(false);
    setTimeout(() => {
      setSelectedNode(null);
    }, 300);
  }, []);

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", pb: 4 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 2 : 3,
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.1
          )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5,
            }}
          >
            Family Tree
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Interactive family tree • Drag to explore • Click members to invite
          </Typography>
        </Box>
      </Paper>

      {/* Legend / Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Legend
          </Typography>

          <FormControlLabel
            control={
              <Switch checked={isAdmin} onChange={handleAdminToggle} color="primary" />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AdminIcon fontSize="small" />
                <Typography variant="caption" fontWeight={600}>
                  Admin Mode
                </Typography>
              </Box>
            }
          />
        </Box>

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          flexWrap="wrap"
          useFlexGap
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1.5,
                backgroundColor: "rgb(120, 159, 172)",
              }}
            />
            <Typography variant="caption">Male</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1.5,
                backgroundColor: "rgb(196, 138, 146)",
              }}
            />
            <Typography variant="caption">Female</Typography>
          </Box>

          {isAdmin && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EditIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                <Typography variant="caption">Click card to invite (Admin)</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AddIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                <Typography variant="caption">Click + to add member (Admin)</Typography>
              </Box>
            </>
          )}
        </Stack>
      </Paper>

      {/* Chart Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          position: "relative",
          height: isMobile ? "600px" : "800px",
        }}
      >
        <FamilyTreeChart
          isAdmin={isAdmin}
          isMobile={isMobile}
          theme={theme}
          onNodeClick={handleNodeClick}
        />
      </Paper>

      {/* Instructions */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.info.main,
            0.05
          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="primary">
          💡 How to Use
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            • <strong>Drag</strong> the canvas to pan around the tree
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Scroll</strong> to zoom in/out
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Click on cards</strong> to invite family members
          </Typography>
          {isAdmin && (
            <>
              <Typography variant="body2" color="text.secondary">
                • <strong>Click ADD buttons</strong> to add new family members (Admin)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Edit mode</strong> allows you to modify member details (Admin)
              </Typography>
            </>
          )}
          <Typography variant="body2" color="text.secondary">
            • <strong>Hover over cards</strong> to see connection paths highlighted
          </Typography>
        </Stack>
      </Paper>

      {/* Family Statistics */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
          📊 Family Statistics
        </Typography>
        <Stack direction={isMobile ? "column" : "row"} spacing={3}>
          <Box>
            <Typography variant="h4" color="primary" fontWeight={700}>
              {familyTreeData.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Members
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="secondary" fontWeight={700}>
              4
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generations
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main" fontWeight={700}>
              25+
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Family Branches
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Invite Dialog */}
      <InviteDialog open={inviteOpen} onClose={handleCloseInvite} node={selectedNode} />
    </Box>
  );
}