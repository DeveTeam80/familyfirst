"use client";

import { ReactNode, useMemo } from "react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { store, RootState } from "@/store"; // make sure path is correct

interface Props {
  children: ReactNode;
}

// ⚠ Inner component to consume Redux state
function InnerThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSelector((state: RootState) => state.theme.mode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark" && {
            background: { default: "#121212", paper: "#1E1E1E" },
            text: { primary: "#fff", secondary: "#aaa" },
          }),
          ...(mode === "light" && {
            background: { default: "#f5f5f5", paper: "#fff" },
            text: { primary: "#000", secondary: "#555" },
          }),
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

// ✅ Main provider
export default function Providers({ children }: Props) {
  return (
    <ReduxProvider store={store}>
      <InnerThemeProvider>{children}</InnerThemeProvider>
    </ReduxProvider>
  );
}
