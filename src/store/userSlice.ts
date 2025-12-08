// src/store/userSlice.ts
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
  currentUser: UserProfile | null;
  profiles: Record<string, UserProfile>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: UserState = {
  currentUser: null,
  profiles: {},
  isAuthenticated: false,
  isLoading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // ⭐ Set current user from NextAuth session
    setCurrentUser(state, action: PayloadAction<UserProfile | null>) {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      
      // Also add to profiles
      if (action.payload) {
        state.profiles[action.payload.username] = action.payload;
      }
    },

    // ⭐ Set loading state
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    // Update profile
    updateProfile(
      state,
      action: PayloadAction<{
        username: string;
        changes: Partial<UserProfile>;
      }>
    ) {
      const { username, changes } = action.payload;
      
      // Update in profiles
      if (state.profiles[username]) {
        state.profiles[username] = { 
          ...state.profiles[username], 
          ...changes 
        };
      }
      
      // Update current user if it's them
      if (state.currentUser?.username === username) {
        state.currentUser = { 
          ...state.currentUser, 
          ...changes 
        };
      }
    },

    // Add/update a profile in the profiles record
    upsertProfile(state, action: PayloadAction<UserProfile>) {
      state.profiles[action.payload.username] = action.payload;
    },

    // Change email
    changeEmail(
      state,
      action: PayloadAction<{ username: string; newEmail: string }>
    ) {
      const { username, newEmail } = action.payload;
      
      if (state.profiles[username]) {
        state.profiles[username].email = newEmail;
      }
      
      if (state.currentUser?.username === username) {
        state.currentUser.email = newEmail;
      }
    },

    // Clear user on logout
    clearCurrentUser(state) {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },

    // Reset entire user state
    resetUserState(state) {
      state.currentUser = null;
      state.profiles = {};
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const {
  setCurrentUser,
  setLoading,
  updateProfile,
  upsertProfile,
  changeEmail,
  clearCurrentUser,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;