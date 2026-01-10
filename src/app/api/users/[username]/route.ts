// src/app/api/users/[username]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // 🔒 SECURITY: Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
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
        // 🔧 FIX: Include birthday and anniversary for profile display
        birthday: true,
        weddingAnniversary: true,
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
        // 🔧 FIX: Return birthday and anniversary for other users to see
        birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
        anniversary: user.weddingAnniversary ? user.weddingAnniversary.toISOString().split('T')[0] : null,
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