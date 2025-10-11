"use client";

import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Avatar,
  Box,
  Button,
  Divider,
  ImageList,
  ImageListItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import * as React from "react";

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const router = useRouter();
  const currentUser = useSelector((s: RootState) => s.user.currentUser);
  const profile = useSelector((s: RootState) => s.user.profiles[username]);
  const allPosts = useSelector((s: RootState) => s.posts.items);

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">User not found</Typography>
        <Typography variant="body2" color="text.secondary">
          The profile @{username} doesn’t exist.
        </Typography>
      </Box>
    );
  }

  const isOwner = !!currentUser && currentUser.username === username;

  const userPosts = allPosts.filter(
    (p: any) => p.username === username || p.user === profile.name
  );

  const galleryImages = userPosts
    .filter((p: any) => !!p.image)
    .map((p: any) => ({ id: p.id, src: p.image as string }));

  const [tab, setTab] = React.useState(0);

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
            src={profile.avatar}
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
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => router.push("/settings/profile")}
                >
                  Edit Profile
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small">Message</Button>
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

      <Box sx={{ mt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="profile sections"
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab label={`Posts (${userPosts.length})`} />
          <Tab label={`Gallery (${galleryImages.length})`} />
        </Tabs>
        <Divider sx={{ mb: 2 }} />
      </Box>

      <Box role="tabpanel" hidden={tab !== 0}>
        {tab === 0 && <PostsTab posts={userPosts} />}
      </Box>

      <Box role="tabpanel" hidden={tab !== 1}>
        {tab === 1 && <GalleryTab images={galleryImages} />}
      </Box>
    </Box>
  );
}


function PostsTab({ posts }: { posts: any[] }) {
  if (posts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No posts yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <Paper key={post.id} sx={{ p: 2, borderRadius: 3 }}>
          {/* header */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={post.avatar} />
            <Box>
              <Typography variant="subtitle2">{post.user || post.username}</Typography>
              {post.date && (
                <Typography variant="caption" color="text.secondary">
                  {post.date}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* content */}
          {post.content && (
            <Typography variant="body1" sx={{ mt: 1.5 }}>
              {post.content}
            </Typography>
          )}

          {/* image */}
          {post.image && (
            <Box sx={{ mt: 1.5 }}>
              <img
                src={post.image}
                alt=""
                style={{
                  width: "100%",
                  borderRadius: 12,
                  objectFit: "cover",
                }}
              />
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

/* ---------------- Gallery: Pinterest-like Masonry ---------------- */

function GalleryTab({ images }: { images: { id: string; src: string }[] }) {
  if (images.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No photos yet.
      </Typography>
    );
  }

  // Use MUI ImageList with masonry layout
  return (
    <ImageList variant="masonry" cols={getCols()} gap={8}>
      {images.map((img) => (
        <ImageListItem key={img.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${img.src}`}
            alt=""
            loading="lazy"
            style={{ borderRadius: 12, width: "100%", display: "block" }}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

// responsive columns helper
function getCols() {
  if (typeof window === "undefined") return 3;
  const w = window.innerWidth;
  if (w < 600) return 2;
  if (w < 900) return 3;
  if (w < 1200) return 4;
  return 5;
}

/* ---------------- About panel (extra details) ---------------- */

function AboutTab({ profile }: { profile: any }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Stack spacing={1}>
        <Row label="Name" value={profile.name} />
        <Row label="Username" value={`@${profile.username}`} />
        {profile.location && <Row label="Location" value={profile.location} />}
        {profile.bio && <Row label="Bio" value={profile.bio} />}
      </Stack>
    </Paper>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
