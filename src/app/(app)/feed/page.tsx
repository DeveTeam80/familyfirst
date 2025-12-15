// src/app/(app)/feed/page.tsx
"use client";

import { useDispatch, useSelector } from "react-redux";
import { addPost, setPosts, appendPosts, likePost, Post as StorePost } from "@/store/postSlice";
import { RootState } from "@/store";
import * as React from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Skeleton,
  Stack,
  CircularProgress,
  Button,
  Fade,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import { KeyboardArrowUp, Refresh as RefreshIcon } from "@mui/icons-material";
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useSearchParams, useRouter } from "next/navigation";

// Import notification emitter
import { notificationEmitter } from "../layout";

import PostComposer from "@/components/feed/PostComposer";
import PostCard, { PostCardData, Comment as PostComment } from "@/components/feed/PostCard";
import CommentBox from "@/components/feed/CommentBox";
import ShareDialog from "@/components/dialogs/ShareDialog";
import EventDialog from "@/components/dialogs/EventDialog";
import DeleteDialog from "@/components/dialogs/DeleteDialog";
import EditPostDialog from "@/components/dialogs/EditPostDialog";
import ImageLightbox from "@/components/feed/ImageLightbox";
import PostModal from "@/components/feed/PostModal";
import imageCompression from "browser-image-compression";

// Import API helpers
import {
  createPost,
  fetchPosts,
  toggleLike,
  addCommentApi,
  updatePostApi,
  deletePostApi,
} from "@/lib/api-posts";

type Post = StorePost;

/* ---------------- Loading skeleton ---------------- */
function PostCardSkeleton() {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.6),
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ p: 3, pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Skeleton variant="circular" width={44} height={44} />
            <Box>
              <Skeleton width={120} height={20} sx={{ mb: 0.5 }} />
              <Skeleton width={80} height={14} />
            </Box>
          </Box>
          <Skeleton variant="circular" width={32} height={32} />
        </Box>

        <Skeleton width="90%" height={16} sx={{ mb: 1 }} />
        <Skeleton width="75%" height={16} sx={{ mb: 2 }} />

        <Stack direction="row" spacing={1} mb={2}>
          <Skeleton width={60} height={24} sx={{ borderRadius: 2 }} />
          <Skeleton width={80} height={24} sx={{ borderRadius: 2 }} />
        </Stack>

        <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 4, mb: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
          <Skeleton width={100} height={16} />
          <Skeleton width={80} height={16} />
        </Box>

        <Stack direction="row" spacing={1} justifyContent="space-around" sx={{ mt: 2 }}>
          <Skeleton width="30%" height={40} sx={{ borderRadius: 2 }} />
          <Skeleton width="30%" height={40} sx={{ borderRadius: 2 }} />
          <Skeleton width="30%" height={40} sx={{ borderRadius: 2 }} />
        </Stack>
      </Box>
    </Paper>
  );
}

/* ---------------- Mapping helper ---------------- */
function mapPostToCardData(post: Post): PostCardData {
  return {
    id: post.id,
    userId: post.userId,
    user: post.user || "Unknown User",
    username: post.username,
    avatar: post.avatar,
    content: post.content,
    image: post.image ?? undefined,
    images: post.images,
    tags: post.tags || [],
    date: post.date || post.createdAt || new Date().toISOString(),
    likes: post.likes || 0,
    likedBy: post.likedBy || [],
    comments: post.comments || [],
    eventDate: post.eventDate,
    createdAt: post.createdAt,
    visibility: post.visibility || "FAMILY",
  };
}

