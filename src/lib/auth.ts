// src/lib/auth.ts
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { serialize } from "cookie";

const SESSION_COOKIE_NAME = "ff_session";

// JWT secret must be set in .env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}
const encoder = new TextEncoder();
const jwtKey = encoder.encode(JWT_SECRET);

/**
 * Hash a plaintext password using bcrypt.
 * @param password plaintext password
 * @returns hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 * @param password plaintext password
 * @param hash bcrypt hash
 * @returns boolean
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token for magic links.
 * This token is safe to store in DB and include in URLs (we URL-encode it).
 * Example: 'a3f9b...'
 */
export function generateMagicToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Generate a friendly invite code for families like "FAM-AB12CD".
 */
export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  const part = Array.from({ length: 6 })
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join("");
  return `FAM-${part}`;
}

/**
 * Create a signed JWT using jose SignJWT.
 * Payload should be a POJO (e.g. { userId: '...', email: '...' })
 * expiresIn accepts values like "7d", "24h", "1h", or numeric seconds string.
 */
export async function createJwt(payload: Record<string, string | number | boolean>, expiresIn: string | number = "7d"): Promise<string> {
  // SignJWT expects a plain object payload; include iat and exp via setExpirationTime
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(typeof expiresIn === "number" ? `${expiresIn}s` : expiresIn)
    .sign(jwtKey);
  return jwt;
}

/**
 * Verify a JWT and return the payload or null on failure.
 */
export async function verifyJwt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a Set-Cookie header value for the session cookie.
 * Returns a string that you can put into `headers: { "Set-Cookie": cookie }`
 */
export function createSessionCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 7): string {
  const isProd = process.env.NODE_ENV === "production";
  return serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: maxAgeSeconds,
  });
}

/**
 * Create a Set-Cookie header value that clears the session cookie.
 */
export function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  return serialize(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 0,
  });
}

/**
 * Helper: set cookie options you'll reuse elsewhere if needed.
 */
export const SESSION_COOKIE_NAME_CONST = SESSION_COOKIE_NAME;