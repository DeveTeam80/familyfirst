// src/app/api/invite/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createJwt, createSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

interface AcceptInviteBody {
  code: string;
  password: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AcceptInviteBody;
    const { code, password, name, avatarUrl, bio } = body;

    // Validation
    if (!code || !password) {
      return NextResponse.json(
        { error: "Invite code and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // 1. Find invitation
    const invite = await prisma.invitation.findUnique({
      where: { inviteCode: code },
      include: {
        treeNode: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            familyId: true,
            userId: true,
          },
        },
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    // 2. Validate invite status
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: `This invite has already been ${invite.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (invite.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This invite code has expired" },
        { status: 410 }
      );
    }

    // 4. Check if tree node already linked
    if (invite.treeNode?.userId) {
      return NextResponse.json(
        { error: "This family member already has an account" },
        { status: 409 }
      );
    }

    // 5. Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please login instead." },
        { status: 409 }
      );
    }

    // 6. Generate display name
    const displayName =
      name ||
      (invite.treeNode
        ? `${invite.treeNode.firstName} ${invite.treeNode.lastName || ""}`.trim()
        : invite.email.split("@")[0]);

    // 7. Hash password using your auth.ts
    const passwordHash = await hashPassword(password);

    // 8. Create user and link in transaction
    const result = await prisma.$transaction(async (tx:any) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invite.email,
          name: displayName,
          passwordHash,
          avatarUrl: avatarUrl || invite.treeNode?.photoUrl,
        },
      });

      // Link user to tree node
      if (invite.treeNode) {
        await tx.familyTreeNode.update({
          where: { id: invite.treeNode.id },
          data: {
            userId: user.id,
            isAccountHolder: true,
            ...(bio && { bio }),
          },
        });
      }

      // Add to family members
      await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: invite.familyId,
          role: "MEMBER",
          status: "ACTIVE",
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invite.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      return user;
    });

    // 9. Create JWT session using your auth.ts
    const token = await createJwt(
      {
        userId: result.id,
        email: result.email,
        name: result.name,
      },
      "7d" // 7 days
    );

    const sessionCookie = createSessionCookie(token);

    // 10. Send welcome email (async, don't wait)
    sendWelcomeEmail({
      to: result.email,
      name: result.name,
      familyName: invite.family.name,
    }).catch((err) => {
      console.error("Failed to send welcome email:", err);
      // Don't fail the request if email fails
    });

    // 11. Return success with session
    return new NextResponse(
      JSON.stringify({
        success: true,
        message: `Welcome to ${invite.family.name}! 🎉`,
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          avatarUrl: result.avatarUrl,
        },
        family: invite.family,
        redirectUrl: "/feed",
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation. Please try again." },
      { status: 500 }
    );
  }
}