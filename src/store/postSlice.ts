// src/store/postSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Comment {
  id: string;
  user: string;
  userId?: string;
  avatar?: string;
  text: string;
  likes?: number;
  likedBy?: string[];
  replies?: Comment[];
  createdAt?: string;
}

export interface Post {
  id: string;
  userId: string;
  user: string;
  username: string;
  avatar?: string;
  content?: string;
  tags: string[];
  image?: string | null;
  images?: string[];
  eventDate?: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  date: string;
  createdAt: string;
  updatedAt: string;
  visibility: "FAMILY" | "PUBLIC" | "PRIVATE" | undefined;
}

interface PostState {
  items: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PostState = {
  items: [],
  selectedPost: null,
  isLoading: false,
  error: null,
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    setPosts(state, action: PayloadAction<Post[]>) {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    // ⭐ NEW: Append posts for infinite scroll
    appendPosts(state, action: PayloadAction<Post[]>) {
      const existingIds = new Set(state.items.map(p => p.id));
      const newPosts = action.payload.filter(p => !existingIds.has(p.id));
      state.items = [...state.items, ...newPosts];
      state.isLoading = false;
      state.error = null;
    },

    addPost(state, action: PayloadAction<Post>) {
      state.items.unshift(action.payload);
    },

    likePost(state, action: PayloadAction<{ postId: string; username: string }>) {
      const post = state.items.find((p) => p.id === action.payload.postId);
      if (!post) return;

      const hasLiked = post.likedBy.includes(action.payload.username);
      if (hasLiked) {
        post.likedBy = post.likedBy.filter((u) => u !== action.payload.username);
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likedBy.push(action.payload.username);
        post.likes++;
      }
      post.updatedAt = new Date().toISOString();
    },

    addComment(
      state,
      action: PayloadAction<{
        postId: string;
        comment: Comment;
      }>
    ) {
      const post = state.items.find((p) => p.id === action.payload.postId);
      if (!post) return;

      post.comments.push(action.payload.comment);
      post.updatedAt = new Date().toISOString();
    },

    updatePost(
      state,
      action: PayloadAction<{
        postId: string;
        content?: string;
        tags?: string[];
        images?: string[];
        eventDate?: string;
      }>
    ) {
      const post = state.items.find((p) => p.id === action.payload.postId);
      if (!post) return;

      if (action.payload.content !== undefined) {
        post.content = action.payload.content;
      }
      if (action.payload.tags !== undefined) {
        post.tags = action.payload.tags;
      }
      if (action.payload.images !== undefined) {
        post.images = action.payload.images;
        post.image = action.payload.images[0] || null;
      }
      if (action.payload.eventDate !== undefined) {
        post.eventDate = action.payload.eventDate;
      }
      post.updatedAt = new Date().toISOString();
    },

    deletePost(state, action: PayloadAction<{ postId: string }>) {
      state.items = state.items.filter((p) => p.id !== action.payload.postId);
    },

    clearPosts(state) {
      state.items = [];
      state.selectedPost = null;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setPosts,
  appendPosts, // ⭐ Export new action
  addPost,
  likePost,
  addComment,
  updatePost,
  deletePost,
  clearPosts,
} = postSlice.actions;

export default postSlice.reducer;