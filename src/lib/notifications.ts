// src/lib/notifications.ts
import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

// ⭐ Auto-cleanup old read notifications (30+ days)
export async function cleanupOldNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        isRead: true, // Only delete read notifications
      },
    });

    console.log(`🧹 Cleaned up ${deleted.count} old notifications`);
    return deleted.count;
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    return 0;
  }
}

// ⭐ Enforce per-user notification limit
async function enforceUserNotificationLimit(userId: string, limit: number = 100) {
  try {
    const userNotifCount = await prisma.notification.count({
      where: { userId },
    });

    if (userNotifCount >= limit) {
      // Delete oldest read notifications to make room
      const oldestRead = await prisma.notification.findMany({
        where: {
          userId,
          isRead: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: userNotifCount - limit + 1, // Delete enough to get back to limit
        select: { id: true },
      });

      if (oldestRead.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            id: {
              in: oldestRead.map((n) => n.id),
            },
          },
        });
        console.log(`🗑️  Deleted ${oldestRead.length} old notifications for user ${userId}`);
      }
    }
  } catch (error) {
    console.error("Error enforcing notification limit:", error);
  }
}

// ⭐ Create notification with auto-cleanup
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
  actorId,
  actorName,
  actorAvatar,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
}) {
  try {
    // Don't notify the actor themselves
    if (userId === actorId) return;

    // Enforce limit before creating new notification
    await enforceUserNotificationLimit(userId, 100);

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        actorId,
        actorName,
        actorAvatar,
      },
    });

    console.log(`✅ Created notification for user ${userId}: ${title}`);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

// Notify when someone likes a post
export async function notifyPostLike({
  postId,
  postAuthorId,
  likerUserId,
  likerName,
  likerAvatar,
}: {
  postId: string;
  postAuthorId: string;
  likerUserId: string;
  likerName: string;
  likerAvatar?: string;
}) {
  await createNotification({
    userId: postAuthorId,
    type: "NEW_REACTION",
    title: "New like",
    message: `${likerName} liked your post`,
    relatedId: postId,
    relatedType: "post",
    actorId: likerUserId,
    actorName: likerName,
    actorAvatar: likerAvatar || undefined,
  });
}

// Notify when someone comments on a post
export async function notifyNewComment({
  postId,
  postAuthorId,
  commenterId,
  commenterName,
  commenterAvatar,
  commentText,
}: {
  postId: string;
  postAuthorId: string;
  commenterId: string;
  commenterName: string;
  commenterAvatar?: string;
  commentText: string;
}) {
  await createNotification({
    userId: postAuthorId,
    type: "NEW_COMMENT",
    title: "New comment",
    message: `${commenterName} commented: "${commentText.substring(0, 50)}${
      commentText.length > 50 ? "..." : ""
    }"`,
    relatedId: postId,
    relatedType: "post",
    actorId: commenterId,
    actorName: commenterName,
    actorAvatar: commenterAvatar || undefined,
  });
}

// Notify family members when someone creates a new post
export async function notifyNewPost({
  postId,
  familyId,
  authorId,
  authorName,
  authorAvatar,
}: {
  postId: string;
  familyId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}) {
  try {
    // Get all family members except the author
    const familyMembers = await prisma.familyMember.findMany({
      where: {
        familyId,
        userId: { not: authorId },
      },
      select: { userId: true },
    });

    // Create notifications for all family members
    const notifications = familyMembers.map((member) =>
      createNotification({
        userId: member.userId,
        type: "NEW_POST",
        title: "New post",
        message: `${authorName} shared something new`,
        relatedId: postId,
        relatedType: "post",
        actorId: authorId,
        actorName: authorName,
        actorAvatar: authorAvatar || undefined,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error notifying new post:", error);
  }
}

// ⭐ Optional: Notify when someone joins the family
export async function notifyMemberJoined({
  familyId,
  newMemberId,
  newMemberName,
  newMemberAvatar,
}: {
  familyId: string;
  newMemberId: string;
  newMemberName: string;
  newMemberAvatar?: string;
}) {
  try {
    // Get all family members except the new member
    const familyMembers = await prisma.familyMember.findMany({
      where: {
        familyId,
        userId: { not: newMemberId },
      },
      select: { userId: true },
    });

    // Notify existing members
    const notifications = familyMembers.map((member) =>
      createNotification({
        userId: member.userId,
        type: "MEMBER_JOINED",
        title: "New family member",
        message: `${newMemberName} joined the family`,
        relatedId: familyId,
        relatedType: "family",
        actorId: newMemberId,
        actorName: newMemberName,
        actorAvatar: newMemberAvatar || undefined,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error notifying member joined:", error);
  }
}