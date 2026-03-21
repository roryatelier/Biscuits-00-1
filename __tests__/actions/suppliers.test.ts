import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient = {
    aosSupplier: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    cobaltSupplier: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn() },
    $transaction: vi.fn(),
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
  transitionSupplierStage,
  createAosSupplier,
  updateAosSupplier,
  setCautionFlag,
} from '@/lib/actions/suppliers';

const AUTH_CTX = { userId: 'user-1', teamId: 'team-1', role: 'admin' };

describe('suppliers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue(AUTH_CTX);
  });

  // ─── transitionSupplierStage ────────────────────────────────

  describe('transitionSupplierStage', () => {
    const supplierInStage = (stage: string) => ({
      id: 'sup-1',
      teamId: 'team-1',
      qualificationStage: stage,
      companyName: 'Test Supplier',
    });

    // 1. Auth boundary
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await transitionSupplierStage('sup-1', 'Outreached');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    // 2. Team scoping — supplier not found in team
    it('returns error when supplier not found in team', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await transitionSupplierStage('sup-1', 'Outreached');
      expect(result).toEqual({ error: 'Supplier not found' });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await transitionSupplierStage('sup-1', 'Outreached');

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
      });
    });

    // 3. Valid transitions — each stage to its allowed next stages
    const validTransitionCases: [string, string][] = [
      ['Identified', 'Outreached'],
      ['Identified', 'Paused'],
      ['Identified', 'Blacklisted'],
      ['Outreached', 'Capability Confirmed'],
      ['Outreached', 'Paused'],
      ['Outreached', 'Blacklisted'],
      ['Capability Confirmed', 'Conditionally Qualified'],
      ['Capability Confirmed', 'Outreached'],
      ['Capability Confirmed', 'Paused'],
      ['Capability Confirmed', 'Blacklisted'],
      ['Conditionally Qualified', 'Fully Qualified'],
      ['Conditionally Qualified', 'Capability Confirmed'],
      ['Conditionally Qualified', 'Paused'],
      ['Conditionally Qualified', 'Blacklisted'],
      ['Fully Qualified', 'Conditionally Qualified'],
      ['Fully Qualified', 'Paused'],
      ['Fully Qualified', 'Blacklisted'],
      ['Paused', 'Identified'],
      ['Paused', 'Outreached'],
    ];

    it.each(validTransitionCases)(
      'allows transition from "%s" to "%s"',
      async (from, to) => {
        mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage(from));
        mockPrismaClient.aosSupplier.update.mockResolvedValue({});
        mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

        const reason = (to === 'Paused' || to === 'Blacklisted')
          ? { type: 'Quality concerns', note: 'Test' }
          : undefined;

        const result = await transitionSupplierStage('sup-1', to, reason);
        expect(result).toEqual({ success: true, newStage: to });
      },
    );

    // 4. Invalid transitions
    const invalidTransitionCases: [string, string][] = [
      ['Identified', 'Fully Qualified'],
      ['Identified', 'Conditionally Qualified'],
      ['Identified', 'Capability Confirmed'],
      ['Outreached', 'Fully Qualified'],
      ['Outreached', 'Identified'],
      ['Fully Qualified', 'Identified'],
      ['Fully Qualified', 'Outreached'],
      ['Blacklisted', 'Identified'],
      ['Blacklisted', 'Outreached'],
      ['Blacklisted', 'Fully Qualified'],
      ['Paused', 'Fully Qualified'],
      ['Paused', 'Capability Confirmed'],
    ];

    it.each(invalidTransitionCases)(
      'rejects transition from "%s" to "%s"',
      async (from, to) => {
        mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage(from));

        const result = await transitionSupplierStage('sup-1', to);
        expect(result).toEqual({
          error: `Cannot transition from "${from}" to "${to}"`,
        });
        // Should NOT update the supplier
        expect(mockPrismaClient.aosSupplier.update).not.toHaveBeenCalled();
      },
    );

    // Blacklisted is a terminal state — no valid transitions
    it('rejects all transitions from Blacklisted (terminal state)', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Blacklisted'));
      const result = await transitionSupplierStage('sup-1', 'Identified');
      expect(result).toEqual({
        error: 'Cannot transition from "Blacklisted" to "Identified"',
      });
    });

    // 5. Reason required for Paused/Blacklisted
    it('requires a reason when transitioning to Paused', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Identified'));

      const result = await transitionSupplierStage('sup-1', 'Paused');
      expect(result).toEqual({
        error: 'A reason is required when pausing or blacklisting a supplier',
      });
    });

    it('requires a reason when transitioning to Blacklisted', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Identified'));

      const result = await transitionSupplierStage('sup-1', 'Blacklisted');
      expect(result).toEqual({
        error: 'A reason is required when pausing or blacklisting a supplier',
      });
    });

    it('rejects reason with missing type for Paused', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Identified'));

      // reason object present but type is empty string
      const result = await transitionSupplierStage('sup-1', 'Paused', { type: '', note: 'some note' });
      expect(result).toEqual({
        error: 'A reason is required when pausing or blacklisting a supplier',
      });
    });

    // 6. Reason not required for other transitions
    it('does not require a reason when transitioning to Outreached', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Identified'));
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await transitionSupplierStage('sup-1', 'Outreached');
      expect(result).toEqual({ success: true, newStage: 'Outreached' });
    });

    it('does not require a reason when transitioning to Capability Confirmed', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Outreached'));
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await transitionSupplierStage('sup-1', 'Capability Confirmed');
      expect(result).toEqual({ success: true, newStage: 'Capability Confirmed' });
    });

    // 7. Activity logging
    it('creates activity record with correct metadata on valid transition', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Identified'));
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await transitionSupplierStage('sup-1', 'Outreached');

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'stage_transition',
          description: 'transitioned from "Identified" to "Outreached"',
          metadata: { from: 'Identified', to: 'Outreached' },
        }),
      });
    });

    it('includes reason in activity metadata when provided', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Outreached'));
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await transitionSupplierStage('sup-1', 'Paused', {
        type: 'Quality concerns',
        note: 'Failed inspection',
      });

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: {
            from: 'Outreached',
            to: 'Paused',
            reason: 'Quality concerns',
            reasonNote: 'Failed inspection',
          },
        }),
      });
    });

    it('updates supplier stage in the database', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(supplierInStage('Identified'));
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await transitionSupplierStage('sup-1', 'Outreached');

      expect(mockPrismaClient.aosSupplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { qualificationStage: 'Outreached' },
      });
    });
  });

  // ─── createAosSupplier ──────────────────────────────────────

  describe('createAosSupplier', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await createAosSupplier({ companyName: 'Test', categories: ['Skincare'] });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('creates supplier with teamId from auth context', async () => {
      mockPrismaClient.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await createAosSupplier({ companyName: 'New Supplier', categories: ['Skincare'] });

      expect(mockPrismaClient.aosSupplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyName: 'New Supplier',
          categories: ['Skincare'],
          teamId: 'team-1',
        }),
      });
    });

    it('returns success with supplier id', async () => {
      mockPrismaClient.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await createAosSupplier({ companyName: 'New Supplier', categories: ['Skincare'] });
      expect(result).toEqual({ success: true, id: 'sup-new' });
    });

    it('defaults optional fields when not provided', async () => {
      mockPrismaClient.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await createAosSupplier({ companyName: 'Test', categories: ['Hair'] });

      const createCall = mockPrismaClient.aosSupplier.create.mock.calls[0][0];
      expect(createCall.data.subcategories).toEqual([]);
      expect(createCall.data.moq).toBeNull();
      expect(createCall.data.keyBrands).toEqual([]);
    });

    it('passes optional fields when provided', async () => {
      mockPrismaClient.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await createAosSupplier({
        companyName: 'Test',
        categories: ['Skincare'],
        subcategories: ['Moisturiser'],
        moq: 500,
        keyBrands: ['BrandA'],
      });

      const createCall = mockPrismaClient.aosSupplier.create.mock.calls[0][0];
      expect(createCall.data.subcategories).toEqual(['Moisturiser']);
      expect(createCall.data.moq).toBe(500);
      expect(createCall.data.keyBrands).toEqual(['BrandA']);
    });

    it('logs activity after creation', async () => {
      mockPrismaClient.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await createAosSupplier({ companyName: 'Test Co', categories: ['Skincare'] });

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-new',
          userId: 'user-1',
          type: 'project_created',
          description: 'created supplier "Test Co"',
        }),
      });
    });
  });

  // ─── updateAosSupplier ──────────────────────────────────────

  describe('updateAosSupplier', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await updateAosSupplier('sup-1', { companyName: 'New Name' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when supplier not found in team', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await updateAosSupplier('sup-1', { companyName: 'New Name' });
      expect(result).toEqual({ error: 'Supplier not found' });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await updateAosSupplier('sup-1', { companyName: 'New Name' });

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
      });
    });

    it('updates only the provided fields', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});

      await updateAosSupplier('sup-1', { companyName: 'Updated Name' });

      expect(mockPrismaClient.aosSupplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { companyName: 'Updated Name' },
      });
    });

    it('returns success on valid update', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});

      const result = await updateAosSupplier('sup-1', { categories: ['Hair'] });
      expect(result).toEqual({ success: true });
    });
  });

  // ─── setCautionFlag ─────────────────────────────────────────

  describe('setCautionFlag', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await setCautionFlag('sup-1', true, 'Concern');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when supplier not found in team', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await setCautionFlag('sup-1', true, 'Concern');
      expect(result).toEqual({ error: 'Supplier not found' });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await setCautionFlag('sup-1', true);

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
      });
    });

    it('sets caution flag to true with note', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await setCautionFlag('sup-1', true, 'Quality issue spotted');

      expect(mockPrismaClient.aosSupplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { cautionFlag: true, cautionNote: 'Quality issue spotted' },
      });
    });

    it('sets cautionNote to null when flag is true but no note provided', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await setCautionFlag('sup-1', true);

      expect(mockPrismaClient.aosSupplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { cautionFlag: true, cautionNote: null },
      });
    });

    it('clears caution flag and note when flag is false', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await setCautionFlag('sup-1', false, 'This note should be ignored');

      expect(mockPrismaClient.aosSupplier.update).toHaveBeenCalledWith({
        where: { id: 'sup-1' },
        data: { cautionFlag: false, cautionNote: null },
      });
    });

    it('logs activity when setting caution flag', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await setCautionFlag('sup-1', true, 'Compliance risk');

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'project_updated',
          description: 'set caution flag: "Compliance risk"',
        }),
      });
    });

    it('logs activity when clearing caution flag', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await setCautionFlag('sup-1', false);

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'cleared caution flag',
        }),
      });
    });

    it('returns success on valid flag set', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.aosSupplier.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await setCautionFlag('sup-1', true, 'Test');
      expect(result).toEqual({ success: true });
    });
  });
});
