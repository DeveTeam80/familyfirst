"use client";

import * as React from "react";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  ThumbUp,
  Comment as CommentIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

export type Comment = { id: string; user: string; text: string };

export type PostCardData = {
  id: string;
  user: string;
  avatar?: string;
  content?: string;
  image?: string | null;
  tags: string[];
  date: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  eventDate?: string;
};

type Props = {
  post: PostCardData;
  onLike: (postId: string) => void;
  onCommentClick: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
  currentUserName: string;
  canEdit?: boolean; // 👈 shows kebab menu only if true
};

export default function PostCard({
  post,
  onLike,
  onCommentClick,
  onEdit,
  onDelete,
  onShare,
  currentUserName,
  canEdit = true,
}: Props) {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        // backgroundColor: (theme) => theme.palette.background.paper,
        // color: (theme) => theme.palette.text.primary,
      }}
    >
      {/* ---------- Header Section ---------- */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={post.avatar} alt={post.user} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {post.user}
            </Typography>
            {post.date && (
              <Typography variant="caption" color="text.secondary">
                {post.date}
              </Typography>
            )}
          </Box>
        </Box>

        {canEdit && (
          <IconButton
            aria-label="post options"
            onClick={handleMenuOpen}
            size="small"
          >
            <MoreVert />
          </IconButton>
        )}
      </Box>

      {/* ---------- Post Options Menu ---------- */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onEdit(post.id);
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleMenuClose();
            onDelete(post.id);
          }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* ---------- Content Section ---------- */}
      {post.content && (
        <Typography variant="body1" sx={{ my: 1.5 }}>
          {post.content}
        </Typography>
      )}

      {post.image && (
        <Box mt={1.5}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt="Post"
            style={{
              width: "100%",
              borderRadius: 12,
              objectFit: "cover",
            }}
          />
        </Box>
      )}

      {post.eventDate && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, fontStyle: "italic" }}
        >
          📅 Event Date: {new Date(post.eventDate).toLocaleDateString()}
        </Typography>
      )}

      {/* ---------- Tags ---------- */}
      {post.tags && post.tags.length > 0 && (
        <Stack direction="row" spacing={1} mt={1} mb={1}>
          {post.tags.map((tag) => (
            <Chip key={tag} label={tag} variant="outlined" size="small" />
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 1 }} />

      {/* ---------- Action Buttons ---------- */}
      <Stack direction="row" spacing={2}>
        <Button
          size="small"
          startIcon={
            <ThumbUp
              color={
                post.likedBy.includes(currentUserName) ? "primary" : "inherit"
              }
            />
          }
          onClick={() => onLike(post.id)}
        >
          {post.likes > 0 ? `Like (${post.likes})` : "Like"}
        </Button>

        <Button
          size="small"
          startIcon={<CommentIcon />}
          onClick={() => onCommentClick(post.id)}
        >
          Comment ({post.comments.length})
        </Button>

        <Button size="small" startIcon={<ShareIcon />} onClick={() => onShare(post.id)}>
          Share
        </Button>
      </Stack>
    </Paper>
  );
}
