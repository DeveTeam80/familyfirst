// src/lib/session.ts
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth.config";
import { verifyJwt } from "./auth";

// Type for session user
interface SessionUser {
  id?: string;
  sub?: string;
  email?: string;
}

// Type for JWT payload
interface JwtPayload {
  userId?: string;
  sub?: string;
  email?: string;
}

// Type for NextRequest cookies
interface RequestCookie {
  name: string;
  value: string;
}

/**
 * Resolve authenticated user id from incoming request.
 *
 * Accepts either the Web Fetch API Request (used in app route handlers)
 * or NextRequest (used in middleware / edge). Returns the user id string
 * or null.
 */
export async function getUserIdFromRequest(req: Request | NextRequest): Promise<string | null> {
  // 1) Try NextAuth session first (if you use NextAuth)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = session.user as SessionUser;
      if (typeof user.id === "string") return user.id;
      if (typeof user.sub === "string") return user.sub;
      if (typeof user.email === "string") return user.email;
    }
  } catch {
    // ignore and fall back to JWT cookie
  }

  // 2) Try custom ff_session JWT cookie
  try {
    // NextRequest has cookies.get() helper
    if ("cookies" in req && typeof req.cookies?.get === "function") {
      const rc = req.cookies.get("ff_session") as RequestCookie | undefined;
      const token = rc?.value ?? null;
      if (!token) return null;
      const payload = await verifyJwt(token);
      if (!payload) return null;
      const jwtPayload = payload as JwtPayload;
      if (typeof jwtPayload.userId === "string") return jwtPayload.userId;
      if (typeof jwtPayload.sub === "string") return jwtPayload.sub;
      if (typeof jwtPayload.email === "string") return jwtPayload.email;
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
    const jwtPayload = payload as JwtPayload;
    if (typeof jwtPayload.userId === "string") return jwtPayload.userId;
    if (typeof jwtPayload.sub === "string") return jwtPayload.sub;
    if (typeof jwtPayload.email === "string") return jwtPayload.email;
    return null;
  } catch (err) {
    console.error("getUserIdFromRequest error:", err);
    return null;
  }
}