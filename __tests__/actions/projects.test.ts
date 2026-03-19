import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockCreateNotifications, txMock, mockPrismaClient } = vi.hoisted(() => {
  const txMock = {
    project: { create: vi.fn(), update: vi.fn() },
    projectAssignment: { create: vi.fn() },
    activity: { create: vi.fn() },
  };

  const mockPrismaClient = {
    project: { findFirst: vi.fn(), findMany: vi.fn() },
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

import { createProject, listProjects, getProject } from '@/lib/actions/projects';

describe('projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
  });

  describe('createProject', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await createProject({ name: 'Test' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects empty project name', async () => {
      const result = await createProject({ name: '   ' });
      expect(result).toEqual({ error: 'Project name is required' });
    });

    it('auto-assigns creator as project lead inside transaction', async () => {
      txMock.project.create.mockResolvedValue({ id: 'proj-1' });
      txMock.activity.create.mockResolvedValue({ id: 'act-1' });

      await createProject({ name: 'New Project' });

      expect(txMock.projectAssignment.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          userId: 'user-1',
          role: 'lead',
        },
      });
    });

    it('emits project_created activity inside transaction', async () => {
      txMock.project.create.mockResolvedValue({ id: 'proj-1' });
      txMock.activity.create.mockResolvedValue({ id: 'act-1' });

      await createProject({ name: 'New Project' });

      expect(txMock.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'proj-1',
          userId: 'user-1',
          type: 'project_created',
        }),
      });
    });
  });

  describe('listProjects', () => {
    it('returns empty array when not authenticated', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await listProjects();
      expect(result).toEqual([]);
    });

    it('scopes query by teamId', async () => {
      mockPrismaClient.project.findMany.mockResolvedValue([]);
      await listProjects();

      const whereArg = mockPrismaClient.project.findMany.mock.calls[0][0].where;
      expect(whereArg.teamId).toBe('team-1');
    });

    it('applies status filter', async () => {
      mockPrismaClient.project.findMany.mockResolvedValue([]);
      await listProjects('In Development');

      const whereArg = mockPrismaClient.project.findMany.mock.calls[0][0].where;
      expect(whereArg.teamId).toBe('team-1');
      expect(whereArg.status).toBe('In Development');
    });

    it('includes assignments in response', async () => {
      mockPrismaClient.project.findMany.mockResolvedValue([]);
      await listProjects();

      const includeArg = mockPrismaClient.project.findMany.mock.calls[0][0].include;
      expect(includeArg.assignments).toBeDefined();
    });
  });

  describe('getProject', () => {
    it('returns null when not authenticated', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await getProject('proj-1');
      expect(result).toBeNull();
    });

    it('scopes query by teamId', async () => {
      mockPrismaClient.project.findFirst.mockResolvedValue(null);
      await getProject('proj-1');

      const whereArg = mockPrismaClient.project.findFirst.mock.calls[0][0].where;
      expect(whereArg.id).toBe('proj-1');
      expect(whereArg.teamId).toBe('team-1');
    });
  });
});
