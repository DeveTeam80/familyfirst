"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
// 👇 Import Redux hooks and selectors
import { useSelector } from "react-redux";
import {  selectCurrentUser,selectUserLoading } from "@/store/userSlice";
import { selectActiveFamilyId,selectIsAdminForActiveFamily } from "@/store/familySlice";
import {
  Box,
  IconButton,
  Fade,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  CircularProgress,
  Typography,
} from "@mui/material";
import { MdOutlineArrowBack } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useRouter } from "next/navigation";
import {
  TreeSkeleton,
  FamilyTreeChart,
  FloatingQuickActions,
  InspectorPanel,
  AddMemberDialog,
  EditMemberDialog,
} from "@/components/familytree";
import {
  FamilyTreeNode,
  FamilyTreeChartHandle,
  RelationType,
  UserAvatarDTO,
} from "@/components/familytree/types";

// Define the new member data type
interface NewMemberData {
  firstName: string;
  lastName?: string;
  gender?: string;
  birthday?: string;
  avatar?: string;
  deathDate?: string | null;
  weddingAnniversary?: string | null;
  relationType?: string;
  targetNodeId?: string;
  specificRole?: string;
}

export default function FamilyTreePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();

  const familyId = useSelector(selectActiveFamilyId);
  const isAuthLoading = useSelector(selectUserLoading);
  // Refs
  const chartRef = useRef<FamilyTreeChartHandle>(null);

  // ⭐ OPTIMIZED: Get Auth Data from Redux Instantly
  const isAdmin = useSelector(selectIsAdminForActiveFamily);
  const currentUser = useSelector(selectCurrentUser);
  const loggedInUserId = currentUser?.id || null;

  // Tree Data State
  const [treeData, setTreeData] = useState<FamilyTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);

  // Selection States
  const [quickActionNode, setQuickActionNode] = useState<FamilyTreeNode | null>(null);
  const [inspectorNode, setInspectorNode] = useState<FamilyTreeNode | null>(null);

  // Dialog States
  const [editOpen, setEditOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addRelationType, setAddRelationType] = useState<RelationType | null>(null);
  const [addSpecificRole, setAddSpecificRole] = useState<string | null>(null);
  const [targetNodeForAdd, setTargetNodeForAdd] = useState<FamilyTreeNode | null>(null);

  // UI State
  const [isAddMode, setIsAddMode] = useState(false);
  const [isAtDefaultView, setIsAtDefaultView] = useState(true);

  // 1. 🛡️ BLOCKING LOADER (Crucial Fix)
  // If we don't have a family ID yet, DO NOT render the main UI.
  // This prevents the Chart from crashing and prevents requests to "/null/"
  const isNotReady = isAuthLoading || !familyId || !loggedInUserId;

  const fetchTreeData = useCallback(async () => {
    // Double check inside the function just in case
    if (!familyId || !loggedInUserId) return;

    try {
      setTreeLoading(true);

      // Helper defined inside to ensure it uses the current familyId
      const fetchAvatars = async () => {
        const res = await fetch(`/api/users?familyId=${familyId}`);
        if (!res.ok) return new Map<string, string>();
        const json = await res.json();
        const map = new Map<string, string>();
        json.users?.forEach((u: UserAvatarDTO) => {
          if (u.id && u.avatarUrl) map.set(u.id, u.avatarUrl);
        });
        return map;
      };

      const [treeRes, userAvatarMap] = await Promise.all([
        fetch(`/api/family/${familyId}/tree`, { credentials: "include" }),
        fetchAvatars(),
      ]);

      if (!treeRes.ok) throw new Error("Tree fetch failed");

      const rawData: FamilyTreeNode[] = await treeRes.json();

      const normalized = rawData.map((node) => {
        const userAvatar = node.userId && userAvatarMap.get(node.userId);
        const finalAvatar = userAvatar || node.data.photoUrl || node.data.avatar;

        return {
          ...node,
          id: String(node.id),
          data: {
            ...node.data,
            avatar: finalAvatar,
            deathDate: node.data.deathDate,
            weddingAnniversary: node.data.weddingAnniversary,
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
    if (!isNotReady) {
      fetchTreeData();
    }
  }, [fetchTreeData, isNotReady]);


  // Handlers (Collapsed for brevity - keep your existing ones)
  const handleNodeSelect = useCallback((node: FamilyTreeNode) => {
    const freshNode = treeData.find((n) => n.id === node.id) || node;
    setQuickActionNode(freshNode);
    setInspectorNode(null);
    setIsAtDefaultView(false); 
  }, [treeData]);

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

  const handleResetView = () => {
    if (chartRef.current) {
      chartRef.current.cancelAddMode();
      chartRef.current.resetView();
    }
    setIsAddMode(false);
    setIsAtDefaultView(true);
  };

  const handleExitEditMode = () => {
    if (chartRef.current) {
      chartRef.current.cancelAddMode();
    }
    setIsAddMode(false);
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

  const handleSaveEdit = async (updatedNode: FamilyTreeNode) => {
    try {
      const payload = {
        firstName: updatedNode.data["first name"],
        lastName: updatedNode.data["last name"],
        gender: updatedNode.data.gender,
        birthday: updatedNode.data.birthday,
        avatar: updatedNode.data.avatar,
        deathDate: updatedNode.data.deathDate || null,
        weddingAnniversary: updatedNode.data.weddingAnniversary || null,
      };

      const res = await fetch(`/api/family/${familyId}/members/${updatedNode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");
      
      setTreeData((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
      setInspectorNode(updatedNode);
      await fetchTreeData();
    } catch (error) {
      console.error("Edit failed", error);
      alert("Failed to save.");
    }
  };

  const handleAddRelativeFromChart = useCallback(
    (parentId: string, type: RelationType, specificRole: string) => {
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

  const handleAddMember = async (newMemberData: NewMemberData) => {
    try {
      const res = await fetch(`/api/family/${familyId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create member");
      }

      const createdMember = await res.json();
      console.log("Member created:", createdMember);

      try {
        if (chartRef.current) {
          chartRef.current.cancelAddMode();
        }
      } catch (uiError) {
        console.warn("Ghost card cleanup failed", uiError);
      }

      await fetchTreeData();
    } catch (error) {
      console.error("❌ Error adding member:", error);
      alert("Failed to add member. Please try again.");
    }
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setTargetNodeForAdd(null);
    setAddSpecificRole(null);
    handleExitEditMode();
  };
if (isNotReady) {
    return (
      <Box sx={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: theme.palette.background.default }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Loading Family Data...</Typography>
      </Box>
    );
  }

  // Determine if back button should be disabled
  const isBackButtonDisabled = isAddMode || isAtDefaultView;

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
        {/* Loading Skeleton */}
        {treeLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 2,
              background: theme.palette.mode === "dark" ? "#1a1229" : "#faf8ff",
            }}
          >
            <TreeSkeleton />
          </Box>
        )}

        {/* Back Button */}
        <Box sx={{ position: "absolute", top: 20, left: 20, zIndex: 100 }}>
          <Tooltip title={isBackButtonDisabled ? "" : "Go Back"}>
            <span>
              <IconButton
                onClick={handleResetView}
                disabled={isBackButtonDisabled}
                sx={{
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 2,
                  opacity: isBackButtonDisabled ? 0.4 : 1,
                  cursor: isBackButtonDisabled ? "not-allowed" : "pointer",
                  "&:hover": {
                    bgcolor: isBackButtonDisabled
                      ? theme.palette.background.paper
                      : alpha(theme.palette.background.paper, 0.9),
                  },
                  "&.Mui-disabled": {
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.action.disabled,
                  },
                }}
              >
                <MdOutlineArrowBack />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Exit Edit Mode Button */}
        <Fade in={isAddMode}>
          <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
            <Tooltip title="Cancel Adding">
              <IconButton
                onClick={handleExitEditMode}
                color="error"
                sx={{
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.light, 0.1),
                  },
                }}
              >
                <RxCross2 size={24} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>

        {/* Family Tree Chart */}
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
            onAddModeChange={setIsAddMode}
          />
        </Box>

        {/* Floating Quick Actions */}
        <FloatingQuickActions
          node={quickActionNode}
          isAdmin={isAdmin}
          onViewDetails={handleViewDetails}
          onTriggerAdd={handleTriggerAddFromPill}
          onDismiss={() => setQuickActionNode(null)}
        />

        {/* Inspector Panel */}
        <Fade in={!!inspectorNode} mountOnEnter unmountOnExit>
          <Box>
            <InspectorPanel
              node={inspectorNode}
              onClose={() => setInspectorNode(null)}
              isAdmin={isAdmin}
              familyId={familyId || ""}
              adminId={loggedInUserId || ""}
              onEdit={() => setEditOpen(true)}
              onAddMemberClick={handleTriggerAddFromInspector}
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

        {/* Add Member Dialog */}
        <AddMemberDialog
          open={addDialogOpen}
          onClose={handleCloseAddDialog}
          relativeNode={targetNodeForAdd || inspectorNode}
          relationType={addRelationType}
          specificRole={addSpecificRole}
          onAdd={handleAddMember}
        />
      </Box>
    </LocalizationProvider>
  );
}