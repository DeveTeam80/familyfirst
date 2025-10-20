import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string | null;   
  bio?: string;
  location?: string;
}
interface UserState {
  currentUser: { username: string } | null;
  profiles: Record<string, UserProfile>;
}

const initialState: UserState = {
  currentUser: { username: "john" },
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
   updateProfile(
      state,
      action: PayloadAction<{
        username: string;
        changes: Partial<UserProfile>; 
      }>
    ) {
      const { username, changes } = action.payload;
      if (!state.profiles[username]) return;
      state.profiles[username] = { ...state.profiles[username], ...changes };
    },
    upsertProfile(state, action: PayloadAction<UserProfile>) {
      state.profiles[action.payload.username] = action.payload;
    },
    // add to your existing createSlice reducers:

changeEmail(
  state,
  action: PayloadAction<{ username: string; newEmail: string }>
) {
  const { username, newEmail } = action.payload;
  const p = state.profiles[username];
  if (p) p.email = newEmail;
},

// purely frontend flag; real change will be handled by Firebase Auth
passwordChangeRequested(
  state,
  _action: PayloadAction<{ username: string }>
) {
  // you might set a timestamp/flag here if you want UI feedback
},

  },
});

export const {
  setCurrentUser,
  updateProfile,
  upsertProfile,
  changeEmail,
  passwordChangeRequested,
} = userSlice.actions;

export default userSlice.reducer;
