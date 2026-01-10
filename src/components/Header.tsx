// src/components/Header.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  styled,
  CSSObject,
  Theme,
  useTheme,
  alpha,
} from "@mui/material/styles";
import {
  Box,
  Drawer as MuiDrawer,
  SwipeableDrawer,
  AppBar as MuiAppBar,
  Toolbar,
  List,
  CssBaseline,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Popover,
  ListItemAvatar,
  Avatar,
  Button,
  Grid,
  Paper,
  Chip,
  Container,
  Tooltip,
  useMediaQuery,
  Switch,
  Stack,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Event as EventIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpOutlineIcon,
  Home,
  PhotoCameraBack,
  MenuBook,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Circle as CircleIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { TbBinaryTree } from "react-icons/tb";
import {
  FiUser,
  FiMoon,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { toggleMode } from "@/store/themeSlice";
import { Style_Script } from "next/font/google";
import Image from "next/image";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

const styleScript = Style_Script({
  subsets: ["latin"],
  weight: "400",
});

// Type definitions
type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
};

type Contact = {
  name: string;
  avatar: string;
  online: boolean;
};

interface ExtendedUser {
  username?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

type UpcomingEvent = {
  title: string;
  date: string;
  color:
  | "primary"
  | "secondary"
  | "default"
  | "error"
  | "info"
  | "success"
  | "warning";
};

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
  borderRight: `1px solid ${theme.palette.divider}`,
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...openedMixin(theme),
  "& .MuiDrawer-paper": {
    ...openedMixin(theme),
    backgroundColor: theme.palette.background.paper,
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.palette.divider} transparent`,
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: theme.palette.divider,
      borderRadius: "3px",
      "&:hover": {
        background: alpha(theme.palette.text.primary, 0.2),
      },
    },
  },
}));

dayjs.extend(relativeTime);

/* ---------------- Header Component ---------------- */
interface HeaderProps {
  children: React.ReactNode;
  onNotificationClick?: (postId: string) => void;
}

export default function Header({ children, onNotificationClick }: HeaderProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: session } = useSession();
  const mode = useSelector((state: RootState) => state.theme.mode);
  const currentUser = useSelector(
    (state: RootState) => state.user?.currentUser
  );
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = React.useState(false);


  const getDisplayInfo = () => {
    if (currentUser && "username" in currentUser) {
      return {
        displayName: currentUser.name || currentUser.username || "User",
        username: currentUser.username || currentUser.name?.toLowerCase().replace(/\s+/g, "") || "user",
        avatar: currentUser.avatar ?? null,
      };
    }

    if (session?.user) {
      return {
        displayName: session.user.name || "User",
        username:
          (session.user as ExtendedUser).username ||
          session.user.name?.toLowerCase().replace(/\s+/g, "") ||
          session.user.email?.split("@")[0] ||
          "user",
        avatar: session.user.image as string | null | undefined,
      };
    }

    return {
      displayName: "Profile",
      username: "profile",
      avatar: null as string | null,
    };
  };
  useOnlineStatus();
  const {
    notifications,
    unreadCount,
    onlineMembers,
    connected: _connected,
    markAsRead
  } = useRealtimeUpdates();


  const { displayName, username, avatar } = getDisplayInfo();
  const profileHref = `/${username}`;

  // Logout handler
 const handleLogout = async () => {
    // 1. Fire and forget the offline status (don't await it blocking the UI)
    fetch("/api/user/online-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: false }),
      keepalive: true // 👈 Add this to ensure it finishes even if page unloads
    }).catch(err => console.error("Offline status error", err));

    // 2. Destroy session immediately
    await signOut({ callbackUrl: "/login" });
  };


  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const notifOpen = Boolean(notifAnchorEl);
  const notifId = notifOpen ? "notifications-popover" : undefined;

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };


  // User popover state
  const [userAnchorEl, setUserAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const userMenuOpen = Boolean(userAnchorEl);
  const userMenuId = userMenuOpen ? "user-menu-popover" : undefined;

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserAnchorEl(null);
  };

  const handleGoToProfile = () => {
    handleUserMenuClose();
    router.push(profileHref);
  };

  const handleUserLogoutClick = async () => {
    handleUserMenuClose();
    await handleLogout();
  };


  const mainMenu: {
    text: string;
    icon: React.ReactNode;
    href: string;
    match: (p: string) => boolean;
    comingSoon?: boolean;
  }[] = [
      {
        text: "Activity",
        icon: <Home />,
        href: "/feed",
        match: (p) => p.startsWith("/feed") || p === "/",
      },
      {
        text: "Calendar",
        icon: <EventIcon />,
        href: "/calendar",
        match: (p) => p.startsWith("/calendar"),
        comingSoon: true,
      },
      {
        text: "Family Tree",
        icon: <TbBinaryTree />,
        href: "/tree",
        match: (p) => p.startsWith("/tree"),
      },
      {
        text: "Gallery",
        icon: <PhotoCameraBack />,
        href: "/gallery",
        match: (p) => p.startsWith("/gallery"),
      },
      {
        text: "Recipe Book",
        icon: <MenuBook />,
        href: "/recipes",
        match: (p) => p.startsWith("/recipes"),
        comingSoon: true,
      },
    ];

  const secondaryMenu: {
    text: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    match?: (p: string) => boolean;
    comingSoon?: boolean;
  }[] = [
      {
        text: mode === "light" ? "Dark Mode" : "Light Mode",
        icon: mode === "light" ? <DarkModeIcon /> : <LightModeIcon />,
        onClick: () => dispatch(toggleMode()),
      },
      {
        text: "Settings",
        icon: <SettingsIcon />,
        href: "/settings",
        match: (p) => p.startsWith("/settings"),
      },
      {
        text: "Help",
        icon: <HelpOutlineIcon />,
        href: "/help",
        comingSoon: true,
        match: (p) => p.startsWith("/help"),
      },
      {
        text: "Logout",
        icon: <LogoutIcon />,
        onClick: handleLogout,
      },
    ];

  const contacts: Contact[] = [
    { name: "Alice", avatar: "/avatar4.png", online: true },
    { name: "Bob", avatar: "/avatar5.png", online: false },
    { name: "Charlie", avatar: "/avatar6.png", online: true },
  ];

  const upcomingEvents: UpcomingEvent[] = [
    { title: "Family Reunion", date: "Oct 15, 2025", color: "primary" },
    { title: "Birthday Party", date: "Oct 20, 2025", color: "secondary" },
  ];

  // Drawer Content Component
  const DrawerContent = () => (
    <>
      <DrawerHeader />

      {/* Main Navigation */}
      <List sx={{ px: 1 }}>
        {mainMenu.map((item) => {
          const active = item.match(pathname);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={(e) => {
                  if (item.comingSoon) {
                    e.preventDefault();
                  }
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  px: 2,
                  transition: "all 0.2s",
                  ...(item.comingSoon && {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  }),
                  ...(active && !item.comingSoon && {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.16),
                    },
                  }),
                  ...(!active && !item.comingSoon && {
                    "&:hover": {
                      bgcolor: alpha(theme.palette.action.hover, 0.6),
                    },
                  }),
                  ...(item.comingSoon && {
                    "&:hover": {
                      bgcolor: alpha(theme.palette.action.hover, 0.3),
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 2,
                    color: active ? theme.palette.primary.main : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: active ? 600 : 500,
                  }}
                />
                {item.comingSoon && (
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* Secondary Menu - UPDATED WITH COMING SOON LOGIC */}
      <List sx={{ px: 1 }}>
        {secondaryMenu.map((item) => {
          const active = item.match?.(pathname) ?? false;
          const buttonProps = item.href
            ? { component: Link, href: item.href }
            : {};

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                {...buttonProps}
                onClick={(e) => {
                  if (item.comingSoon) {
                    e.preventDefault();
                    return;
                  }
                  if (item.onClick) {
                    item.onClick();
                  }
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  px: 2,
                  transition: "all 0.2s",
                  // Disabled Style for Coming Soon
                  ...(item.comingSoon && {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  }),
                  // Active Style
                  ...(active && !item.comingSoon && {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                  }),
                  // Hover Style (Standard)
                  ...(!active && !item.comingSoon && {
                    "&:hover": {
                      bgcolor: alpha(theme.palette.action.hover, 0.6),
                    },
                  }),
                  // Hover Style (Coming Soon)
                  ...(item.comingSoon && {
                    "&:hover": {
                      bgcolor: "transparent", // Or slight hover effect if preferred
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 2,
                    color: active && !item.comingSoon ? theme.palette.primary.main : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: active ? 600 : 500,
                  }}
                />
                {/* Render 'Soon' Chip */}
                {item.comingSoon && (
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen((prev) => !prev)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Image
              src="/assets/ff-logo.png"
              alt="First Family Logo"
              width={isMobile ? 110 : 150}
              height={isMobile ? 34 : 46}
              style={{
                objectFit: "contain",
                cursor: "pointer",
              }}
              onClick={() => router.push("/feed")}
            />
          </Box>

          {/* Right side: Notifications + User menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 } }}>
            {/* Notification Button */}
            <Tooltip title="Notifications">
              <IconButton
                size={isMobile ? "small" : "medium"}
                aria-describedby={notifId}
                onClick={handleNotifClick}
                sx={{
                  transition: "all 0.2s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": { fontWeight: 600 },
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Icon / Avatar */}
            <Tooltip title="Account">
              <IconButton
                aria-describedby={userMenuId}
                onClick={handleUserMenuOpen}
                sx={{
                  transition: "all 0.2s",
                  borderRadius: "50%",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 0.25,
                  "&:hover": { transform: "scale(1.05)", boxShadow: 2 },
                }}
                size={isMobile ? "medium" : "large"}
              >
                {avatar ? (
                  <Avatar src={avatar} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Dropdown Popover */}
      <Popover
        id={userMenuId}
        open={userMenuOpen}
        anchorEl={userAnchorEl}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: 6,
            overflow: "hidden",
            width: { xs: 280, sm: 320 },
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: "background.paper" }}>
          {/* Top user info */}
          <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
            <Avatar
              alt={displayName}
              src={avatar || undefined}
              sx={{ width: 48, height: 48 }}
            />
            <Box sx={{ minWidth: 0, position: "relative" }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {displayName}
              </Typography>
              <Box
                component="button"
                onClick={handleGoToProfile}
                style={{
                  position: "absolute",
                  inset: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </Box>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* Main actions */}
          <List
            dense
            disablePadding
            sx={{
              "& .MuiListItemButton-root": {
                borderRadius: 2,
                mb: 0.5,
              },
            }}
          >
            {/* My Account */}
            <ListItemButton
              component={Link}
              href={profileHref}
              onClick={handleUserMenuClose}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <FiUser />
              </ListItemIcon>
              <ListItemText
                primary="My Account"
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }}
              />
            </ListItemButton>

            {/* Settings */}
            <ListItemButton
              component={Link}
              href="/settings"
              onClick={handleUserMenuClose}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <FiSettings />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }}
              />
            </ListItemButton>
          </List>

          <Divider sx={{ my: 1.5 }} />

          {/* Dark theme + Help + Logout */}
          <List dense disablePadding>
            {/* Dark theme toggle */}
            <ListItemButton
              disableRipple
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <FiMoon />
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  Dark theme
                </Typography>
              </Stack>
              <Switch
                size="small"
                checked={mode === "dark"}
                onChange={() => dispatch(toggleMode())}
              />
            </ListItemButton>

            {/* Help */}
            <ListItemButton
              component={Link}
              href="/help"
              onClick={(e) => {
                // Inline coming soon check for the popover menu item (optional but good for consistency)
                e.preventDefault();
                // handleUserMenuClose(); // Keep open or close based on preference for disabled items
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                opacity: 0.6, // Visual cue in popover
                cursor: "not-allowed",
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <FiHelpCircle />
              </ListItemIcon>
              <ListItemText
                primary="Help"
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }}
              />
              <Chip
                label="Soon"
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  ml: 1
                }}
              />
            </ListItemButton>

            {/* Logout */}
            <ListItemButton
              onClick={handleUserLogoutClick}
              sx={{
                borderRadius: 2,
                mt: 0.5,
                color: "error.main",
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "error.main" }}>
                <FiLogOut />
              </ListItemIcon>
              <ListItemText
                primary="Log out"
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Popover>

      {/* Notifications Popover */}
      <Popover
        id={notifId}
        open={notifOpen}
        anchorEl={notifAnchorEl}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              width: isMobile ? "calc(100vw - 32px)" : 420,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: isMobile ? "70vh" : "60vh",
              borderRadius: 3,
              mt: 1.5,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
            position: "sticky",
            top: 0,
            bgcolor: "background.paper",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={600}
            fontSize={isMobile ? "1rem" : "1.25rem"}
          >
            Notifications
          </Typography>
          <Button
            size="small"
            onClick={() => markAsRead()}
            disabled={unreadCount === 0}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Mark all read
          </Button>
        </Box>
        <List dense disablePadding sx={{ maxHeight: isMobile ? "calc(70vh - 60px)" : "calc(60vh - 60px)", overflow: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                You&apos;re all caught up 🎉
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItem
                key={n.id}
                disableGutters
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Mark notification as read
                  if (!n.isRead) {
                    markAsRead(n.id);
                  }

                  // Close the popover
                  handleNotifClose();

                  // Handle post navigation
                  if (n.relatedType === "post" && n.relatedId) {
                    // If we're already on feed, use the callback to scroll/open modal
                    if (pathname === "/feed" || pathname === "/") {
                      onNotificationClick?.(n.relatedId);
                    } else {
                      // Navigate to feed first, then the callback will handle it
                      router.push(`/feed?postId=${n.relatedId}`);
                    }
                  } else if (n.relatedType === "comment" && n.relatedId) {
                    if (pathname === "/feed" || pathname === "/") {
                      onNotificationClick?.(n.relatedId);
                    } else {
                      router.push(`/feed?postId=${n.relatedId}`);
                    }
                  }
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: n.isRead
                    ? "transparent"
                    : alpha(theme.palette.primary.main, 0.08),
                  borderLeft: n.isRead
                    ? "none"
                    : `3px solid ${theme.palette.primary.main}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.action.hover, 0.8),
                    cursor: "pointer",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={n.actorAvatar || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  >
                    {n.actorName?.[0] || n.title[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: n.isRead ? 400 : 600 }}
                    >
                      {n.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mb: 0.5 }}
                      >
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(n.createdAt).fromNow()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Popover>

      {/* Mobile Drawer */}
      {isMobile ? (
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          onOpen={() => setMobileOpen(true)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <DrawerContent />
        </SwipeableDrawer>
      ) : (
        <Drawer variant="permanent">
          <DrawerContent />
        </Drawer>
      )}

      {/* Main Content Area */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, px: isMobile ? 1 : 3 }}>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Main content */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                py: isMobile ? 2 : 3,
                marginTop: { xs: "56px", sm: "64px" },
                minHeight: "calc(100vh - 64px)",
              }}
            >
              {children}
            </Box>
          </Grid>

          {/* Right Sidebar - Hidden on mobile */}
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              display: { xs: "none", md: "block" },
              py: 3,
              marginTop: "64px",
            }}
          >
            {/* Online Contacts */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Online Now
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                {onlineMembers.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 2 }}
                  >
                    No one is online right now
                  </Typography>
                ) : (
                  onlineMembers.map((member) => (
                    <Box
                      key={member.id}
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.action.hover, 0.5),
                          cursor: "pointer",
                        },
                      }}
                    >
                      <Badge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        badgeContent={
                          member.online ? (
                            <CircleIcon
                              sx={{
                                width: 12,
                                height: 12,
                                color: "success.main",
                                border: `2px solid ${theme.palette.background.paper}`,
                                borderRadius: "50%",
                              }}
                            />
                          ) : null
                        }
                      >
                        <Avatar
                          src={member.avatar || undefined}
                          sx={{ width: 40, height: 40 }}
                        >
                          {member.name[0]}
                        </Avatar>
                      </Badge>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {member.name}
                        </Typography>
                        {!member.online && member.lastSeen && (
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(member.lastSeen).fromNow()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            {/* Upcoming Events */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                Upcoming Events
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                  py: 3,
                }}
              >
                <Chip
                  label="Coming Soon"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: "center" }}
                >
                  Calendar events feature in development
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}