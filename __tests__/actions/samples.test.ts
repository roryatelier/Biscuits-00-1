import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockCreateNotifications, txMock, mockPrismaClient } = vi.hoisted(() => {
  const txMock = {
    sampleOrder: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    sampleReview: { create: vi.fn() },
    formulation: { findUnique: vi.fn() },
    activity: { create: vi.fn() },
  };

  const mockPrismaClient = {
    sampleOrder: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    projectAssignment: { findFirst: vi.fn() },
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

import { createSampleOrder, advanceStatus, addReview } from '@/lib/actions/samples';

describe('samples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue({ userId: 'user-1', teamId: 'team-1', role: 'admin' });
  });

  describe('createSampleOrder', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await createSampleOrder({ formulationId: 'f-1', quantity: 1, format: 'Full-size' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects missing formulationId', async () => {
      const result = await createSampleOrder({ formulationId: '', quantity: 1, format: 'Full-size' });
      expect(result).toEqual({ error: 'Formulation is required' });
    });

    it('rejects quantity less than 1', async () => {
      const result = await createSampleOrder({ formulationId: 'f-1', quantity: 0, format: 'Full-size' });
      expect(result).toEqual({ error: 'Quantity must be at least 1' });
    });

    it('generates reference inside transaction (race condition fix)', async () => {
      txMock.sampleOrder.findFirst.mockResolvedValue({ reference: 'SMP-0003' });
      txMock.sampleOrder.create.mockResolvedValue({ id: 'order-1' });

      await createSampleOrder({ formulationId: 'f-1', quantity: 1, format: 'Full-size' });

      // findFirst for reference should be called on the transaction client, not the main prisma client
      expect(txMock.sampleOrder.findFirst).toHaveBeenCalled();
      expect(mockPrismaClient.sampleOrder.findFirst).not.toHaveBeenCalled();

      // Verify the created order has the incremented reference
      const createCall = txMock.sampleOrder.create.mock.calls[0][0];
      expect(createCall.data.reference).toBe('SMP-0004');
    });

    it('generates SMP-0001 when no orders exist', async () => {
      txMock.sampleOrder.findFirst.mockResolvedValue(null);
      txMock.sampleOrder.create.mockResolvedValue({ id: 'order-1' });

      await createSampleOrder({ formulationId: 'f-1', quantity: 1, format: 'Full-size' });

      const createCall = txMock.sampleOrder.create.mock.calls[0][0];
      expect(createCall.data.reference).toBe('SMP-0001');
    });
  });

  describe('advanceStatus', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await advanceStatus('order-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects order not found', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue(null);
      const result = await advanceStatus('order-1');
      expect(result).toEqual({ error: 'Order not found' });
    });

    it('rejects advancing from Delivered (terminal state)', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue({
        id: 'order-1',
        status: 'Delivered',
        reference: 'SMP-0001',
      });
      const result = await advanceStatus('order-1');
      expect(result).toEqual({ error: 'Cannot advance from "Delivered"' });
    });

    it('advances Pending to In Production', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue({
        id: 'order-1',
        status: 'Pending',
        reference: 'SMP-0001',
        projectId: null,
        createdById: 'user-1',
      });
      txMock.sampleOrder.update.mockResolvedValue({});
      mockPrismaClient.$transaction.mockImplementation((fn) => fn(txMock));

      const result = await advanceStatus('order-1');
      expect(result).toEqual({ success: true, newStatus: 'In Production' });
    });

    it('passes activity ID directly to createNotifications', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue({
        id: 'order-1',
        status: 'Pending',
        reference: 'SMP-0001',
        projectId: 'proj-1',
        createdById: 'user-2', // different from advancer
      });
      txMock.sampleOrder.update.mockResolvedValue({});
      txMock.activity.create.mockResolvedValue({ id: 'activity-99' });
      mockPrismaClient.$transaction.mockImplementation((fn) => fn(txMock));

      await advanceStatus('order-1');

      expect(mockCreateNotifications).toHaveBeenCalledWith('activity-99', ['user-2']);
    });

    it('does not notify when advancer is the order creator', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue({
        id: 'order-1',
        status: 'Pending',
        reference: 'SMP-0001',
        projectId: 'proj-1',
        createdById: 'user-1', // same as advancer
      });
      txMock.sampleOrder.update.mockResolvedValue({});
      txMock.activity.create.mockResolvedValue({ id: 'activity-99' });
      mockPrismaClient.$transaction.mockImplementation((fn) => fn(txMock));

      await advanceStatus('order-1');

      expect(mockCreateNotifications).not.toHaveBeenCalled();
    });
  });

  describe('addReview', () => {
    it('rejects unauthenticated users', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await addReview({ sampleOrderId: 'order-1' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('rejects order not found in team', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue(null);
      const result = await addReview({ sampleOrderId: 'order-1' });
      expect(result).toEqual({ error: 'Sample order not found' });
    });

    it('passes activity ID directly to createNotifications for reviews', async () => {
      mockPrismaClient.sampleOrder.findFirst.mockResolvedValue({
        id: 'order-1',
        reference: 'SMP-0001',
        projectId: 'proj-1',
        createdById: 'user-2',
      });
      txMock.sampleReview.create.mockResolvedValue({ id: 'review-1' });
      txMock.activity.create.mockResolvedValue({ id: 'activity-100' });
      mockPrismaClient.$transaction.mockImplementation((fn) => fn(txMock));
      mockPrismaClient.projectAssignment.findFirst.mockResolvedValue({ userId: 'user-3' });

      await addReview({ sampleOrderId: 'order-1', overall: 4 });

      expect(mockCreateNotifications).toHaveBeenCalledWith(
        'activity-100',
        expect.arrayContaining(['user-2', 'user-3']),
      );
    });
  });
});
