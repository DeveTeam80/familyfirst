"use client";

import * as React from "react";
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
  weight: "400", // only 400 available
});

const drawerWidth = 240;

/* ---------------- MUI Drawer Mixins (opened only) ---------------- */
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

/* ---------------- Drawer & AppBar ---------------- */
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

// Keep the app bar fixed & full width (independent of drawer)
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

// Drawer is always opened
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

  // EXAMPLE notifications state (replace with your store later if you have one)
  const [notifications, setNotifications] = React.useState<
    { id: string; title: string; body: string; read: boolean }[]
  >([
    { id: "1", title: "New comment", body: "Alice commented on your post", read: false },
    { id: "2", title: "Event reminder", body: "Family Reunion in 5 days", read: false },
    { id: "3", title: "Like", body: "Bob liked your photo", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Popover anchor for notifications
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
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

  // Drawer menu items
  const mainMenu = [
    { text: "Activity", icon: <Home /> },
    { text: "Calendar", icon: <EventIcon /> },
    { text: "Family Tree", icon: <TbBinaryTree /> },
    { text: "Gallery", icon: <PhotoCameraBack /> },
    { text: "Recipe Book", icon: <MenuBook /> },
    { text: "Memories", icon: <EventRepeat /> },
  ];

  const secondaryMenu = [
    {
      text: mode === "light" ? "Dark Mode" : "Light Mode",
      icon: mode === "light" ? <DarkModeIcon /> : <LightModeIcon />,
      onClick: () => dispatch(toggleMode()),
    },
    { text: "Settings", icon: <SettingsIcon /> },
    { text: "Help", icon: <HelpOutlineIcon /> },
  ];

  const userMenu = [{ text: "John Doe", icon: <AccountCircle /> }];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Fixed AppBar */}
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

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
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

      {/* Notifications Popover (anchored under the icon) */}
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
        <Box sx={{ px: 1, py: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1">Notifications</Typography>
          <Button size="small" onClick={markAllAsRead} disabled={unreadCount === 0}>
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
                  bgcolor: n.read ? "transparent" : (theme) => theme.palette.action.hover,
                  "&:hover": { bgcolor: (theme) => theme.palette.action.selected },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ width: 28, height: 28 }}>{n.title[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                      {n.title}
                    </Typography>
                  }
                  secondary={<Typography variant="caption">{n.body}</Typography>}
                />
              </ListItem>
            ))
          )}
        </List>
      </Popover>

      {/* Always-open Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          "& .MuiDrawer-paper": {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        {/* Push drawer content below AppBar height */}
        <DrawerHeader />

        <List>
          {mainMenu.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: "initial",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                    mr: 3,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: 1 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        <List>
          {secondaryMenu.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                onClick={item.onClick}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: "initial",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                    mr: 3,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: 1 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        <List>
          {userMenu.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  justifyContent: "initial",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                    mr: 3,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: 1 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content (scrolls), offset for fixed AppBar & permanent Drawer */}
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
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
