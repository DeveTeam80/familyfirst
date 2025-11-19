// src/app/(app)/tree/page.tsx
"use client";

import React from "react";
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
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { familyTreeData } from "@/data/familyTree";

class FamilyTreeChart extends React.Component<{
  isAdmin: boolean;
  isMobile: boolean;
  theme: any;
  onNodeClick?: (node: any) => void;
}> {
  cont = React.createRef<HTMLDivElement>();
  f3ChartInstance: any = null;

  componentDidMount() {
    this.loadFamilyChart();
  }

  componentDidUpdate(prevProps: any) {
    // Rebuild chart when mode or screen size changes
    if (
      prevProps.isAdmin !== this.props.isAdmin ||
      prevProps.isMobile !== this.props.isMobile
    ) {
      this.loadFamilyChart();
    }
  }

  // helper: try to get node id from a DOM element by checking a few common attributes
  getNodeIdFromElement(el: HTMLElement): string | null {
    const attrCandidates = [
      "data-id",
      "data-nodeid",
      "data-node-id",
      "data-person-id",
      "data-person",
      "data-personid",
      "id",
    ];

    for (const a of attrCandidates) {
      const v = el.getAttribute?.(a);
      if (v) return v;
    }

    // sometimes node id is stored on parent elements
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      for (const a of attrCandidates) {
        const v = parent.getAttribute?.(a);
        if (v) return v;
      }
      parent = parent.parentElement;
      depth++;
    }

    // last-resort: attempt to parse from inner text (not ideal but fallback)
    const nameText = el.innerText?.trim();
    if (nameText) return nameText.split("\n")[0]; // return first line
    return null;
  }

  async loadFamilyChart() {
    if (!this.cont.current) return;

    try {
      // Clear previous chart DOM
      this.cont.current.innerHTML = "";

      // dynamic import of library + css
      const f3Module = await import("family-chart");
      // await import("family-chart/dist/styles/family-chart.css");
      const f3 = f3Module.default || f3Module;

      const data = familyTreeData;
      this.createChart(f3, data);
    } catch (error) {
      // show nice console message
      console.error("Error loading family chart:", error);
    }
  }

  createChart(f3: any, data: any[]) {
    const { isAdmin, isMobile } = this.props;

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

    // ⭐ IMPROVED CLICK HANDLER — logs FULL REAL NODE DATA
    try {
      f3Card.setOnCardClick((node: any) => {
        console.log("RAW NODE FROM F3:", node);

        // node.id exists? If not, try fallback resolution
        const nodeId = node?.id;
        const realNode = this.f3ChartInstance?.getNode?.(nodeId) || node; // fallback to whatever f3 gave

        console.log("FULL NODE OBJECT:", realNode);

        this.props.onNodeClick?.(realNode);
      });
    } catch (err) {
      console.warn("setOnCardClick is not supported", err);
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
    this.f3ChartInstance = f3Chart;
  }

  render() {
    const { theme } = this.props;
    const bgColor = theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff";
    const textColor = theme.palette.mode === "dark" ? "#fff" : "#333";

    return (
      <div
        className="f3 f3-cont"
        id="FamilyChart"
        ref={this.cont}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: bgColor,
          color: textColor,
        }}
      />
    );
  }
}

/* -----------------------
   Invite Dialog Component
   ----------------------- */
function InviteDialog({
  open,
  onClose,
  node,
  adminId,
}: {
  open: boolean;
  onClose: () => void;
  node: any;
  adminId?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    if (node) {
      // if node has dataset/email suggestion, prefill maybe
      if (node?.dataset?.email) setEmail(node.dataset.email);
      else if (node?.displayName) {
        // optionally infer email (not safe) — we leave blank
      }
    }
  }, [node]);

  const handleSendInvite = async () => {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          treeNodeId: "keith_issac",
          familyId: "demo-family", // TEMP FIX
          invitedBy: "demo-admin", // TEMP FIX
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.error || `Failed to send invite (status ${res.status})`);
      } else {
        setMsg("Invite sent successfully!");
      }
    } catch (err) {
      console.error(err);
      setMsg("Unexpected error while sending invite");
    }

    setLoading(false);
  };

  if (!node) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Invite {node?.displayName ?? node?.id}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter their email to send a registration link.
        </Typography>

        <TextField
          label="Email"
          fullWidth
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {msg && (
          <Typography
            variant="body2"
            sx={{ mt: 2 }}
            color={msg.includes("success") ? "green" : "error"}
          >
            {msg}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={loading || !email}
          onClick={handleSendInvite}
        >
          {loading ? "Sending..." : "Send Invite"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* -----------------------
   Parent Page Component
   ----------------------- */
export default function FamilyTreePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isAdmin, setIsAdmin] = React.useState(true);
  const [selectedNode, setSelectedNode] = React.useState<any>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const handleAdminToggle = () => {
    setIsAdmin((prev) => !prev);
  };

  const handleNodeClick = (node: any) => {
    // Node clicked from chart — open invite dialog for admins
    setSelectedNode(node);
    setInviteOpen(true);
  };

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", pb: 4 }}>
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
              <Switch
                checked={isAdmin}
                onChange={handleAdminToggle}
                color="primary"
              />
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
          {/* Male */}
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

          {/* Female */}
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

          {/* Admin Only */}
          {isAdmin && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EditIcon
                  sx={{ fontSize: 16, color: theme.palette.warning.main }}
                />
                <Typography variant="caption">
                  Click card to edit (Admin)
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AddIcon
                  sx={{ fontSize: 16, color: theme.palette.success.main }}
                />
                <Typography variant="caption">
                  Click + to add member (Admin)
                </Typography>
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
          height: isMobile ? "600px" : "600px",
        }}
      >
        <FamilyTreeChart
          isAdmin={isAdmin}
          isMobile={isMobile}
          theme={theme}
          onNodeClick={handleNodeClick}
        />
      </Paper>

      {/* How to Use / Stats — omitted here for brevity, keep your existing content */}

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        node={selectedNode}
        adminId={"CURRENT_ADMIN_ID"}
      />
    </Box>
  );
}
