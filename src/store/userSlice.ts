// src/store/userSlice.ts
import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index"; // 👈 Ensure this import exists

// 1. Update Interface to include Role/Memberships
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string | null;
  bio?: string;
  location?: string;
  birthday?: string | null;
  anniversary?: string | null;
  // 👇 Added these fields for permissions
  role?: string; 
  memberships?: { familyId: string; role: string }[];
  familyMemberships?: { 
    familyId: string; 
    role: string; 
  }[];
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
    setCurrentUser(state, action: PayloadAction<UserProfile | null>) {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      
      if (action.payload) {
        state.profiles[action.payload.username] = action.payload;
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    updateProfile(
      state,
      action: PayloadAction<{
        username: string;
        changes: Partial<UserProfile>;
      }>
    ) {
      const { username, changes } = action.payload;
      
      if (state.profiles[username]) {
        state.profiles[username] = { 
          ...state.profiles[username], 
          ...changes 
        };
      }
      
      if (state.currentUser?.username === username) {
        state.currentUser = { 
          ...state.currentUser, 
          ...changes 
        };
      }
    },

    upsertProfile(state, action: PayloadAction<UserProfile>) {
      state.profiles[action.payload.username] = action.payload;
    },

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

    clearCurrentUser(state) {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },

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

/* -------------------------------------------------------------------------- */
/* SELECTORS                                  */
/* -------------------------------------------------------------------------- */

// 1. Basic Selector: Get the current user object
export const selectCurrentUser = (state: RootState) => state.user.currentUser;

// 2. Smart Selector: Calculate the User's Role
// This handles both scenarios: 'role' directly on object OR inside 'familyMemberships'
export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => {
    if (!user) return "VIEWER"; // Default fallback

    // Case A: Role is directly on the user object
    if (user.role) return user.role;
    if (user.memberships && user.memberships.length > 0) {
      return user.memberships[0].role;
    }

    // Case B: Role is inside familyMemberships (Prisma standard)
    if (user.familyMemberships && user.familyMemberships.length > 0) {
      // Assuming the first membership is the active one for this app context
      return user.familyMemberships[0].role;
    }

    return "VIEWER";
  }
);

// 3. Power Selector: Returns TRUE if user is Admin or Owner
export const selectIsAdmin = createSelector(
  [selectUserRole],
  (role) => {
    // Normalize string to uppercase just in case
    const r = (role || "").toUpperCase();
    return r === "ADMIN" || r === "OWNER";
  }
);

export const selectActiveFamilyId = createSelector(
  [selectCurrentUser],
  (user) => {
    if (!user) return null;
    
    // Check 'memberships' (auth provider style)
    if (user.memberships && user.memberships.length > 0) {
      return user.memberships[0].familyId;
    }

    // Check 'familyMemberships' (Prisma style)
    if (user.familyMemberships && user.familyMemberships.length > 0) {
      return user.familyMemberships[0].familyId;
    }

    return null;
  }
);
// 5. Loading State Selector
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export default userSlice.reducer;
