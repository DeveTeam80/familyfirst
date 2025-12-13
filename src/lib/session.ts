// src/lib/session.ts
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyJwt } from "./auth";

/**
 * Resolve authenticated user id from incoming request.
 *
 * Accepts either the Web Fetch API Request (used in app route handlers)
 * or NextRequest (used in middleware / edge). Returns the user id string
 * or null.
 */
export async function getUserIdFromRequest(req: Request | NextRequest): Promise<string | null> {
  // 1) Try NextAuth session first (if you use NextAuth)
  // In many app-router setups getServerSession(authOptions) will work without req/res.
  // If you rely on cookie-scoped session, you may need to adapt to your NextAuth config.
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      // common shapes: session.user.id, session.user.sub or session.user.email
      if (typeof (session.user as any).id === "string") return (session.user as any).id;
      if (typeof (session.user as any).sub === "string") return (session.user as any).sub;
      if (typeof (session.user as any).email === "string") {
        // optionally return email if you use email as identifier
        return (session.user as any).email;
      }
    }
  } catch (e) {
    // ignore and fall back to JWT cookie
  }

  // 2) Try custom ff_session JWT cookie
  try {
    // NextRequest has cookies.get() helper
    // @ts-ignore - guard for shape
    if (typeof (req as any).cookies?.get === "function") {
      // NextRequest.cookies.get returns RequestCookie | undefined
      // RequestCookie can be { name, value } in some types — handle both
      // @ts-ignore
      const rc = (req as any).cookies.get("ff_session");
      const token = typeof rc === "string" ? rc : rc?.value ?? null;
      if (!token) return null;
      const payload = await verifyJwt(token);
      if (!payload) return null;
      if (typeof (payload as any).userId === "string") return (payload as any).userId;
      if (typeof (payload as any).sub === "string") return (payload as any).sub;
      if (typeof (payload as any).email === "string") return (payload as any).email;
      return null;
    }

    // Standard Request (app route) — read cookie header
    const cookieHeader = (req as Request).headers.get("cookie") || "";
    if (!cookieHeader) return null;
    const parts = cookieHeader.split(";").map((c) => c.trim());
    const match = parts.find((c) => c.startsWith("ff_session="));
    if (!match) return null;
    const token = match.split("=")[1];
    if (!token) return null;
    const payload = await verifyJwt(token);
    if (!payload) return null;
    if (typeof (payload as any).userId === "string") return (payload as any).userId;
    if (typeof (payload as any).sub === "string") return (payload as any).sub;
    if (typeof (payload as any).email === "string") return (payload as any).email;
    return null;
  } catch (err) {
    // any error -> return null
    console.error("getUserIdFromRequest error:", err);
    return null;
  }
}
