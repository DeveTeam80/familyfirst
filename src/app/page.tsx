"use client";
import { useDispatch, useSelector } from "react-redux";
import {
  addPost,
  likePost,
  addComment,
  openShareModal,
  closeShareModal,
  deletePost,
  updatePost,
} from "@/store/postSlice";
import { RootState } from "@/store";
import { useMemo, useState } from "react";
import {
  Grid,
  Paper,
  Box,
  Avatar,
  TextField,
  Stack,
  Chip,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Badge,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Image, Event, Tag, MoreVert, Delete, Edit } from "@mui/icons-material";
import {
  ThumbUp,
  Comment as CommentIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

export default function Feed() {
  const dispatch = useDispatch();
  const posts = useSelector((state: RootState) => state.posts.items);
  const selectedPost = useSelector((state: RootState) => state.posts.selectedPost);

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // For Add Photo
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // For Add Event
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Kebab menu per-post
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const openPostMenu = (e: React.MouseEvent<HTMLElement>, postId: string) => {
    setMenuAnchor(e.currentTarget);
    setMenuPostId(postId);
  };
  const closePostMenu = () => {
    setMenuAnchor(null);
    setMenuPostId(null);
  };

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const askDeleteFor = (postId: string) => {
    setDeleteTargetId(postId);
    setDeleteDialogOpen(true);
    closePostMenu();
  };
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };
  const confirmDelete = () => {
    if (deleteTargetId) dispatch(deletePost({ postId: deleteTargetId }));
    closeDeleteDialog();
  };

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editImage, setEditImage] = useState<string | null | undefined>(undefined); // undefined means untouched, null = remove, string = new URL

  const currentEditPost = useMemo(
    () => posts.find((p) => p.id === editTargetId) || null,
    [posts, editTargetId]
  );

  const startEditFor = (postId: string) => {
    const p = posts.find((x) => x.id === postId);
    if (!p) return;
    setEditTargetId(postId);
    setEditContent(p.content);
    setEditTags([...p.tags]);
    setEditImage(undefined); // default: do not change image unless user acts
    setEditDialogOpen(true);
    closePostMenu();
  };
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditTargetId(null);
    setEditContent("");
    setEditTags([]);
    setEditImage(undefined);
  };
  const saveEdit = () => {
    if (!editTargetId) return;
    dispatch(
      updatePost({
        postId: editTargetId,
        content: editContent.trim(),
        tags: editTags,
        image: editImage, // undefined = no change, null = remove, string = replace
      })
    );
    closeEditDialog();
  };

  // Tag popover for composer
  const handleTagMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
    setAnchorEl(null);
  };
  const handleTagDelete = (tag: string) =>
    setSelectedTags(selectedTags.filter((t) => t !== tag));

  const handlePost = () => {
    if (!content.trim() && !selectedImage) return;
    dispatch(
      addPost({
        user: "John Doe",
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
        user: "John Doe",
        avatar: "/avatar.png",
        content: `📅 Event: ${eventTitle}`,
        tags: ["Event"],
        eventDate,
      })
    );
    setOpenEventDialog(false);
    setEventTitle("");
    setEventDate("");
  };

  const contacts = [
    { name: "Alice", avatar: "/avatar4.png", online: true },
    { name: "Bob", avatar: "/avatar5.png", online: false },
    { name: "Charlie", avatar: "/avatar6.png", online: true },
  ];

  const upcomingEvents = [
    { title: "Family Reunion", date: "Oct 15, 2025" },
    { title: "Birthday Party", date: "Oct 20, 2025" },
  ];

  return (
    <Container>
      <Grid container spacing={3}>
        {/* Main Feed */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar alt="User" src="/avatar.png" />
              <TextField
                fullWidth
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Hidden Image Upload */}
            <input
              accept="image/*"
              type="file"
              id="photo-upload"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const imageUrl = URL.createObjectURL(file);
                  setSelectedImage(imageUrl);
                }
              }}
            />

            {/* Tag Chips */}
            {selectedTags.length > 0 && (
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                {selectedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleTagDelete(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}

            {/* Image Preview */}
            {selectedImage && (
              <Box mt={2}>
                <img
                  src={selectedImage}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: 300,
                    borderRadius: 12,
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}

            {/* Post Buttons */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={2}
            >
              <Stack direction="row" spacing={1}>
                <Button
                  variant="text"
                  startIcon={<Image />}
                  onClick={() => document.getElementById("photo-upload")?.click()}
                >
                  Add Photo
                </Button>

                <Button
                  variant="text"
                  startIcon={<Event />}
                  onClick={() => setOpenEventDialog(true)}
                >
                  Add Event
                </Button>

                <Button
                  variant="text"
                  startIcon={<Tag />}
                  onClick={handleTagMenuOpen}
                >
                  Add Tag
                </Button>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                  {["Conversation", "Event", "Giveaway", "Announcement"].map((tag) => (
                    <MenuItem key={tag} onClick={() => handleTagSelect(tag)}>
                      {tag}
                    </MenuItem>
                  ))}
                </Menu>
              </Stack>

              <Button variant="contained" sx={{ borderRadius: 3 }} onClick={handlePost}>
                Post
              </Button>
            </Box>
          </Paper>

          {/* Render Posts */}
          {posts.map((post) => (
            <Paper key={post.id} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
              {/* Header with kebab */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={post.avatar} />
                  <Box>
                    <Typography variant="subtitle2">{post.user}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {post.date}
                    </Typography>
                  </Box>
                </Box>

                <IconButton
                  aria-label="post options"
                  onClick={(e) => openPostMenu(e, post.id)}
                  size="small"
                >
                  <MoreVert />
                </IconButton>
              </Box>

              {/* Per-post menu */}
              <Menu
                anchorEl={menuAnchor}
                open={menuPostId === post.id}
                onClose={closePostMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => startEditFor(post.id)}>
                  <Edit fontSize="small" style={{ marginRight: 8 }} />
                  Edit
                </MenuItem>
                <MenuItem onClick={() => askDeleteFor(post.id)}>
                  <Delete fontSize="small" style={{ marginRight: 8 }} />
                  Delete
                </MenuItem>
              </Menu>

              <Typography variant="body1" my={1}>
                {post.content}
              </Typography>

              {post.image && (
                <Box mt={1}>
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
                  Event Date: {new Date(post.eventDate).toLocaleDateString()}
                </Typography>
              )}

              <Stack direction="row" spacing={1} mb={1} mt={1}>
                {post.tags.map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" size="small" />
                ))}
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" spacing={2}>
                <Button
                  size="small"
                  startIcon={
                    <ThumbUp
                      color={post.likedBy.includes("John Doe") ? "primary" : "inherit"}
                    />
                  }
                  onClick={() =>
                    dispatch(likePost({ postId: post.id, user: "John Doe" }))
                  }
                >
                  {post.likes > 0 ? `Like (${post.likes})` : "Like"}
                </Button>

                <Button
                  size="small"
                  startIcon={<CommentIcon />}
                  onClick={() => setActiveCommentPost(post.id)}
                >
                  Comment ({post.comments.length})
                </Button>

                <Button
                  size="small"
                  startIcon={<ShareIcon />}
                  onClick={() => dispatch(openShareModal(post.id))}
                >
                  Share
                </Button>
              </Stack>

              {/* Comment Box */}
              {activeCommentPost === post.id && (
                <Box mt={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        dispatch(
                          addComment({
                            postId: post.id,
                            user: "John Doe",
                            text: commentText.trim(),
                          })
                        );
                        setCommentText("");
                        setActiveCommentPost(null);
                      }
                    }}
                  />
                  <Stack mt={1}>
                    {post.comments.map((c) => (
                      <Typography key={c.id} variant="body2" sx={{ ml: 2 }}>
                        <strong>{c.user}: </strong> {c.text}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          ))}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Online Contacts
            </Typography>
            <Divider />
            <Box display="flex" flexDirection="column" gap={1} mb={2} mt={2}>
              {contacts.map((contact, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1}>
                  <Badge
                    variant="dot"
                    color="success"
                    invisible={!contact.online}
                    overlap="circular"
                  >
                    <Avatar src={contact.avatar} />
                  </Badge>
                  <Typography variant="body2">{contact.name}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Events
            </Typography>
            <Divider />
            <Box display="flex" flexDirection="column" gap={1} mb={2} mt={2}>
              {upcomingEvents.map((event, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2">{event.title}</Typography>
                  <Chip label={event.date} size="small" />
                </Paper>
              ))}
            </Box>
            <Divider />
            <Typography variant="h6" gutterBottom>
              See All Events
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Share Dialog */}
      <Dialog open={Boolean(selectedPost)} onClose={() => dispatch(closeShareModal())}>
        <DialogTitle>Share Post</DialogTitle>
        <DialogContent dividers>
          {selectedPost && (
            <>
              <Typography variant="subtitle2">{selectedPost.user}</Typography>
              <Typography variant="body2" sx={{ my: 1 }}>
                {selectedPost.content}
              </Typography>
              <Stack direction="row" spacing={1}>
                {selectedPost.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch(closeShareModal())}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!selectedPost) return;
              navigator.clipboard.writeText(`${location.origin}/post/${selectedPost.id}`);
            }}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)}>
        <DialogTitle>Add Event</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Event Title"
            fullWidth
            margin="dense"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
          />
          <TextField
            label="Event Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEventDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEventPost}>
            Post Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete post?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This action can’t be undone. Are you sure you want to delete this post?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Content"
            fullWidth
            multiline
            minRows={3}
            margin="dense"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />

          {/* Tag editor (simple quick-add) */}
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Tags</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {editTags.map((t) => (
                <Chip key={t} label={t} onDelete={() => setEditTags(editTags.filter(x => x !== t))} />
              ))}
              {["Conversation", "Event", "Giveaway", "Announcement"].map((t) => (
                <Chip
                  key={`picker-${t}`}
                  label={`+ ${t}`}
                  variant="outlined"
                  onClick={() => {
                    if (!editTags.includes(t)) setEditTags([...editTags, t]);
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Image controls */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>Image</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                onClick={() => {
                  const el = document.createElement("input");
                  el.type = "file";
                  el.accept = "image/*";
                  el.onchange = (evt: any) => {
                    const f = evt?.target?.files?.[0];
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setEditImage(url); // replace
                    }
                  };
                  el.click();
                }}
              >
                Replace Image
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={() => setEditImage(null)}
                disabled={!currentEditPost?.image && editImage !== null}
              >
                Remove Image
              </Button>
              <Typography variant="caption" color="text.secondary">
                (Leave unchanged if you don’t pick anything)
              </Typography>
            </Stack>

            {/* Preview current/next image */}
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">Preview</Typography>
              <Box mt={1}>
                {editImage === null ? (
                  <Typography variant="body2" color="text.secondary">Image will be removed</Typography>
                ) : (
                  <img
                    src={editImage ?? currentEditPost?.image}
                    alt="Preview"
                    style={{ width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 12 }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveEdit}
            disabled={!editContent.trim() && !(editImage !== undefined)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
