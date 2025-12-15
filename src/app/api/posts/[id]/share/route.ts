// src/app/api/posts/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⭐ Changed to Promise
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params; // ⭐ Await params

  try {
    const { visibility } = await request.json();

    if (!["PUBLIC", "FAMILY"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { visibility },
      include: { photos: true },
    });

    return NextResponse.json(
      {
        post: {
          id: updated.id,
          visibility: updated.visibility,
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH share error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}