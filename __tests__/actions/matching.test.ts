import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient, mockComputeMatchScorePure } = vi.hoisted(() => {
  const mockPrismaClient = {
    aosSupplier: { findFirst: vi.fn() },
    supplierBrief: { findFirst: vi.fn() },
    supplierBriefAssignment: { findMany: vi.fn(), update: vi.fn() },
    certification: { findMany: vi.fn() },
  };

  return {
    mockGetAuthContext: vi.fn(),
    mockPrismaClient,
    mockComputeMatchScorePure: vi.fn(),
  };
});

vi.mock('@/lib/actions/context', () => ({
  getAuthContext: mockGetAuthContext,
  withAuth: async (fn: (ctx: { userId: string; teamId: string; role: string }) => unknown) => {
    const ctx = await mockGetAuthContext();
    if (!ctx) return { error: 'Not authenticated' };
    return fn(ctx);
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

vi.mock('@/lib/match-scoring', () => ({
  computeMatchScorePure: mockComputeMatchScorePure,
}));

import {
  computeMatchScore,
  recalculateMatchScores,
  recalculateMatchScoresForBrief,
} from '@/lib/actions/matching';

const AUTH_CTX = { userId: 'user-1', teamId: 'team-1', role: 'admin' };

describe('matching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue(AUTH_CTX);
  });

  // ─── computeMatchScore ──────────────────────────────────────

  describe('computeMatchScore', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await computeMatchScore('sup-1', 'brief-1');
      expect(result).toEqual({ score: null, breakdown: {} });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await computeMatchScore('sup-1', 'brief-1');

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
        select: { id: true },
      });
    });

    it('scopes brief lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);
      mockPrismaClient.certification.findMany.mockResolvedValue([]);

      await computeMatchScore('sup-1', 'brief-1');

      expect(mockPrismaClient.supplierBrief.findFirst).toHaveBeenCalledWith({
        where: { id: 'brief-1', teamId: 'team-1' },
      });
    });

    it('returns null score when supplier not found', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await computeMatchScore('sup-1', 'brief-1');
      expect(result).toEqual({ score: null, breakdown: {} });
    });

    it('returns null score when brief not found', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);
      mockPrismaClient.certification.findMany.mockResolvedValue([]);

      const result = await computeMatchScore('sup-1', 'brief-1');
      expect(result).toEqual({ score: null, breakdown: {} });
    });

    it('returns score and breakdown from computeMatchScorePure', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({
        id: 'brief-1',
        requiredCerts: ['GMP', 'ISO'],
      });
      mockPrismaClient.certification.findMany.mockResolvedValue([
        { certType: 'GMP', verificationStatus: 'verified', expiryDate: null },
      ]);
      mockComputeMatchScorePure.mockReturnValue({
        score: 50,
        breakdown: { GMP: true, ISO: false },
      });

      const result = await computeMatchScore('sup-1', 'brief-1');

      expect(result).toEqual({ score: 50, breakdown: { GMP: true, ISO: false } });
      expect(mockComputeMatchScorePure).toHaveBeenCalledWith(
        [{ certType: 'GMP', verificationStatus: 'verified', expiryDate: null }],
        ['GMP', 'ISO'],
      );
    });
  });

  // ─── recalculateMatchScores ─────────────────────────────────

  describe('recalculateMatchScores', () => {
    it('scopes assignment lookup by teamId via aosSupplier relation', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([]);
      await recalculateMatchScores('sup-1', 'team-1');

      expect(mockPrismaClient.supplierBriefAssignment.findMany).toHaveBeenCalledWith({
        where: {
          aosSupplierId: 'sup-1',
          aosSupplier: { teamId: 'team-1' },
        },
        select: { id: true, supplierBriefId: true },
      });
    });

    it('updates assignments with new scores', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([
        { id: 'assign-1', supplierBriefId: 'brief-1' },
        { id: 'assign-2', supplierBriefId: 'brief-2' },
      ]);

      // computeMatchScore calls — set up the mocks it needs
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.certification.findMany.mockResolvedValue([]);
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({
        id: 'brief-1',
        requiredCerts: ['GMP'],
      });
      mockComputeMatchScorePure.mockReturnValue({ score: 100, breakdown: { GMP: true } });
      mockPrismaClient.supplierBriefAssignment.update.mockResolvedValue({});

      await recalculateMatchScores('sup-1', 'team-1');

      expect(mockPrismaClient.supplierBriefAssignment.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.supplierBriefAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
        data: {
          matchScore: 100,
          matchBreakdown: { GMP: true },
          matchScoreStaleAt: null,
        },
      });
    });

    it('sets matchScoreStaleAt on error instead of leaving stale data', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([
        { id: 'assign-1', supplierBriefId: 'brief-1' },
      ]);

      // Make computeMatchScore throw by having the inner pure fn throw
      mockPrismaClient.aosSupplier.findFirst.mockRejectedValue(new Error('DB error'));
      mockPrismaClient.supplierBriefAssignment.update.mockResolvedValue({});

      await recalculateMatchScores('sup-1', 'team-1');

      expect(mockPrismaClient.supplierBriefAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
        data: { matchScoreStaleAt: expect.any(Date) },
      });
    });

    it('continues processing remaining assignments after one fails', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([
        { id: 'assign-1', supplierBriefId: 'brief-1' },
        { id: 'assign-2', supplierBriefId: 'brief-2' },
      ]);

      // First call throws, second succeeds
      mockPrismaClient.aosSupplier.findFirst
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id: 'sup-1' });
      mockPrismaClient.certification.findMany.mockResolvedValue([]);
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({
        id: 'brief-2',
        requiredCerts: [],
      });
      mockComputeMatchScorePure.mockReturnValue({ score: null, breakdown: {} });
      mockPrismaClient.supplierBriefAssignment.update.mockResolvedValue({});

      await recalculateMatchScores('sup-1', 'team-1');

      // Both assignments should be updated — first with stale flag, second with score
      expect(mockPrismaClient.supplierBriefAssignment.update).toHaveBeenCalledTimes(2);
    });
  });

  // ─── recalculateMatchScoresForBrief ─────────────────────────

  describe('recalculateMatchScoresForBrief', () => {
    it('scopes assignment lookup by teamId via supplierBrief relation', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([]);
      await recalculateMatchScoresForBrief('brief-1', 'team-1');

      expect(mockPrismaClient.supplierBriefAssignment.findMany).toHaveBeenCalledWith({
        where: {
          supplierBriefId: 'brief-1',
          supplierBrief: { teamId: 'team-1' },
        },
        select: { id: true, aosSupplierId: true },
      });
    });

    it('updates assignments with new scores', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([
        { id: 'assign-1', aosSupplierId: 'sup-1' },
      ]);

      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.certification.findMany.mockResolvedValue([]);
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({
        id: 'brief-1',
        requiredCerts: ['GMP'],
      });
      mockComputeMatchScorePure.mockReturnValue({ score: 0, breakdown: { GMP: false } });
      mockPrismaClient.supplierBriefAssignment.update.mockResolvedValue({});

      await recalculateMatchScoresForBrief('brief-1', 'team-1');

      expect(mockPrismaClient.supplierBriefAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
        data: {
          matchScore: 0,
          matchBreakdown: { GMP: false },
          matchScoreStaleAt: null,
        },
      });
    });

    it('sets matchScoreStaleAt on error', async () => {
      mockPrismaClient.supplierBriefAssignment.findMany.mockResolvedValue([
        { id: 'assign-1', aosSupplierId: 'sup-1' },
      ]);

      mockPrismaClient.aosSupplier.findFirst.mockRejectedValue(new Error('DB error'));
      mockPrismaClient.supplierBriefAssignment.update.mockResolvedValue({});

      await recalculateMatchScoresForBrief('brief-1', 'team-1');

      expect(mockPrismaClient.supplierBriefAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
        data: { matchScoreStaleAt: expect.any(Date) },
      });
    });
  });
});