/* ---------------- Feed Component ---------------- */
export default function Feed() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentUser = useSelector((s: RootState) => s.user.currentUser);
  const postsFromStore = useSelector((s: RootState) => s.posts.items);

  // Normalize posts state to always be an array.
  const postsArr = React.useMemo<Post[]>(() => {
    if (!postsFromStore) return [];
    if (Array.isArray(postsFromStore)) return postsFromStore as Post[];
    if (Array.isArray((postsFromStore as Record<string, unknown>).posts)) {
      return (postsFromStore as { posts: Post[] }).posts;
    }
    return [];
  }, [postsFromStore]);

  // Pagination & Loading states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isLoadingComments, setIsLoadingComments] = React.useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Modal state for viewing specific post
  const [modalPostId, setModalPostId] = React.useState<string | null>(null);
  const [showNotFoundSnackbar, setShowNotFoundSnackbar] = React.useState(false);

  // Image Lightbox state
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxImages, setLightboxImages] = React.useState<string[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = React.useState(0);

  // Refs
  const observerTarget = React.useRef<HTMLDivElement | null>(null);
  const postRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  // Composer state
  const [content, setContent] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);

  // Event dialog
  const [openEventDialog, setOpenEventDialog] = React.useState(false);
  const [eventTitle, setEventTitle] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");

  // Comments
  const [activeCommentPost, setActiveCommentPost] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState("");

  // Share dialog
  const [shareOpen, setShareOpen] = React.useState(false);
  const [sharePostId, setSharePostId] = React.useState<string | undefined>();
  const sharePost = postsArr.find((p) => p.id === sharePostId);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTargetId, setEditTargetId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [editImages, setEditImages] = React.useState<string[]>([]);

  const currentUserName = currentUser?.name || "User";
  const currentUserId = currentUser?.id || "";
  const currentAvatar = currentUser?.avatar || undefined;

  /* ---------------- Data loading + handlers ---------------- */

  const loadInitialPosts = React.useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      const data = await fetchPosts(1, 5);
      dispatch(setPosts(data.posts));
      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [dispatch]);

  const loadMorePosts = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const data = await fetchPosts(nextPage, 5);

      dispatch(appendPosts(data.posts));
      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [dispatch, currentPage, hasMore, isLoadingMore]);

  // Pull-to-refresh handler
  const handleRefresh = React.useCallback(async () => {
    try {
      const data = await fetchPosts(1, 5);
      dispatch(setPosts(data.posts));
      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentPage(1);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error refreshing posts:", error);
    }
  }, [dispatch]);

  // Handle notification click from URL or callback
  const handleNotificationPostOpen = React.useCallback((postId: string) => {
    const post = postsArr.find(p => p.id === postId);
    
    if (post) {
      // Post found in feed - check if it's visible on screen
      const postElement = postRefs.current.get(postId);
      
      if (postElement) {
        // Scroll to the post smoothly
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the post briefly
        postElement.style.transition = 'all 0.3s';
        postElement.style.transform = 'scale(1.02)';
        postElement.style.boxShadow = `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`;
        
        setTimeout(() => {
          postElement.style.transform = '';
          postElement.style.boxShadow = '';
        }, 2000);
      } else {
        // Post exists but not rendered - open modal
        setModalPostId(postId);
      }
    } else {
      // Post not found in current feed - open modal (will try to load)
      setModalPostId(postId);
    }
  }, [postsArr, theme.palette.primary.main]);

  // Check URL for postId param on mount
  React.useEffect(() => {
    const postIdFromUrl = searchParams.get('postId');
    if (postIdFromUrl && !isLoadingPosts) {
      handleNotificationPostOpen(postIdFromUrl);
      // Clean up URL
      router.replace('/feed', { scroll: false });
    }
  }, [searchParams, isLoadingPosts, handleNotificationPostOpen, router]);

 // Listen for notification clicks
