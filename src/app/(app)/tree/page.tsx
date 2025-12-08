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
  IconButton,
  Divider,
  Stack,
  Fade,
  MenuItem,
  InputAdornment,
  Slide,
} from "@mui/material";
import {
  Close as CloseIcon,
  Email as EmailIcon,
  CheckCircle,
  Send as SendIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { familyTreeData } from "@/data/familyTree";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";

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

/* -----------------------
   Family Tree Chart Component
   ----------------------- */
function FamilyTreeChart({
  isAdmin,
  isMobile,
  theme,
  treeData,
  onNodeSelect,
}: {
  isAdmin: boolean;
  isMobile: boolean;
  theme: any;
  treeData: FamilyTreeNode[];
  onNodeSelect?: (node: FamilyTreeNode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const f3ChartInstance = useRef<any>(null);
  const chartDataRef = useRef<FamilyTreeNode[]>([]);
  const onNodeSelectRef = useRef(onNodeSelect);

  // Keep refs updated
  useEffect(() => {
    chartDataRef.current = treeData;
    onNodeSelectRef.current = onNodeSelect;
    if (f3ChartInstance.current) {
       f3ChartInstance.current.updateTree({ data: treeData });
    }
  }, [treeData, onNodeSelect]);

  const createChart = useCallback(
    (f3: any, data: FamilyTreeNode[]) => {
      if (!containerRef.current) return;

      chartDataRef.current = data;

      const f3Chart = f3
        .createChart("#FamilyChart", data)
        .setTransitionTime(1000)
        .setCardXSpacing(isMobile ? 200 : 250)
        .setCardYSpacing(isMobile ? 120 : 150)
        .setSingleParentEmptyCard(isAdmin, { label: "ADD" })
        .setShowSiblingsOfMain(true)
        .setOrientationVertical();

      const f3Card = f3Chart
        .setCardHtml()
        .setCardDisplay([["first name", "last name"], ["birthday"]])
        .setCardDim({})
        .setMiniTree(true)
        .setStyle("imageCircle")
        .setOnHoverPathToMain();

      // ⭐ Use regular function for proper 'this' binding, but wrap logic in arrow function
      f3Card.setOnCardUpdate(function(this: HTMLElement, d: any) {
        // Skip if it's a new relative placeholder
        if (d.data._new_rel_data) return;

        // 'this' refers to the card wrapper element
        const cardInner = this.querySelector('.card-inner') as HTMLElement;
        if (!cardInner) return;

        // Check if button already exists to avoid duplicates
        if (cardInner.querySelector('.custom-info-btn')) return;

        // Create info button wrapper
        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'custom-info-btn';
        btnWrapper.setAttribute('style', `
          cursor: pointer;
          width: 28px;
          height: 28px;
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
        `);

        // Create the actual button
        btnWrapper.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: ${theme.palette.mode === 'dark' ? '#fff' : '#333'};">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
        `;

        // Hover effects
        const innerBtn = btnWrapper.firstElementChild as HTMLElement;
        btnWrapper.addEventListener('mouseenter', () => {
          if (innerBtn) {
            innerBtn.style.background = 'rgba(102, 126, 234, 0.9)';
            innerBtn.style.transform = 'scale(1.1)';
            const svg = innerBtn.querySelector('svg');
            if (svg) (svg as SVGElement).style.color = '#fff';
          }
        });

        btnWrapper.addEventListener('mouseleave', () => {
          if (innerBtn) {
            innerBtn.style.background = theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(0, 0, 0, 0.1)';
            innerBtn.style.transform = 'scale(1)';
            const svg = innerBtn.querySelector('svg');
            if (svg) (svg as SVGElement).style.color = theme.palette.mode === 'dark' ? '#fff' : '#333';
          }
        });

        // Click handler
        btnWrapper.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation(); // Don't trigger card expansion

          // Find node data from our stored reference
          const nodeData = chartDataRef.current.find(n => n.id === d.data.id);
          
          if (nodeData && onNodeSelectRef.current) {
            console.log("🎯 Info button clicked:", nodeData);
            onNodeSelectRef.current(nodeData);
          }
        });

        // Add button to card
        cardInner.appendChild(btnWrapper);
      });

      f3Chart.updateTree({ initial: true });
      f3ChartInstance.current = f3Chart;
    },
    [isAdmin, isMobile, theme]
  );

  const loadFamilyChart = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      containerRef.current.innerHTML = "";
      const f3Module = await import("family-chart");
      const f3 = f3Module.default || f3Module;
      createChart(f3, treeData);
    } catch (error) {
      console.error("❌ Error loading family chart:", error);
    }
  }, [createChart, treeData]);

  useEffect(() => {
    loadFamilyChart();
  }, [loadFamilyChart]);

  const bgColor = theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff";

  return (
    <div
      className="f3 f3-cont"
      id="FamilyChart"
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bgColor,
      }}
    />
  );
}

/* -----------------------
   ✨ Floating Quick Actions (FAB / Pill)
   ----------------------- */
function FloatingQuickActions({
  node,
  onViewDetails,
  onDismiss,
}: {
  node: FamilyTreeNode | null;
  onViewDetails: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!node) return null;

  const displayName = `${node.data["first name"] || ""} ${node.data["last name"] || ""}`.trim();

  return (
    <Slide direction="up" in={!!node} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: isMobile ? 30 : 40,
          left: "50%",
          transform: "translateX(-50%) !important",
          p: 1.5,
          pr: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: theme.palette.mode === 'dark' 
            ? alpha("#1e1e24", 0.8) 
            : alpha("#ffffff", 0.8),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: "100px",
          zIndex: 1100,
          maxWidth: "95%",
          width: "fit-content",
          boxShadow: theme.shadows[12],
        }}
      >
        <Avatar
          src={node.data.avatar}
          sx={{
            width: 44,
            height: 44,
            bgcolor: node.data.gender === "M" ? "#3b82f6" : "#ec4899",
            border: `2px solid ${theme.palette.background.paper}`
          }}
        >
          {node.data["first name"]?.[0]}
        </Avatar>

        <Box sx={{ minWidth: isMobile ? 100 : 140 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {node.data.birthday || (node.data.gender === "M" ? "Male" : "Female")}
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          endIcon={<VisibilityIcon />}
          onClick={onViewDetails}
          sx={{
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: 600,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            boxShadow: "0 4px 10px rgba(118, 75, 162, 0.3)"
          }}
        >
          Profile
        </Button>

        <IconButton size="small" onClick={onDismiss} sx={{ ml: -1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}

/* -----------------------
   🔍 Inspector Panel (Side Pane)
   ----------------------- */
interface InspectorPanelProps {
  node: FamilyTreeNode | null;
  onClose: () => void;
  isAdmin: boolean;
  familyId: string;
  adminId: string;
  onEdit: () => void;
}

function InspectorPanel({
  node,
  onClose,
  isAdmin,
  familyId,
  adminId,
  onEdit,
}: InspectorPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
        setStatus({ type: "error", msg: data.error || "Failed to send invite" });
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

  if (!node) return null;

  const displayName = `${node.data["first name"] || ""} ${node.data["last name"] || ""}`.trim();
  const isMale = node.data.gender === "M";

  return (
    <Paper
      elevation={4}
      sx={{
        position: "absolute",
        top: isMobile ? "auto" : 20,
        bottom: isMobile ? 0 : 20,
        right: isMobile ? 0 : 20,
        left: isMobile ? 0 : "auto",
        width: isMobile ? "100%" : 340,
        maxHeight: isMobile ? "85vh" : "calc(100vh - 40px)",
        borderRadius: isMobile ? "24px 24px 0 0" : 4,
        background: theme.palette.mode === "dark"
            ? alpha("#121217", 0.95)
            : alpha("#ffffff", 0.95),
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.1),
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        overflow: "hidden",
        boxShadow: theme.shadows[24],
        transition: "transform 0.3s ease",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: isMale
            ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.15)}, transparent)`
            : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)}, transparent)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Chip
          label={isAdmin ? "Admin Mode" : "View Mode"}
          size="small"
          color={isAdmin ? "primary" : "default"}
          variant="outlined"
          sx={{ bgcolor: alpha(theme.palette.background.paper, 0.6) }}
        />
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Profile */}
      <Box sx={{ px: 3, pb: 2, display: "flex", flexDirection: "column", alignItems: "center", mt: -3 }}>
        <Avatar
          src={node.data.avatar}
          sx={{
            width: 96,
            height: 96,
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[4],
            bgcolor: isMale ? "#3b82f6" : "#ec4899",
            fontSize: "2.5rem",
          }}
        >
          {node.data["first name"]?.[0]}
        </Avatar>

        <Typography variant="h5" fontWeight={700} sx={{ mt: 2, textAlign: "center" }}>
          {displayName}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip
            icon={<PersonIcon sx={{ fontSize: "1rem !important" }} />}
            label={isMale ? "Male" : "Female"}
            size="small"
            sx={{ fontSize: "0.75rem" }}
          />
          {node.data.birthday && (
            <Chip
              icon={<CakeIcon sx={{ fontSize: "1rem !important" }} />}
              label={node.data.birthday}
              size="small"
              sx={{ fontSize: "0.75rem" }}
            />
          )}
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Content */}
      <Box sx={{ p: 3, pt: 2, flex: 1, overflowY: "auto" }}>
        {isAdmin ? (
          <Stack spacing={2}>
            <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb:1, display:'block'}}>
                    Invitation
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="member@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                        startAdornment: (
                        <InputAdornment position="start">
                            <EmailIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        </InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSendInvite}
                    disabled={loading || !email}
                    endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                    sx={{ 
                      mt: 1, 
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                >
                {loading ? "Sending..." : "Send Invite"}
                </Button>
                {status && (
                    <Fade in>
                        <Alert severity={status.type} sx={{ mt: 1, borderRadius: 2 }}>{status.msg}</Alert>
                    </Fade>
                )}
            </Box>
            
            <Divider />

            <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb:1, display:'block'}}>
                    Management
                </Typography>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={onEdit}
                    startIcon={<EditIcon />}
                    sx={{ borderRadius: 2 }}
                >
                Edit Profile
                </Button>
            </Box>
          </Stack>
        ) : (
             <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
                You are in View Only mode. Contact an admin to invite or edit members.
            </Alert>
        )}
      </Box>
    </Paper>
  );
}

