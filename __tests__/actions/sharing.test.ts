import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient } = vi.hoisted(() => ({
  mockGetAuthContext: vi.fn(),
  mockPrismaClient: {
    project: { findFirst: vi.fn(), findUnique: vi.fn() },
    projectAssignment: { findUnique: vi.fn() },
    shareLink: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/actions/context', () => ({
  getAuthContext: mockGetAuthContext,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

vi.mock('crypto', () => ({
  default: { randomBytes: vi.fn(() => ({ toString: () => 'mock-token-hex' })) },
}));

import { createShareLink, revokeShareLink, getSharedProject } from '@/lib/actions/sharing';

describe('sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createShareLink — role checks', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await createShareLink('proj-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('allows admins to create share links', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrismaClient.$transaction.mockResolvedValue({ id: 'link-1', token: 'abc' });

      const result = await createShareLink('proj-1');
      expect(result).toHaveProperty('success', true);
    });

    it('allows project leads to create share links', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'editor' });
      mockPrismaClient.projectAssignment.findUnique.mockResolvedValue({ role: 'lead' });
      mockPrismaClient.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrismaClient.$transaction.mockResolvedValue({ id: 'link-1', token: 'abc' });

      const result = await createShareLink('proj-1');
      expect(result).toHaveProperty('success', true);
    });

    it('rejects non-admin non-lead users', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'editor' });
      mockPrismaClient.projectAssignment.findUnique.mockResolvedValue({ role: 'member' });

      const result = await createShareLink('proj-1');
      expect(result).toEqual({ error: 'Only admins and project leads can create share links' });
    });

    it('rejects when project not found in team', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.project.findFirst.mockResolvedValue(null);

      const result = await createShareLink('proj-wrong-team');
      expect(result).toEqual({ error: 'Project not found' });
    });
  });

  describe('revokeShareLink', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await revokeShareLink('link-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects revoking link from different team', async () => {
      mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
      mockPrismaClient.shareLink.findFirst.mockResolvedValue({
        id: 'link-1',
        project: { teamId: 'team-2' },
      });

      const result = await revokeShareLink('link-1');
      expect(result).toEqual({ error: 'Share link not found' });
    });
  });

  describe('getSharedProject — public access', () => {
    it('returns not_found for unknown token', async () => {
      mockPrismaClient.shareLink.findUnique.mockResolvedValue(null);
      const result = await getSharedProject('nonexistent');
      expect(result).toEqual({ error: 'not_found' });
    });

    it('returns revoked for revoked link', async () => {
      mockPrismaClient.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        projectId: 'proj-1',
      });
      const result = await getSharedProject('abc');
      expect(result).toEqual({ error: 'revoked' });
    });

    it('returns expired for expired link', async () => {
      mockPrismaClient.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000), // yesterday
        projectId: 'proj-1',
      });
      const result = await getSharedProject('abc');
      expect(result).toEqual({ error: 'expired' });
    });

    it('returns project data for valid link', async () => {
      mockPrismaClient.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        projectId: 'proj-1',
        includeIngredients: false,
        includeReviews: false,
      });
      mockPrismaClient.project.findUnique.mockResolvedValue({
        name: 'Test Project',
        status: 'Brief',
        category: 'Skincare',
        market: 'AU',
        claims: null,
        formulations: [],
        sampleOrders: [],
      });

      const result = await getSharedProject('abc');
      expect(result).toHaveProperty('project');
      if ('project' in result) {
        expect(result.project.name).toBe('Test Project');
      }
    });

    it('strips ingredients when includeIngredients is false', async () => {
      mockPrismaClient.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        projectId: 'proj-1',
        includeIngredients: false,
        includeReviews: false,
      });
      mockPrismaClient.project.findUnique.mockResolvedValue({
        name: 'Test',
        status: 'Brief',
        category: null,
        market: null,
        claims: null,
        formulations: [{
          formulation: {
            name: 'Formula A',
            category: 'Shampoo',
            version: '1.0',
            status: 'Draft',
            ingredients: [{ percentage: 5, role: 'Active', ingredient: { name: 'Zinc', casNumber: null, function: 'Antimicrobial' } }],
          },
        }],
        sampleOrders: [],
      });

      const result = await getSharedProject('abc');
      if ('project' in result) {
        expect(result.project.formulations[0].formulation.ingredients).toEqual([]);
      }
    });

    it('strips reviews when includeReviews is false', async () => {
      mockPrismaClient.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        projectId: 'proj-1',
        includeIngredients: false,
        includeReviews: false,
      });
      mockPrismaClient.project.findUnique.mockResolvedValue({
        name: 'Test',
        status: 'Brief',
        category: null,
        market: null,
        claims: null,
        formulations: [],
        sampleOrders: [{
          reference: 'SMP-0001',
          status: 'Delivered',
          format: 'Full-size',
          quantity: 1,
          formulation: { name: 'Formula A' },
          reviews: [{ overall: 4, texture: 3, scent: 5, colour: 4, notes: 'Good', createdAt: new Date() }],
        }],
      });

      const result = await getSharedProject('abc');
      if ('project' in result) {
        expect(result.project.sampleOrders[0].reviews).toEqual([]);
      }
    });
  });
});
