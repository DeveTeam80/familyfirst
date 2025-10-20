import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

export type Role = "admin" | "member";

export interface FamilyMember {
  username: string;      // must exist in user.profiles
  role: Role;
  email?: string;        // optional cache
}

export interface Invite {
  id: string;
  email: string;
  invitedBy: string;     // username
  role: Role;            // role to grant on accept
  status: "pending" | "sent" | "accepted" | "revoked" | "failed";
  createdAt: number;
}

export interface FamilyState {
  activeFamilyId: string;
  membersByFamily: Record<string, FamilyMember[]>;
  invitesByFamily: Record<string, Invite[]>;
}

const initialState: FamilyState = {
  activeFamilyId: "family-1",
  membersByFamily: {
    "family-1": [
      { username: "john", role: "admin", email: "john@example.com" },
      { username: "alice", role: "member", email: "alice@example.com" },
    ],
  },
  invitesByFamily: {
    "family-1": [],
  },
};

const familySlice = createSlice({
  name: "family",
  initialState,
  reducers: {
    setActiveFamily(state, action: PayloadAction<string>) {
      state.activeFamilyId = action.payload;
    },

    // ---- Invites ----
    inviteMemberRequested(
      state,
      action: PayloadAction<{ email: string; role?: Role; invitedBy: string }>
    ) {
      const famId = state.activeFamilyId;
      const inv: Invite = {
        id: nanoid(),
        email: action.payload.email.toLowerCase().trim(),
        invitedBy: action.payload.invitedBy,
        role: action.payload.role ?? "member",
        status: "pending",
        createdAt: Date.now(),
      };
      state.invitesByFamily[famId] ??= [];
      state.invitesByFamily[famId].push(inv);
    },
    inviteMemberMarkedSent(
      state,
      action: PayloadAction<{ inviteId: string; status?: Invite["status"] }>
    ) {
      const famId = state.activeFamilyId;
      const list = state.invitesByFamily[famId] ?? [];
      const inv = list.find((i) => i.id === action.payload.inviteId);
      if (inv) inv.status = action.payload.status ?? "sent";
    },
    revokeInvite(state, action: PayloadAction<{ inviteId: string }>) {
      const famId = state.activeFamilyId;
      state.invitesByFamily[famId] = (state.invitesByFamily[famId] ?? []).filter(
        (i) => i.id !== action.payload.inviteId
      );
    },
    acceptInvite(
      state,
      action: PayloadAction<{ inviteId: string; username: string; email?: string }>
    ) {
      const famId = state.activeFamilyId;
      const list = state.invitesByFamily[famId] ?? [];
      const inv = list.find((i) => i.id === action.payload.inviteId);
      if (!inv) return;
      inv.status = "accepted";
      state.membersByFamily[famId] ??= [];
      state.membersByFamily[famId].push({
        username: action.payload.username,
        role: inv.role,
        email: action.payload.email ?? inv.email,
      });
    },

    // ---- Members ----
    removeMember(state, action: PayloadAction<{ username: string }>) {
      const famId = state.activeFamilyId;
      state.membersByFamily[famId] = (state.membersByFamily[famId] ?? []).filter(
        (m) => m.username !== action.payload.username
      );
    },
    promoteToAdmin(state, action: PayloadAction<{ username: string }>) {
      const famId = state.activeFamilyId;
      const m = (state.membersByFamily[famId] ?? []).find(
        (x) => x.username === action.payload.username
      );
      if (m) m.role = "admin";
    },
    demoteToMember(state, action: PayloadAction<{ username: string }>) {
      const famId = state.activeFamilyId;
      const m = (state.membersByFamily[famId] ?? []).find(
        (x) => x.username === action.payload.username
      );
      if (m) m.role = "member";
    },
  },
});

export const {
  setActiveFamily,
  inviteMemberRequested,
  inviteMemberMarkedSent,
  revokeInvite,
  acceptInvite,
  removeMember,
  promoteToAdmin,
  demoteToMember,
} = familySlice.actions;

export default familySlice.reducer;

/* ------------ Selectors ------------ */
export const selectActiveFamilyId = (s: { family: FamilyState }) =>
  s.family.activeFamilyId;

export const selectMembers = (s: { family: FamilyState }) =>
  s.family.membersByFamily[s.family.activeFamilyId] ?? [];

export const selectInvites = (s: { family: FamilyState }) =>
  s.family.invitesByFamily[s.family.activeFamilyId] ?? [];

export const selectIsAdmin = (
  s: { family: FamilyState; user: { currentUser: { username: string } | null } }
) => {
  const me = s.user.currentUser?.username;
  const members = s.family.membersByFamily[s.family.activeFamilyId] ?? [];
  return !!members.find((m) => m.username === me && m.role === "admin");
};
