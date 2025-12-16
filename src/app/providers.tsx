"use client";

import { ReactNode, useMemo } from "react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, createTheme, CssBaseline, alpha } from "@mui/material";
import { store, RootState } from "@/store";

interface Props {
  children: ReactNode;
}

function InnerThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSelector((state: RootState) => state.theme.mode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#B794F6" : "#8B5CF6",
            light: mode === "dark" ? "#D4C5F9" : "#A78BFA",
            dark: mode === "dark" ? "#9D75F7" : "#7C3AED",
            contrastText: "#FFFFFF",
          },
          secondary: {
            main: mode === "dark" ? "#A0D8EF" : "#06B6D4",
            light: mode === "dark" ? "#C8E8F5" : "#67E8F9",
            dark: mode === "dark" ? "#7EC8E3" : "#0891B2",
            contrastText: mode === "dark" ? "#0A1929" : "#FFFFFF",
          },
          error: {
            main: mode === "dark" ? "#FF6B8A" : "#EF4444",
            light: mode === "dark" ? "#FFA4B8" : "#F87171",
            dark: mode === "dark" ? "#FF5277" : "#DC2626",
            contrastText: "#FFFFFF",
          },
          warning: {
            main: mode === "dark" ? "#FFB74D" : "#F59E0B",
            contrastText: mode === "dark" ? "#0A1929" : "#FFFFFF",
          },
          success: {
            main: mode === "dark" ? "#66D9A8" : "#10B981",
            light: mode === "dark" ? "#94E7C4" : "#34D399",
            dark: mode === "dark" ? "#4DD199" : "#059669",
            contrastText: "#FFFFFF",
          },
          info: {
            main: mode === "dark" ? "#64B5F6" : "#3B82F6",
            contrastText: "#FFFFFF",
          },
          background: {
            default: mode === "dark" ? "#0A0B14" : "#FAFBFD",
            paper: mode === "dark" ? "#13141F" : "#FFFFFF",
          },
          text: {
            primary: mode === "dark" ? "#F7F8FA" : "#0F1419",
            secondary: mode === "dark" ? "#B4B8C5" : "#536471",
          },
          divider: mode === "dark"
            ? alpha("#B794F6", 0.08)
            : alpha("#8B5CF6", 0.06),
          action: {
            hover: mode === "dark"
              ? alpha("#B794F6", 0.06)
              : alpha("#8B5CF6", 0.04),
            selected: mode === "dark"
              ? alpha("#B794F6", 0.12)
              : alpha("#8B5CF6", 0.08),
            disabledBackground: mode === "dark"
              ? alpha("#B794F6", 0.08)
              : alpha("#8B5CF6", 0.08),
            focus: mode === "dark"
              ? alpha("#B794F6", 0.12)
              : alpha("#8B5CF6", 0.10),
          },
        },
        typography: {
          fontFamily: [
            'PP Telegraf',
            'SF Pro Display',
            'Instrument Sans',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'sans-serif',
          ].join(','),
          h1: {
            fontWeight: 700,
            fontSize: '3.5rem',
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            '@media (max-width:600px)': {
              fontSize: '2.25rem',
            },
          },
          h2: {
            fontWeight: 600,
            fontSize: '2.75rem',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            '@media (max-width:600px)': {
              fontSize: '1.875rem',
            },
          },
          h3: {
            fontWeight: 600,
            fontSize: '2rem',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            '@media (max-width:600px)': {
              fontSize: '1.5rem',
            },
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
            lineHeight: 1.35,
            letterSpacing: '-0.015em',
            '@media (max-width:600px)': {
              fontSize: '1.25rem',
            },
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            '@media (max-width:600px)': {
              fontSize: '1.125rem',
            },
          },
          h6: {
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
          },
          subtitle1: {
            fontWeight: 500,
            fontSize: '1rem',
            lineHeight: 1.6,
            letterSpacing: '0em',
          },
          subtitle2: {
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: 1.6,
            letterSpacing: '0.005em',
          },
          body1: {
            fontSize: '0.9375rem',
            lineHeight: 1.65,
            letterSpacing: '0.002em',
            fontWeight: 400,
          },
          body2: {
            fontSize: '0.8125rem',
            lineHeight: 1.65,
            letterSpacing: '0.005em',
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9375rem',
            letterSpacing: '0.01em',
          },
          caption: {
            fontSize: '0.75rem',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
            fontWeight: 400,
          },
          overline: {
            fontSize: '0.6875rem',
            fontWeight: 600,
            lineHeight: 2,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          },
        },
        shape: {
          borderRadius: 16,
        },
        shadows: [
          'none',
          mode === "dark"
            ? '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)'
            : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          mode === "dark"
            ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.4)'
            : '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.03)',
          mode === "dark"
            ? '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)'
            : '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
          mode === "dark"
            ? '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)'
            : '0 20px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.05)',
          mode === "dark"
            ? '0 25px 50px -12px rgba(0,0,0,0.6)'
            : '0 25px 50px -12px rgba(0,0,0,0.12)',
          mode === "dark"
            ? '0 25px 50px -12px rgba(0,0,0,0.6)'
            : '0 25px 50px -12px rgba(0,0,0,0.14)',
          mode === "dark"
            ? '0 25px 50px -12px rgba(0,0,0,0.6)'
            : '0 25px 50px -12px rgba(0,0,0,0.16)',
          mode === "dark"
            ? '0 25px 50px -12px rgba(0,0,0,0.65)'
            : '0 25px 50px -12px rgba(0,0,0,0.18)',
          mode === "dark"
            ? '0 25px 50px -12px rgba(0,0,0,0.65)'
            : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
          mode === "dark" ? '0 25px 50px -12px rgba(0,0,0,0.65)' : '0 25px 50px -12px rgba(0,0,0,0.20)',
        ],
        breakpoints: {
          values: {
            xs: 0,
            sm: 640,
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
                margin: 0,
                padding: 0,
              },
              html: {
                MozOsxFontSmoothing: 'grayscale',
                WebkitFontSmoothing: 'antialiased',
                textRendering: 'optimizeLegibility',
              },
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === "dark"
                  ? '#2A2B3D #13141F'
                  : '#D1D5DB #FAFBFD',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === "dark" ? '#13141F' : '#FAFBFD',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === "dark"
                    ? alpha('#B794F6', 0.2)
                    : alpha('#8B5CF6', 0.15),
                  borderRadius: '4px',
                  '&:hover': {
                    background: mode === "dark"
                      ? alpha('#B794F6', 0.35)
                      : alpha('#8B5CF6', 0.25),
                  },
                },
              },
              '::selection': {
                backgroundColor: mode === "dark"
                  ? alpha('#B794F6', 0.25)
                  : alpha('#8B5CF6', 0.15),
                color: mode === "dark" ? '#FFFFFF' : '#0F1419',
              },
              '@keyframes shimmer': {
                '0%': {
                  backgroundPosition: '-1000px 0',
                },
                '100%': {
                  backgroundPosition: '1000px 0',
                },
              },
              '@keyframes fadeInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(12px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
              '@keyframes scaleIn': {
                from: {
                  opacity: 0,
                  transform: 'scale(0.95)',
                },
                to: {
                  opacity: 1,
                  transform: 'scale(1)',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: '10px 24px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '@media (max-width:600px)': {
                  padding: '8px 20px',
                  fontSize: '0.875rem',
                },
                '&:hover': {
                  boxShadow: 'none',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              },
              contained: {
                background: mode === "dark"
                  ? 'linear-gradient(135deg, #B794F6 0%, #9D75F7 100%)'
                  : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#FFFFFF !important',
                boxShadow: mode === "dark"
                  ? '0 4px 12px rgba(183, 148, 246, 0.20)'
                  : '0 4px 12px rgba(139, 92, 246, 0.25)',
                '&:hover': {
                  background: mode === "dark"
                    ? 'linear-gradient(135deg, #D4C5F9 0%, #B794F6 100%)'
                    : 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                  boxShadow: mode === "dark"
                    ? '0 6px 20px rgba(183, 148, 246, 0.35)'
                    : '0 6px 20px rgba(139, 92, 246, 0.40)',
                },
                '&.Mui-disabled': {
                  background: mode === "dark"
                    ? alpha('#B794F6', 0.25)
                    : alpha('#8B5CF6', 0.20),
                  color: `${alpha('#FFFFFF', 0.4)} !important`,
                },
              },
              outlined: {
                borderWidth: '1.5px',
                borderColor: mode === "dark"
                  ? alpha('#B794F6', 0.4)
                  : alpha('#8B5CF6', 0.3),
                color: mode === "dark" ? '#D4C5F9' : '#7C3AED',
                '&:hover': {
                  borderWidth: '1.5px',
                  borderColor: mode === "dark" ? '#B794F6' : '#8B5CF6',
                  backgroundColor: mode === "dark"
                    ? alpha('#B794F6', 0.08)
                    : alpha('#8B5CF6', 0.06),
                },
              },
              text: {
                color: mode === "dark" ? '#D4C5F9' : '#7C3AED',
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#B794F6', 0.08)
                    : alpha('#8B5CF6', 0.06),
                },
              },
              sizeSmall: {
                padding: '6px 16px',
                fontSize: '0.8125rem',
                borderRadius: 10,
              },
              sizeLarge: {
                padding: '14px 32px',
                fontSize: '1rem',
                borderRadius: 14,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                backgroundImage: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: `1px solid ${mode === "dark" ? alpha('#B794F6', 0.06) : alpha('#8B5CF6', 0.04)}`,
              },
              elevation0: {
                boxShadow: 'none',
                border: 'none',
              },
              elevation1: {
                boxShadow: mode === "dark"
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
              },
              elevation2: {
                boxShadow: mode === "dark"
                  ? '0 4px 16px rgba(0, 0, 0, 0.35)'
                  : '0 4px 16px rgba(0, 0, 0, 0.06)',
              },
              elevation3: {
                boxShadow: mode === "dark"
                  ? '0 8px 24px rgba(0, 0, 0, 0.40)'
                  : '0 8px 24px rgba(0, 0, 0, 0.08)',
              },
              elevation4: {
                boxShadow: mode === "dark"
                  ? '0 12px 32px rgba(0, 0, 0, 0.45)'
                  : '0 12px 32px rgba(0, 0, 0, 0.10)',
              },
              elevation8: {
                boxShadow: mode === "dark"
                  ? '0 20px 40px rgba(0, 0, 0, 0.50)'
                  : '0 20px 40px rgba(0, 0, 0, 0.14)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                border: `1px solid ${mode === "dark" ? alpha('#B794F6', 0.08) : alpha('#8B5CF6', 0.06)}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === "dark"
                    ? '0 12px 36px rgba(0, 0, 0, 0.45)'
                    : '0 12px 36px rgba(0, 0, 0, 0.10)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.8125rem',
                height: 32,
                transition: 'all 0.2s',
              },
              outlined: {
                borderWidth: '1.5px',
              },
              colorPrimary: {
                background: mode === "dark"
                  ? alpha('#B794F6', 0.12)
                  : alpha('#8B5CF6', 0.08),
                color: mode === "dark" ? '#D4C5F9' : '#7C3AED',
                border: `1.5px solid ${mode === "dark" ? alpha('#B794F6', 0.25) : alpha('#8B5CF6', 0.15)}`,
                '&:hover': {
                  background: mode === "dark"
                    ? alpha('#B794F6', 0.18)
                    : alpha('#8B5CF6', 0.12),
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 14,
                  transition: 'all 0.2s',
                  '& fieldset': {
                    borderWidth: '1.5px',
                    borderColor: mode === "dark"
                      ? alpha('#B794F6', 0.15)
                      : alpha('#8B5CF6', 0.12),
                  },
                  '&:hover fieldset': {
                    borderWidth: '1.5px',
                    borderColor: mode === "dark"
                      ? alpha('#B794F6', 0.3)
                      : alpha('#8B5CF6', 0.2),
                  },
                  '&.Mui-focused fieldset': {
                    borderWidth: '2px',
                    borderColor: mode === "dark" ? '#B794F6' : '#8B5CF6',
                  },
                },
              },
            },
          },
          MuiAvatar: {
            styleOverrides: {
              root: {
                fontWeight: 600,
                border: `2px solid ${mode === "dark" ? alpha('#B794F6', 0.15) : alpha('#8B5CF6', 0.10)}`,
                transition: 'all 0.2s',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                transition: 'all 0.2s',
                color: mode === "dark" ? '#B4B8C5' : '#536471',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: mode === "dark"
                    ? alpha('#B794F6', 0.08)
                    : alpha('#8B5CF6', 0.06),
                  color: mode === "dark" ? '#F7F8FA' : '#8B5CF6',
                },
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                borderRadius: 16,
                boxShadow: mode === "dark"
                  ? '0 12px 40px rgba(0, 0, 0, 0.5)'
                  : '0 12px 40px rgba(0, 0, 0, 0.12)',
                border: `1px solid ${mode === "dark" ? alpha('#B794F6', 0.10) : alpha('#8B5CF6', 0.06)}`,
                backdropFilter: 'blur(20px)',
                backgroundColor: mode === "dark"
                  ? alpha('#13141F', 0.98)
                  : alpha('#FFFFFF', 0.98),
              },
              list: {
                padding: '8px',
              },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                margin: '2px 0',
                padding: '10px 14px',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: mode === "dark"
                    ? alpha('#B794F6', 0.12)
                    : alpha('#8B5CF6', 0.08),
                },
                '&.Mui-selected': {
                  backgroundColor: mode === "dark"
                    ? alpha('#B794F6', 0.16)
                    : alpha('#8B5CF6', 0.12),
                  '&:hover': {
                    backgroundColor: mode === "dark"
                      ? alpha('#B794F6', 0.20)
                      : alpha('#8B5CF6', 0.16),
                  },
                },
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: mode === "dark"
                  ? alpha('#B794F6', 0.08)
                  : alpha('#8B5CF6', 0.06),
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 24,
                boxShadow: mode === "dark"
                  ? '0 24px 64px rgba(0, 0, 0, 0.6)'
                  : '0 24px 64px rgba(0, 0, 0, 0.16)',
                border: `1px solid ${mode === "dark" ? alpha('#B794F6', 0.10) : alpha('#8B5CF6', 0.06)}`,
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                borderRadius: 10,
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: '8px 14px',
                backgroundColor: mode === "dark"
                  ? alpha('#0A0B14', 0.98)
                  : alpha('#0F1419', 0.96),
                backdropFilter: 'blur(12px)',
                boxShadow: mode === "dark"
                  ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                  : '0 4px 20px rgba(0, 0, 0, 0.25)',
              },
            },
          },
          MuiBadge: {
            styleOverrides: {
              badge: {
                fontWeight: 600,
                fontSize: '0.6875rem',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                boxShadow: mode === "dark"
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.12)',
              },
            },
          },
          MuiBackdrop: {
            styleOverrides: {
              root: {
                backgroundColor: mode === "dark"
                  ? 'rgba(0, 0, 0, 0.65)'
                  : 'rgba(0, 0, 0, 0.40)',
                backdropFilter: 'blur(8px)',
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