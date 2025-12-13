// src/store/familySlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

/** client-side role type (you can extend) */
export type ClientRole = "OWNER" | "ADMIN" | "MEMBER" | "UNKNOWN";

export interface FamilyMemberClient {
  userId: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: ClientRole;
  status?: string;
  joinedAt?: string | Date | null;
}

export interface FamilyState {
  activeFamilyId: string | null;
  membersByFamily: Record<string, FamilyMemberClient[]>;
  loadingByFamily: Record<string, boolean>;
  errorByFamily: Record<string, string | null>;
}

const initialState: FamilyState = {
  activeFamilyId: null,
  membersByFamily: {},
  loadingByFamily: {},
  errorByFamily: {},
};

/**
 * Async thunk to fetch members for a given familyId
 */
export const fetchMembers = createAsyncThunk<
  { familyId: string; members: FamilyMemberClient[] },
  string,
  { state: RootState }
>("family/fetchMembers", async (familyId, thunkAPI) => {
  try {
    const res = await fetch(`/api/family/${encodeURIComponent(familyId)}/members`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error || `Failed to load members (${res.status})`);
    }

    const json = await res.json();
    const members = (json.members || []).map((m: any) => ({
      userId: m.userId,
      username: m.user?.username ?? (m.user?.email?.split("@")[0] ?? null),
      name: m.user?.name ?? null,
      email: m.user?.email ?? null,
      avatarUrl: m.user?.avatarUrl ?? null,
      role: m.role ?? "MEMBER",
      status: m.status ?? null,
      joinedAt: m.joinedAt ?? null,
    }));

    return { familyId, members };
  } catch (err: any) {
    return thunkAPI.rejectWithValue({ message: err?.message || String(err) });
  }
});

const familySlice = createSlice({
  name: "family",
  initialState,
  reducers: {
    setActiveFamily(state, action: PayloadAction<string | null>) {
      state.activeFamilyId = action.payload;
    },
    // local-only promotions (optimistic update) — use server to actually persist
    setMembersForFamily(state, action: PayloadAction<{ familyId: string; members: FamilyMemberClient[] }>) {
      state.membersByFamily[action.payload.familyId] = action.payload.members;
    },
    clearFamilyMembers(state, action: PayloadAction<{ familyId: string }>) {
      state.membersByFamily[action.payload.familyId] = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state, action) => {
        const fam = action.meta.arg;
        state.loadingByFamily[fam] = true;
        state.errorByFamily[fam] = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        const { familyId, members } = action.payload;
        state.loadingByFamily[familyId] = false;
        state.errorByFamily[familyId] = null;
        state.membersByFamily[familyId] = members;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        const fam = action.meta.arg;
        state.loadingByFamily[fam] = false;
        state.errorByFamily[fam] = (action.payload as any)?.message ?? action.error.message ?? "Failed to load";
      });
  },
});

export const { setActiveFamily, setMembersForFamily, clearFamilyMembers } = familySlice.actions;
export default familySlice.reducer;

/* ------------ Selectors ------------ */
export const selectActiveFamilyId = (s: RootState) => s.family.activeFamilyId;
export const selectMembersForActiveFamily = (s: RootState) =>
  s.family.activeFamilyId ? s.family.membersByFamily[s.family.activeFamilyId] ?? [] : [];
export const selectIsAdminForActiveFamily = (s: RootState) => {
  const meId = s.user.currentUser?.id;
  const famId = s.family.activeFamilyId;
  if (!meId || !famId) return false;
  const members = s.family.membersByFamily[famId] ?? [];
  return members.some((m) => m.userId === meId && (m.role === "ADMIN" || m.role === "OWNER"));
};
export const selectIsOwnerForActiveFamily = (s: RootState) => {
  const meId = s.user.currentUser?.id;
  const famId = s.family.activeFamilyId;
  if (!meId || !famId) return false;
  const members = s.family.membersByFamily[famId] ?? [];
  return members.some((m) => m.userId === meId && m.role === "OWNER");
};
