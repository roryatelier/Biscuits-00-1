import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient = {
    aosSupplier: { findFirst: vi.fn() },
    supplierBrief: { findFirst: vi.fn() },
    briefRequirement: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  };

  return {
    mockGetAuthContext: vi.fn(),
    mockPrismaClient,
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

import {
  getComplianceAssessment,
  listBriefRequirements,
  addBriefRequirement,
  updateBriefRequirement,
  removeBriefRequirement,
} from '@/lib/actions/compliance';

const AUTH_CTX = { userId: 'user-1', teamId: 'team-1', role: 'admin' };

describe('compliance actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue(AUTH_CTX);
  });

  // ─── getComplianceAssessment ──────────────────────────────

  describe('getComplianceAssessment', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await getComplianceAssessment('sup-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when supplier not found in team', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await getComplianceAssessment('sup-1');
      expect(result).toEqual({ error: 'Supplier not found' });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await getComplianceAssessment('sup-1');

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
        include: {
          certifications: true,
          agreements: true,
          audits: true,
        },
      });
    });

    it('returns rows, score, and supplier name for valid supplier', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({
        id: 'sup-1',
        companyName: 'Test Supplier Co',
        qualificationStage: 'Fully Qualified',
        factoryCountry: 'South Korea',
        companyCountry: 'South Korea',
        cocAcknowledged: true,
        certifications: [
          { certType: 'GMP', certCategory: 'quality', verificationStatus: 'verified', expiryDate: null },
        ],
        agreements: [
          { agreementType: 'NDA', status: 'signed', signedAt: new Date('2025-01-01'), expiryDate: null },
        ],
        audits: [],
      });

      const result = await getComplianceAssessment('sup-1');
      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('rows');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('supplierName', 'Test Supplier Co');

      // Should contain assessment rows
      const typedResult = result as { rows: unknown[]; score: { overall: number | null } };
      expect(typedResult.rows.length).toBeGreaterThan(0);
      expect(typedResult.score).toHaveProperty('overall');
    });
  });

  // ─── listBriefRequirements ────────────────────────────────

  describe('listBriefRequirements', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await listBriefRequirements('brief-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when brief not found in team', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);
      const result = await listBriefRequirements('brief-1');
      expect(result).toEqual({ error: 'Brief not found' });
    });

    it('scopes brief lookup by teamId', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);
      await listBriefRequirements('brief-1');

      expect(mockPrismaClient.supplierBrief.findFirst).toHaveBeenCalledWith({
        where: { id: 'brief-1', teamId: 'team-1' },
      });
    });

    it('returns requirements for valid brief', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1' });
      const reqs = [
        { id: 'req-1', layer: 'manufacturer', category: 'cert', requirement: 'ISO 9001' },
        { id: 'req-2', layer: 'product', category: 'sds', requirement: 'SDS available' },
      ];
      mockPrismaClient.briefRequirement.findMany.mockResolvedValue(reqs);

      const result = await listBriefRequirements('brief-1');
      expect(result).toEqual(reqs);

      expect(mockPrismaClient.briefRequirement.findMany).toHaveBeenCalledWith({
        where: { supplierBriefId: 'brief-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('cannot access another team\'s brief', async () => {
      // Brief not found because teamId doesn't match
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);
      const result = await listBriefRequirements('brief-other-team');
      expect(result).toEqual({ error: 'Brief not found' });
    });
  });

  // ─── addBriefRequirement ──────────────────────────────────

  describe('addBriefRequirement', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await addBriefRequirement({
        supplierBriefId: 'brief-1',
        layer: 'manufacturer',
        category: 'cert',
        requirement: 'ISO 9001',
      });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when brief not found in team', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);
      const result = await addBriefRequirement({
        supplierBriefId: 'brief-1',
        layer: 'manufacturer',
        category: 'cert',
        requirement: 'ISO 9001',
      });
      expect(result).toEqual({ error: 'Brief not found' });
    });

    it('creates requirement with correct defaults', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1' });
      mockPrismaClient.briefRequirement.create.mockResolvedValue({ id: 'req-new' });

      const result = await addBriefRequirement({
        supplierBriefId: 'brief-1',
        layer: 'manufacturer',
        category: 'cert',
        requirement: 'ISO 9001',
      });

      expect(mockPrismaClient.briefRequirement.create).toHaveBeenCalledWith({
        data: {
          supplierBriefId: 'brief-1',
          layer: 'manufacturer',
          category: 'cert',
          requirement: 'ISO 9001',
          ruleKey: null,
          priority: 'nice_to_have',
          extractedBy: 'manual',
        },
      });
      expect(result).toEqual({ success: true, id: 'req-new' });
    });

    it('passes optional ruleKey and priority', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1' });
      mockPrismaClient.briefRequirement.create.mockResolvedValue({ id: 'req-new' });

      await addBriefRequirement({
        supplierBriefId: 'brief-1',
        layer: 'product',
        category: 'cert',
        requirement: 'GMP',
        ruleKey: 'gmp',
        priority: 'must_have',
      });

      expect(mockPrismaClient.briefRequirement.create).toHaveBeenCalledWith({
        data: {
          supplierBriefId: 'brief-1',
          layer: 'product',
          category: 'cert',
          requirement: 'GMP',
          ruleKey: 'gmp',
          priority: 'must_have',
          extractedBy: 'manual',
        },
      });
    });
  });

  // ─── updateBriefRequirement ───────────────────────────────

  describe('updateBriefRequirement', () => {
    const existingReq = {
      id: 'req-1',
      supplierBrief: { teamId: 'team-1' },
    };

    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await updateBriefRequirement('req-1', { priority: 'must_have' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when requirement not found', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue(null);
      const result = await updateBriefRequirement('req-1', { priority: 'must_have' });
      expect(result).toEqual({ error: 'Requirement not found' });
    });

    it('returns error when requirement belongs to different team', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue({
        id: 'req-1',
        supplierBrief: { teamId: 'team-other' },
      });
      const result = await updateBriefRequirement('req-1', { priority: 'must_have' });
      expect(result).toEqual({ error: 'Requirement not found' });
    });

    it('changes priority on valid update', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue(existingReq);
      mockPrismaClient.briefRequirement.update.mockResolvedValue({});

      const result = await updateBriefRequirement('req-1', { priority: 'must_have' });

      expect(mockPrismaClient.briefRequirement.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { priority: 'must_have' },
      });
      expect(result).toEqual({ success: true });
    });

    it('updates multiple fields at once', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue(existingReq);
      mockPrismaClient.briefRequirement.update.mockResolvedValue({});

      await updateBriefRequirement('req-1', {
        requirement: 'Updated label',
        layer: 'product',
        category: 'sds',
        ruleKey: 'new_key',
      });

      expect(mockPrismaClient.briefRequirement.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: {
          requirement: 'Updated label',
          layer: 'product',
          category: 'sds',
          ruleKey: 'new_key',
        },
      });
    });
  });

  // ─── removeBriefRequirement ───────────────────────────────

  describe('removeBriefRequirement', () => {
    const existingReq = {
      id: 'req-1',
      supplierBrief: { teamId: 'team-1' },
    };

    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await removeBriefRequirement('req-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when requirement not found', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue(null);
      const result = await removeBriefRequirement('req-1');
      expect(result).toEqual({ error: 'Requirement not found' });
    });

    it('returns error when requirement belongs to different team', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue({
        id: 'req-1',
        supplierBrief: { teamId: 'team-other' },
      });
      const result = await removeBriefRequirement('req-1');
      expect(result).toEqual({ error: 'Requirement not found' });
    });

    it('deletes requirement and returns success', async () => {
      mockPrismaClient.briefRequirement.findFirst.mockResolvedValue(existingReq);
      mockPrismaClient.briefRequirement.delete.mockResolvedValue({});

      const result = await removeBriefRequirement('req-1');

      expect(mockPrismaClient.briefRequirement.delete).toHaveBeenCalledWith({
        where: { id: 'req-1' },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
