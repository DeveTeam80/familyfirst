// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Style_Script } from "next/font/google";
import {
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Box,
} from "@mui/material";

const styleScript = Style_Script({
  subsets: ["latin"],
  weight: "400",
});

const VALID_INVITES = new Set<string>(["FF-2025-ALPHA", "FF-2025-BETA"]);

export default async function Home() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("ff_auth")?.value;
  if (authCookie === "1") redirect("/tree");

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 8, md: 14 } }}>
      <Paper
        elevation={2}
        sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper" }}
        component="main"
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 1,
            fontFamily: styleScript.style.fontFamily,
            letterSpacing: 0.5,
            fontWeight: 500,
          }}
        >
          Welcome to Family First
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          This is an invite-only private space. Enter your invitation code to register.
        </Typography>

        <Box component="form" action={register}>
          <Stack spacing={2}>
            <TextField
              label="Full name"
              name="name"
              required
              fullWidth
              size="small"
              autoComplete="name"
            />
            <TextField
              type="email"
              label="Email"
              name="email"
              required
              fullWidth
              size="small"
              autoComplete="email"
            />
            <TextField
              label="Invite code"
              name="invite"
              required
              fullWidth
              size="small"
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
            <Button type="submit" variant="contained" size="large" sx={{ mt: 1, borderRadius: 2 }}>
              Register
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

// ---- Server Action: validate invite + set auth, then redirect to /tree?first=1
export async function register(formData: FormData) {
  "use server";
  const invite = String(formData.get("invite") || "").toUpperCase().trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!VALID_INVITES.has(invite)) {
    throw new Error("Invalid invite code");
  }

  const c = await cookies();
  // Demo-only cookies; use a proper session/JWT in production
  c.set("ff_auth", "1", { path: "/", httpOnly: false });
  c.set("ff_user", email || "user", { path: "/", httpOnly: false });

  redirect("/tree?first=1");
}
