// app/(public)/login/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Style_Script } from "next/font/google";
import { Typography } from "@mui/material";

const styleScript = Style_Script({ subsets: ["latin"], weight: "400" });

const USERS = new Map<string, { password: string; username: string }>([
  ["john@example.com", { password: "password123", username: "john" }],
  ["alice@example.com", { password: "password123", username: "alice" }],
]);

export default async function LoginPage() {
  const c = await cookies();
  if (c.get("ff_auth")?.value === "1") {
    redirect("/tree");
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "120px auto 0",
        padding: 24,
        display: "grid",
        gap: 16,
      }}
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
          Welcome to First Family
        </Typography>
      <p style={{ textAlign: "center", color: "#888", marginTop: -6 }}>
        Login to your private family space.
      </p>

      {/* Server Action form */}
      <form action={login} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#888" }}>Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "transparent",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#888" }}>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "transparent",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "black",
            color: "white",
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
            marginTop: 8,
          }}
        >
          Log in
        </button>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "#666",
          marginTop: 6,
        }}
      >
        <Link href="/forgot" style={{ textDecoration: "underline" }}>
          Forgot password?
        </Link>
        <Link href="/" style={{ textDecoration: "underline" }}>
          Register with invite
        </Link>
      </div>

      <DemoNote />
    </main>
  );
}

export async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  const account = USERS.get(email);
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password");
  }

  const c = await cookies();
  c.set("ff_auth", "1", { path: "/", httpOnly: false });
  c.set("ff_user", email, { path: "/", httpOnly: false });
  c.set("ff_username", account.username, { path: "/", httpOnly: false });

  redirect("/tree");
}

function DemoNote() {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        border: "1px dashed #ccc",
        borderRadius: 10,
        fontSize: 13,
        color: "#666",
      }}
    >
      <strong>Demo credentials</strong>
      <div>john@example.com / password123</div>
      <div>alice@example.com / password123</div>
      <div style={{ marginTop: 6, color: "#888" }}>
        Swap this for Firebase Auth later.
      </div>
    </div>
  );
}
