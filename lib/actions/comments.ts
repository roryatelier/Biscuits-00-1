'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';
import { createNotifications } from '@/lib/actions/notifications';

export async function listComments(entityType: string, entityId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  return prisma.comment.findMany({
    where: { entityType, entityId },
    include: {
      user: { select: { id: true, name: true } },
      replies: {
        where: { deletedAt: null },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(data: {
  body: string;
  entityType: string;
  entityId: string;
  parentId?: string;
}) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  if (!data.body?.trim()) return { error: 'Comment cannot be empty' };

  // Enforce one level of threading: if parentId is set, verify it's not itself a reply
  if (data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: data.parentId },
      select: { parentId: true },
    });
    if (parent?.parentId) {
      return { error: 'Cannot reply to a reply — only one level of threading' };
    }
  }

  const { comment, activityId } = await prisma.$transaction(async (tx) => {
    const c = await tx.comment.create({
      data: {
        body: data.body.trim(),
        userId: ctx.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        parentId: data.parentId || null,
      },
    });

    let aId: string | null = null;

    // Emit activity if this is a project comment
    if (data.entityType === 'project') {
      const activity = await tx.activity.create({
        data: {
          entityType: 'project',
          entityId: data.entityId,
          projectId: data.entityId,
          userId: ctx.userId,
          type: 'comment',
          description: `left a comment: "${data.body.trim().substring(0, 80)}${data.body.trim().length > 80 ? '...' : ''}"`,
          metadata: { commentId: c.id, parentId: data.parentId || undefined },
        },
      });
      aId = activity.id;
    }

    return { comment: c, activityId: aId };
  });

  // Fan-out notifications: comment on project -> all project assignees except commenter
  if (data.entityType === 'project' && activityId) {
    const assignments = await prisma.projectAssignment.findMany({
      where: { projectId: data.entityId },
      select: { userId: true },
    });
    const recipients = assignments
      .map((a) => a.userId)
      .filter((uid) => uid !== ctx.userId);
    await createNotifications(activityId, recipients);
  }

  return { success: true, id: comment.id };
}

export async function editComment(commentId: string, body: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  if (!body?.trim()) return { error: 'Comment cannot be empty' };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: 'Comment not found' };
  if (comment.userId !== ctx.userId) return { error: 'You can only edit your own comments' };
  if (comment.deletedAt) return { error: 'Cannot edit a deleted comment' };

  await prisma.comment.update({
    where: { id: commentId },
    data: { body: body.trim() },
  });

  return { success: true };
}

export async function deleteComment(commentId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: 'Comment not found' };
  if (comment.userId !== ctx.userId) return { error: 'You can only delete your own comments' };

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  return { success: true };
}
