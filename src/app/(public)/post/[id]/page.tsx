// src/app/(public)/post/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Skeleton,
  Typography,
  Container,
  Dialog,
  IconButton,
  Button,
  Paper,
  alpha,
  useTheme,
  Avatar,
  Stack,
  Fade,
  Divider,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  Login as LoginIcon,
  ArrowBack,
  Public,
  Favorite,
} from "@mui/icons-material";
import PostCard, { PostCardData } from "@/components/feed/PostCard";
import { useRouter } from "next/navigation";
import Image from "next/image";

// --- Internal Types ---
interface PublicComment {
  id: string;
  user: string;
  userId?: string;
  avatar?: string;
  text: string;
  likes?: number;
  likedBy?: string[];
  createdAt?: string;
  replies?: PublicComment[];
}

interface PublicPost extends PostCardData {
  isPublicView?: boolean;

}

interface PageProps {
  params: Promise<{ id: string }>;
}

// --- Sub-Component: Premium Read-Only Comment Item (with proper nesting) ---
const PublicCommentItem = ({
  comment,
  depth = 0,
  isLast = false,
}: {
  comment: PublicComment;
  depth?: number;
  isLast?: boolean;
}) => {
  const theme = useTheme();
  const isReply = depth > 0;

  const bubbleColor =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, isReply ? 0.05 : 0.1)
      : isReply
        ? "#fafbfc"
        : alpha(theme.palette.grey[200], 0.6);

  const threadColor =
    theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";

  const avatarSize = isReply ? 24 : 32;
  const likeCount = comment.likes || 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Box sx={{ position: "relative", mb: isReply ? 1.5 : 2 }}>
      {/* Thread Lines for Replies */}
      {isReply && (
        <>
          <Box
            sx={{
              position: "absolute",
              left: -28,
              top: 0,
              height: isLast ? 20 : "100%",
              width: "2px",
              bgcolor: threadColor,
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: -28,
              top: 20,
              width: "28px",
              height: "2px",
              bgcolor: threadColor,
              zIndex: 0,
            }}
          />
        </>
      )}

      <Box
        sx={{
          display: "flex",
          gap: isReply ? 1 : 1.5,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Avatar
          src={comment.avatar}
          sx={{
            width: avatarSize,
            height: avatarSize,
            fontSize: isReply ? "0.65rem" : "0.85rem",
            bgcolor: theme.palette.primary.light,
            border: isReply
              ? `1.5px solid ${theme.palette.background.paper}`
              : `2px solid ${theme.palette.background.paper}`,
            flexShrink: 0,
            opacity: isReply ? 0.9 : 1,
          }}
        >
          {comment.user?.[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Bubble */}
          <Box
            sx={{
              bgcolor: bubbleColor,
              borderRadius: isReply ? "14px" : "18px",
              borderTopLeftRadius: 4,
              px: isReply ? 1.5 : 2,
              py: isReply ? 1 : 1.5,
              maxWidth: "100%",
              wordBreak: "break-word",
              border: isReply
                ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
                : "none",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: isReply ? "0.75rem" : "0.85rem",
                mb: 0.3,
                opacity: isReply ? 0.85 : 1,
              }}
            >
              {comment.user}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: isReply ? "0.8rem" : "0.9rem",
                color: "text.primary",
                lineHeight: 1.5,
                opacity: isReply ? 0.9 : 1,
              }}
            >
              {comment.text}
            </Typography>
          </Box>

          {/* Meta Data */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mt: 0.5, ml: 0.5 }}
          >
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontWeight: 500, fontSize: isReply ? "0.65rem" : "0.7rem" }}
            >
              {formatDate(comment.createdAt)}
            </Typography>

            {likeCount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.3,
                  bgcolor: alpha(theme.palette.action.active, 0.08),
                  borderRadius: "10px",
                  px: 0.6,
                  py: 0.2,
                }}
              >
                <Favorite sx={{ fontSize: "0.6rem", color: "text.secondary" }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.6rem",
                    color: "text.secondary",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {likeCount}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ pl: 7, mt: 1.5 }}>
          {comment.replies.map((reply, index) => (
            <PublicCommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              isLast={index === comment.replies!.length - 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// --- Main Page Component ---
export default function PublicPostPage({ params }: PageProps) {
  const theme = useTheme();
  const router = useRouter();
  const [postId, setPostId] = useState<string>("");
  const [post, setPost] = useState<PublicPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Unwrap params promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setPostId(resolvedParams.id);
    });
  }, [params]);

  // Fetch post data
  useEffect(() => {
    if (!postId) return;

    let mounted = true;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/posts/${postId}`);

        if (!res.ok) {
          if (res.status === 404) throw new Error("Post not found");
          if (res.status === 403) throw new Error("Private Post");
          if (res.status === 401) throw new Error("Authentication required");
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.error || `Failed to load post`);
        }

        const data = await res.json();

        if (!mounted) return;

        // ⭐ Data is already nested correctly from API
        const postData = data.post || data;

        const normalizedPost: PublicPost = {
          id: postData.id,
          userId: postData.userId || postData.authorId || "",
          user: postData.user || "Unknown User",
          avatar: postData.avatar,
          content: postData.content || "",
          date: postData.createdAt || new Date().toISOString(),
          createdAt: postData.createdAt,
          likes: postData.likes ?? 0,
          likedBy: Array.isArray(postData.likedBy) ? postData.likedBy : [],
          comments: Array.isArray(postData.comments) ? postData.comments : [],
          tags: Array.isArray(postData.tags) ? postData.tags : [],
          images: Array.isArray(postData.images)
            ? postData.images
            : postData.image
              ? [postData.image]
              : [],
          image: postData.image || null,
          eventDate: postData.eventDate,
          visibility: postData.visibility,
        };

        setPost(normalizedPost);
      } catch (err) {
        console.error("Failed to fetch post:", err);
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPost();

    return () => {
      mounted = false;
    };
  }, [postId]);

  // Handlers
  const handleLike = () => router.push(`/login?redirect=/post/${postId}`);
  const handleCommentClick = () => router.push(`/login?redirect=/post/${postId}`);

  const handleShare = () => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("✅ Link copied!"))
      .catch(() => prompt("Copy link:", url));
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const handlePrevImage = () => {
    if (!post?.images) return;
    setLightboxIndex((prev) => (prev === 0 ? post.images!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!post?.images) return;
    setLightboxIndex((prev) => (prev === post.images!.length - 1 ? 0 : prev + 1));
  };

  // Count total comments including replies
  const countTotalComments = (comments: PublicComment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countTotalComments(comment.replies) : 0);
    }, 0);
  };

  // --- Skeleton Loading State ---
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={200} height={30} />
        </Box>
        <Paper sx={{ p: 3, borderRadius: 4 }} elevation={0}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={80} />
            </Box>
          </Box>
          <Skeleton
            variant="rectangular"
            height={20}
            width="100%"
            sx={{ mb: 1, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={20}
            width="80%"
            sx={{ mb: 3, borderRadius: 1 }}
          />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
        </Paper>
      </Container>
    );
  }

  // --- Error State ---
  if (error || !post) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "background.paper",
            borderRadius: 4,
            boxShadow: theme.shadows[10],
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: "4rem", mb: 2 }}>
            🚫
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {error === "Private Post" || error === "Authentication required"
              ? "Private Content"
              : "Post Unavailable"}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error === "Private Post" || error === "Authentication required"
              ? "This post is visible to family members only."
              : "This post may have been removed or the link is broken."}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" onClick={() => router.push("/")}>
              Home
            </Button>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  const totalComments = countTotalComments(post.comments);

  return (
    <Fade in={true}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Top Nav */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3, color: "text.secondary", "&:hover": { color: "text.primary" } }}
        >
          Back
        </Button>

        {/* Premium Public Banner */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 2,
            pl: 3,
            borderRadius: 4,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.dark,
                  0.3
                )}, ${alpha(theme.palette.background.paper, 0.4)})`
                : `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.light,
                  0.1
                )}, #ffffff)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: "primary.main",
              }}
            >
              <Public />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Public View Mode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to interact with this post and view the full family tree.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={() => router.push(`/login?redirect=/post/${postId}`)}
            sx={{
              borderRadius: 3,
              px: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Sign In
          </Button>
        </Paper>

        {/* Main Post Card */}
        <PostCard
          post={post}
          onLike={handleLike}
          onCommentClick={handleCommentClick}
          onEdit={() => { }}
          onDelete={() => { }}
          onShare={handleShare}
          onImageClick={handleOpenLightbox}
          currentUserName=""
          currentUserId=""
          canEdit={false}
        />

        {/* Comments Section */}
        <Paper
          elevation={0}
          sx={{
            mt: -2,
            pt: 4,
            p: 3,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.3)
                : alpha(theme.palette.action.hover, 0.2),
            border: `1px solid ${theme.palette.divider}`,
            borderTop: "none",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
          >
            Comments
            {totalComments > 0 && (
              <Chip
                label={totalComments}
                size="small"
                color="primary"
                sx={{ height: 20, fontWeight: 700 }}
              />
            )}
          </Typography>

          {post.comments.length > 0 ? (
            <Box>
              {post.comments.map((comment, index) => (
                <PublicCommentItem
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  isLast={index === post.comments.length - 1}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4, opacity: 0.6 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic" }}
              >
                No comments yet. Be the first to comment!
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Button
            fullWidth
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={() => router.push(`/login?redirect=/post/${postId}`)}
            sx={{
              borderRadius: 3,
              py: 1.5,
              borderStyle: "dashed",
              fontWeight: 600,
            }}
          >
            Log in to join the conversation
          </Button>
        </Paper>

        {/* Premium Lightbox */}
        <Dialog
          open={lightboxOpen}
          onClose={handleCloseLightbox}
          maxWidth={false}
          PaperProps={{
            sx: {
              bgcolor: "rgba(0, 0, 0, 0.92)",
              boxShadow: "none",
              m: 0,
              width: "100vw",
              height: "100vh",
              borderRadius: 0,
              backdropFilter: "blur(10px)",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton
              onClick={handleCloseLightbox}
              sx={{
                position: "absolute",
                top: 24,
                right: 24,
                color: "white",
                bgcolor: "rgba(255, 255, 255, 0.1)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                zIndex: 10,
              }}
            >
              <CloseIcon />
            </IconButton>

            {post.images && post.images.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  sx={{
                    position: "absolute",
                    left: 24,
                    color: "white",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                    p: 1.5,
                  }}
                >
                  <ChevronLeft fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: "absolute",
                    right: 24,
                    color: "white",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" },
                    p: 1.5,
                  }}
                >
                  <ChevronRight fontSize="large" />
                </IconButton>
              </>
            )}

            {post.images && post.images[lightboxIndex] && (
              <Box
                sx={{
                  position: 'relative',
                  width: '95vw',
                  height: '90vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  src={post.images[lightboxIndex]}
                  alt={`Image ${lightboxIndex + 1}`}
                  fill
                  style={{
                    objectFit: "contain",
                    borderRadius: 8,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                  }}
                  sizes="95vw"
                />
              </Box>
            )}

            {post.images && post.images.length > 1 && (
              <Chip
                label={`${lightboxIndex + 1} / ${post.images.length}`}
                sx={{
                  position: "absolute",
                  bottom: 30,
                  bgcolor: "rgba(255,255,255,0.1)",
                  color: "white",
                  backdropFilter: "blur(4px)",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        </Dialog>
      </Container>
    </Fade>
  );
}
