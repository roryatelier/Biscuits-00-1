'use server';

import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import { computeComplianceAssessment, computeComplianceScore } from '@/lib/compliance-assessment';
import type { SupplierComplianceInput } from '@/lib/compliance-assessment';
import { computeFullComplianceAssessment } from '@/lib/compliance-assessment-full';
import type { FullSupplierComplianceInput } from '@/lib/compliance-assessment-full';

export async function getComplianceAssessment(aosSupplierId: string) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
      include: {
        certifications: true,
        agreements: true,
        audits: true,
      },
    });
    if (!supplier) return { error: 'Supplier not found' };

    const input: SupplierComplianceInput = {
      qualificationStage: supplier.qualificationStage,
      factoryCountry: supplier.factoryCountry,
      companyCountry: supplier.companyCountry,
      certifications: supplier.certifications.map(c => ({
        certType: c.certType,
        certCategory: c.certCategory,
        verificationStatus: c.verificationStatus,
        expiryDate: c.expiryDate?.toISOString() || null,
      })),
      agreements: supplier.agreements.map(a => ({
        agreementType: a.agreementType,
        status: a.status,
        signedAt: a.signedAt?.toISOString() || null,
        expiryDate: a.expiryDate?.toISOString() || null,
      })),
      cocAcknowledged: supplier.cocAcknowledged,
      factoryAudits: supplier.audits.map(a => ({
        score: a.score,
        auditedOn: a.auditedOn?.toISOString() || null,
        auditor: a.auditor,
      })),
    };

    const rows = computeComplianceAssessment(input);
    const score = computeComplianceScore(rows);

    return { rows, score, supplierName: supplier.companyName };
  });
}

export async function getFullComplianceAssessment(aosSupplierId: string) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
      include: {
        certifications: true,
        agreements: true,
        audits: true,
        contacts: true,
      },
    });
    if (!supplier) return { error: 'Supplier not found' };

    const input: FullSupplierComplianceInput = {
      qualificationStage: supplier.qualificationStage,
      factoryCountry: supplier.factoryCountry,
      companyCountry: supplier.companyCountry,
      certifications: supplier.certifications.map(c => ({
        certType: c.certType,
        certCategory: c.certCategory,
        verificationStatus: c.verificationStatus,
        expiryDate: c.expiryDate?.toISOString() || null,
      })),
      agreements: supplier.agreements.map(a => ({
        agreementType: a.agreementType,
        status: a.status,
        signedAt: a.signedAt?.toISOString() || null,
        expiryDate: a.expiryDate?.toISOString() || null,
      })),
      cocAcknowledged: supplier.cocAcknowledged,
      factoryAudits: supplier.audits.map(a => ({
        score: a.score,
        auditedOn: a.auditedOn?.toISOString() || null,
        auditor: a.auditor,
      })),
      companyName: supplier.companyName,
      contacts: supplier.contacts.map(c => ({
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        isPrimary: c.isPrimary,
      })),
      capabilityType: supplier.capabilityType,
      activeSkus: (supplier.activeSkus as string[]) || [],
      keyBrands: (supplier.keyBrands as string[]) || [],
    };

    const rows = computeFullComplianceAssessment(input);
    const score = computeComplianceScore(rows);

    return { rows, score, supplierName: supplier.companyName };
  });
}

// --- BriefRequirement CRUD ---

export async function listBriefRequirements(supplierBriefId: string) {
  return withAuth(async (ctx) => {
    // Verify brief belongs to team
    const brief = await prisma.supplierBrief.findFirst({
      where: { id: supplierBriefId, teamId: ctx.teamId },
    });
    if (!brief) return { error: 'Brief not found' };

    return prisma.briefRequirement.findMany({
      where: { supplierBriefId },
      orderBy: { createdAt: 'asc' },
    });
  });
}

export async function addBriefRequirement(data: {
  supplierBriefId: string;
  layer: string;
  category: string;
  requirement: string;
  ruleKey?: string;
  priority?: string;
}) {
  return withAuth(async (ctx) => {
    const brief = await prisma.supplierBrief.findFirst({
      where: { id: data.supplierBriefId, teamId: ctx.teamId },
    });
    if (!brief) return { error: 'Brief not found' };

    const req = await prisma.briefRequirement.create({
      data: {
        supplierBriefId: data.supplierBriefId,
        layer: data.layer,
        category: data.category,
        requirement: data.requirement,
        ruleKey: data.ruleKey || null,
        priority: data.priority || 'nice_to_have',
        extractedBy: 'manual',
      },
    });

    return { success: true, id: req.id };
  });
}

export async function updateBriefRequirement(id: string, data: {
  requirement?: string;
  layer?: string;
  category?: string;
  priority?: string;
  ruleKey?: string;
}) {
  return withAuth(async (ctx) => {
    const req = await prisma.briefRequirement.findFirst({
      where: { id },
      include: { supplierBrief: { select: { teamId: true } } },
    });
    if (!req || req.supplierBrief.teamId !== ctx.teamId) return { error: 'Requirement not found' };

    await prisma.briefRequirement.update({
      where: { id },
      data: {
        ...(data.requirement !== undefined && { requirement: data.requirement }),
        ...(data.layer !== undefined && { layer: data.layer }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.ruleKey !== undefined && { ruleKey: data.ruleKey }),
      },
    });

    return { success: true };
  });
}

export async function removeBriefRequirement(id: string) {
  return withAuth(async (ctx) => {
    const req = await prisma.briefRequirement.findFirst({
      where: { id },
      include: { supplierBrief: { select: { teamId: true } } },
    });
    if (!req || req.supplierBrief.teamId !== ctx.teamId) return { error: 'Requirement not found' };

    await prisma.briefRequirement.delete({ where: { id } });

    return { success: true };
  });
}
