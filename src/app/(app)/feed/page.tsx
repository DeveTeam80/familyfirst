"use client";
import { useDispatch, useSelector } from "react-redux";
import { addPost, likePost, addComment, deletePost, updatePost } from "@/store/postSlice";
import { RootState } from "@/store";
import * as React from "react";
import { Container, Box, Typography, Paper, alpha, useTheme } from "@mui/material";

import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import CommentBox from "@/components/feed/CommentBox";
import ShareDialog from "@/components/dialogs/ShareDialog";
import EventDialog from "@/components/dialogs/EventDialog";
import DeleteDialog from "@/components/dialogs/DeleteDialog";
import EditPostDialog from "@/components/dialogs/EditPostDialog";

export default function Feed() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const posts = useSelector((s: RootState) => s.posts.items);

  // Composer state
  const [content, setContent] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

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
  const sharePost = posts.find((p) => p.id === sharePostId);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTargetId, setEditTargetId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [editTags, setEditTags] = React.useState<string[]>([]);
  const [editImage, setEditImage] = React.useState<string | null | undefined>(undefined);
  const currentEditPost = posts.find((p) => p.id === editTargetId) || null;

  const currentUserName = "John Doe";

  /* Handlers */

  const handlePost = () => {
    if (!content.trim() && !selectedImage) return;
    dispatch(
      addPost({
        user: currentUserName,
        avatar: "/avatar.png",
        content,
        tags: selectedTags,
        image: selectedImage || undefined,
      })
    );
    setContent("");
    setSelectedTags([]);
    setSelectedImage(null);
  };

  const handleAddEventPost = () => {
    if (!eventTitle || !eventDate) return;
    dispatch(
      addPost({
        user: currentUserName,
        avatar: "/avatar.png",
        content: `📅 Event: ${eventTitle}`,
        tags: ["Event"],
        eventDate,
      } as any)
    );
    setOpenEventDialog(false);
    setEventTitle("");
    setEventDate("");
  };

  const startEditFor = (postId: string) => {
    const p = posts.find((x) => x.id === postId);
    if (!p) return;
    setEditTargetId(postId);
    setEditContent(p.content ?? "");
    setEditTags([...p.tags]);
    setEditImage(undefined);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editTargetId) return;
    dispatch(
      updatePost({
        postId: editTargetId,
        content: editContent.trim(),
        tags: editTags,
        image: editImage,
      })
    );
    setEditOpen(false);
    setEditTargetId(null);
    setEditContent("");
    setEditTags([]);
    setEditImage(undefined);
  };

  const askDeleteFor = (postId: string) => {
    setDeleteTargetId(postId);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) dispatch(deletePost({ postId: deleteTargetId }));
    setDeleteOpen(false);
    setDeleteTargetId(null);
  };

  const onShare = (postId: string) => {
    setSharePostId(postId);
    setShareOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, pt:0 }}>
      {/* Welcome Header */}
      {/* <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Family Feed
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Share moments and stay connected with your family
        </Typography>
      </Box> */}

      {/* Post Composer */}
      <Box sx={{ mb: 3 }}>
        <PostComposer
          content={content}
          setContent={setContent}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          onOpenEvent={() => setOpenEventDialog(true)}
          onPost={handlePost}
        />
      </Box>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Typography 
            variant="h6" 
            color="text.secondary" 
            gutterBottom
            sx={{ mb: 1 }}
          >
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to share something with your family! 🎉
          </Typography>
        </Paper>
      ) : (
        <Box>
          {posts.map((post) => (
            <React.Fragment key={post.id}>
              <PostCard
                post={post}
                currentUserName={currentUserName}
                onLike={(id) => dispatch(likePost({ postId: id, user: currentUserName }))}
                onCommentClick={(id) => setActiveCommentPost(id)}
                onEdit={startEditFor}
                onDelete={askDeleteFor}
                onShare={onShare}
              />

              <CommentBox
                openForPostId={activeCommentPost}
                postId={post.id}
                comments={post.comments}
                value={commentText}
                setValue={setCommentText}
                onSubmit={() => {
                  if (commentText.trim()) {
                    dispatch(addComment({ postId: post.id, user: currentUserName, text: commentText.trim() }));
                    setCommentText("");
                    setActiveCommentPost(null);
                  }
                }}
              />
            </React.Fragment>
          ))}
        </Box>
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

      <EventDialog
        open={openEventDialog}
        title={eventTitle}
        date={eventDate}
        setTitle={setEventTitle}
        setDate={setEventDate}
        onCancel={() => setOpenEventDialog(false)}
        onSubmit={handleAddEventPost}
      />

      <DeleteDialog 
        open={deleteOpen} 
        onCancel={() => setDeleteOpen(false)} 
        onConfirm={confirmDelete} 
      />

      <EditPostDialog
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditTargetId(null);
          setEditContent("");
          setEditTags([]);
          setEditImage(undefined);
        }}
        onSave={saveEdit}
        content={editContent}
        setContent={setEditContent}
        tags={editTags}
        setTags={setEditTags}
        image={editImage}
        setImage={setEditImage}
        currentImage={currentEditPost?.image}
      />
    </Container>
  );
}