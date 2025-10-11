"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { styled, CSSObject, Theme, useTheme } from "@mui/material/styles";
import {
  Box,
  Drawer as MuiDrawer,
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
} from "@mui/icons-material";
import { TbBinaryTree } from "react-icons/tb";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { toggleMode } from "@/store/themeSlice";
import { Style_Script } from "next/font/google";

const styleScript = Style_Script({
  subsets: ["latin"],
  weight: "400",
});

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
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
}));

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...openedMixin(theme),
  "& .MuiDrawer-paper": openedMixin(theme),
}));

/* ---------------- Header Component ---------------- */
export default function Header({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.theme.mode);
  const currentUser = useSelector(
    (state: RootState) => state.user?.currentUser
  ); // optional if you added userSlice
  const pathname = usePathname();

  // Notifications (local state for now)
  const [notifications, setNotifications] = React.useState<
    { id: string; title: string; body: string; read: boolean }[]
  >([
    {
      id: "1",
      title: "New comment",
      body: "Alice commented on your post",
      read: false,
    },
    {
      id: "2",
      title: "Event reminder",
      body: "Family Reunion in 5 days",
      read: false,
    },
    { id: "3", title: "Like", body: "Bob liked your photo", read: true },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(
    null
  );
  const notifOpen = Boolean(notifAnchorEl);
  const notifId = notifOpen ? "notifications-popover" : undefined;
  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) =>
    setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);
  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // Drawer nav config (with hrefs)
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
  ];

  // Optional: profile entry (go to /u/[username]) if you have currentUser
  const profileHref = currentUser ? `/${currentUser.username}` : "/john"; // fallback demo

  const contacts = [
    { name: "Alice", avatar: "/avatar4.png", online: true },
    { name: "Bob", avatar: "/avatar5.png", online: false },
    { name: "Charlie", avatar: "/avatar6.png", online: true },
  ];

  const upcomingEvents = [
    { title: "Family Reunion", date: "Oct 15, 2025" },
    { title: "Birthday Party", date: "Oct 20, 2025" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar>
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontFamily: styleScript.style.fontFamily,
              fontSize: "1.8rem",
              letterSpacing: 0.5,
            }}
          >
            Family First
          </Typography>

          <Box
            sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
          >
            <IconButton
              size="large"
              aria-describedby={notifId}
              aria-haspopup="true"
              aria-controls={notifId}
              onClick={handleNotifClick}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications popover */}
      <Popover
        id={notifId}
        open={notifOpen}
        anchorEl={notifAnchorEl}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: "90vw",
              p: 1,
              borderRadius: 2,
            },
          },
        }}
      >
        <Box
          sx={{
            px: 1,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1">Notifications</Typography>
          <Button
            size="small"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />
        <List dense disablePadding>
          {notifications.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You’re all caught up 🎉
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItem
                key={n.id}
                disableGutters
                sx={{
                  px: 1,
                  bgcolor: n.read
                    ? "transparent"
                    : (t) => t.palette.action.hover,
                  "&:hover": { bgcolor: (t) => t.palette.action.selected },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 28, height: 28 }}>{n.title[0]}</Avatar>
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
                    <Typography variant="caption">{n.body}</Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Popover>

      {/* Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        {/* space under AppBar */}
        <DrawerHeader />
        {/* Main nav */}
        <List>
          {mainMenu.map((item) => {
            const active = item.match(pathname);
            return (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ display: "block" }}
              >
                <ListItemButton
                  component={Link}
                  href={item.href}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    justifyContent: "initial",
                    ...(active && {
                      bgcolor: (t) => t.palette.action.selected,
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 0, justifyContent: "center", mr: 3 }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: 1 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider />

        {/* Secondary */}
        <List>
          {secondaryMenu.map((item) => {
            const active = item.match?.(pathname) ?? false;
            const buttonProps = item.href
              ? { component: Link, href: item.href }
              : { onClick: item.onClick };

            return (
              <ListItem
                key={item.text}
                disablePadding
                sx={{ display: "block" }}
              >
                <ListItemButton
                  {...buttonProps}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                    justifyContent: "initial",
                    ...(active && {
                      bgcolor: (t) => t.palette.action.selected,
                    }),
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: 0, justifyContent: "center", mr: 3 }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: 1 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider />
        {/* Profile entry (top) */}
        <List>
          <ListItem disablePadding sx={{ display: "block" }}>
            <ListItemButton
              component={Link}
              href={profileHref}
              sx={{
                minHeight: 48,
                px: 2.5,
                justifyContent: "initial",
                ...(pathname.startsWith("/") && {
                  bgcolor: (t) => t.palette.action.selected,
                }),
              }}
            >
              <ListItemIcon
                sx={{ minWidth: 0, justifyContent: "center", mr: 3 }}
              >
                <AccountCircle />
              </ListItemIcon>
              <ListItemText
                primary={currentUser ? currentUser.username : "Profile"}
                sx={{ opacity: 1 }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Container>
        <Grid container spacing={3}>
          {/* Main content — IMPORTANT: offset by drawer width */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 3,
    bgcolor: theme.palette.background.default,
    color: theme.palette.text.primary,
    marginTop: "64px",
    height: "calc(100vh - 64px)",
    overflowY: "auto",
    /* 👇 hide scrollbar (cross-browser) */
    scrollbarWidth: "none", // Firefox
    msOverflowStyle: "none", // IE/Edge
    "&::-webkit-scrollbar": {
      display: "none", // Chrome, Safari, Opera
    },
  }}
>
  {children}
</Box>

          </Grid>
          {/* Sidebar */}
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{
              flexGrow: 1,
              py: 3,
              bgcolor: theme.palette.background.default,
              color: theme.palette.text.primary,
              marginTop: "64px",
              height: "calc(100vh - 64px)",
              overflowY: "auto",
            }}
          >
            <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Online Contacts
              </Typography>
              <Divider />
              <Box display="flex" flexDirection="column" gap={1} mb={2} mt={2}>
                {contacts.map((contact, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1}>
                    <Badge
                      variant="dot"
                      color="success"
                      invisible={!contact.online}
                      overlap="circular"
                    >
                      <Avatar src={contact.avatar} />
                    </Badge>
                    <Typography variant="body2">{contact.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Events
              </Typography>
              <Divider />
              <Box display="flex" flexDirection="column" gap={1} mb={2} mt={2}>
                {upcomingEvents.map((event, i) => (
                  <Paper
                    key={i}
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2">{event.title}</Typography>
                    <Chip label={event.date} size="small" />
                  </Paper>
                ))}
              </Box>
              <Divider />
              <Typography variant="h6" gutterBottom>
                See All Events
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
