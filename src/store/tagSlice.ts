import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TagsState {
  available: string[];
}

const initialState: TagsState = {
  available: ["Conversation", "Event", "Giveaway", "Announcement"],
};

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    addTag: (state, action: PayloadAction<string>) => {
      const tag = action.payload.trim();
      if (tag && !state.available.includes(tag)) {
        state.available.push(tag);
      }
    },
  },
});

export const { addTag } = tagsSlice.actions;
export default tagsSlice.reducer;
