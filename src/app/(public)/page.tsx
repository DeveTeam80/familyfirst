"use client";

import {
  Container,
  Paper,
  Typography,
  Stack,
  Button,
  Box,
  Grid,
} from "@mui/material";
import Image from "next/image";
import { Style_Script } from "next/font/google";

const styleScript = Style_Script({
  subsets: ["latin"],
  weight: "400",
});

export default function LandingPage() {
  return (
    <Container maxWidth="md" sx={{ mt: { xs: 6, md: 10 }, mb: 8 }}>
      {/* Hero Section */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
          <Image
            src="/assets/ff-logo.png" 
            alt="First Family Logo"
            width={220}
            height={80}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
            priority
          />
        </Box>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: "auto", mb: 3 }}
        >
          This private family space was created in remembrance of late{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: "text.primary",
            }}
          >
            Mr. Russel Issac
          </Box>
          , whose love, values, and legacy continue to bring family together. An
          invite-only space for the family to stay connected. End-to-end secure.
          Share updates, photos, recipes securely.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
        >
          <Button
            variant="contained"
            size="large"
            sx={{ px: 4, borderRadius: 2 }}
          >
            Request an Invite
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{ px: 4, borderRadius: 2 }}
            href="/login"
          >
            Login
          </Button>
        </Stack>
      </Paper>

      {/* Features */}
      <Box sx={{ mt: 8 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontFamily: styleScript.style.fontFamily,
            mb: 5,
            fontWeight: 400,
          }}
        >
          What You Can Do
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              title: "Family Feed",
              desc: "Share updates and everyday moments privately with the family.",
            },
            {
              title: "Photo Gallery",
              desc: "Organize and preserve precious memories in one secure place.",
            },
            {
              title: "Family Tree",
              desc: "Visualize your entire lineage beautifully and interactively.",
            },
            {
              title: "Recipe Book",
              desc: "Store traditional recipes and pass them down generations.",
            },
          ].map((item, i) => (
            <Grid key={i} size={{ xs: 12, sm: 3 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: "100%",
                  textAlign: "left",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* How It Works */}
      <Box sx={{ mt: 10 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ fontFamily: styleScript.style.fontFamily, mb: 5 }}
        >
          How It Works
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              num: "1",
              title: "Get an Invite",
              desc: "Family admin sends you an invite code.",
            },
            {
              num: "2",
              title: "Create Your Account",
              desc: "Register using the code, instantly join the family.",
            },
            {
              num: "3",
              title: "Start Sharing",
              desc: "Post updates, upload photos & explore the family Tree.",
            },
          ].map((step, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: "100%",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{ color: "grey.300", fontWeight: "bold", mb: 1 }}
                >
                  {step.num}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 10, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} First Family | Built with love for the
          family. | Empowered by{" "}
          <a
            href="https://www.visionarybizz.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visionary Services
          </a>
        </Typography>
      </Box>
    </Container>
  );
}
