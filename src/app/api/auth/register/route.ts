// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, inviteCode, avatarUrl } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // If inviteCode provided, verify it
    let invitation = null;
    if (inviteCode) {
      invitation = await prisma.invitation.findUnique({
        where: { inviteCode },
        include: { treeNode: true, family: true },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "Invalid invite code" },
          { status: 404 }
        );
      }

      if (invitation.status !== "PENDING") {
        return NextResponse.json(
          { error: "Invite already used or expired" },
          { status: 409 }
        );
      }

      if (new Date() > invitation.expiresAt) {
        return NextResponse.json(
          { error: "Invite code has expired" },
          { status: 410 }
        );
      }

      if (invitation.email !== email) {
        return NextResponse.json(
          { error: "Email does not match invitation" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and link to tree node in a transaction
    const result = await prisma.$transaction(async (tx:any) => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          avatarUrl,
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
            status: "ACTIVE", // Or PENDING if approval workflow needed
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
      },
      message: invitation
        ? `Welcome to ${invitation.family.name}!`
        : "Registration successful!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}