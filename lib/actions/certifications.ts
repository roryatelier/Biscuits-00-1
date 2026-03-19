'use server';

import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import { recalculateMatchScores } from '@/lib/actions/matching';
import { computePermissionLevel } from '@/lib/suppliers/permission-logic';

// ─── Certification CRUD ─────────────────────────────────────

export async function listCertifications(aosSupplierId: string) {
  return withAuth(async (ctx) => {
    // Verify team access
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
      select: { id: true },
    });
    if (!supplier) return { error: 'Supplier not found' };

    return prisma.certification.findMany({
      where: { aosSupplierId },
      orderBy: { certType: 'asc' },
    });
  });
}

export async function addCertification(aosSupplierId: string, data: {
  certType: string;
  certBody?: string;
  scope?: string;
  issueDate?: string;
  expiryDate?: string;
  documentRef?: string;
  verificationStatus?: string;
}) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
    });
    if (!supplier) return { error: 'Supplier not found' };

    const cert = await prisma.certification.create({
      data: {
        aosSupplierId,
        certType: data.certType,
        certBody: data.certBody || null,
        scope: data.scope || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        documentRef: data.documentRef || null,
        verificationStatus: data.verificationStatus || 'unverified',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: aosSupplierId,
        userId: ctx.userId,
        type: 'cert_changed',
        description: `added ${data.certType} certification`,
        metadata: { certId: cert.id, certType: data.certType, action: 'added' },
      },
    });

    // Recalculate match scores for all assigned briefs
    await recalculateMatchScores(aosSupplierId);

    return { success: true, id: cert.id };
  });
}

export async function updateCertification(certId: string, data: {
  certBody?: string;
  scope?: string;
  issueDate?: string;
  expiryDate?: string;
  documentRef?: string;
  verificationStatus?: string;
}) {
  return withAuth(async (ctx) => {
    const cert = await prisma.certification.findFirst({
      where: { id: certId },
      include: { aosSupplier: { select: { id: true, teamId: true } } },
    });
    if (!cert || cert.aosSupplier.teamId !== ctx.teamId) return { error: 'Certification not found' };

    await prisma.certification.update({
      where: { id: certId },
      data: {
        ...(data.certBody !== undefined && { certBody: data.certBody }),
        ...(data.scope !== undefined && { scope: data.scope }),
        ...(data.issueDate !== undefined && { issueDate: data.issueDate ? new Date(data.issueDate) : null }),
        ...(data.expiryDate !== undefined && { expiryDate: data.expiryDate ? new Date(data.expiryDate) : null }),
        ...(data.documentRef !== undefined && { documentRef: data.documentRef }),
        ...(data.verificationStatus !== undefined && { verificationStatus: data.verificationStatus }),
      },
    });

    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: cert.aosSupplierId,
        userId: ctx.userId,
        type: 'cert_changed',
        description: `updated ${cert.certType} certification`,
        metadata: { certId, certType: cert.certType, action: 'updated' },
      },
    });

    await recalculateMatchScores(cert.aosSupplierId);

    return { success: true };
  });
}

export async function removeCertification(certId: string) {
  return withAuth(async (ctx) => {
    const cert = await prisma.certification.findFirst({
      where: { id: certId },
      include: { aosSupplier: { select: { id: true, teamId: true } } },
    });
    if (!cert || cert.aosSupplier.teamId !== ctx.teamId) return { error: 'Certification not found' };

    await prisma.certification.delete({ where: { id: certId } });

    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: cert.aosSupplierId,
        userId: ctx.userId,
        type: 'cert_changed',
        description: `removed ${cert.certType} certification`,
        metadata: { certType: cert.certType, action: 'removed' },
      },
    });

    await recalculateMatchScores(cert.aosSupplierId);

    return { success: true };
  });
}

// ─── Expiry Status ──────────────────────────────────────────

export async function getExpiryStatus(expiryDate: Date | null): Promise<'green' | 'amber' | 'red' | 'black' | 'none'> {
  if (!expiryDate) return 'none';

  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'black';    // expired
  if (daysUntilExpiry < 30) return 'red';      // <30 days
  if (daysUntilExpiry < 90) return 'amber';    // 30-90 days
  return 'green';                               // >90 days
}

// ─── Agreement CRUD ─────────────────────────────────────────

export async function listAgreements(aosSupplierId: string) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
      select: { id: true },
    });
    if (!supplier) return { error: 'Supplier not found' };

    return prisma.agreement.findMany({
      where: { aosSupplierId },
      orderBy: { agreementType: 'asc' },
    });
  });
}

export async function updateAgreementStatus(agreementId: string, status: string) {
  return withAuth(async (ctx) => {
    const agreement = await prisma.agreement.findFirst({
      where: { id: agreementId },
      include: { aosSupplier: { select: { id: true, teamId: true } } },
    });
    if (!agreement || agreement.aosSupplier.teamId !== ctx.teamId) {
      return { error: 'Agreement not found' };
    }

    const now = new Date();
    await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        status,
        ...(status === 'sent' && { sentAt: now }),
        ...(status === 'signed' && { signedAt: now }),
      },
    });

    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: agreement.aosSupplierId,
        userId: ctx.userId,
        type: 'agreement_changed',
        description: `updated ${agreement.agreementType} to "${status}"`,
        metadata: {
          agreementId,
          agreementType: agreement.agreementType,
          from: agreement.status,
          to: status,
        },
      },
    });

    return { success: true };
  });
}

// ─── Permission Levels ──────────────────────────────────────
//
//  Can receive redacted brief  ← NDA = signed
//  Can be sampled              ← NDA = signed AND GMP = verified
//  Can be PO'd                 ← NDA + MSA + IP + Payment = signed
//                                AND GMP + ISO = verified

export async function getPermissionLevel(aosSupplierId: string) {
  const [agreements, certifications] = await Promise.all([
    prisma.agreement.findMany({ where: { aosSupplierId } }),
    prisma.certification.findMany({ where: { aosSupplierId } }),
  ]);

  return computePermissionLevel(agreements, certifications);
}
