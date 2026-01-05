import React from "react";
import {
  Box,
  Paper,
  Skeleton,
  Stack,
  Fade,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";

const SkeletonNode = ({ isMobile }: { isMobile: boolean }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        width: isMobile ? 160 : 220,
        height: 80,
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: "12px",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.4),
      }}
    >
      <Skeleton
        variant="circular"
        width={50}
        height={50}
        sx={{ flexShrink: 0 }}
      />
      <Box sx={{ width: "100%" }}>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="50%" height={20} />
      </Box>
    </Paper>
  );
};

export function TreeSkeleton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        pt: 4,
      }}
    >
      <Fade in timeout={500}>
        <Box>
          <SkeletonNode isMobile={isMobile} />
        </Box>
      </Fade>
      <Skeleton variant="rectangular" width={2} height={40} sx={{ my: -4 }} />
      <Fade in timeout={700}>
        <Stack direction="row" spacing={isMobile ? 2 : 8} alignItems="center">
          <SkeletonNode isMobile={isMobile} />
          <SkeletonNode isMobile={isMobile} />
        </Stack>
      </Fade>
      <Stack direction="row" spacing={isMobile ? 18 : 30} sx={{ my: -4 }}>
        <Skeleton variant="rectangular" width={2} height={40} />
        <Skeleton variant="rectangular" width={2} height={40} />
      </Stack>
      <Fade in timeout={900}>
        <Stack direction="row" spacing={isMobile ? 2 : 4}>
          <SkeletonNode isMobile={isMobile} />
          <SkeletonNode isMobile={isMobile} />
          {!isMobile && <SkeletonNode isMobile={isMobile} />}
        </Stack>
      </Fade>
    </Box>
  );
}