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
        const { content, tags, imageUrls, eventDate, familyId, calendarEventId } = body;

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
                calendarEventId: calendarEventId || null,

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
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
                photos: {
                    select: {
                        id: true,
                        url: true,
                    },
                },
                reactions: {
                    select: {
                        userId: true,
                        type: true,
                    },
                },
                calendarEvent: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        eventType: true,
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

        // ⭐ CALCULATE THRESHOLD
        const threshold = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
        const isActuallyOnline =
            post.author?.isOnline &&
            post.author?.lastSeenAt &&
            post.author.lastSeenAt >= threshold;

        // ✅ CLEAN RESPONSE FORMAT
        return NextResponse.json({
            id: post.id,
            userId: post.author?.id || "",
            user: post.author?.name || "User",
            username: post.author?.name?.toLowerCase().replace(/\s+/g, "") || "user",
            avatar: post.author?.avatarUrl || null,
            isOnline: !!isActuallyOnline,
            content: post.content,
            tags: post.tags,
            photos: post.photos.map(p => ({ id: p.id, url: p.url })), // ✅ Structured format
            eventDate: post.eventDate?.toISOString(),
            visibility: post.visibility,
            calendarEventId: post.calendarEventId,
            calendarEvent: post.calendarEvent,
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
        const userId = searchParams.get("userId");
        const skip = (page - 1) * limit;

        const userFamilies = await prisma.familyMember.findMany({
            where: { userId: session.user.id },
            select: { familyId: true },
        });

        const familyIds = userFamilies.map((f) => f.familyId);

        // ⭐ Dynamic WHERE clause
        const whereClause: any = {
            familyId: { in: familyIds },
        };

        if (userId) {
            whereClause.authorId = userId;
        }

        const totalPosts = await prisma.post.count({
            where: whereClause,
        });

        const posts = await prisma.post.findMany({
            where: whereClause,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
                photos: {
                    select: {
                        id: true,
                        url: true,
                    },
                },
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
                calendarEvent: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        eventType: true,
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
            const isActuallyOnline =
                post.author?.isOnline &&
                post.author?.lastSeenAt &&
                post.author.lastSeenAt >= threshold;

            // ⭐ FIX: Proper type annotation for photosArray
            let photosArray: Array<{ id: string; url: string }> = [];
            
            if (post.photos && post.photos.length > 0) {
                // New format: photos relation exists
                photosArray = post.photos.map(p => ({ id: p.id, url: p.url }));
            }
            // ⭐ REMOVED: No fallback to post.image since it doesn't exist in schema

            return {
                id: post.id,
                userId: post.author?.id || "",
                user: post.author?.name || "Deleted User",
                username: post.author?.name?.toLowerCase().replace(/\s+/g, "") || "deleted",
                avatar: post.author?.avatarUrl || null,
                isOnline: !!isActuallyOnline,
                content: post.content,
                tags: post.tags,
                photos: photosArray, // ✅ Now properly typed
                eventDate: post.eventDate?.toISOString(),
                visibility: post.visibility,
                likes: post.reactions.filter(r => r.type === "LIKE").length,
                likedBy: post.reactions.filter(r => r.type === "LIKE").map(r => r.userId),
                calendarEventId: post.calendarEventId,
                calendarEvent: post.calendarEvent,
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