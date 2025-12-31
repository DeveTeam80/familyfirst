// src/app/(app)/tree/page.tsx
"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
} from "react";
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
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Add as AddIcon,
  Replay as ReplayIcon, // 👈 Restored
  Edit as EditIcon,     // 👈 Restored
} from "@mui/icons-material";
import { AiOutlineUserAdd } from "react-icons/ai";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { Theme } from "@mui/material/styles";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";
import { FamilyRole } from "@prisma/client";

/* -----------------------
   Type Definitions
   ----------------------- */
interface FamilyTreeNodeData {
  "first name": string;
  "last name"?: string;
  birthday?: string;
  avatar?: string;
  photoUrl?: string;
  gender: "M" | "F";
  email?: string;
  [key: string]: unknown;
}

interface FamilyTreeNode {
  id: string;
  userId?: string | null;
  data: FamilyTreeNodeData;
  rels?: {
    parents?: string[];
    spouses?: string[];
    children?: string[];
  };
}

interface F3CardData {
  data: {
    id: string;
    _new_rel_data?: {
      rel_type: string;
      label: string;
      rel_id: string;
    };
    [key: string]: unknown;
  };
}

interface UserAvatarDTO {
  id: string;
  avatarUrl?: string | null;
}

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  relativeNode: FamilyTreeNode | null;
  relationType: "children" | "spouses" | "parents" | null;
  specificRole: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (data: any) => void;
}

/* -----------------------
   💀 Tree Skeleton Loader
   ----------------------- */
function TreeSkeleton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const SkeletonNode = () => (
    <Paper
      elevation={0}
      sx={{
        width: isMobile ? 160 : 220,
        height: 80,
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: "12px",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.4),
      }}
    >
      <Skeleton
        variant="circular"
        width={50}
        height={50}
        sx={{ flexShrink: 0 }}
      />
      <Box sx={{ width: "100%" }}>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="50%" height={20} />
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        pt: 4,
      }}
    >
      <Fade in timeout={500}>
        <Box>
          <SkeletonNode />
        </Box>
      </Fade>
      <Skeleton variant="rectangular" width={2} height={40} sx={{ my: -4 }} />
      <Fade in timeout={700}>
        <Stack direction="row" spacing={isMobile ? 2 : 8} alignItems="center">
          <SkeletonNode />
          <SkeletonNode />
        </Stack>
      </Fade>
      <Stack direction="row" spacing={isMobile ? 18 : 30} sx={{ my: -4 }}>
        <Skeleton variant="rectangular" width={2} height={40} />
        <Skeleton variant="rectangular" width={2} height={40} />
      </Stack>
      <Fade in timeout={900}>
        <Stack direction="row" spacing={isMobile ? 2 : 4}>
          <SkeletonNode />
          <SkeletonNode />
          {!isMobile && <SkeletonNode />}
        </Stack>
      </Fade>
    </Box>
  );
}

/* -----------------------
   🌳 Family Tree Chart Component
   ----------------------- */

export interface FamilyTreeChartHandle {
  resetView: () => void;
  triggerAddMode: (nodeId: string) => void;
  cancelAddMode: () => void;
}

const FamilyTreeChart = React.forwardRef<
  FamilyTreeChartHandle,
  {
    isAdmin: boolean;
    isMobile: boolean;
    theme: Theme;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    treeData: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onNodeSelect?: (node: any) => void;
    onAddRelative?: (
      parentId: string,
      relationType: "children" | "spouses" | "parents",
      specificRole: string
    ) => void;
  }
