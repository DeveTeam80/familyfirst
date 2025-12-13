// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session"; 

export async function GET(req: Request) {
  try {
    const actorId = await getUserIdFromRequest(req);
    if (!actorId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Accept familyId as query param to check owner for that family
    const url = new URL(req.url);
    const familyId = url.searchParams.get("familyId");
    if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });

    // Confirm actor is OWNER for the family
    const family = await prisma.family.findUnique({ where: { id: familyId }, select: { ownerId: true } });
    if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });
    if (family.ownerId !== actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Return all users (limit fields)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
      },
      orderBy: { name: "asc" },
      take: 1000,
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
