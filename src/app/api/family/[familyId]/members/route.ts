// src/app/api/family/[familyId]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session";

// ⭐ Add proper interface for family member with user
interface FamilyMemberWithUser {
  userId: string;
  familyId: string;
  role: string;
  status: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    username: string | null;
  } | null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ familyId: string }> } // ⭐ Fixed for Next.js 15
) {
  const { familyId } = await context.params; // ⭐ Await params

  try {
    const requesterId = await getUserIdFromRequest(req);
    if (!requesterId) {
      // return unauthenticated but still safe to return 200 with empty? we return 401
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // confirm family exists (optional)
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // fetch members with related user data
    const members = await prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            // adjust name of avatar field to match your schema
            avatarUrl: true,
            username: true, // if present
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // normalize to a safe shape for the client
    // ⭐ Use typed members instead of any
    const payload = (members as unknown as FamilyMemberWithUser[]).map((m) => ({
      userId: m.userId,
      familyId: m.familyId,
      role: m.role, // OWNER / ADMIN / MEMBER etc (server enum)
      status: m.status,
      joinedAt: m.joinedAt,
      user: {
        id: m.user?.id,
        name: m.user?.name,
        email: m.user?.email,
        avatarUrl: m.user?.avatarUrl ?? null,
        username: m.user?.username ?? (m.user?.email?.split("@")[0] ?? null),
      },
    }));

    return NextResponse.json({ ok: true, family: { id: family.id, name: family.name }, members: payload });
  } catch (err) {
    console.error("[GET /api/family/:id/members] error:", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}