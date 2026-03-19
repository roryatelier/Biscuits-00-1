import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockCreateNotifications, txMock, mockPrismaClient } = vi.hoisted(() => {
  const txMock = {
    comment: { create: vi.fn() },
    activity: { create: vi.fn() },
  };

  const mockPrismaClient = {
    comment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    activity: { create: vi.fn(), findFirst: vi.fn() },
    projectAssignment: { findMany: vi.fn() },
    $transaction: vi.fn((fn: (tx: typeof txMock) => unknown) => fn(txMock)),
  };

  return {
    mockGetAuthContext: vi.fn(),
    mockCreateNotifications: vi.fn(),
    txMock,
    mockPrismaClient,
  };
});

vi.mock('@/lib/actions/context', () => ({
  getAuthContext: mockGetAuthContext,
}));

vi.mock('@/lib/actions/notifications', () => ({
  createNotifications: mockCreateNotifications,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

import { createComment, editComment, deleteComment } from '@/lib/actions/comments';

describe('comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
    txMock.comment.create.mockResolvedValue({ id: 'comment-1' });
    txMock.activity.create.mockResolvedValue({ id: 'activity-1' });
  });

  describe('createComment', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await createComment({ body: 'test', entityType: 'project', entityId: 'proj-1' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects empty body', async () => {
      const result = await createComment({ body: '   ', entityType: 'project', entityId: 'proj-1' });
      expect(result).toEqual({ error: 'Comment cannot be empty' });
    });

    it('enforces one level of threading', async () => {
      mockPrismaClient.comment.findUnique.mockResolvedValue({ parentId: 'some-parent' });
      const result = await createComment({
        body: 'reply to reply',
        entityType: 'project',
        entityId: 'proj-1',
        parentId: 'already-a-reply',
      });
      expect(result).toEqual({ error: 'Cannot reply to a reply — only one level of threading' });
    });

    it('passes activity ID directly to createNotifications (not re-fetched)', async () => {
      mockPrismaClient.projectAssignment.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);

      await createComment({ body: 'test comment', entityType: 'project', entityId: 'proj-1' });

      // Should call createNotifications with the activity ID from the transaction
      expect(mockCreateNotifications).toHaveBeenCalledWith(
        'activity-1', // directly from tx.activity.create, not re-fetched
        ['user-2', 'user-3'], // excludes commenter (user-1)
      );

      // Should NOT have called activity.findFirst to re-fetch
      expect(mockPrismaClient.activity.findFirst).not.toHaveBeenCalled();
    });

    it('does not notify the commenter', async () => {
      mockPrismaClient.projectAssignment.findMany.mockResolvedValue([
        { userId: 'user-1' }, // the commenter
      ]);

      await createComment({ body: 'test', entityType: 'project', entityId: 'proj-1' });

      expect(mockCreateNotifications).toHaveBeenCalledWith('activity-1', []);
    });
  });

  describe('editComment', () => {
    it('rejects editing another user\'s comment', async () => {
      mockPrismaClient.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-2', // different user
        deletedAt: null,
      });
      const result = await editComment('c-1', 'new body');
      expect(result).toEqual({ error: 'You can only edit your own comments' });
    });

    it('rejects editing a deleted comment', async () => {
      mockPrismaClient.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
        deletedAt: new Date(),
      });
      const result = await editComment('c-1', 'new body');
      expect(result).toEqual({ error: 'Cannot edit a deleted comment' });
    });

    it('rejects empty body', async () => {
      const result = await editComment('c-1', '');
      expect(result).toEqual({ error: 'Comment cannot be empty' });
    });
  });

  describe('deleteComment', () => {
    it('rejects deleting another user\'s comment', async () => {
      mockPrismaClient.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-2',
      });
      const result = await deleteComment('c-1');
      expect(result).toEqual({ error: 'You can only delete your own comments' });
    });

    it('soft-deletes own comment', async () => {
      mockPrismaClient.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
      });
      mockPrismaClient.comment.update.mockResolvedValue({});

      const result = await deleteComment('c-1');
      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.comment.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
