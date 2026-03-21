import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient, mockComputeMatchScore, mockRecalculateMatchScoresForBrief } = vi.hoisted(() => {
  const mockPrismaClient = {
    supplierBrief: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    aosSupplier: { findFirst: vi.fn() },
    supplierBriefAssignment: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    activity: { create: vi.fn() },
  };

  return {
    mockGetAuthContext: vi.fn(),
    mockPrismaClient,
    mockComputeMatchScore: vi.fn(),
    mockRecalculateMatchScoresForBrief: vi.fn(),
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

vi.mock('@/lib/actions/matching', () => ({
  computeMatchScore: mockComputeMatchScore,
  recalculateMatchScoresForBrief: mockRecalculateMatchScoresForBrief,
}));

import {
  createSupplierBrief,
  assignSupplierToBrief,
  removeSupplierFromBrief,
  listSupplierBriefs,
  getSupplierBrief,
} from '@/lib/actions/supplier-briefs';

const AUTH_CTX = { userId: 'user-1', teamId: 'team-1', role: 'admin' };

describe('supplier-briefs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue(AUTH_CTX);
  });

  // ─── createSupplierBrief ────────────────────────────────────

  describe('createSupplierBrief', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await createSupplierBrief({ name: 'Test', category: 'Skincare' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('creates brief with teamId from auth context', async () => {
      mockPrismaClient.supplierBrief.create.mockResolvedValue({ id: 'brief-new' });

      await createSupplierBrief({ name: 'New Brief', category: 'Skincare' });

      expect(mockPrismaClient.supplierBrief.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Brief',
          category: 'Skincare',
          teamId: 'team-1',
        }),
      });
    });

    it('returns success with brief id', async () => {
      mockPrismaClient.supplierBrief.create.mockResolvedValue({ id: 'brief-new' });

      const result = await createSupplierBrief({ name: 'Test', category: 'Hair' });
      expect(result).toEqual({ success: true, id: 'brief-new' });
    });

    it('defaults optional fields when not provided', async () => {
      mockPrismaClient.supplierBrief.create.mockResolvedValue({ id: 'brief-new' });

      await createSupplierBrief({ name: 'Test', category: 'Hair' });

      const createCall = mockPrismaClient.supplierBrief.create.mock.calls[0][0];
      expect(createCall.data.customerName).toBeNull();
      expect(createCall.data.subcategory).toBeNull();
      expect(createCall.data.blendFillType).toBeNull();
      expect(createCall.data.dueDate).toBeNull();
      expect(createCall.data.filterCategories).toEqual([]);
      expect(createCall.data.requiredCerts).toEqual([]);
      expect(createCall.data.requirements).toEqual({});
    });

    it('passes optional fields when provided', async () => {
      mockPrismaClient.supplierBrief.create.mockResolvedValue({ id: 'brief-new' });

      await createSupplierBrief({
        name: 'Test',
        category: 'Skincare',
        customerName: 'Acme Corp',
        subcategory: 'Moisturiser',
        requiredCerts: ['GMP', 'ISO'],
        requirements: { organic: true },
      });

      const createCall = mockPrismaClient.supplierBrief.create.mock.calls[0][0];
      expect(createCall.data.customerName).toBe('Acme Corp');
      expect(createCall.data.subcategory).toBe('Moisturiser');
      expect(createCall.data.requiredCerts).toEqual(['GMP', 'ISO']);
      expect(createCall.data.requirements).toEqual({ organic: true });
    });
  });

  // ─── assignSupplierToBrief ──────────────────────────────────

  describe('assignSupplierToBrief', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await assignSupplierToBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1' });

      await assignSupplierToBrief('sup-1', 'brief-1');

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
      });
    });

    it('scopes brief lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);

      await assignSupplierToBrief('sup-1', 'brief-1');

      expect(mockPrismaClient.supplierBrief.findFirst).toHaveBeenCalledWith({
        where: { id: 'brief-1', teamId: 'team-1' },
      });
    });

    it('returns error when supplier not found', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1' });

      const result = await assignSupplierToBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Supplier not found' });
    });

    it('returns error when brief not found', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);

      const result = await assignSupplierToBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Brief not found' });
    });

    it('returns error when supplier already assigned to brief', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1' });
      mockPrismaClient.supplierBriefAssignment.findUnique.mockResolvedValue({ id: 'assign-existing' });

      const result = await assignSupplierToBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Supplier is already assigned to this brief' });
    });

    it('creates assignment with match score', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1', name: 'Test Brief' });
      mockPrismaClient.supplierBriefAssignment.findUnique.mockResolvedValue(null);
      mockComputeMatchScore.mockResolvedValue({ score: 75, breakdown: { GMP: true, ISO: false } });
      mockPrismaClient.supplierBriefAssignment.create.mockResolvedValue({ id: 'assign-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await assignSupplierToBrief('sup-1', 'brief-1');

      expect(mockPrismaClient.supplierBriefAssignment.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-1',
          supplierBriefId: 'brief-1',
          matchScore: 75,
          matchBreakdown: { GMP: true, ISO: false },
          assignedById: 'user-1',
        },
      });
      expect(result).toEqual({ success: true, id: 'assign-new', matchScore: 75 });
    });

    it('logs activity after assignment', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue({ id: 'brief-1', name: 'Test Brief' });
      mockPrismaClient.supplierBriefAssignment.findUnique.mockResolvedValue(null);
      mockComputeMatchScore.mockResolvedValue({ score: 50, breakdown: {} });
      mockPrismaClient.supplierBriefAssignment.create.mockResolvedValue({ id: 'assign-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await assignSupplierToBrief('sup-1', 'brief-1');

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'brief_assigned',
          description: 'assigned to brief "Test Brief"',
          metadata: { supplierBriefId: 'brief-1', matchScore: 50 },
        }),
      });
    });
  });

  // ─── removeSupplierFromBrief ────────────────────────────────

  describe('removeSupplierFromBrief', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await removeSupplierFromBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when assignment not found', async () => {
      mockPrismaClient.supplierBriefAssignment.findUnique.mockResolvedValue(null);
      const result = await removeSupplierFromBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Assignment not found' });
    });

    it('returns error when assignment belongs to a different team', async () => {
      mockPrismaClient.supplierBriefAssignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        supplierBrief: { name: 'Brief', teamId: 'team-other' },
      });

      const result = await removeSupplierFromBrief('sup-1', 'brief-1');
      expect(result).toEqual({ error: 'Assignment not found' });
    });

    it('deletes assignment and returns success', async () => {
      mockPrismaClient.supplierBriefAssignment.findUnique.mockResolvedValue({
        id: 'assign-1',
        supplierBrief: { name: 'Test Brief', teamId: 'team-1' },
      });
      mockPrismaClient.supplierBriefAssignment.delete.mockResolvedValue({});

      const result = await removeSupplierFromBrief('sup-1', 'brief-1');

      expect(mockPrismaClient.supplierBriefAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'assign-1' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  // ─── listSupplierBriefs ─────────────────────────────────────

  describe('listSupplierBriefs', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await listSupplierBriefs();
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('scopes query by teamId', async () => {
      mockPrismaClient.supplierBrief.findMany.mockResolvedValue([]);

      await listSupplierBriefs();

      expect(mockPrismaClient.supplierBrief.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        include: { _count: { select: { assignments: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('passes category filter when provided', async () => {
      mockPrismaClient.supplierBrief.findMany.mockResolvedValue([]);

      await listSupplierBriefs({ category: 'Skincare' });

      expect(mockPrismaClient.supplierBrief.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1', category: 'Skincare' },
        include: { _count: { select: { assignments: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  // ─── getSupplierBrief ───────────────────────────────────────

  describe('getSupplierBrief', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await getSupplierBrief('brief-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('scopes query by teamId', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);

      await getSupplierBrief('brief-1');

      expect(mockPrismaClient.supplierBrief.findFirst).toHaveBeenCalledWith({
        where: { id: 'brief-1', teamId: 'team-1' },
        include: {
          assignments: {
            include: {
              aosSupplier: {
                include: {
                  certifications: { select: { certType: true, verificationStatus: true, expiryDate: true } },
                  agreements: { select: { agreementType: true, status: true } },
                },
              },
            },
            orderBy: { matchScore: 'desc' },
          },
        },
      });
    });

    it('returns brief with assignments when found', async () => {
      const briefData = {
        id: 'brief-1',
        name: 'Test Brief',
        assignments: [{ id: 'assign-1', matchScore: 80 }],
      };
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(briefData);

      const result = await getSupplierBrief('brief-1');
      expect(result).toEqual(briefData);
    });

    it('returns null when brief not found in team', async () => {
      mockPrismaClient.supplierBrief.findFirst.mockResolvedValue(null);

      const result = await getSupplierBrief('brief-1');
      expect(result).toBeNull();
    });
  });
});
