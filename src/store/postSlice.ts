import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Comment {
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
  tags: string[];
  image?: string;
  eventDate?: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  date: string;
}

interface PostsState {
  items: Post[];
  selectedPost: Post | null;
}

const initialState: PostsState = {
  items: [
    {
      id: "1",
      user: "John Doe",
      avatar: "/avatars/avatar1.jpg",
      content: "Excited to announce our new AI-driven solution! 🚀",
      tags: ["Announcement"],
      image: "/posts/ai-announcement.jpg",
      likes: 12,
      likedBy: ["Alice"],
      comments: [
        { id: "c1", user: "Alice", text: "Amazing!", date: new Date().toISOString() },
      ],
      date: new Date().toISOString(),
    },
    {
      id: "2",
      user: "Infra.Health",
      avatar: "/avatars/avatar2.jpg",
      content:
        "Join us for our Healthcare Infra Expo 2025 — meet industry leaders and explore smart hospital solutions.",
      tags: ["Event"],
      eventDate: "2025-03-10",
      likes: 35,
      likedBy: [],
      comments: [],
      date: new Date().toISOString(),
    },
  ],
  selectedPost: null,
};

// --- Payload Types ---
type AddPostPayload = {
  user: string;
  avatar?: string;
  content?: string;
  tags?: string[];
  image?: string | null;
  eventDate?: string | null;
};

type LikePostPayload = { postId: string; user: string };
type AddCommentPayload = { postId: string; user: string; text: string };

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    // ADD POST
    addPost: (state, action: PayloadAction<AddPostPayload>) => {
      const payload = action.payload;
      const newPost: Post = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        user: payload.user,
        avatar: payload.avatar ?? "/avatars/default.png",
        content: payload.content ?? "",
        tags: payload.tags ?? [],
        image: payload.image ?? undefined,
        eventDate: payload.eventDate ?? undefined,
        likes: 0,
        likedBy: [],
        comments: [],
        date: new Date().toISOString(),
      };
      state.items.unshift(newPost); // add new post at top
    },

    // LIKE / UNLIKE POST
    likePost: (state, action: PayloadAction<LikePostPayload>) => {
      const { postId, user } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (!post) return;

      const index = post.likedBy.indexOf(user);
      if (index === -1) {
        post.likedBy.push(user);
      } else {
        post.likedBy.splice(index, 1);
      }
      post.likes = post.likedBy.length;
    },

    // ADD COMMENT
    addComment: (state, action: PayloadAction<AddCommentPayload>) => {
      const { postId, user, text } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (!post) return;

      const newComment: Comment = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        user,
        text,
        date: new Date().toISOString(),
      };
      post.comments.push(newComment);
    },

    // OPEN SHARE MODAL
    openShareModal: (state, action: PayloadAction<string>) => {
      const postId = action.payload;
      const post = state.items.find((p) => p.id === postId) ?? null;
      state.selectedPost = post;
    },

    // CLOSE SHARE MODAL
    closeShareModal: (state) => {
      state.selectedPost = null;
    },
  },
});

export const { addPost, likePost, addComment, openShareModal, closeShareModal } =
  postSlice.actions;

export default postSlice.reducer;
