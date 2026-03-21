import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAuthContext, mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient = {
    aosSupplier: { findMany: vi.fn(), create: vi.fn() },
    certification: { create: vi.fn() },
    agreement: { create: vi.fn() },
    supplierContact: { create: vi.fn() },
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
    country: 'Australia',
    categories: ['Skincare'],
    subcategories: ['Moisturiser'],
    capabilityType: 'turnkey',
    moq: 1000,
    keyBrands: ['BrandA'],
    companyCity: 'Melbourne',
    factoryCity: 'Shenzhen',
    factoryCountry: 'China',
    certTypes: ['GMP', 'ISO'],
    agreementTypes: ['NDA'],
    contactName: 'Jane Doe',
    contactEmail: 'jane@test.com',
    contactMobile: '+61400000000',
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
        certification: { create: vi.fn() },
        agreement: { create: vi.fn() },
        supplierContact: { create: vi.fn() },
        activity: { create: vi.fn() },
        $transaction: vi.fn(),
      };

      // The key pattern: $transaction receives a callback, we invoke it with txMock
      mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof txMock) => unknown) => fn(txMock));

      txMock.aosSupplier.create.mockResolvedValue({ id: 'sup-new' });
      txMock.certification.create.mockResolvedValue({ id: 'cert-new' });
      txMock.agreement.create.mockResolvedValue({ id: 'agr-new' });
      txMock.supplierContact.create.mockResolvedValue({ id: 'contact-new' });
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
        data: {
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
        },
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

    it('creates certifications for each certType', async () => {
      const supplier = makeParsedSupplier({
        certTypes: ['GMP', 'ISO', 'Halal'],
        agreementTypes: [],
        contactName: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.certification.create).toHaveBeenCalledTimes(3);
      expect(txMock.certification.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-new',
          certType: 'GMP',
          verificationStatus: 'unverified',
        },
      });
      expect(txMock.certification.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-new',
          certType: 'ISO',
          verificationStatus: 'unverified',
        },
      });
      expect(txMock.certification.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-new',
          certType: 'Halal',
          verificationStatus: 'unverified',
        },
      });
    });

    it('creates agreements for each agreementType', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: ['NDA', 'MSA'],
        contactName: null,
      });

      await commitCsvImport([supplier]);

      expect(txMock.agreement.create).toHaveBeenCalledTimes(2);
      expect(txMock.agreement.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-new',
          agreementType: 'NDA',
          status: 'not_started',
        },
      });
      expect(txMock.agreement.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-new',
          agreementType: 'MSA',
          status: 'not_started',
        },
      });
    });

    it('creates contact when contactName is provided', async () => {
      const supplier = makeParsedSupplier({
        certTypes: [],
        agreementTypes: [],
        contactName: 'Jane Doe',
        contactEmail: 'jane@test.com',
        contactMobile: '+61400000000',
      });

      await commitCsvImport([supplier]);

      expect(txMock.supplierContact.create).toHaveBeenCalledTimes(1);
      expect(txMock.supplierContact.create).toHaveBeenCalledWith({
        data: {
          aosSupplierId: 'sup-new',
          name: 'Jane Doe',
          email: 'jane@test.com',
          mobile: '+61400000000',
          isPrimary: true,
        },
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

      expect(txMock.supplierContact.create).not.toHaveBeenCalled();
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
        makeParsedSupplier({ certTypes: ['GMP', 'ISO'], agreementTypes: ['NDA'], contactName: 'Alice' }),
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
      expect(txMock.certification.create).toHaveBeenCalled();
      expect(txMock.agreement.create).toHaveBeenCalled();
      expect(txMock.supplierContact.create).toHaveBeenCalled();
      expect(txMock.activity.create).toHaveBeenCalled();

      // global prisma was NOT used for these operations
      expect(mockPrismaClient.aosSupplier.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.certification.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.agreement.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.supplierContact.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.activity.create).not.toHaveBeenCalled();
    });

    it('wraps all operations in $transaction so a failure rolls back the batch', async () => {
      // Make certification.create fail on the second call
      txMock.certification.create
        .mockResolvedValueOnce({ id: 'cert-1' })
        .mockRejectedValueOnce(new Error('DB constraint violation'));

      const supplier = makeParsedSupplier({ certTypes: ['GMP', 'ISO'] });

      // The whole commitCsvImport should reject because $transaction propagates the error
      await expect(commitCsvImport([supplier])).rejects.toThrow('DB constraint violation');

      // Verify $transaction was called (meaning all ops are inside it)
      expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
