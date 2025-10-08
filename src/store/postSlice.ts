import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Comment {
  id: string;
  user: string;
  text: string;
}

interface Post {
  id: string;
  user: string;
  avatar: string;
  content: string;
  tags: string[];
  date: string;
  likes: number;
  likedBy: string[]; // ✅ new
  comments: Comment[];
}

interface PostsState {
  items: Post[];
  selectedPost: Post | null;
}

const initialState: PostsState = {
  items: [],
  selectedPost: null,
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    addPost: (
      state,
      action: PayloadAction<{
        user: string;
        avatar: string;
        content: string;
        tags: string[];
      }>
    ) => {
      state.items.unshift({
        id: Date.now().toString(),
        user: action.payload.user,
        avatar: action.payload.avatar,
        content: action.payload.content,
        tags: action.payload.tags,
        date: new Date().toLocaleString(),
        likes: 0,
        likedBy: [], // ✅ new field
        comments: [],
      });
    },

    // ✅ Toggle like
    likePost: (state, action: PayloadAction<{ postId: string; user: string }>) => {
      const post = state.items.find((p) => p.id === action.payload.postId);
      if (post) {
        const index = post.likedBy.indexOf(action.payload.user);
        if (index === -1) {
          // User hasn't liked → add like
          post.likedBy.push(action.payload.user);
          post.likes += 1;
        } else {
          // User already liked → remove like
          post.likedBy.splice(index, 1);
          post.likes -= 1;
        }
      }
    },

    addComment: (
      state,
      action: PayloadAction<{ postId: string; user: string; text: string }>
    ) => {
      const post = state.items.find((p) => p.id === action.payload.postId);
      if (post) {
        post.comments.push({
          id: Date.now().toString(),
          user: action.payload.user,
          text: action.payload.text,
        });
      }
    },

    openShareModal: (state, action: PayloadAction<string>) => {
      const post = state.items.find((p) => p.id === action.payload);
      state.selectedPost = post || null;
    },

    closeShareModal: (state) => {
      state.selectedPost = null;
    },
  },
});

export const { addPost, likePost, addComment, openShareModal, closeShareModal } =
  postSlice.actions;

export default postSlice.reducer;
