import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient, mockRecalculateMatchScores, mockComputePermissionLevel } = vi.hoisted(() => {
  const mockPrismaClient = {
    aosSupplier: { findFirst: vi.fn(), findMany: vi.fn() },
    certification: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    agreement: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn() },
  };

  return {
    mockGetAuthContext: vi.fn(),
    mockPrismaClient,
    mockRecalculateMatchScores: vi.fn(),
    mockComputePermissionLevel: vi.fn(),
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
  recalculateMatchScores: mockRecalculateMatchScores,
}));

vi.mock('@/lib/suppliers/permission-logic', () => ({
  computePermissionLevel: mockComputePermissionLevel,
}));

import {
  addCertification,
  updateCertification,
  removeCertification,
  updateAgreementStatus,
  getPermissionLevel,
  getPermissionLevels,
} from '@/lib/actions/certifications';

const AUTH_CTX = { userId: 'user-1', teamId: 'team-1', role: 'admin' };

describe('certifications actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue(AUTH_CTX);
    mockRecalculateMatchScores.mockResolvedValue(undefined);
  });

  // ─── addCertification ──────────────────────────────────────

  describe('addCertification', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await addCertification('sup-1', { certType: 'GMP' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when supplier not found in team', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await addCertification('sup-1', { certType: 'GMP' });
      expect(result).toEqual({ error: 'Supplier not found' });
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await addCertification('sup-1', { certType: 'GMP' });

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
      });
    });

    it('creates certification record with correct data', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.certification.create.mockResolvedValue({ id: 'cert-1' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await addCertification('sup-1', {
        certType: 'GMP',
        certBody: 'TGA',
        scope: 'Manufacturing',
        issueDate: '2025-01-01',
        expiryDate: '2026-01-01',
        documentRef: 'doc-ref-1',
        verificationStatus: 'verified',
      });

      expect(mockPrismaClient.certification.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-1',
          certType: 'GMP',
          certBody: 'TGA',
          scope: 'Manufacturing',
          issueDate: new Date('2025-01-01'),
          expiryDate: new Date('2026-01-01'),
          documentRef: 'doc-ref-1',
          verificationStatus: 'verified',
        },
      });
    });

    it('defaults optional fields to null and status to unverified', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.certification.create.mockResolvedValue({ id: 'cert-1' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await addCertification('sup-1', { certType: 'ISO' });

      expect(mockPrismaClient.certification.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-1',
          certType: 'ISO',
          certBody: null,
          scope: null,
          issueDate: null,
          expiryDate: null,
          documentRef: null,
          verificationStatus: 'unverified',
        },
      });
    });

    it('returns success with cert id', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.certification.create.mockResolvedValue({ id: 'cert-new' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await addCertification('sup-1', { certType: 'GMP' });
      expect(result).toEqual({ success: true, id: 'cert-new' });
    });

    it('triggers recalculateMatchScores after creation', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.certification.create.mockResolvedValue({ id: 'cert-1' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await addCertification('sup-1', { certType: 'GMP' });

      expect(mockRecalculateMatchScores).toHaveBeenCalledWith('sup-1', 'team-1');
    });

    it('logs activity after creation', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
      mockPrismaClient.certification.create.mockResolvedValue({ id: 'cert-1' });
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await addCertification('sup-1', { certType: 'GMP' });

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'cert_changed',
          description: 'added GMP certification',
          metadata: { certId: 'cert-1', certType: 'GMP', action: 'added' },
        }),
      });
    });

    it('validates verificationStatus — rejects invalid value', async () => {
      const result = await addCertification('sup-1', {
        certType: 'GMP',
        verificationStatus: 'bogus',
      });

      expect(result).toEqual({
        error: 'Invalid verification status "bogus". Must be one of: unverified, verified, expired',
      });
      expect(mockPrismaClient.certification.create).not.toHaveBeenCalled();
    });

    it.each(['unverified', 'verified', 'expired'] as const)(
      'accepts valid verificationStatus "%s"',
      async (status) => {
        mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1', teamId: 'team-1' });
        mockPrismaClient.certification.create.mockResolvedValue({ id: 'cert-1' });
        mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

        const result = await addCertification('sup-1', {
          certType: 'GMP',
          verificationStatus: status,
        });
        expect(result).toEqual({ success: true, id: 'cert-1' });
      },
    );
  });

  // ─── updateCertification ───────────────────────────────────

  describe('updateCertification', () => {
    const existingCert = {
      id: 'cert-1',
      aosSupplierId: 'sup-1',
      certType: 'GMP',
      aosSupplier: { id: 'sup-1', teamId: 'team-1' },
    };

    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await updateCertification('cert-1', { scope: 'Manufacturing' });
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when cert not found', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(null);
      const result = await updateCertification('cert-1', { scope: 'Manufacturing' });
      expect(result).toEqual({ error: 'Certification not found' });
    });

    it('returns error when cert belongs to different team', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue({
        ...existingCert,
        aosSupplier: { id: 'sup-1', teamId: 'team-other' },
      });
      const result = await updateCertification('cert-1', { scope: 'Manufacturing' });
      expect(result).toEqual({ error: 'Certification not found' });
    });

    it('updates only provided fields', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateCertification('cert-1', { scope: 'Packaging', certBody: 'SAI Global' });

      expect(mockPrismaClient.certification.update).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
        data: { scope: 'Packaging', certBody: 'SAI Global' },
      });
    });

    it('returns success on valid update', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await updateCertification('cert-1', { scope: 'Packaging' });
      expect(result).toEqual({ success: true });
    });

    it('triggers recalculateMatchScores after update', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateCertification('cert-1', { verificationStatus: 'verified' });

      expect(mockRecalculateMatchScores).toHaveBeenCalledWith('sup-1', 'team-1');
    });

    it('logs activity after update', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateCertification('cert-1', { scope: 'Packaging' });

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'cert_changed',
          description: 'updated GMP certification',
          metadata: { certId: 'cert-1', certType: 'GMP', action: 'updated' },
        }),
      });
    });

    it('validates verificationStatus — rejects invalid value', async () => {
      const result = await updateCertification('cert-1', { verificationStatus: 'pending' });

      expect(result).toEqual({
        error: 'Invalid verification status "pending". Must be one of: unverified, verified, expired',
      });
      expect(mockPrismaClient.certification.update).not.toHaveBeenCalled();
    });

    it.each(['unverified', 'verified', 'expired'] as const)(
      'accepts valid verificationStatus "%s"',
      async (status) => {
        mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
        mockPrismaClient.certification.update.mockResolvedValue({});
        mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

        const result = await updateCertification('cert-1', { verificationStatus: status });
        expect(result).toEqual({ success: true });
      },
    );
  });

  // ─── removeCertification ───────────────────────────────────

  describe('removeCertification', () => {
    const existingCert = {
      id: 'cert-1',
      aosSupplierId: 'sup-1',
      certType: 'GMP',
      aosSupplier: { id: 'sup-1', teamId: 'team-1' },
    };

    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await removeCertification('cert-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error when cert not found', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(null);
      const result = await removeCertification('cert-1');
      expect(result).toEqual({ error: 'Certification not found' });
    });

    it('returns error when cert belongs to different team', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue({
        ...existingCert,
        aosSupplier: { id: 'sup-1', teamId: 'team-other' },
      });
      const result = await removeCertification('cert-1');
      expect(result).toEqual({ error: 'Certification not found' });
    });

    it('deletes the certification record', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.delete.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await removeCertification('cert-1');

      expect(mockPrismaClient.certification.delete).toHaveBeenCalledWith({
        where: { id: 'cert-1' },
      });
    });

    it('returns success on valid deletion', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.delete.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      const result = await removeCertification('cert-1');
      expect(result).toEqual({ success: true });
    });

    it('triggers recalculateMatchScores after deletion', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.delete.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await removeCertification('cert-1');

      expect(mockRecalculateMatchScores).toHaveBeenCalledWith('sup-1', 'team-1');
    });

    it('logs activity after deletion', async () => {
      mockPrismaClient.certification.findFirst.mockResolvedValue(existingCert);
      mockPrismaClient.certification.delete.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await removeCertification('cert-1');

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'cert_changed',
          description: 'removed GMP certification',
          metadata: { certType: 'GMP', action: 'removed' },
        }),
      });
    });
  });

  // ─── updateAgreementStatus ─────────────────────────────────

  describe('updateAgreementStatus', () => {
    const existingAgreement = {
      id: 'agr-1',
      aosSupplierId: 'sup-1',
      agreementType: 'NDA',
      status: 'not_started',
      aosSupplier: { id: 'sup-1', teamId: 'team-1' },
    };

    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await updateAgreementStatus('agr-1', 'sent');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('validates status — rejects invalid value', async () => {
      const result = await updateAgreementStatus('agr-1', 'approved');

      expect(result).toEqual({
        error: 'Invalid agreement status "approved". Must be one of: not_started, sent, signed',
      });
      expect(mockPrismaClient.agreement.findFirst).not.toHaveBeenCalled();
    });

    it.each(['not_started', 'sent', 'signed'] as const)(
      'accepts valid status "%s"',
      async (status) => {
        mockPrismaClient.agreement.findFirst.mockResolvedValue(existingAgreement);
        mockPrismaClient.agreement.update.mockResolvedValue({});
        mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

        const result = await updateAgreementStatus('agr-1', status);
        expect(result).toEqual({ success: true });
      },
    );

    it('returns error when agreement not found', async () => {
      mockPrismaClient.agreement.findFirst.mockResolvedValue(null);
      const result = await updateAgreementStatus('agr-1', 'sent');
      expect(result).toEqual({ error: 'Agreement not found' });
    });

    it('returns error when agreement belongs to different team', async () => {
      mockPrismaClient.agreement.findFirst.mockResolvedValue({
        ...existingAgreement,
        aosSupplier: { id: 'sup-1', teamId: 'team-other' },
      });
      const result = await updateAgreementStatus('agr-1', 'sent');
      expect(result).toEqual({ error: 'Agreement not found' });
    });

    it('sets sentAt when status is "sent"', async () => {
      mockPrismaClient.agreement.findFirst.mockResolvedValue(existingAgreement);
      mockPrismaClient.agreement.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateAgreementStatus('agr-1', 'sent');

      const updateCall = mockPrismaClient.agreement.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('sent');
      expect(updateCall.data.sentAt).toBeInstanceOf(Date);
      expect(updateCall.data.signedAt).toBeUndefined();
    });

    it('sets signedAt when status is "signed"', async () => {
      mockPrismaClient.agreement.findFirst.mockResolvedValue(existingAgreement);
      mockPrismaClient.agreement.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateAgreementStatus('agr-1', 'signed');

      const updateCall = mockPrismaClient.agreement.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('signed');
      expect(updateCall.data.signedAt).toBeInstanceOf(Date);
      expect(updateCall.data.sentAt).toBeUndefined();
    });

    it('does not set sentAt or signedAt when status is "not_started"', async () => {
      mockPrismaClient.agreement.findFirst.mockResolvedValue(existingAgreement);
      mockPrismaClient.agreement.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateAgreementStatus('agr-1', 'not_started');

      const updateCall = mockPrismaClient.agreement.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('not_started');
      expect(updateCall.data.sentAt).toBeUndefined();
      expect(updateCall.data.signedAt).toBeUndefined();
    });

    it('logs activity with correct metadata', async () => {
      mockPrismaClient.agreement.findFirst.mockResolvedValue(existingAgreement);
      mockPrismaClient.agreement.update.mockResolvedValue({});
      mockPrismaClient.activity.create.mockResolvedValue({ id: 'act-1' });

      await updateAgreementStatus('agr-1', 'signed');

      expect(mockPrismaClient.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'supplier',
          entityId: 'sup-1',
          userId: 'user-1',
          type: 'agreement_changed',
          description: 'updated NDA to "signed"',
          metadata: {
            agreementId: 'agr-1',
            agreementType: 'NDA',
            from: 'not_started',
            to: 'signed',
          },
        }),
      });
    });
  });

  // ─── getPermissionLevel ────────────────────────────────────

  describe('getPermissionLevel', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await getPermissionLevel('sup-1');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns "none" when supplier not found in team', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      const result = await getPermissionLevel('sup-1');
      expect(result).toBe('none');
    });

    it('scopes supplier lookup by teamId', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue(null);
      await getPermissionLevel('sup-1');

      expect(mockPrismaClient.aosSupplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'sup-1', teamId: 'team-1' },
        select: { id: true },
      });
    });

    it('fetches agreements and certifications then delegates to computePermissionLevel', async () => {
      mockPrismaClient.aosSupplier.findFirst.mockResolvedValue({ id: 'sup-1' });

      const mockAgreements = [{ agreementType: 'NDA', status: 'signed' }];
      const mockCerts = [{ certType: 'GMP', verificationStatus: 'verified' }];
      mockPrismaClient.agreement.findMany.mockResolvedValue(mockAgreements);
      mockPrismaClient.certification.findMany.mockResolvedValue(mockCerts);
      mockComputePermissionLevel.mockReturnValue('can_sample');

      const result = await getPermissionLevel('sup-1');

      expect(mockPrismaClient.agreement.findMany).toHaveBeenCalledWith({
        where: { aosSupplierId: 'sup-1' },
      });
      expect(mockPrismaClient.certification.findMany).toHaveBeenCalledWith({
        where: { aosSupplierId: 'sup-1' },
      });
      expect(mockComputePermissionLevel).toHaveBeenCalledWith(mockAgreements, mockCerts);
      expect(result).toBe('can_sample');
    });
  });

  // ─── getPermissionLevels (batch) ───────────────────────────

  describe('getPermissionLevels', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await getPermissionLevels(['sup-1']);
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns empty object for empty input', async () => {
      const result = await getPermissionLevels([]);
      expect(result).toEqual({});
    });

    it('fetches agreements and certs scoped by teamId in 2 queries', async () => {
      const ids = ['sup-1', 'sup-2'];
      mockPrismaClient.agreement.findMany.mockResolvedValue([]);
      mockPrismaClient.certification.findMany.mockResolvedValue([]);
      mockComputePermissionLevel.mockReturnValue('none');

      await getPermissionLevels(ids);

      expect(mockPrismaClient.agreement.findMany).toHaveBeenCalledWith({
        where: {
          aosSupplierId: { in: ids },
          aosSupplier: { teamId: 'team-1' },
        },
        select: { aosSupplierId: true, agreementType: true, status: true },
      });

      expect(mockPrismaClient.certification.findMany).toHaveBeenCalledWith({
        where: {
          aosSupplierId: { in: ids },
          aosSupplier: { teamId: 'team-1' },
        },
        select: { aosSupplierId: true, certType: true, verificationStatus: true },
      });
    });

    it('returns Record<string, PermissionLevel> for multiple suppliers', async () => {
      const ids = ['sup-1', 'sup-2'];

      mockPrismaClient.agreement.findMany.mockResolvedValue([
        { aosSupplierId: 'sup-1', agreementType: 'NDA', status: 'signed' },
      ]);
      mockPrismaClient.certification.findMany.mockResolvedValue([
        { aosSupplierId: 'sup-1', certType: 'GMP', verificationStatus: 'verified' },
      ]);

      // First call for sup-1 (has data), second call for sup-2 (empty arrays)
      mockComputePermissionLevel
        .mockReturnValueOnce('can_sample')
        .mockReturnValueOnce('none');

      const result = await getPermissionLevels(ids);

      expect(result).toEqual({
        'sup-1': 'can_sample',
        'sup-2': 'none',
      });
    });

    it('groups agreements and certs by supplier before computing', async () => {
      const ids = ['sup-1', 'sup-2'];

      const agreements = [
        { aosSupplierId: 'sup-1', agreementType: 'NDA', status: 'signed' },
        { aosSupplierId: 'sup-2', agreementType: 'MSA', status: 'sent' },
      ];
      const certs = [
        { aosSupplierId: 'sup-1', certType: 'GMP', verificationStatus: 'verified' },
      ];

      mockPrismaClient.agreement.findMany.mockResolvedValue(agreements);
      mockPrismaClient.certification.findMany.mockResolvedValue(certs);
      mockComputePermissionLevel.mockReturnValue('none');

      await getPermissionLevels(ids);

      // sup-1 gets its own agreements and certs
      expect(mockComputePermissionLevel).toHaveBeenCalledWith(
        [agreements[0]],
        [certs[0]],
      );

      // sup-2 gets its own agreements and empty certs
      expect(mockComputePermissionLevel).toHaveBeenCalledWith(
        [agreements[1]],
        [],
      );
    });
  });
});
