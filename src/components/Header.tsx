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
} from "@mui/icons-material";
import { TbBinaryTree } from "react-icons/tb";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { toggleMode } from "@/store/themeSlice";

const drawerWidth = 240;

// ---------------- MUI Drawer Mixins ----------------
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// ---------------- Drawer & AppBar ----------------
const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

// ---------------- Header Component ----------------
export default function Header({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.theme.mode);
  const [open, setOpen] = React.useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleThemeToggle = () => dispatch(toggleMode());

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
      onClick: handleThemeToggle,
    },
    { text: "Settings", icon: <SettingsIcon /> },
    { text: "Help", icon: <HelpOutlineIcon /> },
  ];

  const userMenu = [{ text: "John Doe", icon: <AccountCircle /> }];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        open={open && !isMobile}
        sx={{
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Family First
          </Typography>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            <IconButton size="large">
              <Badge badgeContent={5} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        onMouseEnter={handleDrawerOpen}
        onMouseLeave={handleDrawerClose}
        sx={{
          "& .MuiDrawer-paper": {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        <DrawerHeader />

        <List>
          {mainMenu.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open ? { justifyContent: "initial" } : { justifyContent: "center" },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: "center" },
                    open ? { mr: 3 } : { mr: "auto" },
                  ]}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
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
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open ? { justifyContent: "initial" } : { justifyContent: "center" },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: "center" },
                    open ? { mr: 3 } : { mr: "auto" },
                  ]}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        <List>
          {userMenu.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={[
                  { minHeight: 48, px: 2.5 },
                  open ? { justifyContent: "initial" } : { justifyContent: "center" },
                ]}
              >
                <ListItemIcon
                  sx={[
                    { minWidth: 0, justifyContent: "center" },
                    open ? { mr: 3 } : { mr: "auto" },
                  ]}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
<Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 3,
    bgcolor: theme.palette.background.default,
    color: theme.palette.text.primary,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }}
>
        <DrawerHeader />
          {children} 
      </Box>
    </Box>
  );
}