>(
  (
    {
      isAdmin,
      isMobile,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      theme,
      treeData,
      onNodeSelect,
      onAddRelative,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f3ChartInstance = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f3EditTreeRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f3LibRef = useRef<any>(null);

    // Refs to hold latest props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartDataRef = useRef<any[]>([]);
    const onNodeSelectRef = useRef(onNodeSelect);
    const onAddRelativeRef = useRef(onAddRelative);

    // Track previous data to prevent unnecessary redraws
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevTreeDataRef = useRef<any[]>([]);

    // 🔄 1. ALWAYS Keep Refs Fresh
    chartDataRef.current = treeData;
    onNodeSelectRef.current = onNodeSelect;
    onAddRelativeRef.current = onAddRelative;

    // 🎨 2. Chart Update Effect (Runs ONLY when treeData changes)
    useEffect(() => {
      if (prevTreeDataRef.current === treeData) {
        return;
      }

      prevTreeDataRef.current = treeData;

      if (f3ChartInstance.current) {
        f3ChartInstance.current.updateTree({ data: treeData });
      }
    }, [treeData]);

    const createChart = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f3: any, data: any[]) => {
        if (!containerRef.current) return;
        chartDataRef.current = data;
        prevTreeDataRef.current = data;

        const f3Chart = f3
          .createChart("#FamilyChart", data)
          .setTransitionTime(1000)
          .setCardXSpacing(isMobile ? 200 : 250)
          .setCardYSpacing(isMobile ? 120 : 150)
          .setShowSiblingsOfMain(true)
          .setOrientationVertical();

        const f3Card = f3Chart
          .setCardHtml()
          .setCardDisplay([
            ["first name", "last name"],
            ["birthday"],
          ])
          .setCardDim({})
          .setMiniTree(true)
          .setStyle("imageCircle")
          .setOnHoverPathToMain();

        if (isAdmin) {
          const editTree = f3Chart
            .editTree()
            .fixed(true)
            .setFields(["first name"])
            .setEditFirst(false);
          f3EditTreeRef.current = editTree;
        }

        f3Card.setOnCardUpdate(function (this: HTMLElement, d: F3CardData) {
          // ============================================================
          // 🟢 LOGIC FOR GHOST CARDS
          // ============================================================
          if (d.data._new_rel_data) {
            this.style.cursor = "pointer";

            // Check if we've already bound the listener to avoid duplicates
            if (!this.getAttribute("data-click-bound")) {
              this.setAttribute("data-click-bound", "true");

              // 🛑 USE { capture: true } TO INTERCEPT BEFORE LIBRARY
              this.addEventListener(
                "click",
                (e) => {
                  // 🛑 STOP EVERYTHING
                  e.stopPropagation();
                  e.stopImmediatePropagation(); // Kills library listeners
                  e.preventDefault();

                  // Get Handler
                  const handler = onAddRelativeRef.current;

                  // Get IDs
                  const realParentId =
                    d.data._new_rel_data?.rel_id || d.data.id;
                  const rawRelType = d.data._new_rel_data?.rel_type;

                  // Map Types
                  let appRelType:
                    | "children"
                    | "spouses"
                    | "parents"
                    | null = null;
                  if (rawRelType === "son" || rawRelType === "daughter")
                    appRelType = "children";
                  else if (rawRelType === "spouse") appRelType = "spouses";
                  else if (rawRelType === "father" || rawRelType === "mother")
                    appRelType = "parents";

                  // Trigger Parent Action
                  if (realParentId && appRelType && rawRelType && handler) {
                    handler(realParentId, appRelType, rawRelType);
                  }
                },
                { capture: true }
              ); // <--- IMPORTANT
            }
            return;
          }

          // ============================================================
          // 🔵 LOGIC FOR REGULAR NODES
          // ============================================================
          const nodeData = chartDataRef.current.find((n) => n.id === d.data.id);
          if (nodeData) {
            // Standard onclick is fine for regular nodes, or use capture if you want to stop centering there too
            this.onclick = (e: MouseEvent) => {
              e.stopPropagation();
              if (onNodeSelectRef.current) {
                onNodeSelectRef.current(nodeData);
              }
            };
          }
        });

        f3Chart.updateTree({ initial: true });
        f3ChartInstance.current = f3Chart;
      },
      [isAdmin, isMobile]
    );

    useImperativeHandle(ref, () => ({
      resetView: () => {
        if (
          containerRef.current &&
          f3LibRef.current &&
          chartDataRef.current.length > 0
        ) {
          containerRef.current.innerHTML = "";
          createChart(f3LibRef.current, chartDataRef.current);
        }
      },
      triggerAddMode: (nodeId: string) => {
        if (f3ChartInstance.current && f3EditTreeRef.current) {
          const node = chartDataRef.current.find((n) => n.id === nodeId);
          if (node) {
            f3ChartInstance.current.updateTree({ main_id: nodeId });
            f3EditTreeRef.current.open(node);
            setTimeout(() => {
              const addBtn = document.querySelector(
                ".f3-add-relative-btn"
              ) as HTMLElement;
              if (addBtn) addBtn.click();
            }, 0);
          }
        }
      },
      cancelAddMode: () => {
        if (f3EditTreeRef.current) {
          f3EditTreeRef.current.closeForm();
        }
      },
    }));

    const loadFamilyChart = useCallback(async () => {
      if (!containerRef.current) return;
      try {
        containerRef.current.innerHTML = "";
        const f3Module = await import("family-chart");
        const f3 = f3Module.default || f3Module;
        f3LibRef.current = f3;
        createChart(f3, treeData);
      } catch (error) {
        console.error("❌ Error loading family chart:", error);
      }
    }, [createChart, treeData]);

    useEffect(() => {
      if (treeData.length > 0) {
        loadFamilyChart();
      }
    }, [loadFamilyChart, treeData]);

    const bgColor = theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff";

    return (
      <>
        <style jsx global>{`
          .f3-form-cont,
          .f3-card-edit,
          div[class*="f3-card-edit"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
          }
        `}</style>
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
      </>
    );
  }
);
FamilyTreeChart.displayName = "FamilyTreeChart";

