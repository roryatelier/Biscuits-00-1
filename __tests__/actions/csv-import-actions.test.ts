import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient = {
    aosSupplier: { findMany: vi.fn(), create: vi.fn() },
    certification: { create: vi.fn(), createMany: vi.fn() },
    agreement: { create: vi.fn(), createMany: vi.fn() },
    supplierContact: { create: vi.fn(), createMany: vi.fn() },
    factoryAudit: { create: vi.fn(), createMany: vi.fn() },
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

import { previewCsvImport, commitCsvImport } from '@/lib/actions/csv-import';
import type { ParsedSupplier } from '@/lib/csv-parser';

const AUTH_CTX = { userId: 'user-1', teamId: 'team-1', role: 'admin' };

// Helper to build a valid ParsedSupplier
function makeParsedSupplier(overrides: Partial<ParsedSupplier> = {}): ParsedSupplier {
  return {
    row: 2,
    companyName: 'Test Supplier',
    companyLegalName: null,
    country: 'Australia',
    categories: ['Skincare'],
    subcategories: ['Moisturiser'],
    capabilityType: 'turnkey',
    moq: 1000,
    moqInfo: null,
    keyBrands: ['BrandA'],
    companyCity: 'Melbourne',
    factoryCity: 'Shenzhen',
    factoryCountry: 'China',
    certTypes: ['GMP', 'ISO'],
    certCategory: null,
    regulatoryCerts: [],
    agreementTypes: ['NDA'],
    contactName: 'Jane Doe',
    contactEmail: 'jane@test.com',
    contactMobile: '+61400000000',
    qualificationStage: null,
    activeSkus: [],
    region: null,
    marketExperience: [],
    acquisitionSource: null,
    currency: null,
    supplierCode: null,
    legacyId: null,
    cautionFlag: false,
    cautionNote: null,
    dateOutreached: null,
    dateQualified: null,
    productionLeadTimeDayMin: null,
    productionLeadTimeDayMax: null,
    productionLeadTimeInfo: null,
    fillCapabilities: [],
    fillPackagingNotes: null,
    ndaLink: null,
    ndaStart: null,
    ndaExpiry: null,
    ndaStatus: null,
    nonCircumventMonths: null,
    agreementLink: null,
    agreementNotes: null,
    cocAcknowledged: false,
    cocLink: null,
    cocDateAccepted: null,
    certificationLink: null,
    ipOwnership: null,
    atelierBrands: [],
    atelierNote: null,
    factoryNotes: null,
    paymentTerms: null,
    factoryAuditData: null,
    raw: { 'Company Name': 'Test Supplier', Country: 'Australia' },
    ...overrides,
  };
}

describe('csv-import actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue(AUTH_CTX);
  });

  // ─── previewCsvImport ──────────────────────────────────────

  describe('previewCsvImport', () => {
    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await previewCsvImport('Company Name,Country\nTest,AU');
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('returns error for empty CSV', async () => {
      mockPrismaClient.aosSupplier.findMany.mockResolvedValue([]);
      const result = await previewCsvImport('');
      expect(result).toEqual({ error: 'No data rows found in CSV' });
    });

    it('returns error for header-only CSV', async () => {
      mockPrismaClient.aosSupplier.findMany.mockResolvedValue([]);
      const result = await previewCsvImport('Company Name,Country');
      expect(result).toEqual({ error: 'No data rows found in CSV' });
    });

    it('returns parsed suppliers with correct counts for valid CSV', async () => {
      mockPrismaClient.aosSupplier.findMany.mockResolvedValue([]);

      const csv = [
        'Company Name,Country,Categories,Capability',
        'Supplier A,Australia,Skincare,turnkey',
        'Supplier B,China,Hair,blend_fill',
      ].join('\n');

      const result = await previewCsvImport(csv);

      expect(result).not.toHaveProperty('error');
      const preview = result as { valid: ParsedSupplier[]; duplicates: ParsedSupplier[]; rejected: unknown[]; totalRows: number };
      expect(preview.totalRows).toBe(2);
      expect(preview.valid).toHaveLength(2);
      expect(preview.duplicates).toHaveLength(0);
      expect(preview.rejected).toHaveLength(0);
      expect(preview.valid[0].companyName).toBe('Supplier A');
      expect(preview.valid[0].country).toBe('Australia');
      expect(preview.valid[1].companyName).toBe('Supplier B');
    });

    it('flags suppliers already in DB as duplicates', async () => {
      mockPrismaClient.aosSupplier.findMany.mockResolvedValue([
        { companyName: 'Existing Corp', companyCountry: 'Australia' },
      ]);

      const csv = [
        'Company Name,Country',
        'Existing Corp,Australia',
        'New Supplier,China',
      ].join('\n');

      const result = await previewCsvImport(csv);

      const preview = result as { valid: ParsedSupplier[]; duplicates: ParsedSupplier[]; rejected: unknown[]; totalRows: number };
      expect(preview.valid).toHaveLength(1);
      expect(preview.valid[0].companyName).toBe('New Supplier');
      expect(preview.duplicates).toHaveLength(1);
      expect(preview.duplicates[0].companyName).toBe('Existing Corp');
    });

    it('flags in-batch duplicates', async () => {
      mockPrismaClient.aosSupplier.findMany.mockResolvedValue([]);

      const csv = [
        'Company Name,Country',
        'Dupe Co,Australia',
        'Dupe Co,Australia',
      ].join('\n');

      const result = await previewCsvImport(csv);

      const preview = result as { valid: ParsedSupplier[]; duplicates: ParsedSupplier[]; rejected: unknown[]; totalRows: number };
      expect(preview.valid).toHaveLength(1);
      expect(preview.duplicates).toHaveLength(1);
    });

    it('rejects rows missing required fields with reason', async () => {
      mockPrismaClient.aosSupplier.findMany.mockResolvedValue([]);

      const csv = [
        'Company Name,Country',
        ',Australia',
        'Good Supplier,',
        'Valid Supplier,China',
      ].join('\n');

      const result = await previewCsvImport(csv);

      const preview = result as { valid: ParsedSupplier[]; duplicates: ParsedSupplier[]; rejected: { row: number; reason: string; data: Record<string, string> }[]; totalRows: number };
      expect(preview.valid).toHaveLength(1);
      expect(preview.valid[0].companyName).toBe('Valid Supplier');
      expect(preview.rejected).toHaveLength(2);
      expect(preview.rejected[0].reason).toBe('Missing company name');
      expect(preview.rejected[0].row).toBe(2);
      expect(preview.rejected[1].reason).toBe('Missing country');
      expect(preview.rejected[1].row).toBe(3);
    });
  });

  // ─── commitCsvImport ───────────────────────────────────────

  describe('commitCsvImport', () => {
    // Create a txMock that mirrors mockPrismaClient shape
    let txMock: typeof mockPrismaClient;

    beforeEach(() => {
      txMock = {
        aosSupplier: { findMany: vi.fn(), create: vi.fn() },
        certification: { create: vi.fn(), createMany: vi.fn() },
        agreement: { create: vi.fn(), createMany: vi.fn() },
        supplierContact: { create: vi.fn(), createMany: vi.fn() },
        factoryAudit: { create: vi.fn(), createMany: vi.fn() },
        activity: { create: vi.fn() },
        $transaction: vi.fn(),
      };

      // The key pattern: $transaction receives a callback, we invoke it with txMock
      mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock));

      txMock.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      txMock.certification.create.mockResolvedValue({ id: 'cert-new' });
      txMock.certification.createMany.mockResolvedValue({ count: 0 });
      txMock.agreement.create.mockResolvedValue({ id: 'agr-new' });
      txMock.agreement.createMany.mockResolvedValue({ count: 0 });
      txMock.supplierContact.create.mockResolvedValue({ id: 'contact-new' });
      txMock.supplierContact.createMany.mockResolvedValue({ count: 0 });
      txMock.factoryAudit.create.mockResolvedValue({ id: 'audit-new' });
      txMock.factoryAudit.createMany.mockResolvedValue({ count: 0 });
      txMock.activity.create.mockResolvedValue({ id: 'act-new' });
    });

    it('rejects unauthenticated requests', async () => {
      mockGetAuthContext.mockResolvedValue(null);
      const result = await commitCsvImport([makeParsedSupplier()]);
      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('creates supplier with correct fields', async () => {
      const supplier = makeParsedSupplier({
        companyName: 'Acme Co',
        country: 'Australia',
        companyCity: 'Sydney',
        factoryCity: 'Shenzhen',
        factoryCountry: 'China',
        categories: ['Skincare', 'Hair'],
        subcategories: ['Moisturiser'],
        capabilityType: 'turnkey',
        moq: 500,
        keyBrands: ['BrandX'],
        certTypes: [],
        agreementTypes: [],
        contactName: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.aosSupplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyName: 'Acme Co',
          companyCountry: 'Australia',
          companyCity: 'Sydney',
          factoryCity: 'Shenzhen',
          factoryCountry: 'China',
          categories: ['Skincare', 'Hair'],
          subcategories: ['Moisturiser'],
          capabilityType: 'turnkey',
          moq: 500,
          keyBrands: ['BrandX'],
          teamId: 'team-1',
        }),
      });
    });

    it('defaults factoryCountry to country when not provided', async () => {
      const supplier = makeParsedSupplier({
        country: 'Australia',
        factoryCountry: null,
      });

      await commitCsvImport([supplier]);

      const createCall = txMock.aosSupplier.create.mock.calls[0][0];
      expect(createCall.data.factoryCountry).toBe('Australia');
    });

    it('creates certifications for each certType via createMany', async () => {
      const supplier = makeParsedSupplier({
        certTypes: ['GMP', 'ISO_9001', 'Halal'],
        agreementTypes: [],
        contactName: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.certification.createMany).toHaveBeenCalledTimes(1);
      const certData = txMock.certification.createMany.mock.calls[0][0].data;
      expect(certData).toHaveLength(3);
      // normaliseCertType is applied again in commitCsvImport
      expect(certData[0]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        certType: 'GMP',
        certCategory: 'quality',
        verificationStatus: 'unverified',
      }));
      expect(certData[1]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        certType: 'ISO_9001',
      }));
      expect(certData[2]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        certType: 'other',
      }));
    });

    it('creates agreements for each agreementType via createMany', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: ['NDA', 'MSA'],
        contactName: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.agreement.createMany).toHaveBeenCalledTimes(1);
      const agrData = txMock.agreement.createMany.mock.calls[0][0].data;
      expect(agrData).toHaveLength(2);
      expect(agrData[0]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        agreementType: 'NDA',
        status: 'not_started',
      }));
      expect(agrData[1]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        agreementType: 'MSA',
        status: 'not_started',
      }));
    });

    it('creates contact when contactName is provided via createMany', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: 'Jane Doe',
        contactEmail: 'jane@test.com',
        contactMobile: '+61400000000',
      });

      await commitCsvImport([supplier]);

      expect(txMock.supplierContact.createMany).toHaveBeenCalledTimes(1);
      const contactData = txMock.supplierContact.createMany.mock.calls[0][0].data;
      expect(contactData).toHaveLength(1);
      expect(contactData[0]).toEqual({
        aosSupplierId: 'sup-new',
        name: 'Jane Doe',
        email: 'jane@test.com',
        mobile: '+61400000000',
        isPrimary: true,
      });
    });

    it('skips contact creation when no contact info', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: null,
        contactEmail: null,
        contactMobile: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.supplierContact.createMany).not.toHaveBeenCalled();
    });

    it('logs activity after import', async () => {
      const suppliers = [
        makeParsedSupplier({ certTypes: ['GMP'], agreementTypes: ['NDA'], contactName: 'John' }),
      ];

      await commitCsvImport(suppliers);

      expect(txMock.activity.create).toHaveBeenCalledWith({
        data: {
          entityType: 'supplier',
          entityId: 'import',
          userId: 'user-1',
          type: 'project_created',
          description: 'imported 1 suppliers via CSV',
          metadata: { created: 1, certsCreated: 1, agreementsCreated: 1, contactsCreated: 1 },
        },
      });
    });

    it('returns correct counts', async () => {
      const suppliers = [
        makeParsedSupplier({ certTypes: ['GMP', 'ISO_9001'], agreementTypes: ['NDA'], contactName: 'Alice' }),
        makeParsedSupplier({ companyName: 'Other Co', certTypes: [], agreementTypes: ['MSA'], contactName: null }),
      ];

      // Second supplier also gets a new id
      txMock.aosSupplier.create
        .mockResolvedValueOnce({ id: 'sup-1' })
        .mockResolvedValueOnce({ id: 'sup-2' });

      const result = await commitCsvImport(suppliers);

      expect(result).toEqual({
        success: true,
        created: 2,
        certsCreated: 2,
        agreementsCreated: 2,
        contactsCreated: 1,
      });
    });

    it('uses the transaction client (tx) not the global prisma for all operations', async () => {
      const supplier = makeParsedSupplier({
        certTypes: ['GMP'],
        agreementTypes: ['NDA'],
        contactName: 'Jane',
      });

      await commitCsvImport([supplier]);

      // tx was used
      expect(txMock.aosSupplier.create).toHaveBeenCalled();
      expect(txMock.certification.createMany).toHaveBeenCalled();
      expect(txMock.agreement.createMany).toHaveBeenCalled();
      expect(txMock.supplierContact.createMany).toHaveBeenCalled();
      expect(txMock.activity.create).toHaveBeenCalled();

      // global prisma was NOT used for these operations
      expect(mockPrismaClient.aosSupplier.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.certification.createMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.agreement.createMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.supplierContact.createMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.activity.create).not.toHaveBeenCalled();
    });

    it('wraps all operations in $transaction so a failure rolls back the batch', async () => {
      // Make certification.createMany fail
      txMock.certification.createMany
        .mockRejectedValueOnce(new Error('DB constraint violation'));

      const supplier = makeParsedSupplier({ certTypes: ['GMP', 'ISO_9001'] });

      // The whole commitCsvImport should reject because $transaction propagates the error
      await expect(commitCsvImport([supplier])).rejects.toThrow('DB constraint violation');

      // Verify $transaction was called (meaning all ops are inside it)
      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    // ─── NDA agreement creation from nda_data ───────────────────

    it('creates NDA agreement from nda_data with status "Signed" → signed', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: null,
        ndaLink: 'http://example.com/nda.pdf',
        ndaStatus: 'Signed',
        ndaStart: new Date('2025-01-01'),
        ndaExpiry: new Date('2026-01-01'),
      });

      await commitCsvImport([supplier]);

      expect(txMock.agreement.createMany).toHaveBeenCalledTimes(1);
      const agrData = txMock.agreement.createMany.mock.calls[0][0].data;
      expect(agrData).toHaveLength(1);
      expect(agrData[0]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        agreementType: 'NDA',
        status: 'signed',
        documentLink: 'http://example.com/nda.pdf',
      }));
    });

    it('creates NDA agreement with status "Progressing" → sent', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: null,
        ndaStatus: 'Progressing',
        ndaLink: null,
        ndaStart: null,
        ndaExpiry: null,
      });

      // ndaStatus alone triggers NDA creation
      await commitCsvImport([supplier]);

      expect(txMock.agreement.createMany).toHaveBeenCalledTimes(1);
      const agrData = txMock.agreement.createMany.mock.calls[0][0].data;
      expect(agrData[0]).toEqual(expect.objectContaining({
        agreementType: 'NDA',
        status: 'sent',
      }));
    });

    it('creates NDA agreement with status "Issues" → not_started', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: null,
        ndaStatus: 'Issues',
      });

      await commitCsvImport([supplier]);

      expect(txMock.agreement.createMany).toHaveBeenCalledTimes(1);
      const agrData = txMock.agreement.createMany.mock.calls[0][0].data;
      expect(agrData[0]).toEqual(expect.objectContaining({
        agreementType: 'NDA',
        status: 'not_started',
      }));
    });

    // ─── Duplicate NDA guard ────────────────────────────────────

    it('supplier with nda_data AND "NDA" in agreementTypes → only one NDA agreement', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        contactName: null,
        ndaLink: 'http://example.com/nda.pdf',
        ndaStatus: 'Signed',
        agreementTypes: ['NDA', 'MSA'],
      });

      await commitCsvImport([supplier]);

      expect(txMock.agreement.createMany).toHaveBeenCalledTimes(1);
      const agrData = txMock.agreement.createMany.mock.calls[0][0].data;
      // Should have NDA from nda_data + MSA from agreementTypes, but NOT a duplicate NDA
      const ndaAgreements = agrData.filter((a: { agreementType: string }) => a.agreementType === 'NDA');
      expect(ndaAgreements).toHaveLength(1);
      expect(ndaAgreements[0].status).toBe('signed'); // from nda_data, not 'not_started'
      const msaAgreements = agrData.filter((a: { agreementType: string }) => a.agreementType === 'MSA');
      expect(msaAgreements).toHaveLength(1);
    });

    // ─── Regulatory cert creation ───────────────────────────────

    it('supplier with regulatoryCerts creates cert with certCategory "regulatory"', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        regulatoryCerts: ['TGA'],
        agreementTypes: [],
        contactName: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.certification.createMany).toHaveBeenCalledTimes(1);
      const certData = txMock.certification.createMany.mock.calls[0][0].data;
      expect(certData).toHaveLength(1);
      expect(certData[0]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        certType: 'TGA',
        certCategory: 'regulatory',
        verificationStatus: 'unverified',
      }));
    });

    // ─── Factory audit creation ─────────────────────────────────

    it('supplier with factoryAuditData creates FactoryAudit record', async () => {
      const auditDate = new Date('2025-06-01');
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: null,
        factoryAuditData: {
          score: 85,
          auditedOn: auditDate,
          auditor: 'SGS',
          location: 'Shenzhen',
          visitType: 'on-site',
          actionItems: 'Fix ventilation',
          followUp: '2025-12-01',
        },
      });

      await commitCsvImport([supplier]);

      expect(txMock.factoryAudit.createMany).toHaveBeenCalledTimes(1);
      const auditData = txMock.factoryAudit.createMany.mock.calls[0][0].data;
      expect(auditData).toHaveLength(1);
      expect(auditData[0]).toEqual(expect.objectContaining({
        aosSupplierId: 'sup-new',
        score: 85,
        auditedOn: auditDate,
        auditor: 'SGS',
        location: 'Shenzhen',
        visitType: 'on-site',
        actionItems: 'Fix ventilation',
      }));
    });
  });
});
