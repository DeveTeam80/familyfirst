import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.commentLike.create({
        data: {
          commentId: id,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}