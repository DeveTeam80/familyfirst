import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export interface Comment {
  id: string;
  user: string;
  text: string;
  date: string;
}

export interface Post {
  id: string;
  user: string;
  avatar: string;
  content: string;
  image?: string;
  eventDate?: string; // ISO string "YYYY-MM-DD"
  tags: string[];
  date: string; // e.g., "Oct 10, 2025, 10:05 AM"
  likes: number;
  likedBy: string[];
  comments: Comment[];
}

interface PostsState {
  items: Post[];
  selectedPost: Post | null; // for Share modal
}

const initialState: PostsState = {
  items: [],
  selectedPost: null,
};

const fmtNow = () =>
  new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

type AddPostPayload = {
  user: string;
  avatar: string;
  content: string;
  tags: string[];
  image?: string;
  eventDate?: string; // "YYYY-MM-DD"
};

type UpdatePostPayload = {
  postId: string;
  content?: string;
  tags?: string[];
  image?: string | null; // pass null to remove image
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<AddPostPayload>) => {
      const { user, avatar, content, tags, image, eventDate } = action.payload;
      const post: Post = {
        id: nanoid(),
        user,
        avatar,
        content,
        image,
        eventDate,
        tags,
        date: fmtNow(),
        likes: 0,
        likedBy: [],
        comments: [],
      };
      state.items.unshift(post);
    },

    likePost: (
      state,
      action: PayloadAction<{ postId: string; user: string }>
    ) => {
      const { postId, user } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (!post) return;
      const i = post.likedBy.indexOf(user);
      if (i >= 0) {
        post.likedBy.splice(i, 1);
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likedBy.push(user);
        post.likes += 1;
      }
    },

    addComment: (
      state,
      action: PayloadAction<{ postId: string; user: string; text: string }>
    ) => {
      const { postId, user, text } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (!post) return;
      post.comments.push({
        id: nanoid(),
        user,
        text,
        date: fmtNow(),
      });
    },

    openShareModal: (state, action: PayloadAction<string /* postId */>) => {
      const post = state.items.find((p) => p.id === action.payload) || null;
      state.selectedPost = post;
    },

    closeShareModal: (state) => {
      state.selectedPost = null;
    },

    deletePost: (state, action: PayloadAction<{ postId: string }>) => {
      const pid = action.payload.postId;
      state.items = state.items.filter((p) => p.id !== pid);
      if (state.selectedPost?.id === pid) state.selectedPost = null;
    },

    updatePost: (state, action: PayloadAction<UpdatePostPayload>) => {
      const { postId, content, tags, image } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (!post) return;
      if (typeof content === "string") post.content = content;
      if (Array.isArray(tags)) post.tags = tags;
      if (image !== undefined) {
        // undefined means "don't change"; null means "remove"
        if (image === null) delete post.image;
        else post.image = image;
      }
      // optional: bump edited timestamp
      post.date = fmtNow();
    },
  },
});

export const {
  addPost,
  likePost,
  addComment,
  openShareModal,
  closeShareModal,
  deletePost,
  updatePost,
} = postsSlice.actions;

export default postsSlice.reducer;
