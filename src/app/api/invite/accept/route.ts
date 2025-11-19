import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createJwt, createSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, password, bio, avatarUrl } = body;

    if (!code || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const invite = await prisma.invitation.findFirst({
      where: { inviteCode: code },
      include: { treeNode: true },
    });

    if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    if (invite.status !== "PENDING") return NextResponse.json({ error: "Invite not active" }, { status: 400 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 400 });

    // 1. Create user
    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: invite.email,
        name: `${invite.treeNode?.firstName ?? ""} ${invite.treeNode?.lastName ?? ""}`.trim(),
        passwordHash: hashed,
        avatarUrl,
      },
    });

    // 2. Attach user to tree node
    await prisma.familyTreeNode.update({
      where: { id: invite.treeNodeId! },
      data: { userId: user.id, isAccountHolder: true },
    });

    // 3. Add to family_members
    await prisma.familyMember.create({
      data: {
        userId: user.id,
        familyId: invite.familyId,
        role: "MEMBER",
        status: "ACTIVE",
      },
    });

    // 4. Mark invite accepted
    await prisma.invitation.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // 5. Create session
    const token = await createJwt({ userId: user.id, email: user.email });
    const cookie = createSessionCookie(token);

    return new NextResponse(
      JSON.stringify({ success: true, user }),
      { status: 200, headers: { "Set-Cookie": cookie } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
