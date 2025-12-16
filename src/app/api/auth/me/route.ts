// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// Types for session user
interface SessionUser {
  id?: string;
  email?: string;
}

// Type for family membership from database (GET)
interface FamilyMembershipDataWithJoinedAt {
  role: string;
  joinedAt: Date;
  family: {
    id: string;
    name: string;
  };
}

// Type for family membership from database (PATCH - without joinedAt)
interface FamilyMembershipData {
  role: string;
  family: {
    id: string;
    name: string;
  };
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Prefer session.user.id (if you added it in callbacks). Otherwise fallback to email.
    const sessionUser = session.user as SessionUser;
    const sessionUserId = sessionUser?.id;
    const sessionEmail = sessionUser?.email;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: "Session missing identifying information" }, { status: 401 });
    }

    // find user by id (if present) or by email
    const user = await prisma.user.findUnique({
      where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail },
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

    const memberships = (user.familyMemberships || []).map((m: FamilyMembershipDataWithJoinedAt) => ({
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

    const sessionUser = session.user as SessionUser;
    const sessionUserId = sessionUser?.id;
    const sessionEmail = sessionUser?.email;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: "Session missing identifying information" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, bio, avatarUrl, location, avatar } = body;

    // guard: at least one field must be present
    interface UpdateData {
      name?: string;
      bio?: string;
      location?: string;
      avatarUrl?: string;
    }

    const data: UpdateData = {};
    if (typeof name === "string" && name.trim() !== "") data.name = name.trim();
    if (typeof bio === "string") data.bio = bio;
    if (typeof location === "string") data.location = location;
    if (typeof avatarUrl === "string") data.avatarUrl = avatarUrl;
    else if (typeof avatar === "string") data.avatarUrl = avatar;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail },
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

    const memberships = (updatedUser.familyMemberships || []).map((m: FamilyMembershipData) => ({
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