// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Create a URL-safe username slug from a name or email local part.
 * Example: "Natalie Issac" -> "natalieissac"
 */
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    // remove accents (basic)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    // remove non-alphanumerics except dash/underscore/dot
    .replace(/[^a-z0-9._-]/g, "")
    // remove dots/underscores/hyphens from ends & collapse repeats
    .replace(/^[._-]+|[._-]+$/g, "")
    .replace(/[._-]{2,}/g, (m) => m[0]);
}

/**
 * Generate a unique username using the provided transaction client.
 * Will append numeric suffixes until a unique username is found.
 */
async function generateUniqueUsername(tx: any, base: string) {
  let candidate = base;
  let suffix = 0;

  while (true) {
    const exists = await tx.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!exists) return candidate;

    suffix += 1;
    candidate = `${base}${suffix}`;
    // safety: if candidate grows too long, truncate base
    if (candidate.length > 60) {
      base = base.slice(0, 45);
      candidate = `${base}${suffix}`;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept either `name` or `firstName` + `lastName`
    const { email, password, name: rawName, firstName, lastName, inviteCode, avatarUrl } = body;

    // Build name if not provided
    const name = (typeof rawName === "string" && rawName.trim())
      ? rawName.trim()
      : [firstName, lastName].filter(Boolean).join(" ").trim();

    // Basic validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password is required and must be at least 8 characters" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name (first and/or last) is required" }, { status: 400 });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // If inviteCode provided, verify it
    let invitation: any = null;
    if (inviteCode) {
      invitation = await prisma.invitation.findUnique({
        where: { inviteCode },
        include: { treeNode: true, family: true },
      });

      if (!invitation) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json({ error: "Invite already used or expired" }, { status: 409 });
      }

      if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
        return NextResponse.json({ error: "Invite code has expired" }, { status: 410 });
      }

      if (invitation.email && invitation.email.toLowerCase() !== emailNormalized) {
        return NextResponse.json({ error: "Email does not match invitation" }, { status: 400 });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and link to tree node in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // generate base for username from name or email local part
      const emailLocal = emailNormalized.split("@")[0] || "";
      const baseForSlug = slugify(name || emailLocal || `user${Math.random().toString(36).slice(2, 8)}`) || slugify(emailLocal);

      // ensure uniqueness (this uses the transaction client)
      const username = await generateUniqueUsername(tx, baseForSlug);

      // 1. Create user (including username)
      const user = await tx.user.create({
        data: {
          email: emailNormalized,
          name,
          username,
          passwordHash,
          avatarUrl,
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      });

      if (invitation && invitation.treeNode) {
        // 2. Link user to tree node
        await tx.familyTreeNode.update({
          where: { id: invitation.treeNodeId! },
          data: {
            userId: user.id,
            isAccountHolder: true,
          },
        });

        // 3. Add user to family
        await tx.familyMember.create({
          data: {
            userId: user.id,
            familyId: invitation.familyId,
            role: "MEMBER",
            status: "ACTIVE",
          },
        });

        // 4. Mark invitation as accepted
        await tx.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        username: result.username,
        avatar: result.avatarUrl ?? null,
      },
      message: invitation ? `Welcome to ${invitation.family.name}!` : "Registration successful!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
