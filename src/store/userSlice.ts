import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
}

interface UserState {
  currentUser: { username: string } | null;
  profiles: Record<string, UserProfile>;
}

const initialState: UserState = {
  // Simulate an authenticated user for now
  currentUser: { username: "john" },
  // Seed some profiles
  profiles: {
    john: {
      id: "1",
      username: "john",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/avatar.png",
      bio: "Family history buff. Coffee enthusiast.",
      location: "Bengaluru, IN",
    },
    alice: {
      id: "2",
      username: "alice",
      name: "Alice Fernandes",
      email: "alice@example.com",
      avatar: "/avatar4.png",
      bio: "Archivist of memories.",
      location: "Goa, IN",
    },
  },
};

type UpdatePayload = {
  username: string;
  changes: Partial<Pick<UserProfile, "name" | "bio" | "location" | "avatar">>;
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<{ username: string } | null>) {
      state.currentUser = action.payload;
    },
    updateProfile(state, action: PayloadAction<UpdatePayload>) {
      const { username, changes } = action.payload;
      const p = state.profiles[username];
      if (!p) return;
      state.profiles[username] = { ...p, ...changes };
    },
    // helper for local dev to create new profiles quickly
    upsertProfile(state, action: PayloadAction<UserProfile>) {
      state.profiles[action.payload.username] = action.payload;
    },
  },
});

export const { setCurrentUser, updateProfile, upsertProfile } = userSlice.actions;
export default userSlice.reducer;
