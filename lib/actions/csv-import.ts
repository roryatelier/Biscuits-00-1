'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import {
  type CsvRow,
  type ParsedSupplier,
  parseCsvText,
  parseRow,
} from '@/lib/csv-parser';

type ImportPreview = {
  valid: ParsedSupplier[];
  duplicates: ParsedSupplier[];
  rejected: { row: number; reason: string; data: CsvRow }[];
  totalRows: number;
};

export async function previewCsvImport(csvText: string): Promise<ImportPreview | { error: string }> {
  return withAuth(async (ctx) => {
    const rows = parseCsvText(csvText);
    if (rows.length === 0) return { error: 'No data rows found in CSV' };

    // Get existing suppliers for duplicate detection
    const existing = await prisma.aosSupplier.findMany({
      where: { teamId: ctx.teamId },
      select: { companyName: true, companyCountry: true },
    });
    const existingSet = new Set(
      existing.map(e => `${e.companyName.toLowerCase()}|${(e.companyCountry || '').toLowerCase()}`)
    );

    const valid: ParsedSupplier[] = [];
    const duplicates: ParsedSupplier[] = [];
    const rejected: ImportPreview['rejected'] = [];
    const seenInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const result = parseRow(rows[i], i + 2); // +2 for 1-indexed + header row

      if ('error' in result) {
        rejected.push({ row: i + 2, reason: result.error, data: rows[i] });
        continue;
      }

      const key = `${result.companyName.toLowerCase()}|${result.country.toLowerCase()}`;

      if (existingSet.has(key) || seenInBatch.has(key)) {
        duplicates.push(result);
      } else {
        valid.push(result);
        seenInBatch.add(key);
      }
    }

    return { valid, duplicates, rejected, totalRows: rows.length };
  }) as Promise<ImportPreview | { error: string }>;
}

export async function commitCsvImport(suppliers: ParsedSupplier[]) {
  return withAuth(async (ctx) => {
    let created = 0;
    let certsCreated = 0;
    let agreementsCreated = 0;
    let contactsCreated = 0;

    for (const s of suppliers) {
      const aos = await prisma.aosSupplier.create({
        data: {
          companyName: s.companyName,
          companyCountry: s.country,
          companyCity: s.companyCity,
          factoryCity: s.factoryCity,
          factoryCountry: s.factoryCountry || s.country,
          categories: s.categories as Prisma.InputJsonValue,
          subcategories: s.subcategories as Prisma.InputJsonValue,
          capabilityType: s.capabilityType,
          moq: s.moq,
          keyBrands: s.keyBrands as Prisma.InputJsonValue,
          teamId: ctx.teamId,
        },
      });
      created++;

      // Create certifications
      for (const certType of s.certTypes) {
        await prisma.certification.create({
          data: {
            aosSupplierId: aos.id,
            certType: certType.trim(),
            verificationStatus: 'unverified',
          },
        });
        certsCreated++;
      }

      // Create agreements
      for (const agreementType of s.agreementTypes) {
        await prisma.agreement.create({
          data: {
            aosSupplierId: aos.id,
            agreementType: agreementType.trim(),
            status: 'not_started',
          },
        });
        agreementsCreated++;
      }

      // Create contact if provided
      if (s.contactName) {
        await prisma.supplierContact.create({
          data: {
            aosSupplierId: aos.id,
            name: s.contactName,
            email: s.contactEmail,
            mobile: s.contactMobile,
            isPrimary: true,
          },
        });
        contactsCreated++;
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: 'import',
        userId: ctx.userId,
        type: 'project_created',
        description: `imported ${created} suppliers via CSV`,
        metadata: { created, certsCreated, agreementsCreated, contactsCreated } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      created,
      certsCreated,
      agreementsCreated,
      contactsCreated,
    };
  });
}
