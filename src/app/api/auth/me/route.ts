// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET -> returns current user + family memberships (returns up to all memberships).
 * PATCH -> update profile (name, bio, avatarUrl, location).
 *
 * Note: Ensure NextAuth session callback includes user.id if you want session.user.id to be available.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Prefer session.user.id (if you added it in callbacks). Otherwise fallback to email.
    const sessionUserId = (session as any).user?.id as string | undefined;
    const sessionEmail = (session as any).user?.email as string | undefined;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: "Session missing identifying information" }, { status: 401 });
    }

    // find user by id (if present) or by email
    const where: any = sessionUserId ? { id: sessionUserId } : { email: sessionEmail };

    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        location: true,
        familyMemberships: {
          select: {
            role: true,
            joinedAt: true,
            family: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const memberships = (user.familyMemberships || []).map((m: any) => ({
      familyId: m.family.id,
      familyName: m.family.name,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        location: user.location ?? null,
      },
      memberships, // array (may be empty)
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sessionUserId = (session as any).user?.id as string | undefined;
    const sessionEmail = (session as any).user?.email as string | undefined;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: "Session missing identifying information" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, bio, avatarUrl, location, avatar } = body;

    // guard: at least one field must be present
    const data: any = {};
    if (typeof name === "string" && name.trim() !== "") data.name = name.trim();
    if (typeof bio === "string") data.bio = bio;
    if (typeof location === "string") data.location = location;
    if (typeof avatarUrl === "string") data.avatarUrl = avatarUrl;
    else if (typeof avatar === "string") data.avatarUrl = avatar;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const where: any = sessionUserId ? { id: sessionUserId } : { email: sessionEmail };

    const updatedUser = await prisma.user.update({
      where,
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        location: true,
        familyMemberships: {
          select: {
            role: true,
            family: { select: { id: true, name: true } },
          },
        },
      },
    });

    const memberships = (updatedUser.familyMemberships || []).map((m: any) => ({
      familyId: m.family.id,
      familyName: m.family.name,
      role: m.role,
    }));

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl ?? null,
        bio: updatedUser.bio ?? null,
        location: updatedUser.location ?? null,
      },
      memberships,
    });
  } catch (error) {
    console.error("PATCH /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