/* -----------------------
   ➕ Add Member Dialog
   ----------------------- */
function AddMemberDialog({
  open,
  onClose,
  relativeNode,
  relationType,
  specificRole,
  onAdd,
}: AddMemberDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "M" as "M" | "F",
    birthday: null as Dayjs | null,
    avatar: "",
  });

  useEffect(() => {
    if (open) {
      let initialGender: "M" | "F" = "M";
      if (specificRole === "daughter" || specificRole === "mother") {
        initialGender = "F";
      } else if (specificRole === "son" || specificRole === "father") {
        initialGender = "M";
      } else if (specificRole === "spouse" && relativeNode) {
        initialGender = relativeNode.data.gender === "M" ? "F" : "M";
      }

      setFormData({
        firstName: "",
        lastName: "",
        gender: initialGender,
        birthday: null,
        avatar: "",
      });
    }
  }, [open, specificRole, relativeNode]);

  const handleSave = () => {
    const payload = {
      ...formData,
      birthday: formData.birthday
        ? formData.birthday.format("YYYY")
        : undefined,
      relativeId: relativeNode?.id,
      relationType: relationType,
    };
    onAdd(payload);
    onClose();
  };

  const getTitle = () => {
    // Robust Name Check (CamelCase vs Space)
    const rawName =
      relativeNode?.data?.["first name"] ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (relativeNode?.data as any)?.firstName;

    const name = rawName || "Relative";

    if (specificRole) {
      const role = specificRole.charAt(0).toUpperCase() + specificRole.slice(1);
      return `Add ${role} to ${name}`;
    }
    return "Add Member";
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{getTitle()}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CloudinaryUpload
                currentImage={formData.avatar}
                onUploadSuccess={(url) =>
                  setFormData({ ...formData, avatar: url })
                }
                folder="familyfirst/avatars"
              />
            </Box>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Birthday"
                value={formData.birthday}
                onChange={(newValue) =>
                  setFormData({ ...formData, birthday: newValue })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                select
                fullWidth
                label="Gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as "M" | "F",
                  })
                }
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formData.firstName}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          Add Member
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* -----------------------
   ✨ Floating Quick Actions
   ----------------------- */
