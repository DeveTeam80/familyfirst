import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";
import cloudinary, { getPublicIdFromUrl } from "@/lib/cloudinary"; 

// Helper to clear cookies if user is invalid
function clearAuthCookies() {
  const headers = new Headers();
  // Clear both NextAuth and your custom cookie just in case
  headers.append("Set-Cookie", "next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  headers.append("Set-Cookie", "ff_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  return headers;
}

// Type for family membership from database
interface FamilyMembershipData {
  role: string;
  joinedAt?: Date;
  family: {
    id: string;
    name: string;
  };
}

export async function GET() {
  try {
    // 1. Get Session
    const session = await getServerSession(authOptions);

    // Check if session exists (NextAuth session usually has user object)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionEmail = session.user.email;
    
    // 2. 🛡️ SECURITY CHECK: Does this user actually exist in the DB?
    // We prefer ID if available, otherwise email
    const user = await prisma.user.findUnique({
      where: { email: sessionEmail as string },
      select: {
        id: true,
        email: true,
        name: true,
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
            family: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 3. HANDLE ZOMBIE SESSIONS (User deleted from DB but cookie remains)
    if (!user) {
      console.warn(`Zombie session detected for ${sessionEmail}. Logging out.`);
      return NextResponse.json(
        { error: "User account no longer exists" }, 
        { status: 401, headers: clearAuthCookies() }
      );
    }

    // 4. Transform Data for Frontend
    const memberships = (user.familyMemberships || []).map((m) => ({
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
        username: user.username,
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
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionEmail = session.user.email;

    // Parse Body
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
    
    // Handle Avatar (supports both field names)
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

    // 1. CLOUDINARY CLEANUP
    // Fetch current avatar to see if we need to delete it
    if (data.avatarUrl) {
      const currentUser = await prisma.user.findUnique({
        where: { email: sessionEmail },
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

    // 2. UPDATE USER ACCOUNT
    const updatedUser = await prisma.user.update({
      where: { email: sessionEmail },
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

    // 3. SYNC TO FAMILY TREE NODE
    // If name, avatar, or dates changed, update the linked visual tree node
    if (
        data.birthday !== undefined || 
        data.weddingAnniversary !== undefined || 
        data.name !== undefined ||
        data.avatarUrl !== undefined
    ) {
      const firstName = data.name ? data.name.split(" ")[0] : undefined;
      const lastName = data.name && data.name.split(" ").length > 1 
        ? data.name.split(" ").slice(1).join(" ") 
        : undefined;

      await prisma.familyTreeNode.updateMany({
        where: { userId: updatedUser.id },
        data: {
          ...(data.birthday !== undefined && { birthDate: data.birthday }),
          ...(data.weddingAnniversary !== undefined && { weddingAnniversary: data.weddingAnniversary }),
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(data.avatarUrl !== undefined && { photoUrl: data.avatarUrl }),
        }
      });
      
    }

    // 4. PREPARE RESPONSE
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