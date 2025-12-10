// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user with family membership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const family = user.familyMemberships[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio ?? null,
        location: user.location ?? null,
      },
      family: family
        ? {
            id: family.family.id,
            name: family.family.name,
            role: family.role,
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
    // Get session using NextAuth
    const session = await getServerSession(authOptions);

    console.log("🔍 PATCH: Session:", session ? "Found" : "Not found");

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await req.json().catch(() => ({}));
    const { name, bio, avatarUrl, location, avatar } = body;

    console.log("🔍 PATCH: Update data:", { name, bio, avatarUrl, location, avatar });

    // Build update data
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

    console.log("🔍 PATCH: Updating user", userId, "with data:", data);

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
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}