/* -----------------------
   📝 Edit Member Dialog
   ----------------------- */
function EditMemberDialog({
  open,
  onClose,
  node,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  node: FamilyTreeNode | null;
  onSave: (updatedNode: FamilyTreeNode) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthday: null as Dayjs | null,
    gender: "",
    avatar: "",
  });

  useEffect(() => {
    if (node) {
      setFormData({
        firstName: node.data["first name"] || "",
        lastName: node.data["last name"] || "",
        birthday: node.data.birthday ? dayjs(node.data.birthday) : null,
        gender: node.data.gender || "",
        avatar: node.data.avatar || "",
      });
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;

    const updatedNode: FamilyTreeNode = {
      ...node,
      data: {
        ...node.data,
        "first name": formData.firstName,
        "last name": formData.lastName,
        birthday: formData.birthday ? formData.birthday.format("YYYY") : undefined,
        gender: formData.gender as "M" | "F" | undefined,
        avatar: formData.avatar,
      },
    };

    onSave(updatedNode);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Details</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CloudinaryUpload
                    currentImage={formData.avatar}
                    onUploadSuccess={(url) => setFormData({ ...formData, avatar: url })}
                    folder="familyfirst/avatars"
                />
            </Box>
            <Stack direction="row" spacing={2}>
                <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
            </Stack>
            <Stack direction="row" spacing={2}>
                <DatePicker
                    label="Birthday"
                    value={formData.birthday}
                    onChange={(newValue) => setFormData({ ...formData, birthday: newValue })}
                    slotProps={{ textField: { fullWidth: true } }}
                />
                <TextField
                    select
                    fullWidth
                    label="Gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                </TextField>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formData.firstName}
          sx={{ borderRadius: 2, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* -----------------------
   🌳 Main Page Layout
   ----------------------- */
export default function FamilyTreePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [isAdmin, setIsAdmin] = useState(true);
  const [treeData, setTreeData] = useState<FamilyTreeNode[]>(familyTreeData as FamilyTreeNode[]);
  
  const [quickActionNode, setQuickActionNode] = useState<FamilyTreeNode | null>(null);
  const [inspectorNode, setInspectorNode] = useState<FamilyTreeNode | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleNodeSelect = useCallback((node: FamilyTreeNode) => {
    const freshNode = treeData.find(n => n.id === node.id) || node;
    setQuickActionNode(freshNode);
  }, [treeData]);

  const handleViewDetails = () => {
    if (quickActionNode) {
      setInspectorNode(quickActionNode);
      setQuickActionNode(null);
    }
  };

  const handleSaveEdit = (updatedNode: FamilyTreeNode) => {
    setTreeData(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    setInspectorNode(updatedNode);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ height: "calc(100vh - 64px)", width: "100%", position: "relative", overflow: "hidden" }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 5,
            p: 1,
            px: 2,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(10px)",
            border: "1px solid",
            borderColor: alpha(theme.palette.divider, 0.1),
          }}
        >
            <Typography variant="subtitle2" fontWeight={800}>Family Tree</Typography>
            <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Click ⓘ on cards for details
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">Mode:</Typography>
                <Chip
                    label={isAdmin ? "Admin" : "Viewer"}
                    size="small"
                    color={isAdmin ? "primary" : "default"}
                    onClick={() => setIsAdmin(!isAdmin)}
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                />
            </Box>
        </Paper>

        {/* Chart */}
        <FamilyTreeChart
          isAdmin={isAdmin}
          isMobile={isMobile}
          theme={theme}
          treeData={treeData}
          onNodeSelect={handleNodeSelect}
        />

        {/* Quick Action FAB */}
        <FloatingQuickActions
          node={quickActionNode}
          onViewDetails={handleViewDetails}
          onDismiss={() => setQuickActionNode(null)}
        />

        {/* Inspector Panel */}
        <Fade in={!!inspectorNode} mountOnEnter unmountOnExit>
          <Box>
            <InspectorPanel
              node={inspectorNode}
              onClose={() => setInspectorNode(null)}
              isAdmin={isAdmin}
              familyId="demo-family"
              adminId="demo-admin"
              onEdit={() => setEditOpen(true)}
            />
          </Box>
        </Fade>

        {/* Edit Dialog */}
        <EditMemberDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          node={inspectorNode}
          onSave={handleSaveEdit}
        />
      </Box>
    </LocalizationProvider>
  );
}