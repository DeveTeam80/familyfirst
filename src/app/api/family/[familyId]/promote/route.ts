// src/app/api/family/[familyId]/promote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/session";

/**
 * Promote a family member to ADMIN.
 *
 * POST body: { username?: string, userId?: string, email?: string }
 *
 * Only the family OWNER can promote members.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ familyId: string }> } // ⭐ Changed to Promise
) {
  try {
    const { familyId } = await context.params; // ⭐ Added await
    
    if (!familyId) {
      return NextResponse.json({ error: "Missing familyId in URL" }, { status: 400 });
    }

    // Resolve caller
    const callerId = await getUserIdFromRequest(req);
    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure caller is OWNER for this family (from FamilyMember)
    const callerMembership = await prisma.familyMember.findUnique({
      where: {
        // composite PK is [userId, familyId] mapped in schema as @@id([userId, familyId])
        userId_familyId: {
          userId: callerId,
          familyId,
        },
      },
    });

    if (!callerMembership || callerMembership.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden — only the family owner can promote members" }, { status: 403 });
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { userId: targetUserId, username, email } = body as {
      userId?: string;
      username?: string;
      email?: string;
    };

    if (!targetUserId && !username && !email) {
      return NextResponse.json({ error: "Provide userId, username, or email of the member to promote" }, { status: 400 });
    }

    // Resolve target user record
    let targetUser = null;
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (typeof username === "string" && username.trim()) {
      // assume you have username column; if not, adapt to your schema
      targetUser = await prisma.user.findUnique({ where: { username: username.trim() } }).catch(() => null);
      // fallback: try matching by generated username from name (if you don't have username column)
      if (!targetUser) {
        const gen = username.trim().toLowerCase().replace(/\s+/g, "");
        targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: gen },
              { name: { equals: username.trim(), mode: "insensitive" } },
            ],
          },
        }).catch(() => null);
      }
    } else if (typeof email === "string" && email.trim()) {
      targetUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Check family membership for target
    const targetMembership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: targetUser.id,
          familyId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Target user is not a member of this family" }, { status: 400 });
    }

    // Prevent promoting the OWNER (no-op)
    if (targetMembership.role === "OWNER") {
      return NextResponse.json({ error: "Target user is already owner" }, { status: 400 });
    }

    // Update role to ADMIN
    const updated = await prisma.familyMember.update({
      where: {
        userId_familyId: {
          userId: targetUser.id,
          familyId,
        },
      },
      data: {
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name || targetUser.email} promoted to ADMIN`,
      membership: {
        userId: updated.userId,
        familyId: updated.familyId,
        role: updated.role,
      },
    });
  } catch (err) {
    console.error("Promote error:", err);
    return NextResponse.json({ error: "Failed to promote member" }, { status: 500 });
  }
}