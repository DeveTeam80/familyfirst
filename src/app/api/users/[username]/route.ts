// src/app/api/users/[username]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> } // ⭐ Changed to Promise
) {
  try {
    const { username } = await params; // ⭐ Await params
    const normalizedUsername = username.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizedUsername,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        location: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("User lookup error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}