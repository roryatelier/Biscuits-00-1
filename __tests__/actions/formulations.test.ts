import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient } = vi.hoisted(() => ({
  mockGetAuthContext: vi.fn(),
  mockPrismaClient: {
    formulation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/actions/context', () => ({
  getAuthContext: mockGetAuthContext,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

import { listFormulations, getFormulation, getFormulationCategories } from '@/lib/actions/formulations';

describe('formulations — team scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listFormulations', () => {
    it('returns empty array when not authenticated', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await listFormulations();
      expect(result).toEqual([]);
      expect(mockPrismaClient.formulation.findMany).not.toHaveBeenCalled();
    });

    it('scopes query by teamId', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.formulation.findMany.mockResolvedValue([]);

      await listFormulations();

      const whereArg = mockPrismaClient.formulation.findMany.mock.calls[0][0].where;
      expect(whereArg.teamId).toBe('team-1');
    });

    it('does not leak formulations from other teams', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.formulation.findMany.mockResolvedValue([]);

      await listFormulations();

      const whereArg = mockPrismaClient.formulation.findMany.mock.calls[0][0].where;
      expect(whereArg.teamId).toBe('team-1');
      expect(whereArg.teamId).not.toBe('team-2');
    });

    it('applies filters alongside team scoping', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.formulation.findMany.mockResolvedValue([]);

      await listFormulations({ category: 'Shampoo', status: 'Draft' });

      const whereArg = mockPrismaClient.formulation.findMany.mock.calls[0][0].where;
      expect(whereArg.teamId).toBe('team-1');
      expect(whereArg.category).toBe('Shampoo');
      expect(whereArg.status).toBe('Draft');
    });
  });

  describe('getFormulation', () => {
    it('returns null when not authenticated', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await getFormulation('form-1');
      expect(result).toBeNull();
    });

    it('scopes query by teamId', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.formulation.findFirst.mockResolvedValue(null);

      await getFormulation('form-1');

      const whereArg = mockPrismaClient.formulation.findFirst.mock.calls[0][0].where;
      expect(whereArg.id).toBe('form-1');
      expect(whereArg.teamId).toBe('team-1');
    });

    it('returns null for formulation belonging to different team', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.formulation.findFirst.mockResolvedValue(null);

      const result = await getFormulation('form-from-other-team');
      expect(result).toBeNull();
    });
  });

  describe('getFormulationCategories', () => {
    it('scopes category query by teamId', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.formulation.findMany.mockResolvedValue([{ category: 'Shampoo' }]);

      await getFormulationCategories();

      const queryArg = mockPrismaClient.formulation.findMany.mock.calls[0][0];
      expect(queryArg.where.teamId).toBe('team-1');
    });
  });
});
