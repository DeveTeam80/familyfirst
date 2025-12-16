import { createSlice } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
}

// 🔹 Safe initializer (SSR-safe)
const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") return "dark"; // fallback for SSR
  const saved = localStorage.getItem("theme-mode");
  return saved === "light" || saved === "dark" ? saved : "dark";
};

const initialState: ThemeState = {
  mode: getInitialMode(),
};

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", state.mode);
    },
    setMode: (state, action: { payload: ThemeMode }) => {
      state.mode = action.payload;
      localStorage.setItem("theme-mode", state.mode);
    },
  },
});

export const { toggleMode, setMode } = themeSlice.actions;
export default themeSlice.reducer;
