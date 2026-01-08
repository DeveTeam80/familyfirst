// src/components/feed/PostModal.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  useTheme,
  alpha,
  useMediaQuery,
  Slide,
  Fade,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import PostCard, { PostCardData } from "./PostCard";
import CommentBox from "./CommentBox";

// Slide up transition for mobile
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface PostModalProps {
  post: PostCardData | null;
  open: boolean;
  onClose: () => void;
  currentUserName: string;
  currentUserId: string;
  currentAvatar?: string;
  isAdmin?: boolean; // ✅ Added
  onLike: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (postId: string) => void;
  onImageClick?: (index: number) => void;
  onComment: (postId: string, text: string) => void;
  onLikeComment: (commentId: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReplyComment: (commentId: string, text: string) => void;
  onSaveToAlbum?: (photoIds: string[]) => void; // ✅ Added (optional, if you want save in modal)
}

export default function PostModal({
  post,
  open,
  onClose,
  currentUserName,
  currentUserId,
  currentAvatar,
  isAdmin = false, // ✅ Added with default
  onLike,
  onEdit,
  onDelete,
  onShare,
  onImageClick,
  onComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onReplyComment,
  onSaveToAlbum, // ✅ Added (optional)
}: PostModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [commentText, setCommentText] = React.useState("");
  const [commentsOpen, setCommentsOpen] = React.useState(true);

  if (!post) return null;

  const handleComment = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText("");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? SlideTransition : Fade}
      transitionDuration={isMobile ? 300 : 200}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? "100%" : "90vh",
          m: isMobile ? 0 : 2,
          bgcolor: "background.default",
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          bgcolor: alpha(theme.palette.common.black, 0.7),
          backdropFilter: "blur(8px)",
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: isMobile ? 8 : 16,
          right: isMobile ? 8 : 16,
          zIndex: 1,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: "blur(10px)",
          boxShadow: 2,
          "&:hover": {
            bgcolor: theme.palette.background.paper,
            transform: "scale(1.1)",
          },
          transition: "all 0.2s",
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent
        sx={{
          p: 0,
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme.palette.divider,
            borderRadius: "4px",
            "&:hover": {
              background: alpha(theme.palette.text.primary, 0.3),
            },
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            mx: "auto",
            px: isMobile ? 0 : 2,
            py: isMobile ? 2 : 3,
          }}
        >
          <PostCard
            post={post}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            isAdmin={isAdmin} // ✅ Pass isAdmin to PostCard
            onLike={onLike}
            onCommentClick={() => setCommentsOpen(!commentsOpen)}
            onEdit={onEdit}
            onDelete={onDelete}
            onShare={onShare}
            onImageClick={onImageClick}
            onSaveToAlbum={onSaveToAlbum} // ✅ Pass save handler if provided
            canEdit={post.userId === currentUserId}
            commentsOpen={commentsOpen}
            commentSection={
              <CommentBox
                openForPostId={post.id}
                postId={post.id}
                comments={post.comments}
                value={commentText}
                setValue={setCommentText}
                onSubmit={handleComment}
                currentUserId={currentUserId}
                currentUserAvatar={currentAvatar}
                onLikeComment={onLikeComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                onReplyComment={onReplyComment}
                isLoading={false}
              />
            }
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}