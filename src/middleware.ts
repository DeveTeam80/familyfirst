// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    // If user is authenticated and hits auth pages, send to feed
    if (token && (path.startsWith("/login") || path.startsWith("/register"))) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Always allow Next internals + public static files
        if (
          path.startsWith("/_next") ||
          path.startsWith("/static") ||
          path === "/favicon.ico" ||
          /\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(path)
        ) {
          return true;
        }

        // Public pages you want to keep public (e.g. post view)
        if (
          path.startsWith("/post") ||      // public post page(s)
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/") // you can remove this if you don't want root public
        ) {
          // Allow unauthenticated access — middleware will still redirect authenticated
          // users away from /login or /register via the main middleware function above.
          return true;
        }

        // Public API endpoints that should remain public (ex: next-auth callbacks, invite verify)
        if (
          path.startsWith("/api/auth") ||
          path.startsWith("/api/invite") ||
          path.startsWith("/api/public") // add other public api prefixes here
        ) {
          return true;
        }

        // Otherwise require a token (authenticated)
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

/**
 * IMPORTANT:
 * - Keep this matcher narrowly focused on protected app routes and protected APIs only.
 * - If your protected app files live under /(app) folder, use the matcher below.
 * - Adjust the API patterns to include any protected API routes you need.
 */
export const config = {
  matcher: [
    // Protect everything under (app)
    "/(app)(/:path*)",
    // Protect any API endpoints that must be authenticated:
    "/api/posts/:path*",
    "/api/comments/:path*",
    "/api/family/:path*",
    // add other protected api routes here
  ],
};
