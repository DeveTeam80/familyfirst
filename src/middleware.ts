// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    if (token && (path.startsWith("/login") || path.startsWith("/register"))) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow static assets
        if (
          path.startsWith("/_next") ||
          path.startsWith("/static") ||
          path === "/favicon.ico" ||
          /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(path)
        ) {
          return true;
        }

        // Public pages that don't require auth
        if (
          path === "/" ||  // 🔒 FIX: Only exact homepage, not all paths!
          path.startsWith("/post") ||
          path.startsWith("/login") ||
          path.startsWith("/register")
        ) {
          return true;
        }

        // Public API routes
        if (
          path.startsWith("/api/auth") ||
          path.startsWith("/api/invite") ||
          path.startsWith("/api/public")
        ) {
          return true;
        }

        // 🔒 Everything else requires valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/(app)(/:path*)",
    "/api/posts/:path*",
    "/api/comments/:path*",
    "/api/family/:path*",
  ],
};
