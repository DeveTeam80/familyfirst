// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

// Type for invitation with includes
interface InvitationWithRelations {
  id: string;
  inviteCode: string;
  email: string | null;
  status: string;
  expiresAt: Date | null;
  treeNodeId: string | null;
  familyId: string;
  treeNode: {
    id: string;
    birthDate: Date | null;
    deathDate: Date | null;
    weddingAnniversary: Date | null;
  } | null;
  family: {
    id: string;
    name: string;
  };
}

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
async function generateUniqueUsername(tx: Prisma.TransactionClient, base: string) {
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
    let invitation: InvitationWithRelations | null = null;
    if (inviteCode) {
      const foundInvitation = await prisma.invitation.findUnique({
        where: { inviteCode },
        include: {
          treeNode: {
            select: {
              id: true,
              birthDate: true,
              deathDate: true,
              weddingAnniversary: true,
            }
          },
          family: true
        },
      });

      if (!foundInvitation) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }

      invitation = foundInvitation as InvitationWithRelations;

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
    const result = await prisma.$transaction(async (tx) => {
      // generate base for username from name or email local part
      const emailLocal = emailNormalized.split("@")[0] || "";
      const baseForSlug = slugify(name || emailLocal || `user${Math.random().toString(36).slice(2, 8)}`) || slugify(emailLocal);

      // ensure uniqueness (this uses the transaction client)
      const username = await generateUniqueUsername(tx, baseForSlug);

      // ⭐ NEW: Prepare date fields from tree node
      const dateFields: {
        birthday?: Date;
        weddingAnniversary?: Date;
        deathDay?: Date;
      } = {};

      if (invitation?.treeNode) {
        if (invitation.treeNode.birthDate) {
          dateFields.birthday = invitation.treeNode.birthDate;
        }
        if (invitation.treeNode.weddingAnniversary) {
          dateFields.weddingAnniversary = invitation.treeNode.weddingAnniversary;
        }
        if (invitation.treeNode.deathDate) {
          dateFields.deathDay = invitation.treeNode.deathDate;
        }
      }

      // 1. Create user (including username and synced dates)
      const user = await tx.user.create({
        data: {
          email: emailNormalized,
          name,
          username,
          passwordHash,
          avatarUrl,
          ...dateFields, // ⭐ NEW: Sync dates from tree node
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatarUrl: true,
          birthday: true,
          weddingAnniversary: true,
          deathDay: true,
        },
      });

      if (invitation && invitation.treeNode && invitation.treeNodeId) {
        // 2. Link user to tree node
        await tx.familyTreeNode.update({
          where: { id: invitation.treeNodeId },
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

        // ⭐ NEW: Create automatic calendar events for important dates
        const events = [];

        // Around line 240-290, replace the entire event creation section with this:

        // ⭐ NEW: Create automatic calendar events for important dates
        if (user.birthday || user.weddingAnniversary || user.deathDay) {
          try {
            // Get user's family to create events in
            const userFamily = await tx.familyMember.findFirst({
              where: { userId: user.id },
              select: { familyId: true },
            });

            if (userFamily) {
              const eventsToCreate = [];

              if (user.birthday) {
                eventsToCreate.push({
                  title: `${name}'s Birthday`,
                  description: `Birthday celebration for ${name}`,
                  startTime: user.birthday,
                  eventType: "Birthday",
                  tags: ["Birthday", "Family"],
                  familyId: userFamily.familyId,
                  creatorId: user.id,
                  isRecurring: true,
                  recurrenceRule: "FREQ=YEARLY",
                  allDay: true,
                  timezone: "UTC",
                });
              }

              if (user.weddingAnniversary) {
                eventsToCreate.push({
                  title: `${name}'s Anniversary`,
                  description: `Wedding anniversary for ${name}`,
                  startTime: user.weddingAnniversary,
                  eventType: "Anniversary",
                  tags: ["Anniversary", "Family"],
                  familyId: userFamily.familyId,
                  creatorId: user.id,
                  isRecurring: true,
                  recurrenceRule: "FREQ=YEARLY",
                  allDay: true,
                  timezone: "UTC",
                });
              }

              if (user.deathDay) {
                eventsToCreate.push({
                  title: `${name}'s Memorial Day`,
                  description: `In memory of ${name}`,
                  startTime: user.deathDay,
                  eventType: "Memorial",
                  tags: ["Memorial", "Family"],
                  familyId: userFamily.familyId,
                  creatorId: user.id,
                  isRecurring: true,
                  recurrenceRule: "FREQ=YEARLY",
                  allDay: true,
                  timezone: "UTC",
                });
              }

              for (const eventData of eventsToCreate) {
                await tx.calendarEvent.create({
                  data: eventData,
                });
              }
            }
          } catch (eventError) {
            // If CalendarEvent creation fails, log but don't fail registration
            console.log("CalendarEvent creation skipped:", eventError);
          }
        }
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
        birthday: result.birthday,
        weddingAnniversary: result.weddingAnniversary,
        deathDay: result.deathDay,
      },
      message: invitation ? `Welcome to ${invitation.family.name}!` : "Registration successful!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}