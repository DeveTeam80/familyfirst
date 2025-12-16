// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { prisma } from "@/lib/prisma";

// ⭐ CRITICAL: Users are considered offline if no heartbeat for 2 minutes
const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000; 

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { content, tags, imageUrls, eventDate, familyId } = body;

        const userFamily =
            familyId ||
            (
                await prisma.familyMember.findFirst({
                    where: { userId: session.user.id },
                    select: { familyId: true },
                })
            )?.familyId;

        if (!userFamily) {
            return NextResponse.json({ error: "No family found" }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                content,
                authorId: session.user.id,
                familyId: userFamily,
                tags: tags || [],
                eventDate: eventDate ? new Date(eventDate) : null,

                photos: imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
                    ? {
                        create: imageUrls.map((url: string) => ({
                            url,
                            familyId: userFamily,
                            cloudinaryId: "uploaded",
                        })),
                    }
                    : undefined,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                photos: true,
                reactions: {
                    select: {
                        userId: true,
                        type: true,
                    },
                },
                comments: {
                    where: {
                        parentId: null,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                        likes: true,
                        replies: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatarUrl: true,
                                    },
                                },
                                likes: true,
                            },
                            orderBy: {
                                createdAt: "asc",
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        return NextResponse.json({
            id: post.id,
            userId: post.author?.id || "",
            user: post.author?.name || "User",
            username: post.author?.name?.toLowerCase().replace(/\s+/g, "") || "user",
            avatar: post.author?.avatarUrl || null,
            content: post.content,
            tags: post.tags,
            images: post.photos.map(p => p.url),
            image: post.photos?.[0]?.url || null,
            eventDate: post.eventDate?.toISOString(),
            likes: post.reactions.filter(r => r.type === "LIKE").length,
            likedBy: post.reactions.filter(r => r.type === "LIKE").map(r => r.userId),
            comments: post.comments.map((c) => ({
                id: c.id,
                user: c.user?.name || "User",
                userId: c.user?.id,
                avatar: c.user?.avatarUrl || null,
                text: c.content,
                likes: c.likes?.length || 0,
                likedBy: c.likes?.map(l => l.userId) || [],
                replies: c.replies?.map(r => ({
                    id: r.id,
                    user: r.user?.name || "User",
                    userId: r.user?.id,
                    avatar: r.user?.avatarUrl || null,
                    text: r.content,
                    likes: r.likes?.length || 0,
                    likedBy: r.likes?.map(l => l.userId) || [],
                    createdAt: r.createdAt.toISOString(),
                })) || [],
                createdAt: c.createdAt.toISOString(),
            })),
            date: post.createdAt.toISOString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json(
            { error: "Failed to create post" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '5');
        const skip = (page - 1) * limit;

        const userFamilies = await prisma.familyMember.findMany({
            where: { userId: session.user.id },
            select: { familyId: true },
        });

        const familyIds = userFamilies.map((f) => f.familyId);

        const totalPosts = await prisma.post.count({
            where: {
                familyId: { in: familyIds },
            },
        });

        const posts = await prisma.post.findMany({
            where: {
                familyId: { in: familyIds },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        // ⭐ ADDED: Fetch online status fields
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
                photos: true,
                reactions: {
                    select: {
                        userId: true,
                        type: true,
                    },
                },
                comments: {
                    where: {
                        parentId: null,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                        likes: true,
                        replies: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        avatarUrl: true,
                                    },
                                },
                                likes: true,
                            },
                            orderBy: {
                                createdAt: "asc",
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        });

        // ⭐ CALCULATE THRESHOLD ONCE
        const threshold = new Date(Date.now() - OFFLINE_THRESHOLD_MS);

        const formattedPosts = posts.map((post) => {
            // ⭐ CALCULATE ACTUAL STATUS
            const isActuallyOnline =
                post.author?.isOnline &&
                post.author?.lastSeenAt &&
                post.author.lastSeenAt >= threshold;

            return {
                id: post.id,
                userId: post.author?.id || "",
                user: post.author?.name || "Deleted User",
                username: post.author?.name?.toLowerCase().replace(/\s+/g, "") || "deleted",
                avatar: post.author?.avatarUrl || null,
                // ⭐ ADDED: Return calculated status
                isOnline: !!isActuallyOnline,
                content: post.content,
                tags: post.tags,
                images: post.photos.map(p => p.url),
                image: post.photos?.[0]?.url || null,
                eventDate: post.eventDate?.toISOString(),
                visibility: post.visibility,
                likes: post.reactions.filter(r => r.type === "LIKE").length,
                likedBy: post.reactions.filter(r => r.type === "LIKE").map(r => r.userId),
                comments: post.comments.map((c) => ({
                    id: c.id,
                    user: c.user?.name || "Deleted User",
                    userId: c.user?.id,
                    avatar: c.user?.avatarUrl || null,
                    text: c.content,
                    likes: c.likes?.length || 0,
                    likedBy: c.likes?.map(l => l.userId) || [],
                    replies: c.replies?.map(r => ({
                        id: r.id,
                        user: r.user?.name || "Deleted User",
                        userId: r.user?.id,
                        avatar: r.user?.avatarUrl || null,
                        text: r.content,
                        likes: r.likes?.length || 0,
                        likedBy: r.likes?.map(l => l.userId) || [],
                        createdAt: r.createdAt.toISOString(),
                    })) || [],
                    createdAt: c.createdAt.toISOString(),
                })),
                date: post.createdAt.toISOString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString(),
            };
        });

        return NextResponse.json({
            posts: formattedPosts,
            pagination: {
                page,
                limit,
                total: totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
                hasMore: skip + limit < totalPosts,
            },
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}