// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 🔹 Helper to get current userId from cookie/JWT
async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("ff_session");

  if (!sessionCookie) {
    return null;
  }

  const payload = await verifyJwt(sessionCookie.value);
  if (!payload || !payload.userId) {
    return null;
  }

  return payload.userId as string;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromSession();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        // include these if you have them in your schema:
        bio: true,
        location: true,
        familyMemberships: {
          select: {
            role: true,
            family: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const familyMembership = user.familyMemberships[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio ?? null,
        location: user.location ?? null,
      },
      family: familyMembership
        ? {
            id: familyMembership.family.id,
            name: familyMembership.family.name,
            role: familyMembership.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching auth state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromSession();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, bio, avatarUrl, location, avatar } = body;

    // Build update data, only including provided fields
    const data: any = {};

    if (typeof name === "string") {
      data.name = name.trim();
    }
    if (typeof bio === "string") {
      data.bio = bio;
    }
    if (typeof location === "string") {
      data.location = location;
    }

    if (typeof avatarUrl === "string") {
      data.avatarUrl = avatarUrl;
    } else if (typeof avatar === "string") {
      data.avatarUrl = avatar;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
            family: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    const familyMembership = updatedUser.familyMemberships[0];

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio ?? null,
        location: updatedUser.location ?? null,
      },
      family: familyMembership
        ? {
            id: familyMembership.family.id,
            name: familyMembership.family.name,
            role: familyMembership.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Error updating auth state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
