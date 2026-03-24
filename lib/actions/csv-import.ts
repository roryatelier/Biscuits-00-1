'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import {
  type CsvRow,
  type ParsedSupplier,
  parseCsvText,
  parseRow,
  normaliseCertType,
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

    // TODO: This is an unbounded query — add pagination when supplier count exceeds ~2000
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
    const result = await prisma.$transaction(async (tx) => {
      let created = 0;

      const allCerts: Array<{
        aosSupplierId: string;
        certType: string;
        certCategory: string;
        verificationStatus: string;
        documentRef?: string | null;
      }> = [];
      const allAgreements: Array<{
        aosSupplierId: string;
        agreementType: string;
        status: string;
        documentLink?: string | null;
        startDate?: Date | null;
        expiryDate?: Date | null;
        nonCircumventMonths?: number | null;
        notes?: string | null;
      }> = [];
      const allContacts: Array<{
        aosSupplierId: string;
        name: string;
        email?: string | null;
        mobile?: string | null;
        isPrimary: boolean;
      }> = [];
      const allAudits: Array<{
        aosSupplierId: string;
        score?: number | null;
        auditedOn?: Date | null;
        auditor?: string | null;
        location?: string | null;
        visitType?: string | null;
        actionItems?: string | null;
        followUp?: string | null;
      }> = [];

      for (const s of suppliers) {
        const aos = await tx.aosSupplier.create({
          data: {
            companyName: s.companyName,
            companyLegalName: s.companyLegalName,
            companyCountry: s.country,
            companyCity: s.companyCity,
            factoryCity: s.factoryCity,
            factoryCountry: s.factoryCountry || s.country,
            categories: s.categories as Prisma.InputJsonValue,
            subcategories: s.subcategories as Prisma.InputJsonValue,
            capabilityType: s.capabilityType,
            moq: s.moq,
            moqInfo: s.moqInfo,
            keyBrands: s.keyBrands as Prisma.InputJsonValue,
            qualificationStage: s.qualificationStage || 'Identified',
            activeSkus: s.activeSkus as Prisma.InputJsonValue,
            region: s.region,
            marketExperience: s.marketExperience as Prisma.InputJsonValue,
            acquisitionSource: s.acquisitionSource,
            currency: s.currency || 'USD',
            supplierCode: s.supplierCode,
            legacyId: s.legacyId,
            cautionFlag: s.cautionFlag,
            cautionNote: s.cautionNote,
            dateOutreached: s.dateOutreached,
            dateQualified: s.dateQualified,
            productionLeadTimeDayMin: s.productionLeadTimeDayMin,
            productionLeadTimeDayMax: s.productionLeadTimeDayMax,
            productionLeadTimeInfo: s.productionLeadTimeInfo,
            cocAcknowledged: s.cocAcknowledged,
            cocLink: s.cocLink,
            cocDateAccepted: s.cocDateAccepted,
            ipOwnership: s.ipOwnership,
            fillCapabilities: s.fillCapabilities as Prisma.InputJsonValue,
            fillPackagingNotes: s.fillPackagingNotes,
            atelierBrands: s.atelierBrands as Prisma.InputJsonValue,
            atelierNote: s.atelierNote,
            factoryNotes: s.factoryNotes,
            paymentTerms: s.paymentTerms,
            teamId: ctx.teamId,
          },
        });
        created++;

        // Collect certifications (quality certs)
        for (const certType of s.certTypes) {
          allCerts.push({
            aosSupplierId: aos.id,
            certType: normaliseCertType(certType),
            certCategory: 'quality',
            verificationStatus: 'unverified',
            documentRef: s.certificationLink,
          });
        }

        // Collect certifications (regulatory certs)
        for (const certType of s.regulatoryCerts) {
          allCerts.push({
            aosSupplierId: aos.id,
            certType: normaliseCertType(certType),
            certCategory: 'regulatory',
            verificationStatus: 'unverified',
          });
        }

        // Collect NDA agreement if NDA data exists
        let ndaCreatedFromData = false;
        if (s.ndaLink || s.ndaStart || s.ndaExpiry || s.ndaStatus) {
          const ndaStatusMap: Record<string, string> = {
            'signed': 'signed',
            'progressing': 'sent',
            'issues': 'not_started',
          };
          allAgreements.push({
            aosSupplierId: aos.id,
            agreementType: 'NDA',
            status: ndaStatusMap[s.ndaStatus?.toLowerCase() || ''] || 'not_started',
            documentLink: s.ndaLink,
            startDate: s.ndaStart,
            expiryDate: s.ndaExpiry,
            nonCircumventMonths: s.nonCircumventMonths,
            notes: s.agreementNotes,
          });
          ndaCreatedFromData = true;
        }

        // Collect other agreements
        for (const agreementType of s.agreementTypes) {
          if (agreementType.trim().toUpperCase() === 'NDA' && ndaCreatedFromData) continue;
          allAgreements.push({
            aosSupplierId: aos.id,
            agreementType: agreementType.trim(),
            status: 'not_started',
            documentLink: s.agreementLink,
            notes: s.agreementNotes,
          });
        }

        // Collect factory audit if data exists
        if (s.factoryAuditData) {
          allAudits.push({
            aosSupplierId: aos.id,
            score: s.factoryAuditData.score,
            auditedOn: s.factoryAuditData.auditedOn,
            auditor: s.factoryAuditData.auditor,
            location: s.factoryAuditData.location,
            visitType: s.factoryAuditData.visitType,
            actionItems: s.factoryAuditData.actionItems,
            followUp: s.factoryAuditData.followUp,
          });
        }

        // Collect contact if provided
        if (s.contactName) {
          allContacts.push({
            aosSupplierId: aos.id,
            name: s.contactName,
            email: s.contactEmail,
            mobile: s.contactMobile,
            isPrimary: true,
          });
        }
      }

      // Batch insert related records
      if (allCerts.length > 0) await tx.certification.createMany({ data: allCerts });
      if (allAgreements.length > 0) await tx.agreement.createMany({ data: allAgreements });
      if (allContacts.length > 0) await tx.supplierContact.createMany({ data: allContacts });
      if (allAudits.length > 0) await tx.factoryAudit.createMany({ data: allAudits });

      const certsCreated = allCerts.length;
      const agreementsCreated = allAgreements.length;
      const contactsCreated = allContacts.length;

      // Log activity
      await tx.activity.create({
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

    return result;
  });
}
