"use client";

import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setPosts } from "@/store/postSlice";
import { updateProfile } from "@/store/userSlice";

import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import * as React from "react";

import PostCard from "@/components/feed/PostCard";
import CommentBox from "@/components/feed/CommentBox";
import ShareDialog from "@/components/dialogs/ShareDialog";
import EditPostDialog from "@/components/dialogs/EditPostDialog";
import DeleteDialog from "@/components/dialogs/DeleteDialog";
import EditProfileDialog from "@/components/dialogs/EditProfileDialog";
import {
  fetchPosts,
  toggleLike,
  addCommentApi,
  updatePostApi,
  deletePostApi,
} from "@/lib/api-posts";

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const dispatch = useDispatch();

  const currentUser = useSelector((s: RootState) => s.user.currentUser);
  const profiles = useSelector((s: RootState) => s.user.profiles);

  // 🔹 IMPORTANT: items = { posts: [...], pagination: {...} }
  const postsState = useSelector((s: RootState) => s.posts.items);

  // 🔹 Normalize to a plain posts array
  const allPosts = React.useMemo(() => {
    if (!postsState) return [];
    if (Array.isArray(postsState)) return postsState as any[];
    if (Array.isArray((postsState as any).posts)) {
      return (postsState as any).posts as any[];
    }
    return [];
  }, [postsState]);

  const profile =
    profiles[username] ||
    (currentUser?.username === username ? currentUser : null);

  console.log("user dets", currentUser);
  console.log("allPosts (normalized):", allPosts);

  // ---- load posts -------------------------------------------------
  const loadPosts = React.useCallback(async () => {
    try {
      const postsData = await fetchPosts(); // returns { posts, pagination }
      dispatch(setPosts(postsData));
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  }, [dispatch]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const isOwner = !!currentUser && currentUser.username === username;
  const currentUserName = currentUser?.name || "User";
  const currentAvatar = currentUser?.avatar || undefined;

  // posts for this profile (uses normalized array)
  const userPosts = React.useMemo(
    () =>
      allPosts.filter((p: any) => {
        if (p.username === username) return true;
        if (profile?.name && p.user === profile.name) return true;
        return false;
      }),
    [allPosts, username, profile?.name]
  );

  const [tab, setTab] = React.useState(0);

  // Comments
  const [activeCommentPost, setActiveCommentPost] =
    React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState("");

  // Share
  const [shareOpen, setShareOpen] = React.useState(false);
  const [sharePostId, setSharePostId] = React.useState<string | undefined>();
  const sharePost = allPosts.find((p: any) => p.id === sharePostId);

  // Edit Post
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTargetId, setEditTargetId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [editImages, setEditImages] = React.useState<string[]>([]);
  const currentEditPost =
    allPosts.find((p: any) => p.id === editTargetId) || null;

  // Delete Post
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] =
    React.useState<string | null>(null);

  // Edit Profile
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatar, setAvatar] =
    React.useState<string | null | undefined>(undefined);

  // sync name/bio when profile changes
  React.useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // ---- post interactions ------------------------------------------
  const onLike = async (postId: string) => {
    try {
      await toggleLike(postId);
      await loadPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const onCommentClick = (postId: string) => setActiveCommentPost(postId);

  const onSubmitComment = async (postId: string) => {
    if (!commentText.trim()) return;

    try {
      await addCommentApi(postId, commentText.trim());
      await loadPosts();

      setCommentText("");
      setActiveCommentPost(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  const onShare = (postId: string) => {
    setSharePostId(postId);
    setShareOpen(true);
  };

  const startEditFor = (postId: string) => {
    if (!isOwner) return;
    const p: any = allPosts.find((x: any) => x.id === postId);
    if (!p) return;

    setEditTargetId(postId);
    setEditContent(p.content ?? "");
    setEditTags([...p.tags]);

    if (p.images && p.images.length > 0) {
      setEditImages(p.images);
    } else if (p.image) {
      setEditImages([p.image]);
    } else {
      setEditImages([]);
    }

    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editTargetId) return;

    try {
      await updatePostApi(editTargetId, {
        content: editContent.trim(),
        tags: editTags,
        imageUrls: editImages,
      });

      await loadPosts();

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
    if (!isOwner) return;
    setDeleteTargetId(postId);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await deletePostApi(deleteTargetId);
      await loadPosts();

      setDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const openEditProfile = () => {
    if (!profile) return;
    setName(profile.name || "");
    setBio(profile.bio || "");
    setAvatar(undefined);
    setEditProfileOpen(true);
  };

  // 🔹 UPDATED: send userId in payload using currentUser / profile
  const saveProfile = async (changes: {
    name?: string;
    bio?: string;
    avatar?: string | null;
    location?: string;
  }) => {
    try {
      const userId = currentUser?.id || (profile as any)?.id;

      if (!userId) {
        console.error("No userId found for profile update");
        alert("You must be logged in to update your profile.");
        return;
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId, // ⬅ required by backend
          name: changes.name,
          bio: changes.bio,
          location: changes.location,
          avatarUrl: changes.avatar ?? undefined,
        }),
      });

      if (!res.ok) {
        console.error("Failed to update profile:", await res.text());
        alert("Failed to update profile. Please try again.");
        return;
      }

      const { user: updatedUser } = await res.json();

      // Update Redux
      dispatch(
        updateProfile({
          username, // route param
          changes: {
            id: updatedUser.id,
            name: updatedUser.name,
            bio: updatedUser.bio,
            avatar: updatedUser.avatarUrl,
            location: updatedUser.location,
          },
        })
      );

      setEditProfileOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Something went wrong while updating your profile.");
    }
  };

  // ---- comment handlers -------------------------------------------
  const handleLikeComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
      await loadPosts();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    try {
      await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
      await loadPosts();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      await loadPosts();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleReplyComment = async (commentId: string, text: string) => {
    try {
      const post = allPosts.find((p: any) =>
        p.comments.some((c: any) => c.id === commentId)
      );

      if (!post) return;

      await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentId: commentId }),
      });
      await loadPosts();
    } catch (error) {
      console.error("Error replying to comment:", error);
    }
  };

  // ---- render -----------------------------------------------------

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">User not found</Typography>
        <Typography variant="body2" color="text.secondary">
          The profile @{username} doesn&apos;t exist.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
          gap: 3,
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <Avatar
            src={profile.avatar || undefined}
            alt={profile.name}
            sx={{ width: 140, height: 140 }}
          />
        </Box>

        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 1 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              @{profile.username}
            </Typography>

            {isOwner ? (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={openEditProfile}>
                  Edit Profile
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small">
                  Message
                </Button>
              </Stack>
            )}
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {profile.name}
          </Typography>
          {profile.location && (
            <Typography variant="body2" color="text.secondary">
              {profile.location}
            </Typography>
          )}
          {profile.bio && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {profile.bio}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Posts Tab */}
      {tab === 0 && (
        <Stack spacing={2}>
          {userPosts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No posts yet.
            </Typography>
          ) : (
            userPosts.map((post: any) => (
              <React.Fragment key={post.id}>
                <PostCard
                  currentUserId={currentUser?.id ?? ""}
                  post={post}
                  currentUserName={currentUserName}
                  onLike={onLike}
                  onCommentClick={onCommentClick}
                  onEdit={startEditFor}
                  onDelete={askDeleteFor}
                  onShare={onShare}
                  canEdit={isOwner}
                  commentsOpen={activeCommentPost === post.id}
                  commentSection={
                    <CommentBox
                      openForPostId={activeCommentPost}
                      postId={post.id}
                      comments={post.comments}
                      value={commentText}
                      setValue={setCommentText}
                      onSubmit={() => onSubmitComment(post.id)}
                      currentUserId={currentUser?.id}
                      currentUserAvatar={currentAvatar}
                      onLikeComment={handleLikeComment}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onReplyComment={handleReplyComment}
                    />
                  }
                />
              </React.Fragment>
            ))
          )}
        </Stack>
      )}

      {/* Dialogs */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        user={sharePost?.user}
        content={sharePost?.content}
        tags={sharePost?.tags}
        postId={sharePost?.id}
      />

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

      <DeleteDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

      <EditProfileDialog
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onSave={saveProfile}
        name={name}
        setName={setName}
        bio={bio}
        setBio={setBio}
        avatar={avatar}
        setAvatar={setAvatar}
        currentAvatar={profile.avatar}
      />
    </Box>
  );
}
