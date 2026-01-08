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

// ✅ 1. Notify for New Albums
export async function notifyNewAlbum({
  albumId,
  familyId,
  creatorId,
  creatorName,
  albumTitle,
}: {
  albumId: string;
  familyId: string;
  creatorId: string;
  creatorName: string;
  albumTitle: string;
}) {
  try {
    // Fetch all family members EXCEPT the creator
    const membersToNotify = await prisma.familyMember.findMany({
      where: {
        familyId,
        userId: { not: creatorId }, // 👈 This handles the exclusion
      },
      select: { userId: true },
    });

    // Bulk create notifications
    const notifications = membersToNotify.map((member) =>
      createNotification({
        userId: member.userId,
        type: "NEW_ALBUM",
        title: "New Album",
        message: `${creatorName} created "${albumTitle}"`,
        relatedId: albumId,
        relatedType: "album",
        actorId: creatorId,
        actorName: creatorName,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error("Error sending album notifications:", error);
  }
}

// ✅ 2. Daily Cron: Check Birthdays
export async function checkDailyBirthdays() {
  const today = new Date();
  const month = today.getMonth() + 1; // JS months are 0-indexed
  const day = today.getDate();

  try {
    // Find all tree nodes with birthday today
    // Note: This requires raw query or filtering in JS because Prisma doesn't do date parts easily across DBs
    // Ideally, you'd store birthMonth and birthDay as Ints for speed, but filtering logic works too:
    const allNodes = await prisma.familyTreeNode.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, firstName: true, lastName: true, birthDate: true, familyId: true, userId: true },
    });

    const birthdayNodes = allNodes.filter(node => {
        if(!node.birthDate) return false;
        const d = new Date(node.birthDate);
        return d.getUTCDate() === day && (d.getUTCMonth() + 1) === month;
    });

    for (const person of birthdayNodes) {
      const fullName = `${person.firstName} ${person.lastName || ""}`.trim();
      
      // Get everyone in that family
      const members = await prisma.familyMember.findMany({
        where: { familyId: person.familyId },
      });

      for (const member of members) {
        // Message is different if it's YOUR birthday
        const isMe = member.userId === person.userId;
        const message = isMe 
          ? "Happy Birthday! 🎂 We hope you have a great day!" 
          : `It's ${fullName}'s birthday today! 🎂`;

        await createNotification({
          userId: member.userId,
          type: "BIRTHDAY_REMINDER",
          title: "Birthday Reminder",
          message,
          relatedId: person.id,
          relatedType: "treenode",
        });
      }
    }
  } catch (error) {
    console.error("Error checking birthdays:", error);
  }
}


export async function checkDailyAnniversaries() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  try {
    const allNodes = await prisma.familyTreeNode.findMany({
      where: { weddingAnniversary: { not: null } },
      include: {
        // Relationships where 'person' is stored as person1 (so spouse is person2)
        relationshipsFrom: {
          where: { relationshipType: "SPOUSE" },
          include: { person2: true } 
        },
        // Relationships where 'person' is stored as person2 (so spouse is person1)
        relationshipsTo: {
          where: { relationshipType: "SPOUSE" },
          include: { person1: true }
        }
      }
    });

    // Filter by date match
    const anniversaryNodes = allNodes.filter(node => {
      if (!node.weddingAnniversary) return false;
      const d = new Date(node.weddingAnniversary);
      return d.getUTCDate() === day && (d.getUTCMonth() + 1) === month;
    });

    const processedCoupleIds = new Set<string>();

    for (const person of anniversaryNodes) {
      // 🛠️ FIX: Explicitly check which array has data to avoid TS errors
      let spouse = null;
      
      if (person.relationshipsFrom.length > 0) {
        // If in 'relationshipsFrom', I am person1, spouse is person2
        spouse = person.relationshipsFrom[0].person2;
      } else if (person.relationshipsTo.length > 0) {
        // If in 'relationshipsTo', I am person2, spouse is person1
        spouse = person.relationshipsTo[0].person1;
      }

      // Create a unique key to prevent duplicate notifications for the same couple
      const ids = [person.id, spouse?.id || "single"].sort();
      const coupleKey = ids.join("-");

      if (processedCoupleIds.has(coupleKey)) continue;
      processedCoupleIds.add(coupleKey);

      const personName = person.firstName;
      const spouseName = spouse ? spouse.firstName : "Spouse";
      
      const familyMembers = await prisma.familyMember.findMany({
        where: { familyId: person.familyId },
      });

      for (const member of familyMembers) {
        let message = "";
        
        const isPerson = member.userId === person.userId;
        const isSpouse = spouse && member.userId === spouse.userId;

        if (isPerson) {
          message = `Happy Anniversary to you and ${spouseName}! 🥂`;
        } else if (isSpouse) {
          message = `Happy Anniversary to you and ${personName}! 🥂`;
        } else {
          message = spouse 
            ? `It's ${personName} & ${spouseName}'s Anniversary today! 🥂`
            : `It's ${personName}'s Anniversary today! 🥂`;
        }

        await createNotification({
          userId: member.userId,
          type: "ANNIVERSARY_REMINDER",
          title: "Anniversary Reminder",
          message,
          relatedId: person.id,
          relatedType: "treenode",
        });
      }
    }
  } catch (error) {
    console.error("Error checking anniversaries:", error);
  }
}