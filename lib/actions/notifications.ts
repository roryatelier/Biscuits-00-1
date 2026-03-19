'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';

/**
 * List notifications for the current user, most recent first.
 * Includes the related activity with user info.
 */
export async function listNotifications() {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  return prisma.notification.findMany({
    where: { userId: ctx.userId },
    include: {
      activity: {
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

/**
 * Return the count of unread notifications for the current user.
 */
export async function getUnreadCount() {
  const ctx = await getAuthContext();
  if (!ctx) return 0;

  return prisma.notification.count({
    where: { userId: ctx.userId, read: false },
  });
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: ctx.userId },
    data: { read: true },
  });

  return { success: true };
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead() {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  await prisma.notification.updateMany({
    where: { userId: ctx.userId, read: false },
    data: { read: true },
  });

  return { success: true };
}

/**
 * Create notification records for each recipient.
 * Called after activity creation — non-critical, so failures are caught silently.
 */
export async function createNotifications(
  activityId: string,
  recipientUserIds: string[]
) {
  if (!recipientUserIds.length) return;

  try {
    await prisma.notification.createMany({
      data: recipientUserIds.map((userId) => ({
        userId,
        activityId,
      })),
    });
  } catch {
    // Non-critical — log but don't propagate
    console.error('Failed to create notifications for activity', activityId);
  }
}
