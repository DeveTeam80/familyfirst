// store/postSlice.ts
import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

interface Comment {
  id: string;
  user: string;
  text: string;
}

interface Post {
  id: string;
  user: string;
  username?: string;
  avatar?: string;
  content?: string;
  tags: string[];
  image?: string | null;     // (keep your tri-state if you added it)
  eventDate?: string;        // ✅ add this
  likes: number;
  likedBy: string[];
  comments: Comment[];
  date: string;
}


interface PostState {
  items: Post[];
  selectedPost?: Post | null;
}

const initialState: PostState = {
  items: [
    {
      id: nanoid(),
      user: "John Doe",
      username: "john",
      avatar: "/avatar.png",
      content: "Had a great time with the family this weekend!",
      tags: ["Memories", "Family"],
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=800",
      likes: 3,
      likedBy: ["alice", "bob", "charlie"],
      comments: [
        { id: nanoid(), user: "Alice", text: "Beautiful!" },
        { id: nanoid(), user: "Charlie", text: "Looks fun 😄" },
      ],
      date: "Oct 9, 2025",
    },
    {
      id: nanoid(),
      user: "Alice Fernandes",
      username: "alice",
      avatar: "/avatar4.png",
      content: "Some moments are worth framing forever ❤️",
      tags: ["Gallery"],
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800",
      likes: 5,
      likedBy: ["john", "bob"],
      comments: [{ id: nanoid(), user: "John Doe", text: "Lovely picture!" }],
      date: "Oct 8, 2025",
    },
    {
      id: nanoid(),
      user: "Charlie Pinto",
      username: "charlie",
      avatar: "/avatar6.png",
      content: "Cooking up grandma’s classic biryani recipe 🍛",
      tags: ["Recipe"],
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
      likes: 8,
      likedBy: ["alice", "john"],
      comments: [],
      date: "Oct 7, 2025",
    },
  ],
  selectedPost: null,
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    addPost(state, action: PayloadAction<Omit<Post, "id" | "likes" | "likedBy" | "comments" | "date">>) {
      state.items.unshift({
        id: nanoid(),
        ...action.payload,
        likes: 0,
        likedBy: [],
        comments: [],
        date: new Date().toLocaleDateString(),
      });
    },
    likePost(state, action: PayloadAction<{ postId: string; user: string }>) {
      const p = state.items.find((x) => x.id === action.payload.postId);
      if (!p) return;
      const hasLiked = p.likedBy.includes(action.payload.user);
      if (hasLiked) {
        p.likedBy = p.likedBy.filter((u) => u !== action.payload.user);
        p.likes--;
      } else {
        p.likedBy.push(action.payload.user);
        p.likes++;
      }
    },
    addComment(state, action: PayloadAction<{ postId: string; user: string; text: string }>) {
      const p = state.items.find((x) => x.id === action.payload.postId);
      if (!p) return;
      p.comments.push({ id: nanoid(), user: action.payload.user, text: action.payload.text });
    },
    deletePost(state, action: PayloadAction<{ postId: string }>) {
      state.items = state.items.filter((x) => x.id !== action.payload.postId);
    },
    updatePost(state, action: PayloadAction<{ postId: string; content: string; tags: string[]; image?: string | null }>) {
      const p = state.items.find((x) => x.id === action.payload.postId);
      if (!p) return;
      p.content = action.payload.content;
      p.tags = action.payload.tags;
      if (action.payload.image !== undefined) p.image = action.payload.image;
    },
  },
});

export const { addPost, likePost, addComment, deletePost, updatePost } = postSlice.actions;
export default postSlice.reducer;
