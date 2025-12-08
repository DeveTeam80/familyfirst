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
  EventRepeat,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Circle as CircleIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { TbBinaryTree } from "react-icons/tb";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { toggleMode } from "@/store/themeSlice";
import { Style_Script } from "next/font/google";
import Image from "next/image";

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

/* ---------------- Header Component ---------------- */
export default function Header({ children }: { children: React.ReactNode }) {
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

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // ⭐ Helper to get display name and username
  const getDisplayInfo = () => {
    if (session?.user) {
      // User from NextAuth session
      return {
        displayName: session.user.name || "User",
        username: session.user.name?.toLowerCase().replace(/\s+/g, "") || "user",
        avatar: session.user.image,
      };
    } else if (currentUser && "username" in currentUser) {
      // User from Redux (fallback)
      return {
        displayName: currentUser.username,
        username: currentUser.username,
        avatar: null,
      };
    }
    // Default fallback
    return {
      displayName: "Profile",
      username: "profile",
      avatar: null,
    };
  };

  const { displayName, username, avatar } = getDisplayInfo();

  // Logout handler
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Notifications state
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: "1",
      title: "New comment",
      body: "Alice commented on your post",
      read: false,
      time: "5m ago",
    },
    {
      id: "2",
      title: "Event reminder",
      body: "Family Reunion in 5 days",
      read: false,
      time: "2h ago",
    },
    {
      id: "3",
      title: "Like",
      body: "Bob liked your photo",
      read: true,
      time: "1d ago",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Drawer nav config
  const mainMenu: {
    text: string;
    icon: React.ReactNode;
    href: string;
    match: (p: string) => boolean;
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
    },
    {
      text: "Memories",
      icon: <EventRepeat />,
      href: "/memories",
      match: (p) => p.startsWith("/memories"),
    },
  ];

  const secondaryMenu: {
    text: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    match?: (p: string) => boolean;
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
      match: (p) => p.startsWith("/help"),
    },
    {
      text: "Logout",
      icon: <LogoutIcon />,
      onClick: handleLogout,
    },
  ];

  const profileHref = `/${username}`;

  const contacts: Contact[] = [
    { name: "Alice", avatar: "/avatar4.png", online: true },
    { name: "Bob", avatar: "/avatar5.png", online: false },
    { name: "Charlie", avatar: "/avatar6.png", online: true },
  ];

  const upcomingEvents: UpcomingEvent[] = [
    { title: "Family Reunion", date: "Oct 15, 2025", color: "primary" },
    { title: "Birthday Party", date: "Oct 20, 2025", color: "secondary" },
  ];

  // Drawer Content Component (shared between mobile and desktop)
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
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  minHeight: 48,
                  borderRadius: 2,
                  px: 2,
                  transition: "all 0.2s",
                  ...(active && {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.16),
                    },
                  }),
                  ...(!active && {
                    "&:hover": {
                      bgcolor: alpha(theme.palette.action.hover, 0.6),
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
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* Secondary Menu */}
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
                onClick={() => {
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
                  ...(active && {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                  }),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.action.hover, 0.6),
                  },
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
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* Profile */}
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href={profileHref}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{
              minHeight: 48,
              borderRadius: 2,
              px: 2,
              transition: "all 0.2s",
              ...(pathname.startsWith(`/${username}`) && {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
              }),
              "&:hover": {
                bgcolor: alpha(theme.palette.action.hover, 0.6),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
              {avatar ? (
                <Avatar src={avatar} sx={{ width: 24, height: 24 }} />
              ) : (
                <AccountCircle />
              )}
            </ListItemIcon>
            <ListItemText
              primary={displayName}
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar elevation={0}>
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(true)}
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
              src="/assets/FF logo.png"
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

          {/* Notification Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton
                size={isMobile ? "medium" : "large"}
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
          </Box>
        </Toolbar>
      </AppBar>

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
              width: isMobile ? "90vw" : 380,
              maxWidth: "90vw",
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
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Mark all read
          </Button>
        </Box>
        <List dense disablePadding sx={{ maxHeight: 400, overflow: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                You're all caught up 🎉
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItem
                key={n.id}
                disableGutters
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: n.read
                    ? "transparent"
                    : alpha(theme.palette.primary.main, 0.08),
                  borderLeft: n.read
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
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: theme.palette.primary.main,
                      fontWeight: 600,
                    }}
                  >
                    {n.title[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: n.read ? 400 : 600 }}
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
                        {n.body}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {n.time}
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
                marginTop: "64px",
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
                {contacts.map((contact, i) => (
                  <Box
                    key={i}
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
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      badgeContent={
                        contact.online ? (
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
                        src={contact.avatar}
                        sx={{ width: 40, height: 40 }}
                      />
                    </Badge>
                    <Typography variant="body2" fontWeight={500}>
                      {contact.name}
                    </Typography>
                  </Box>
                ))}
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
              <Box display="flex" flexDirection="column" gap={1.5}>
                {upcomingEvents.map((event, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
                        cursor: "pointer",
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      {event.title}
                    </Typography>
                    <Chip
                      label={event.date}
                      size="small"
                      color={event.color}
                      sx={{ fontSize: "0.7rem", fontWeight: 500 }}
                    />
                  </Paper>
                ))}
              </Box>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                View All Events
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}