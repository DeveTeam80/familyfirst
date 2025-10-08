import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import postsReducer from "./postSlice";
import tagsReducer from "./tagSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    posts: postsReducer,
    tags: tagsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
