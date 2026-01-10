// src/lib/auth-helpers.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { NextResponse } from "next/server";

type Role = "OWNER" | "ADMIN" | "MEMBER";

interface FamilyMemberResult {
    userId: string;
    familyId: string;
    role: string;
    status: string;
}

interface AuthResult {
    userId: string;
}

/**
 * Get the authenticated user's ID from session.
 * Returns null if not authenticated.
 */
export async function getAuthUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    return session.user.id;
}

/**
 * Require authentication - returns userId or error response.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
    const userId = await getAuthUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return { userId };
}

/**
 * Verify that a user is a member of a specific family.
 * 
 * @param userId - The user to check
 * @param familyId - The family to check membership for
 * @param requiredRoles - Optional array of roles required (e.g., ["OWNER", "ADMIN"])
 * @returns The membership record or an error object
 */
export async function requireFamilyMembership(
    userId: string,
    familyId: string,
    requiredRoles?: Role[]
): Promise<
    | { membership: FamilyMemberResult }
    | { error: string; status: number }
> {
    const membership = await prisma.familyMember.findUnique({
        where: {
            userId_familyId: {
                userId,
                familyId,
            },
        },
    });

    if (!membership) {
        return { error: "Not a member of this family", status: 403 };
    }

    if (requiredRoles && !requiredRoles.includes(membership.role as Role)) {
        return { error: "Insufficient permissions", status: 403 };
    }

    return { membership };
}

/**
 * Get all family IDs that a user is a member of.
 */
export async function getUserFamilyIds(userId: string): Promise<string[]> {
    const memberships = await prisma.familyMember.findMany({
        where: { userId },
        select: { familyId: true },
    });
    return memberships.map((m) => m.familyId);
}

/**
 * Check if user is ADMIN or OWNER of a family.
 */
export async function isAdminOrOwner(
    userId: string,
    familyId: string
): Promise<boolean> {
    const membership = await prisma.familyMember.findUnique({
        where: {
            userId_familyId: { userId, familyId },
        },
        select: { role: true },
    });
    return membership?.role === "ADMIN" || membership?.role === "OWNER";
}
