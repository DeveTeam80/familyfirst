"use client";

import { ReactNode, useMemo } from "react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { ThemeProvider, createTheme, CssBaseline, alpha } from "@mui/material";
import { store, RootState } from "@/store";

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
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            '@media (max-width:600px)': {
              fontSize: '1.75rem',
            },
          },
          h2: {
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            '@media (max-width:600px)': {
              fontSize: '1.5rem',
            },
          },
          h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
            lineHeight: 1.3,
            '@media (max-width:600px)': {
              fontSize: '1.25rem',
            },
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.4,
            '@media (max-width:600px)': {
              fontSize: '1.125rem',
            },
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
            '@media (max-width:600px)': {
              fontSize: '1rem',
            },
          },
          h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.4,
            '@media (max-width:600px)': {
              fontSize: '0.95rem',
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
            lineHeight: 1.5,
          },
          body1: {
            fontSize: '0.95rem',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9rem',
            letterSpacing: '0.02em',
          },
          caption: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
            letterSpacing: '0.03em',
          },
        },
        shape: {
          borderRadius: 8,
        },
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
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === "dark" 
                  ? '#a78bfa40 #1a1229'
                  : '#7c3aed20 #faf8ff',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === "dark" ? '#1a1229' : '#faf8ff',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === "dark" 
                    ? alpha('#a78bfa', 0.3)
                    : alpha('#7c3aed', 0.2),
                  borderRadius: '4px',
                  '&:hover': {
                    background: mode === "dark" 
                      ? alpha('#a78bfa', 0.5)
                      : alpha('#7c3aed', 0.3),
                  },
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '10px 24px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (max-width:600px)': {
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                },
                '&:hover': {
                  boxShadow: 'none',
                  transform: 'translateY(-1px)',
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
                    ? '0 8px 16px rgba(139, 92, 246, 0.4)'
                    : '0 8px 16px rgba(124, 58, 237, 0.4)',
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
                borderWidth: '1.5px',
                borderColor: mode === "dark" 
                  ? alpha('#a78bfa', 0.5)
                  : alpha('#7c3aed', 0.5),
                color: mode === "dark" ? '#e9d5ff' : '#7c3aed',
                '&:hover': {
                  borderWidth: '1.5px',
                  borderColor: mode === "dark" ? '#a78bfa' : '#7c3aed',
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.08)
                    : alpha('#7c3aed', 0.04),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                },
              },
              text: {
                color: mode === "dark" ? '#e9d5ff' : '#7c3aed',
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.08)
                    : alpha('#7c3aed', 0.04),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                },
              },
              sizeSmall: {
                padding: '6px 16px',
                fontSize: '0.8125rem',
                borderRadius: 6,
                '@media (max-width:600px)': {
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                },
              },
              sizeLarge: {
                padding: '12px 28px',
                fontSize: '1rem',
                borderRadius: 10,
                '@media (max-width:600px)': {
                  padding: '10px 20px',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
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
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === "dark"
                  ? '0 4px 16px rgba(0, 0, 0, 0.4)'
                  : '0 4px 16px rgba(124, 58, 237, 0.06)',
                border: `1px solid ${mode === "dark" 
                  ? alpha('#a78bfa', 0.1)
                  : alpha('#7c3aed', 0.05)}`,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                fontWeight: 500,
                fontSize: '0.8125rem',
                transition: 'all 0.2s',
                '@media (max-width:600px)': {
                  fontSize: '0.75rem',
                },
              },
              outlined: {
                borderWidth: '1.5px',
              },
              colorPrimary: {
                background: mode === "dark"
                  ? alpha('#a78bfa', 0.15)
                  : alpha('#7c3aed', 0.1),
                color: mode === "dark" ? '#e9d5ff' : '#6d28d9',
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
                  borderRadius: 10,
                  transition: 'all 0.2s',
                  '& fieldset': {
                    borderWidth: '1.5px',
                    borderColor: mode === "dark"
                      ? alpha('#a78bfa', 0.2)
                      : alpha('#7c3aed', 0.2),
                  },
                  '&:hover fieldset': {
                    borderWidth: '1.5px',
                    borderColor: mode === "dark"
                      ? alpha('#a78bfa', 0.4)
                      : alpha('#7c3aed', 0.3),
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                  },
                },
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
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                transition: 'all 0.2s',
                color: mode === "dark" ? '#e9d5ff' : '#6b5b95',
                '@media (max-width:600px)': {
                  padding: '8px',
                },
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.08)
                    : alpha('#7c3aed', 0.04),
                  color: mode === "dark" ? '#ffffff' : '#7c3aed',
                },
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                borderRadius: 10,
                boxShadow: mode === "dark"
                  ? '0 12px 32px rgba(0, 0, 0, 0.5)'
                  : '0 12px 32px rgba(124, 58, 237, 0.15)',
                border: `1px solid ${mode === "dark"
                  ? alpha('#a78bfa', 0.1)
                  : alpha('#7c3aed', 0.08)}`,
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                margin: '4px 8px',
                padding: '10px 12px',
                transition: 'all 0.2s',
                color: mode === "dark" ? '#f3f0ff' : '#1e1b29',
                '@media (max-width:600px)': {
                  padding: '8px 10px',
                },
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.12)
                    : alpha('#7c3aed', 0.06),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                },
                '&.Mui-selected': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.16)
                    : alpha('#7c3aed', 0.1),
                  color: mode === "dark" ? '#ffffff' : '#6d28d9',
                  '&:hover': {
                    backgroundColor: mode === "dark"
                      ? alpha('#a78bfa', 0.2)
                      : alpha('#7c3aed', 0.14),
                    color: mode === "dark" ? '#ffffff' : '#6d28d9',
                  },
                },
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                transition: 'all 0.2s',
                color: mode === "dark" ? '#e9d5ff' : '#6b5b95',
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.08)
                    : alpha('#7c3aed', 0.04),
                  color: mode === "dark" ? '#ffffff' : '#7c3aed',
                },
                '&.Mui-selected': {
                  backgroundColor: mode === "dark"
                    ? alpha('#a78bfa', 0.16)
                    : alpha('#7c3aed', 0.1),
                  color: mode === "dark" ? '#ffffff' : '#7c3aed',
                  '&:hover': {
                    backgroundColor: mode === "dark"
                      ? alpha('#a78bfa', 0.2)
                      : alpha('#7c3aed', 0.14),
                    color: mode === "dark" ? '#ffffff' : '#6d28d9',
                  },
                },
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: mode === "dark"
                  ? alpha('#a78bfa', 0.12)
                  : alpha('#7c3aed', 0.08),
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === "dark"
                  ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                  : '0 2px 8px rgba(124, 58, 237, 0.08)',
                backgroundImage: 'none',
                backdropFilter: 'blur(8px)',
                backgroundColor: mode === "dark"
                  ? alpha('#1a1229', 0.95)
                  : alpha('#ffffff', 0.95),
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 12,
                boxShadow: mode === "dark"
                  ? '0 20px 48px rgba(0, 0, 0, 0.6)'
                  : '0 20px 48px rgba(124, 58, 237, 0.15)',
                '@media (max-width:600px)': {
                  margin: '16px',
                  maxHeight: 'calc(100% - 32px)',
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                borderRadius: 6,
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: '8px 12px',
                backgroundColor: mode === "dark"
                  ? alpha('#1a1229', 0.95)
                  : alpha('#1e1b29', 0.95),
                color: '#ffffff',
              },
            },
          },
          MuiBadge: {
            styleOverrides: {
              badge: {
                fontWeight: 600,
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
                  paddingLeft: '12px',
                  paddingRight: '12px',
                },
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

// ✅ Main provider
export default function Providers({ children }: Props) {
  return (
    <ReduxProvider store={store}>
      <InnerThemeProvider>{children}</InnerThemeProvider>
    </ReduxProvider>
  );
}