import React from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Slide,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FamilyTreeNode } from "./types";

interface FloatingQuickActionsProps {
  node: FamilyTreeNode | null;
  isAdmin: boolean;
  onViewDetails: () => void;
  onTriggerAdd: () => void;
  onDismiss: () => void;
}

export function FloatingQuickActions({
  node,
  isAdmin,
  onViewDetails,
  onTriggerAdd,
  onDismiss,
}: FloatingQuickActionsProps) {
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