React.useEffect(() => {
  const unsubscribe = notificationEmitter.subscribe((postId: string) => {
    console.log("🎯 Feed received notification for post:", postId);
    handleNotificationPostOpen(postId);
  });
  // RIGHT: Wrap it in a proper cleanup function
  return () => {
    unsubscribe();
  };
}, [handleNotificationPostOpen]);

  React.useEffect(() => {
    loadInitialPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingPosts) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    const el = observerTarget.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoadingMore, isLoadingPosts, loadMorePosts]);

  // Show scroll to top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Handlers */

  const handlePost = async () => {
    if (!content.trim() && selectedImages.length === 0) return;

    try {
      const imageUrls: string[] = [];

      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const selectedImage = selectedImages[i];
          const blob = await fetch(selectedImage).then((r) => r.blob());

          let fileToUpload: Blob = blob;
          if (blob.size > 8 * 1024 * 1024) {
            const file = new File([blob], "upload.jpg", { type: blob.type });
            const options = {
              maxSizeMB: 8,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: blob.type as string,
            };
            const compressedBlob = await imageCompression(file, options);
            fileToUpload = compressedBlob;
          }

          const formData = new FormData();
          formData.append("file", fileToUpload);
          formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
          );

          if (!response.ok) throw new Error(`Cloudinary upload failed`);
          const data = await response.json();
          imageUrls.push(data.secure_url);
        }
      }

      const newPost = await createPost({
        content,
        tags: selectedTags,
        imageUrls,
      });

      dispatch(addPost(newPost));

      setContent("");
      setSelectedTags([]);
      setSelectedImages([]);
    } catch (error) {
      console.error("❌ Error creating post:", error);
      alert(`Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleAddEventPost = async () => {
    if (!eventTitle || !eventDate) return;

    try {
      const newPost = await createPost({
        content: `📅 Event: ${eventTitle}`,
        tags: ["Event"],
        eventDate,
      });

      dispatch(addPost(newPost));
      setOpenEventDialog(false);
      setEventTitle("");
      setEventDate("");
    } catch (error) {
      console.error("Error creating event post:", error);
      alert("Failed to create event");
    }
  };

  const startEditFor = (postId: string) => {
    const post = postsArr.find((x) => x.id === postId);
    if (!post || post.userId !== currentUserId) return;

    setEditTargetId(postId);
    setEditContent(post.content ?? "");
    setEditTags([...post.tags]);
    setEditImages(post.images ? post.images : post.image ? [post.image] : []);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editTargetId) return;

    try {
      const imageUrls: string[] = [];
      const newImages = editImages.filter((img) => img.startsWith("data:"));
      const existingImages = editImages.filter((img) => !img.startsWith("data:"));

      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const imageDataUrl = newImages[i];
          const blob = await fetch(imageDataUrl).then((r) => r.blob());

          let fileToUpload: Blob = blob;
          if (blob.size > 8 * 1024 * 1024) {
            const file = new File([blob], "upload.jpg", { type: blob.type });
            const options = {
              maxSizeMB: 8,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: blob.type as string,
            };
            const compressedBlob = await imageCompression(file, options);
            fileToUpload = compressedBlob;
          }

          const formData = new FormData();
          formData.append("file", fileToUpload);
          formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
          );

          if (!response.ok) throw new Error(`Cloudinary upload failed`);
          const data = await response.json();
          imageUrls.push(data.secure_url);
        }
      }

      const finalImageUrls = [...existingImages, ...imageUrls];

      await updatePostApi(editTargetId, {
        content: editContent.trim(),
        tags: editTags,
        imageUrls: finalImageUrls,
      });

      await loadInitialPosts();

      setEditOpen(false);
      setEditTargetId(null);
      setEditContent("");
      setEditTags([]);
      setEditImages([]);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const askDeleteFor = (postId: string) => {
    const post = postsArr.find((p) => p.id === postId);
    if (!post || post.userId !== currentUserId) return;

    setDeleteTargetId(postId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await deletePostApi(deleteTargetId);
      await loadInitialPosts();

      setDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const onShare = (postId: string) => {
    setSharePostId(postId);
    setShareOpen(true);
  };

  const handleLike = async (postId: string) => {
    dispatch(likePost({ postId, username: currentUserId }));

    try {
      await toggleLike(postId);
    } catch (error) {
      console.error("Error toggling like:", error);
      dispatch(likePost({ postId, username: currentUserId }));
    }
  };

  const handleCommentClick = (postId: string) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(postId);
      setIsLoadingComments((prev) => ({ ...prev, [postId]: true }));

      setTimeout(() => {
        setIsLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }, 500);
    }
  };

  const handleComment = async (postId: string, text?: string) => {
    const textToSubmit = text || commentText.trim();
    if (!textToSubmit) return;

    const tempComment: PostComment = {
      id: `temp-${Date.now()}`,
      user: currentUserName,
      userId: currentUserId,
      avatar: currentAvatar,
      text: textToSubmit,
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: new Date().toISOString(),
    };

    dispatch(
      setPosts(
        postsArr.map((p) =>
          p.id === postId ? { ...p, comments: [...(p.comments || []), tempComment] } : p
        )
      )
    );

    if (!text) setCommentText("");

    try {
      const result = await addCommentApi(postId, textToSubmit);

      dispatch(
        setPosts(
          postsArr.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: (p.comments || []).map((c) => (c.id === tempComment.id ? result : c)),
                }
              : p
          )
        )
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      dispatch(
        setPosts(
          postsArr.map((p) =>
            p.id === postId
              ? { ...p, comments: (p.comments || []).filter((c) => c.id !== tempComment.id) }
              : p
          )
        )
      );
      alert("Failed to add comment");
      if (!text) setCommentText(textToSubmit);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const post = postsArr.find((p) =>
      (p.comments || []).some((c) => c.id === commentId || (c.replies || []).some((r) => r.id === commentId))
    );
    if (!post) return;

    const originalPosts = [...postsArr];

    const updateCommentLikes = (comments: PostComment[]): PostComment[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = (comment.likedBy || []).includes(currentUserId);
          return {
            ...comment,
            likes: isLiked ? (comment.likes || 0) - 1 : (comment.likes || 0) + 1,
            likedBy: isLiked ? (comment.likedBy || []).filter((id) => id !== currentUserId) : [...(comment.likedBy || []), currentUserId],
          };
        }

        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateCommentLikes(comment.replies) };
        }

        return comment;
      });
    };

    dispatch(
      setPosts(
        postsArr.map((p) => {
          if (p.id !== post.id) return p;
          return {
            ...p,
            comments: updateCommentLikes(p.comments || []),
          };
        })
      )
    );

    try {
      await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
    } catch (error) {
      console.error("Error liking comment:", error);
      dispatch(setPosts(originalPosts));
    }
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    const post = postsArr.find((p) =>
      (p.comments || []).some((c) => c.id === commentId || (c.replies || []).some((r) => r.id === commentId))
    );
    if (!post) return;

    const originalPosts = [...postsArr];

    const updateCommentText = (comments: PostComment[]): PostComment[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, text: newText };
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateCommentText(comment.replies) };
        }
        return comment;
      });
    };

    dispatch(
      setPosts(
        postsArr.map((p) => {
          if (p.id !== post.id) return p;
          return { ...p, comments: updateCommentText(p.comments || []) };
        })
      )
    );

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      dispatch(setPosts(originalPosts));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const post = postsArr.find((p) =>
      (p.comments || []).some((c) => c.id === commentId || (c.replies || []).some((r) => r.id === commentId))
    );
    if (!post) return;

    const originalPosts = [...postsArr];

    const deleteCommentRecursive = (comments: PostComment[]): PostComment[] => {
      return comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: deleteCommentRecursive(comment.replies) };
          }
          return comment;
        });
    };

    dispatch(
      setPosts(
        postsArr.map((p) => (p.id === post.id ? { ...p, comments: deleteCommentRecursive(p.comments || []) } : p))
      )
    );

    try {
      await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      dispatch(setPosts(originalPosts));
    }
  };

  const handleReplyComment = async (commentId: string, text: string) => {
    const post = postsArr.find((p) => (p.comments || []).some((c) => c.id === commentId));
    if (!post) return;

    const tempReply: PostComment = {
      id: `temp-reply-${Date.now()}`,
      user: currentUserName,
      userId: currentUserId,
      avatar: currentAvatar,
      text: text,
      likes: 0,
      likedBy: [],
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const originalPosts = [...postsArr];

    dispatch(
      setPosts(
        postsArr.map((p) => {
          if (p.id !== post.id) return p;
          return {
            ...p,
            comments: (p.comments || []).map((c) => (c.id === commentId ? { ...c, replies: [...(c.replies || []), tempReply] } : c)),
          };
        })
      )
    );

    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentId: commentId }),
      });
      await loadInitialPosts();
    } catch (error) {
      console.error("Error replying to comment:", error);
      dispatch(setPosts(originalPosts));
    }
  };

  // Image click handler - opens lightbox
  const handleImageClick = (postId: string, imageIndex: number) => {
    const post = postsArr.find((p) => p.id === postId);
    if (!post) return;

    const images = post.images || (post.image ? [post.image] : []);
    setLightboxImages(images);
    setLightboxInitialIndex(imageIndex);
    setLightboxOpen(true);
  };

  // Get post for modal
  const modalPost = modalPostId ? postsArr.find(p => p.id === modalPostId) : null;
  const modalPostData = modalPost ? mapPostToCardData(modalPost) : null;

  /* ---------------- Render ---------------- */

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, pt: 0, position: "relative" }}>
      {/* Pull-to-Refresh Wrapper */}
      <PullToRefresh
        onRefresh={handleRefresh}
        pullingContent=""
        refreshingContent={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
          </Box>
        }
        resistance={2}
        maxPullDownDistance={100}
      >
        <Box>
          {/* Post Composer */}
          <Box sx={{ mb: 3 }}>
            <PostComposer
              content={content}
              setContent={setContent}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              onOpenEvent={() => setOpenEventDialog(true)}
              onPost={handlePost}
            />
          </Box>

          {/* Manual Refresh Button (Desktop fallback) */}
          {!isMobile && (
            <Fade in={!isLoadingPosts}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  onClick={handleRefresh}
                  disabled={isLoadingPosts}
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderRadius: 20,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderStyle: 'dashed',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderStyle: 'solid',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Refresh Feed
                </Button>
              </Box>
            </Fade>
          )}

          {/* Posts Feed */}
          {isLoadingPosts ? (
            <Box>
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </Box>
          ) : postsArr.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                No posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Be the first to share something with your family! 🎉
              </Typography>
            </Paper>
          ) : (
            <>
              <Box>
                {postsArr.map((post: Post) => {
                  const postCardData = mapPostToCardData(post);

                  return (
                    <Box
                      key={post.id}
                      ref={(el: HTMLDivElement | null) => {
                        if (el) postRefs.current.set(post.id, el);
                        else postRefs.current.delete(post.id);
                      }}
                    >
                      <PostCard
                        post={postCardData}
                        currentUserName={currentUserName}
                        currentUserId={currentUserId}
                        onLike={handleLike}
                        onCommentClick={handleCommentClick}
                        onEdit={startEditFor}
                        onDelete={askDeleteFor}
                        onShare={onShare}
                        onImageClick={(index) => handleImageClick(post.id, index)}
                        canEdit={post.userId === currentUserId}
                        commentsOpen={activeCommentPost === post.id}
                        commentSection={
                          <CommentBox
                            openForPostId={activeCommentPost}
                            postId={post.id}
                            comments={post.comments}
                            value={commentText}
                            setValue={setCommentText}
                            onSubmit={() => handleComment(post.id)}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentAvatar}
                            onLikeComment={handleLikeComment}
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
                            onReplyComment={handleReplyComment}
                            isLoading={isLoadingComments[post.id] || false}
                          />
                        }
                      />
                    </Box>
                  );
                })}
              </Box>

              {/* Infinite Scroll Trigger */}
              <Box ref={observerTarget} sx={{ py: 2, textAlign: "center" }}>
                {isLoadingMore && (
                  <Stack spacing={2} alignItems="center">
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary">
                      Loading more posts...
                    </Typography>
                  </Stack>
                )}
                {!hasMore && postsArr.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    You&apos;ve reached the end!
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </PullToRefresh>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          sx={{
            position: "fixed",
            bottom: { xs: 16, md: 32 },
            right: { xs: 16, md: 32 },
            minWidth: { xs: 48, md: 56 },
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "white",
            boxShadow: 4,
            zIndex: 1000,
            "&:hover": {
              bgcolor: "primary.dark",
              transform: "translateY(-4px)",
              boxShadow: 6,
            },
            transition: "all 0.3s",
          }}
        >
          <KeyboardArrowUp />
        </Button>
      )}

      {/* Post Modal */}
      <PostModal
        post={modalPostData}
        open={!!modalPostId}
        onClose={() => setModalPostId(null)}
        currentUserName={currentUserName}
        currentUserId={currentUserId}
        currentAvatar={currentAvatar}
        onLike={handleLike}
        onEdit={startEditFor}
        onDelete={askDeleteFor}
        onShare={onShare}
        onImageClick={(index) => modalPostId && handleImageClick(modalPostId, index)}
        onComment={handleComment}
        onLikeComment={handleLikeComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onReplyComment={handleReplyComment}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxInitialIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Post Not Found Snackbar */}
      <Snackbar
        open={showNotFoundSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowNotFoundSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setShowNotFoundSnackbar(false)}>
          Post not found or has been deleted
        </Alert>
      </Snackbar>

      {/* Dialogs */}
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} user={sharePost?.user} content={sharePost?.content} tags={sharePost?.tags} postId={sharePost?.id} />

      <EventDialog
        open={openEventDialog}
        title={eventTitle}
        date={eventDate}
        setTitle={setEventTitle}
        setDate={setEventDate}
        onCancel={() => setOpenEventDialog(false)}
        onSubmit={handleAddEventPost}
      />

      <DeleteDialog open={deleteOpen} onCancel={() => setDeleteOpen(false)} onConfirm={confirmDelete} />

      <EditPostDialog
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditTargetId(null);
          setEditContent("");
          setEditTags([]);
          setEditImages([]);
        }}
        onSave={saveEdit}
        content={editContent}
        setContent={setEditContent}
        tags={editTags}
        setTags={setEditTags}
        images={editImages}
        setImages={setEditImages}
      />
    </Container>
  );
}