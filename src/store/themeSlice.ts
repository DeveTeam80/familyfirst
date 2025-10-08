import { createSlice } from "@reduxjs/toolkit";

interface ThemeState {
  mode: "light" | "dark";
}

const initialState: ThemeState = {
  mode: "dark",
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setMode: (state, action: { payload: "light" | "dark" }) => {
      state.mode = action.payload;
    },
  },
});

export const { toggleMode, setMode } = themeSlice.actions;
export default themeSlice.reducer;
