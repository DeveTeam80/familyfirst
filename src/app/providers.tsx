

"use client";

import { ReactNode, useMemo } from "react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme, CssBaseline, alpha } from "@mui/material";
import { store, RootState } from "@/store";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setMode } from "@/store/themeSlice";

interface Props {
  children: ReactNode;
}

function InnerThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSelector((state: RootState) => state.theme.mode);
const dispatch = useDispatch();

useEffect(() => {
  const savedMode = localStorage.getItem("theme-mode");
  if (savedMode === "light" || savedMode === "dark") {
    dispatch(setMode(savedMode));
  }
}, [dispatch]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#a78bfa" : "#7c3aed",
            light: mode === "dark" ? "#c4b5fd" : "#a78bfa",
            dark: mode === "dark" ? "#8b5cf6" : "#6d28d9",
            contrastText: "#ffffff",
          },
          secondary: {
            main: mode === "dark" ? "#fbbf24" : "#f59e0b",
            light: mode === "dark" ? "#fcd34d" : "#fbbf24",
            dark: mode === "dark" ? "#f59e0b" : "#d97706",
            contrastText: "#000000",
          },
          error: {
            main: mode === "dark" ? "#fb7185" : "#f43f5e",
            light: mode === "dark" ? "#fda4af" : "#fb7185",
            dark: mode === "dark" ? "#f43f5e" : "#e11d48",
            contrastText: "#ffffff",
          },
          warning: {
            main: mode === "dark" ? "#fbbf24" : "#f59e0b",
            contrastText: "#000000",
          },
          success: {
            main: mode === "dark" ? "#34d399" : "#10b981",
            light: mode === "dark" ? "#6ee7b7" : "#34d399",
            dark: mode === "dark" ? "#10b981" : "#059669",
            contrastText: "#ffffff",
          },
          info: {
            main: mode === "dark" ? "#60a5fa" : "#3b82f6",
            contrastText: "#ffffff",
          },
          background: {
            default: mode === "dark" ? "#0f0a1e" : "#faf8ff",
            paper: mode === "dark" ? "#1a1229" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#f3f0ff" : "#1e1b29",
            secondary: mode === "dark" ? "#c4b5fd" : "#6b5b95",
          },
          divider: mode === "dark"
            ? "rgba(167, 139, 250, 0.12)"
            : "rgba(124, 58, 237, 0.08)",
          action: {
            hover: mode === "dark"
              ? alpha("#a78bfa", 0.08)
              : alpha("#7c3aed", 0.04),
            selected: mode === "dark"
              ? alpha("#a78bfa", 0.16)
              : alpha("#7c3aed", 0.08),
            disabledBackground: mode === "dark"
              ? alpha("#a78bfa", 0.12)
              : alpha("#7c3aed", 0.12),
            focus: mode === "dark"
              ? alpha("#a78bfa", 0.12)
              : alpha("#7c3aed", 0.12),
          },
        },
        typography: {
          fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
          h1: {
            fontWeight: 800,
            fontSize: '2.75rem',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            '@media (max-width:600px)': {
              fontSize: '2rem',
            },
          },
          h2: {
            fontWeight: 700,
            fontSize: '2.25rem',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            '@media (max-width:600px)': {
              fontSize: '1.75rem',
            },
          },
          h3: {
            fontWeight: 700,
            fontSize: '1.875rem',
            lineHeight: 1.3,
            letterSpacing: '-0.015em',
            '@media (max-width:600px)': {
              fontSize: '1.5rem',
            },
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.4,
            '@media (max-width:600px)': {
              fontSize: '1.25rem',
            },
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
            '@media (max-width:600px)': {
              fontSize: '1.125rem',
            },
          },
          h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.5,
            '@media (max-width:600px)': {
              fontSize: '1rem',
            },
          },
          subtitle1: {
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.5,
            letterSpacing: '0.01em',
          },
          subtitle2: {
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.57,
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.7,
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9375rem',
            letterSpacing: '0.02em',
          },
          caption: {
            fontSize: '0.75rem',
            lineHeight: 1.66,
            letterSpacing: '0.03em',
          },
          overline: {
            fontSize: '0.75rem',
            fontWeight: 700,
            lineHeight: 2.66,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
        },
        shape: {
          borderRadius: 12,
        },
        // Around line 183 - Fix shadows array
        shadows: [
          'none',
          mode === "dark"
            ? '0 2px 4px rgba(0,0,0,0.4)'
            : '0 2px 4px rgba(124,58,237,0.08)',
          mode === "dark"
            ? '0 4px 8px rgba(0,0,0,0.4)'
            : '0 4px 8px rgba(124,58,237,0.08)',
          mode === "dark"
            ? '0 6px 12px rgba(0,0,0,0.4)'
            : '0 6px 12px rgba(124,58,237,0.10)',
          mode === "dark"
            ? '0 8px 16px rgba(0,0,0,0.45)'
            : '0 8px 16px rgba(124,58,237,0.12)',
          mode === "dark"
            ? '0 12px 20px rgba(0,0,0,0.5)'
            : '0 12px 20px rgba(124,58,237,0.14)',
          mode === "dark"
            ? '0 16px 24px rgba(0,0,0,0.5)'
            : '0 16px 24px rgba(124,58,237,0.15)',
          mode === "dark"
            ? '0 20px 28px rgba(0,0,0,0.55)'
            : '0 20px 28px rgba(124,58,237,0.16)',
          mode === "dark"
            ? '0 24px 32px rgba(0,0,0,0.6)'
            : '0 24px 32px rgba(124,58,237,0.18)',
          mode === "dark"
            ? '0 28px 36px rgba(0,0,0,0.6)'
            : '0 28px 36px rgba(124,58,237,0.20)',
          mode === "dark"
            ? '0 32px 40px rgba(0,0,0,0.65)'
            : '0 32px 40px rgba(124,58,237,0.22)',
          mode === "dark"
            ? '0 36px 44px rgba(0,0,0,0.65)'
            : '0 36px 44px rgba(124,58,237,0.24)',
          mode === "dark"
            ? '0 40px 48px rgba(0,0,0,0.7)'
            : '0 40px 48px rgba(124,58,237,0.26)',
          // Fill remaining array slots (indices 13-24)
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
          mode === "dark" ? '0 40px 48px rgba(0,0,0,0.7)' : '0 40px 48px rgba(124,58,237,0.26)',
        ],
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              '*': {
                boxSizing: 'border-box',
              },
              html: {
                MozOsxFontSmoothing: 'grayscale',
                WebkitFontSmoothing: 'antialiased',
              },
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === "dark"
                  ? '#a78bfa40 #1a1229'
                  : '#7c3aed20 #faf8ff',
                '&::-webkit-scrollbar': {
                  width: '10px',
                  height: '10px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === "dark" ? '#1a1229' : '#faf8ff',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === "dark"
                    ? alpha('#a78bfa', 0.4)
                    : alpha('#7c3aed', 0.25),
                  borderRadius: '10px',
                  border: `2px solid ${mode === "dark" ? '#1a1229' : '#faf8ff'}`,
                  '&:hover': {
                    background: mode === "dark"
                      ? alpha('#a78bfa', 0.6)
                      : alpha('#7c3aed', 0.4),
                  },
                },
              },
              // Selection styling
              '::selection': {
                backgroundColor: mode === "dark"
                  ? alpha('#a78bfa', 0.3)
                  : alpha('#7c3aed', 0.2),
                color: mode === "dark" ? '#ffffff' : '#1e1b29',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                padding: '10px 24px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (max-width:600px)': {
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                },
                '&:hover': {
                  boxShadow: 'none',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0px)',
                },
              },
              contained: {
                background: mode === "dark"
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff !important',
                '&:hover': {
                  background: mode === "dark"
                    ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  boxShadow: mode === "dark"
                    ? '0 8px 20px rgba(139, 92, 246, 0.5)'
                    : '0 8px 20px rgba(124, 58, 237, 0.4)',
                  color: '#ffffff !important',
                },
                '&.Mui-disabled': {
                  background: mode === "dark"
                    ? alpha('#8b5cf6', 0.3)
                    : alpha('#7c3aed', 0.3),
                  color: `${alpha('#ffffff', 0.5)} !important`,
                },
              },
              containedPrimary: {
                color: '#ffffff !important',
                '&:hover': {
                  color: '#ffffff !important',
                },
              },
              outlined: {
                borderWidth: '2px',
                borderColor: mode === "dark"
                  ? alpha('#a78bfa', 0.5)
                  : alpha('#7c3aed', 0.5),
                color: mode === "dark" ? '#e9d5ff' : '#7c3aed',
                '&:hover': {
                  borderWidth: '2px',
                  borderColor: mode === "dark" ? '#a78bfa' : '#7c3aed',
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.1)
                    : alpha('#7c3aed', 0.08),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                },
              },
              text: {
                color: mode === "dark" ? '#e9d5ff' : '#7c3aed',
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.1)
                    : alpha('#7c3aed', 0.08),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                },
              },
              sizeSmall: {
                padding: '6px 16px',
                fontSize: '0.8125rem',
                borderRadius: 8,
                '@media (max-width:600px)': {
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                },
              },
              sizeLarge: {
                padding: '14px 32px',
                fontSize: '1rem',
                borderRadius: 12,
                '@media (max-width:600px)': {
                  padding: '12px 24px',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundImage: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              elevation0: {
                boxShadow: 'none',
              },
              elevation1: {
                boxShadow: mode === "dark"
                  ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                  : '0 2px 8px rgba(124, 58, 237, 0.08)',
              },
              elevation2: {
                boxShadow: mode === "dark"
                  ? '0 4px 12px rgba(0, 0, 0, 0.45)'
                  : '0 4px 12px rgba(124, 58, 237, 0.10)',
              },
              elevation3: {
                boxShadow: mode === "dark"
                  ? '0 6px 16px rgba(0, 0, 0, 0.5)'
                  : '0 6px 16px rgba(124, 58, 237, 0.12)',
              },
              elevation4: {
                boxShadow: mode === "dark"
                  ? '0 8px 20px rgba(0, 0, 0, 0.55)'
                  : '0 8px 20px rgba(124, 58, 237, 0.14)',
              },
              elevation8: {
                boxShadow: mode === "dark"
                  ? '0 12px 28px rgba(0, 0, 0, 0.6)'
                  : '0 12px 28px rgba(124, 58, 237, 0.18)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === "dark"
                  ? '0 4px 16px rgba(0, 0, 0, 0.4)'
                  : '0 4px 16px rgba(124, 58, 237, 0.08)',
                border: `1px solid ${mode === "dark"
                  ? alpha('#a78bfa', 0.15)
                  : alpha('#7c3aed', 0.08)}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: mode === "dark"
                    ? '0 8px 24px rgba(0, 0, 0, 0.5)'
                    : '0 8px 24px rgba(124, 58, 237, 0.12)',
                  transform: 'translateY(-4px)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.8125rem',
                transition: 'all 0.2s',
                '@media (max-width:600px)': {
                  fontSize: '0.75rem',
                },
              },
              outlined: {
                borderWidth: '2px',
              },
              colorPrimary: {
                background: mode === "dark"
                  ? alpha('#a78bfa', 0.15)
                  : alpha('#7c3aed', 0.1),
                color: mode === "dark" ? '#e9d5ff' : '#6d28d9',
                border: `1px solid ${mode === "dark"
                  ? alpha('#a78bfa', 0.3)
                  : alpha('#7c3aed', 0.2)}`,
                '&:hover': {
                  background: mode === "dark"
                    ? alpha('#a78bfa', 0.25)
                    : alpha('#7c3aed', 0.15),
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  transition: 'all 0.2s',
                  '& fieldset': {
                    borderWidth: '2px',
                    borderColor: mode === "dark"
                      ? alpha('#a78bfa', 0.2)
                      : alpha('#7c3aed', 0.2),
                  },
                  '&:hover fieldset': {
                    borderWidth: '2px',
                    borderColor: mode === "dark"
                      ? alpha('#a78bfa', 0.4)
                      : alpha('#7c3aed', 0.3),
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                    borderColor: mode === "dark" ? '#a78bfa' : '#7c3aed',
                  },
                },
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                fontSize: '0.9375rem',
              },
            },
          },
          MuiAvatar: {
            styleOverrides: {
              root: {
                fontWeight: 600,
                border: `2px solid ${mode === "dark"
                  ? alpha('#a78bfa', 0.2)
                  : alpha('#7c3aed', 0.1)}`,
                transition: 'all 0.2s',
              },
            },
          },
          MuiAvatarGroup: {
            styleOverrides: {
              avatar: {
                borderWidth: '3px',
                fontSize: '0.875rem',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                transition: 'all 0.2s',
                color: mode === "dark" ? '#c4b5fd' : '#6b5b95',
                '@media (max-width:600px)': {
                  padding: '8px',
                },
                '&:hover': {
                  transform: 'scale(1.08)',
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.1)
                    : alpha('#7c3aed', 0.08),
                  color: mode === "dark" ? '#ffffff' : '#7c3aed',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
              sizeSmall: {
                padding: '6px',
                '& svg': {
                  fontSize: '1.25rem',
                },
              },
              sizeLarge: {
                padding: '14px',
                '& svg': {
                  fontSize: '2rem',
                },
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                borderRadius: 12,
                boxShadow: mode === "dark"
                  ? '0 12px 32px rgba(0, 0, 0, 0.6)'
                  : '0 12px 32px rgba(124, 58, 237, 0.18)',
                border: `1px solid ${mode === "dark"
                  ? alpha('#a78bfa', 0.15)
                  : alpha('#7c3aed', 0.1)}`,
                backdropFilter: 'blur(12px)',
                backgroundColor: mode === "dark"
                  ? alpha('#1a1229', 0.95)
                  : alpha('#ffffff', 0.95),
              },
              list: {
                padding: '8px',
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                margin: '2px 0',
                padding: '10px 14px',
                transition: 'all 0.2s',
                color: mode === "dark" ? '#f3f0ff' : '#1e1b29',
                '@media (max-width:600px)': {
                  padding: '8px 12px',
                },
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.15)
                    : alpha('#7c3aed', 0.08),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                },
                '&.Mui-selected': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.2)
                    : alpha('#7c3aed', 0.12),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                  '&:hover': {
                    backgroundColor: mode === "dark"
                      ? alpha('#a78bfa', 0.25)
                      : alpha('#7c3aed', 0.16),
                  },
                },
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                margin: '2px 8px',
                transition: 'all 0.2s',
                color: mode === "dark" ? '#e9d5ff' : '#6b5b95',
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.1)
                    : alpha('#7c3aed', 0.08),
                  color: mode === "dark" ? '#ffffff' : '#7c3aed',
                },
                '&.Mui-selected': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.2)
                    : alpha('#7c3aed', 0.12),
                  color: mode === "dark" ? '#ffffff' : '#7c3aed',
                  '&:hover': {
                    backgroundColor: mode === "dark"
                      ? alpha('#a78bfa', 0.25)
                      : alpha('#7c3aed', 0.16),
                  },
                },
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: mode === "dark"
                  ? alpha('#a78bfa', 0.15)
                  : alpha('#7c3aed', 0.1),
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === "dark"
                  ? '0 2px 12px rgba(0, 0, 0, 0.4)'
                  : '0 2px 12px rgba(124, 58, 237, 0.08)',
                backgroundImage: 'none',
                backdropFilter: 'blur(12px)',
                backgroundColor: mode === "dark"
                  ? alpha('#1a1229', 0.95)
                  : alpha('#ffffff', 0.95),
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 16,
                boxShadow: mode === "dark"
                  ? '0 24px 64px rgba(0, 0, 0, 0.7)'
                  : '0 24px 64px rgba(124, 58, 237, 0.20)',
                border: `1px solid ${mode === "dark"
                  ? alpha('#a78bfa', 0.15)
                  : alpha('#7c3aed', 0.1)}`,
                '@media (max-width:600px)': {
                  margin: '16px',
                  maxHeight: 'calc(100% - 32px)',
                  borderRadius: '20px',
                },
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                fontSize: '1.5rem',
                fontWeight: 700,
                padding: '24px 24px 16px',
                '@media (max-width:600px)': {
                  fontSize: '1.25rem',
                  padding: '20px 20px 12px',
                },
              },
            },
          },
          MuiDialogContent: {
            styleOverrides: {
              root: {
                padding: '0 24px 24px',
                '@media (max-width:600px)': {
                  padding: '0 20px 20px',
                },
              },
            },
          },
          MuiDialogActions: {
            styleOverrides: {
              root: {
                padding: '16px 24px 24px',
                gap: '12px',
                '@media (max-width:600px)': {
                  padding: '12px 20px 20px',
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                borderRadius: 8,
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '8px 12px',
                backgroundColor: mode === "dark"
                  ? alpha('#1a1229', 0.98)
                  : alpha('#1e1b29', 0.95),
                color: '#ffffff',
                boxShadow: mode === "dark"
                  ? '0 4px 12px rgba(0, 0, 0, 0.5)'
                  : '0 4px 12px rgba(0, 0, 0, 0.3)',
              },
              arrow: {
                color: mode === "dark"
                  ? alpha('#1a1229', 0.98)
                  : alpha('#1e1b29', 0.95),
              },
            },
          },
          MuiBadge: {
            styleOverrides: {
              badge: {
                fontWeight: 700,
                fontSize: '0.75rem',
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                boxShadow: mode === "dark"
                  ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              },
            },
          },
          MuiContainer: {
            styleOverrides: {
              root: {
                '@media (max-width:600px)': {
                  paddingLeft: '16px',
                  paddingRight: '16px',
                },
              },
            },
          },
          
          MuiCollapse: {
            styleOverrides: {
              root: {
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important',
              },
            },
          },
          MuiBackdrop: {
            styleOverrides: {
              root: {
                backgroundColor: mode === "dark"
                  ? 'rgba(0, 0, 0, 0.7)'
                  : 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
              },
            },
          },
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

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        <InnerThemeProvider>{children}</InnerThemeProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}