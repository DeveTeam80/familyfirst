import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";
import cloudinary, { getPublicIdFromUrl } from "@/lib/cloudinary"; 

// Types for session user
interface SessionUser {
  id?: string;
  email?: string;
}

// Type for family membership from database (GET)
interface FamilyMembershipDataWithJoinedAt {
  role: string;
  joinedAt: Date;
  family: {
    id: string;
    name: string;
  };
}

// Type for family membership from database (PATCH)
interface FamilyMembershipData {
  role: string;
  family: {
    id: string;
    name: string;
  };
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = session.user as SessionUser;
    const sessionUserId = sessionUser?.id;
    const sessionEmail = sessionUser?.email;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: "Session missing identifying information" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail },
      select: {
        id: true,
        email: true,
        name: true,
        // 👇 CRITICAL: These missing fields caused the button/data to vanish
        username: true, 
        avatarUrl: true,
        bio: true,
        location: true,
        birthday: true,
        weddingAnniversary: true,
        
        familyMemberships: {
          select: {
            role: true,
            joinedAt: true,
            family: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform memberships
    const memberships = (user.familyMemberships || []).map((m: FamilyMembershipDataWithJoinedAt) => ({
      familyId: m.family.id,
      familyName: m.family.name,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username, // 👈 Return this so "isOwner" logic works
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        location: user.location ?? null,
        birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
        anniversary: user.weddingAnniversary ? user.weddingAnniversary.toISOString().split('T')[0] : null,
        memberships: memberships, 
      },
      memberships, 
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sessionUser = session.user as SessionUser;
    const sessionUserId = sessionUser?.id;
    const sessionEmail = sessionUser?.email;

    if (!sessionUserId && !sessionEmail) {
      return NextResponse.json({ error: "Session missing identifying information" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, bio, avatarUrl, location, avatar, birthday, anniversary } = body;

    interface UpdateData {
      name?: string;
      bio?: string;
      location?: string;
      avatarUrl?: string;
      birthday?: Date | null;
      weddingAnniversary?: Date | null;
    }

    const data: UpdateData = {};
    if (typeof name === "string" && name.trim() !== "") data.name = name.trim();
    if (typeof bio === "string") data.bio = bio;
    if (typeof location === "string") data.location = location;
    
    if (typeof avatarUrl === "string") data.avatarUrl = avatarUrl;
    else if (typeof avatar === "string") data.avatarUrl = avatar;

    // Handle Dates
    if (birthday) data.birthday = new Date(birthday);
    else if (birthday === null || birthday === "") data.birthday = null;

    if (anniversary) data.weddingAnniversary = new Date(anniversary);
    else if (anniversary === null || anniversary === "") data.weddingAnniversary = null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // CLOUDINARY CLEANUP
    if (data.avatarUrl) {
      const currentUser = await prisma.user.findUnique({
        where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail },
        select: { avatarUrl: true }
      });

      if (currentUser?.avatarUrl && currentUser.avatarUrl !== data.avatarUrl) {
        const publicId = getPublicIdFromUrl(currentUser.avatarUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Failed to delete old avatar from Cloudinary:", err);
          }
        }
      }
    }

    // 1. UPDATE USER ACCOUNT
    const updatedUser = await prisma.user.update({
      where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        location: true,
        birthday: true,
        weddingAnniversary: true,
        familyMemberships: {
          select: {
            role: true,
            family: { select: { id: true, name: true } },
          },
        },
      },
    });

    // ⭐ 2. SYNC TO FAMILY TREE NODE (The Missing Piece)
    // If any relevant data changed, update the linked tree node(s)
    if (
        data.birthday !== undefined || 
        data.weddingAnniversary !== undefined || 
        data.name !== undefined ||
        data.avatarUrl !== undefined
    ) {
      // Split name safely
      const firstName = data.name ? data.name.split(" ")[0] : undefined;
      const lastName = data.name && data.name.split(" ").length > 1 
        ? data.name.split(" ").slice(1).join(" ") 
        : undefined;

      await prisma.familyTreeNode.updateMany({
        where: { userId: updatedUser.id },
        data: {
          // Sync Dates
          ...(data.birthday !== undefined && { birthDate: data.birthday }),
          ...(data.weddingAnniversary !== undefined && { weddingAnniversary: data.weddingAnniversary }),
          
          // Sync Name
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          
          // Sync Avatar
          ...(data.avatarUrl !== undefined && { photoUrl: data.avatarUrl }),
        }
      });
      
      console.log(`✅ Synced profile updates to Family Tree for user ${updatedUser.id}`);
    }

    // 3. PREPARE RESPONSE
    const memberships = (updatedUser.familyMemberships || []).map((m: FamilyMembershipData) => ({
      familyId: m.family.id,
      familyName: m.family.name,
      role: m.role,
    }));

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl ?? null,
        bio: updatedUser.bio ?? null,
        location: updatedUser.location ?? null,
        birthday: updatedUser.birthday ? updatedUser.birthday.toISOString().split('T')[0] : null,
        anniversary: updatedUser.weddingAnniversary ? updatedUser.weddingAnniversary.toISOString().split('T')[0] : null,
        memberships: memberships,
      },
      memberships,
    });
  } catch (error) {
    console.error("PATCH /api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}