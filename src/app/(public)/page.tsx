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

        {/* Russell Issac Image */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <Image
            src="/assets/russell-issac.jpg" // Ensure you have this image in your public/assets folder
            alt="Mr. Russell Isaac"
            width={180}
            height={180}
            style={{
              borderRadius: "50%",
              border: "4px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              objectFit: "cover",
            }}
            priority
          />
        </Box>

        {/* Dedication / Intro */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: styleScript.style.fontFamily,
              color: "text.primary",
              mb: 1,
            }}
          >
            In Loving Memory of
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}
          >
            Russell Isaac
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            (12th July 1946 - 12th January 2025)
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 700, mx: "auto", lineHeight: 1.8 }}
          >
            Though he no longer walks beside us, his soul, love, and light live
            forever in the deepest corners of our hearts. We created this
            private space to honour him with gratitude, for every memory he
            blessed us with and every lesson he left behind. <br />
            <br />
            Here, the family stays connected, sharing the strength his life
            still gives us.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
        >
          <Button
            variant="contained"
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
          Keeping His Light Alive
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              title: "Family Feed",
              desc: "Share updates and everyday moments. Keep the family close, just as he would have wanted.",
            },
            {
              title: "Photo Gallery",
              desc: "A sanctuary for our cherished memories. Revisit the laughter and presence we miss so much.",
            },
            {
              title: "Family Tree",
              desc: "Visualize the roots he strengthened and the legacy that continues through all of us.",
            },
            {
              title: "Recipe Book",
              desc: "The comfort of home. Preserve the traditional recipes that remind us of his love.",
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
          Join the Family Space
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              num: "1",
              title: "Get an Invite",
              desc: "Family admin sends you a secure invite code.",
            },
            {
              num: "2",
              title: "Create Your Account",
              desc: "Register using the code to instantly join the circle.",
            },
            {
              num: "3",
              title: "Start Sharing",
              desc: "Post updates, upload photos, and celebrate his life.",
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
          © {new Date().getFullYear()} First Family | Forever in our hearts. |
          Empowered by{" "}
          <a
            href="https://www.visionarybizz.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            Visionary Services
          </a>
        </Typography>
      </Box>
    </Container>
  );
}