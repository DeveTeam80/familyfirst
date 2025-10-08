"use client";
import { useDispatch, useSelector } from "react-redux";
import { addPost } from "@/store/postSlice";
import { RootState } from "@/store/index";
import { useState } from "react";
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
} from "@mui/material";
import { Image, Event, Tag } from "@mui/icons-material";
import {
  ThumbUp,
  Comment as CommentIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as InputField,
} from "@mui/material";
import {
  likePost,
  addComment,
  openShareModal,
  closeShareModal,
} from "@/store/postSlice";

export default function Feed() {
  const dispatch = useDispatch();
  const posts = useSelector((state: RootState) => state.posts.items);

  const selectedPost = useSelector(
    (state: RootState) => state.posts.selectedPost
  );

  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(
    null
  );
  const [commentText, setCommentText] = useState("");

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
    if (!content.trim()) return;
    dispatch(
      addPost({
        user: "John Doe",
        avatar: "/avatar.png",
        content,
        tags: selectedTags,
      })
    );
    setContent("");
    setSelectedTags([]);
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

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={2}
            >
              <Stack direction="row" spacing={1}>
                <Button variant="text" startIcon={<Image />}>
                  Add Photo
                </Button>
                <Button variant="text" startIcon={<Event />}>
                  Add Event
                </Button>
                <Button
                  variant="text"
                  startIcon={<Tag />}
                  onClick={handleTagMenuOpen}
                >
                  Add Tag
                </Button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  {["Conversation", "Event", "Giveaway", "Announcement"].map(
                    (tag) => (
                      <MenuItem key={tag} onClick={() => handleTagSelect(tag)}>
                        {tag}
                      </MenuItem>
                    )
                  )}
                </Menu>
              </Stack>

              <Button
                variant="contained"
                sx={{ borderRadius: 3 }}
                onClick={handlePost}
              >
                Post
              </Button>
            </Box>
          </Paper>

          {/* Render Posts */}
          {posts.map((post) => (
            <Paper key={post.id} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Avatar src={post.avatar} />
                <Box>
                  <Typography variant="subtitle2">{post.user}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {post.date}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="body1" my={1}>
                {post.content}
              </Typography>
              <Stack direction="row" spacing={1} mb={1}>
                {post.tags.map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" size="small" />
                ))}
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" spacing={2}>
                <Button
  size="small"
  startIcon={<ThumbUp color={post.likedBy.includes("John Doe") ? "primary" : "inherit"} />}
  onClick={() => dispatch(likePost({ postId: post.id, user: "John Doe" }))}
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
                  <InputField
                    fullWidth
                    size="small"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        dispatch(
                          addComment({
                            postId: post.id,
                            user: "John Doe",
                            text: commentText,
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
        {/* Right Sidebar */}
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
            {/* Upcoming Events */}
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
      <Dialog
        open={Boolean(selectedPost)}
        onClose={() => dispatch(closeShareModal())}
      >
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
          <Button variant="contained">Copy Link</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
