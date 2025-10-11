"use client";
import { useDispatch, useSelector } from "react-redux";
import { addPost, likePost, addComment, deletePost, updatePost } from "@/store/postSlice";
import { RootState } from "@/store";
import * as React from "react";
import { Grid, Paper, Box, Container, Typography } from "@mui/material";

import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import CommentBox from "@/components/feed/CommentBox";
import ShareDialog from "@/components/dialogs/ShareDialog";
import EventDialog from "@/components/dialogs/EventDialog";
import DeleteDialog from "@/components/dialogs/DeleteDialog";
import EditPostDialog from "@/components/dialogs/EditPostDialog";

export default function Feed() {
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

  // Share dialog (local, reusable)
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
      } as any) // if your addPost payload type already allows eventDate, remove 'as any'
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
    <Container>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md:12 }}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
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
          </Paper>

          {/* Posts */}
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
                  dispatch(addComment({ postId: post.id, user: currentUserName, text: commentText.trim() }));
                  setCommentText("");
                  setActiveCommentPost(null);
                }}
              />
            </React.Fragment>
          ))}
        </Grid>
      </Grid>

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

      <DeleteDialog open={deleteOpen} onCancel={() => setDeleteOpen(false)} onConfirm={confirmDelete} />

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