function FloatingQuickActions({
  node,
  isAdmin,
  onViewDetails,
  onTriggerAdd,
  onDismiss,
}: {
  node: FamilyTreeNode | null;
  isAdmin: boolean;
  onViewDetails: () => void;
  onTriggerAdd: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!node) return null;

  const displayName = `${node.data["first name"] || ""} ${
    node.data["last name"] || ""
  }`.trim();

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
          background:
            theme.palette.mode === "dark"
              ? alpha("#1e1e24", 0.9)
              : alpha("#ffffff", 0.9),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: "100px",
          zIndex: 1100,
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
            border: `2px solid ${theme.palette.background.paper}`,
          }}
        >
          {node.data["first name"]?.[0]}
        </Avatar>

        <Box sx={{ minWidth: isMobile ? 80 : 120, mr: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            noWrap
            sx={{ maxWidth: 150 }}
          >
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {node.data.birthday ||
              (node.data.gender === "M" ? "Male" : "Female")}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={onViewDetails}
          sx={{
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: 600,
            borderColor: alpha(theme.palette.primary.main, 0.5),
            color: theme.palette.text.primary,
          }}
        >
          Profile
        </Button>

        {isAdmin && (
          <Tooltip title="Add Relative">
            <IconButton
              onClick={onTriggerAdd}
              size="small"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: "#fff",
                ml: 1,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              <AiOutlineUserAdd fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <IconButton size="small" onClick={onDismiss} sx={{ ml: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}

/* -----------------------
   🔍 Inspector Panel
   ----------------------- */
interface InspectorPanelProps {
  node: FamilyTreeNode | null;
  onClose: () => void;
  isAdmin: boolean;
  familyId: string;
  adminId: string;
  onEdit: () => void;
  onAddMemberClick: () => void;
}

function InspectorPanel({
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

  if (!node) return null;

  const displayName = `${node.data["first name"] || ""} ${
    node.data["last name"] || ""
  }`.trim();
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
        background:
          theme.palette.mode === "dark"
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
      <Box
        sx={{
          p: 2,
          background: isMale
            ? `linear-gradient(135deg, ${alpha(
                theme.palette.info.main,
                0.15
              )}, transparent)`
            : `linear-gradient(135deg, ${alpha(
                theme.palette.error.main,
                0.15
              )}, transparent)`,
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

      <Box
        sx={{
          px: 3,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: -3,
        }}
      >
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

        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ mt: 2, textAlign: "center" }}
        >
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

      <Box sx={{ p: 3, pb: 0 }}>
        {isAdmin && (
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={onAddMemberClick}
              startIcon={<AddIcon />}
              sx={{
                background:
                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              Add Relative
            </Button>
            <Button
              variant="outlined"
              onClick={onEdit}
              fullWidth
              startIcon={<EditIcon />}
            >
              Edit Profile
            </Button>
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ p: 3, pt: 0, flex: 1, overflowY: "auto" }}>
        {isAdmin ? (
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: "uppercase", mb: 1, display: "block" }}
              >
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
                      <EmailIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleSendInvite}
                disabled={loading || !email}
                endIcon={
                  loading ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <SendIcon fontSize="small" />
                  )
                }
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                {loading ? "Sending..." : "Send Invite"}
              </Button>
              {status && (
                <Fade in>
                  <Alert
                    severity={status.type}
                    sx={{ mt: 1, borderRadius: 2 }}
                  >
                    {status.msg}
                  </Alert>
                </Fade>
              )}
            </Box>
          </Stack>
        ) : (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            You are in View Only mode. Contact an admin to invite or edit
            members.
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
    gender: "M" as "M" | "F",
    avatar: "",
  });

  useEffect(() => {
    if (node) {
      setFormData({
        firstName: node.data["first name"] || "",
        lastName: node.data["last name"] || "",
        birthday: node.data.birthday ? dayjs(node.data.birthday) : null,
        gender: node.data.gender || "M",
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
        birthday: formData.birthday
          ? formData.birthday.format("YYYY")
          : undefined,
        gender: formData.gender,
        avatar: formData.avatar,
      },
    };

    onSave(updatedNode);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Details</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CloudinaryUpload
                currentImage={formData.avatar}
                onUploadSuccess={(url) =>
                  setFormData({ ...formData, avatar: url })
                }
                folder="familyfirst/avatars"
              />
            </Box>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Birthday"
                value={formData.birthday}
                onChange={(newValue) =>
                  setFormData({ ...formData, birthday: newValue })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                select
                fullWidth
                label="Gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as "M" | "F",
                  })
                }
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
              </TextField>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formData.firstName}
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
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
  const router = useRouter();

  const [treeData, setTreeData] = useState<FamilyTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const familyId = "demo-family";

  // Selection States
  const [quickActionNode, setQuickActionNode] = useState<FamilyTreeNode | null>(
    null
  );
  const [inspectorNode, setInspectorNode] = useState<FamilyTreeNode | null>(
    null
  );

  // Dialog States
  const [editOpen, setEditOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addRelationType, setAddRelationType] = useState<
    "children" | "spouses" | "parents" | null
  >(null);
  const [addSpecificRole, setAddSpecificRole] = useState<string | null>(null);
  const [targetNodeForAdd, setTargetNodeForAdd] =
    useState<FamilyTreeNode | null>(null);

  // User/Auth States
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [role, setRole] = useState<FamilyRole>("VIEWER");
  const isAdmin = role === "OWNER" || role === "ADMIN";

  const chartRef = useRef<FamilyTreeChartHandle>(null);

  const fetchUsersMap = async () => {
    const res = await fetch(`/api/users?familyId=${familyId}`, {
      credentials: "include",
    });
    if (!res.ok) return new Map<string, string>();

    const json = await res.json();
    const map = new Map<string, string>();

    json.users?.forEach((u: UserAvatarDTO) => {
      if (u.id && u.avatarUrl) {
        map.set(u.id, u.avatarUrl);
      }
    });

    return map;
  };

  const fetchTreeData = useCallback(async () => {
    if (!loggedInUserId) return;
    try {
      setTreeLoading(true);

      const [treeRes, userAvatarMap] = await Promise.all([
        fetch(`/api/family/${familyId}/tree`, { credentials: "include" }),
        fetchUsersMap(),
      ]);

      if (!treeRes.ok) throw new Error("Tree fetch failed");

      const rawData: FamilyTreeNode[] = await treeRes.json();

      const normalized = rawData.map((node) => {
        const userAvatar = node.userId && userAvatarMap.get(node.userId);
        return {
          ...node,
          id: String(node.id),
          data: {
            ...node.data,
            avatar: userAvatar || node.data.photoUrl || undefined,
          },
          rels: {
            children: node.rels?.children?.map((id) => String(id)) || [],
            spouses: node.rels?.spouses?.map((id) => String(id)) || [],
            parents: node.rels?.parents?.map((id) => String(id)) || [],
          },
        };
      });

      const povNode = normalized.find((n) => n.userId === loggedInUserId);
      const orderedTree = povNode
        ? [povNode, ...normalized.filter((n) => n.id !== povNode.id)]
        : normalized;

      setTreeData(orderedTree);
    } catch (e) {
      console.error("Tree load failed", e);
    } finally {
      setTreeLoading(false);
    }
  }, [familyId, loggedInUserId]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (!res.ok) return;

        const json = await res.json();
        setLoggedInUserId(json.user.id);
        const familyRole = json?.memberships[0].role as FamilyRole | undefined;
        if (
          familyRole === "OWNER" ||
          familyRole === "ADMIN" ||
          familyRole === "MEMBER" ||
          familyRole === "VIEWER"
        ) {
          setRole(familyRole);
        }
      } catch {
        setRole("VIEWER");
      }
    })();
  }, []);

  const handleNodeSelect = useCallback(
    (node: FamilyTreeNode) => {
      const freshNode = treeData.find((n) => n.id === node.id) || node;
      setQuickActionNode(freshNode);
      setInspectorNode(null);
    },
    [treeData]
  );

  const handleTriggerAddFromPill = () => {
    if (quickActionNode && chartRef.current) {
      chartRef.current.triggerAddMode(quickActionNode.id);
      setQuickActionNode(null);
    }
  };

  const handleTriggerAddFromInspector = () => {
    if (inspectorNode && chartRef.current) {
      chartRef.current.triggerAddMode(inspectorNode.id);
      setInspectorNode(null);
    }
  };

  // 👇 Restored Function
  const handleResetView = () => {
    if (chartRef.current) {
      chartRef.current.resetView();
    }
  };

  const handleViewDetails = async () => {
    if (!quickActionNode) return;
    const node = quickActionNode;
    try {
      const res = await fetch(
        `/api/tree/node/${encodeURIComponent(node.id)}/account`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setInspectorNode(node);
        setQuickActionNode(null);
        return;
      }

      if (data.exists && data.user) {
        const username = data.user.username || data.user.name || data.user.id;
        const slug =
          typeof username === "string"
            ? encodeURIComponent(
                username
                  .toString()
                  .trim()
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9\-._~]/g, "")
              )
            : data.user.id;

        router.push(`/${slug}`);
        setQuickActionNode(null);
        return;
      }
      setInspectorNode(node);
    } catch (err) {
      console.error("Error while checking node account:", err);
      setInspectorNode(node);
    } finally {
      setQuickActionNode(null);
    }
  };

  const handleSaveEdit = (updatedNode: FamilyTreeNode) => {
    setTreeData((prev) =>
      prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
    );
    setInspectorNode(updatedNode);
  };

  const handleAddRelativeFromChart = useCallback(
    (
      parentId: string,
      type: "children" | "spouses" | "parents",
      specificRole: string
    ) => {
      const parentNode = treeData.find((n) => n.id === parentId);
      if (parentNode) {
        setTargetNodeForAdd(parentNode);
        setAddRelationType(type);
        setAddSpecificRole(specificRole);
        setAddDialogOpen(true);
      }
    },
    [treeData]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddMember = async (newMemberData: any) => {
    try {
      // 1. Call API
      const res = await fetch(`/api/family/${familyId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create member");
      }

      // 2. 🎉 Success! Now verify we got data back
      const createdMember = await res.json();
      console.log("Member created:", createdMember);

      // 3. 🧹 Cleanup Ghost Cards FIRST
      if (chartRef.current) {
        chartRef.current.cancelAddMode();
      }

      // 4. 🔄 REFETCH the tree to get the complete graph (including spouse links)
      await fetchTreeData();
    } catch (error) {
      console.error("❌ Error adding member:", error);
      alert("Failed to add member. Please try again.");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          bgcolor: theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff",
        }}
      >
        {treeLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 2,
              background:
                theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff",
            }}
          >
            <TreeSkeleton />
          </Box>
        )}

        {/* 👇 Added Reset View Button */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 100,
          }}
        >
          <Tooltip title="Reset View">
            <IconButton
              onClick={handleResetView}
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 1,
                "&:hover": {
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                },
              }}
            >
              <ReplayIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            opacity: treeLoading ? 0 : 1,
            transition: "opacity 0.8s ease",
            height: "100%",
          }}
        >
          <FamilyTreeChart
            ref={chartRef}
            isAdmin={isAdmin}
            isMobile={isMobile}
            theme={theme}
            treeData={treeData}
            onNodeSelect={handleNodeSelect}
            onAddRelative={handleAddRelativeFromChart}
          />
        </Box>

        <FloatingQuickActions
          node={quickActionNode}
          isAdmin={isAdmin}
          onViewDetails={handleViewDetails}
          onTriggerAdd={handleTriggerAddFromPill}
          onDismiss={() => setQuickActionNode(null)}
        />

        <Fade in={!!inspectorNode} mountOnEnter unmountOnExit>
          <Box>
            <InspectorPanel
              node={inspectorNode}
              onClose={() => setInspectorNode(null)}
              isAdmin={isAdmin}
              familyId="demo-family"
              adminId="demo-admin"
              onEdit={() => setEditOpen(true)}
              onAddMemberClick={handleTriggerAddFromInspector}
            />
          </Box>
        </Fade>

        <EditMemberDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          node={inspectorNode}
          onSave={handleSaveEdit}
        />

        <AddMemberDialog
          open={addDialogOpen}
          onClose={() => {
            setAddDialogOpen(false);
            setTargetNodeForAdd(null);
            setAddSpecificRole(null);
          }}
          relativeNode={targetNodeForAdd || inspectorNode}
          relationType={addRelationType}
          specificRole={addSpecificRole}
          onAdd={handleAddMember}
        />
      </Box>
    </LocalizationProvider>
  );
}