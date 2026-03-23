'use server';

import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import { computeMatchScore, recalculateMatchScoresForBrief } from '@/lib/actions/matching';

// ─── SupplierBrief CRUD ─────────────────────────────────────

export async function listSupplierBriefs(filters?: { category?: string }) {
  return withAuth(async (ctx) => {
    const where: Record<string, unknown> = { teamId: ctx.teamId };
    if (filters?.category) where.category = filters.category;

    return prisma.supplierBrief.findMany({
      where,
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  });
}

export async function listSupplierBriefsWithAssignments() {
  return withAuth(async (ctx) => {
    return prisma.supplierBrief.findMany({
      where: { teamId: ctx.teamId },
      include: {
        assignments: {
          include: {
            aosSupplier: {
              include: {
                certifications: { select: { id: true } },
              },
            },
          },
          orderBy: { matchScore: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  });
}

export async function getSupplierBrief(id: string) {
  return withAuth(async (ctx) => {
    return prisma.supplierBrief.findFirst({
      where: { id, teamId: ctx.teamId },
      include: {
        assignments: {
          include: {
            aosSupplier: {
              include: {
                certifications: { select: { certType: true, verificationStatus: true, expiryDate: true } },
                agreements: { select: { agreementType: true, status: true } },
                cobaltSupplier: { select: { id: true, matchedProducts: true } },
              },
            },
          },
          orderBy: { matchScore: 'desc' },
        },
      },
    });
  });
}

export async function createSupplierBrief(data: {
  name: string;
  customerName?: string;
  category: string;
  subcategory?: string;
  blendFillType?: string;
  dueDate?: string;
  filterCategories?: string[];
  requiredCerts?: string[];
  requirements?: Record<string, boolean>;
}) {
  return withAuth(async (ctx) => {
    const brief = await prisma.supplierBrief.create({
      data: {
        name: data.name,
        customerName: data.customerName || null,
        category: data.category,
        subcategory: data.subcategory || null,
        blendFillType: data.blendFillType || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        filterCategories: data.filterCategories || [],
        requiredCerts: data.requiredCerts || [],
        requirements: data.requirements || {},
        teamId: ctx.teamId,
      },
    });

    return { success: true, id: brief.id };
  });
}

export async function updateSupplierBrief(id: string, data: {
  name?: string;
  customerName?: string;
  category?: string;
  subcategory?: string;
  blendFillType?: string;
  dueDate?: string;
  filterCategories?: string[];
  requiredCerts?: string[];
  requirements?: Record<string, boolean>;
}) {
  return withAuth(async (ctx) => {
    const brief = await prisma.supplierBrief.findFirst({
      where: { id, teamId: ctx.teamId },
    });
    if (!brief) return { error: 'Brief not found' };

    const requirementsChanged =
      data.requiredCerts !== undefined &&
      JSON.stringify(data.requiredCerts) !== JSON.stringify(brief.requiredCerts);

    await prisma.supplierBrief.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.customerName !== undefined && { customerName: data.customerName }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.blendFillType !== undefined && { blendFillType: data.blendFillType }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.filterCategories !== undefined && { filterCategories: data.filterCategories }),
        ...(data.requiredCerts !== undefined && { requiredCerts: data.requiredCerts }),
        ...(data.requirements !== undefined && { requirements: data.requirements }),
      },
    });

    // Recalculate match scores if requirements changed
    if (requirementsChanged) {
      await recalculateMatchScoresForBrief(id, ctx.teamId);
    }

    return { success: true };
  });
}

// ─── Assignment ─────────────────────────────────────────────

export async function assignSupplierToBrief(aosSupplierId: string, supplierBriefId: string) {
  return withAuth(async (ctx) => {
    // Verify both exist and belong to team
    const [supplier, brief] = await Promise.all([
      prisma.aosSupplier.findFirst({ where: { id: aosSupplierId, teamId: ctx.teamId } }),
      prisma.supplierBrief.findFirst({ where: { id: supplierBriefId, teamId: ctx.teamId } }),
    ]);
    if (!supplier) return { error: 'Supplier not found' };
    if (!brief) return { error: 'Brief not found' };

    // Check for duplicate
    const existing = await prisma.supplierBriefAssignment.findUnique({
      where: { aosSupplierId_supplierBriefId: { aosSupplierId, supplierBriefId } },
    });
    if (existing) return { error: 'Supplier is already assigned to this brief' };

    // Compute initial match score
    const { score, breakdown } = await computeMatchScore(aosSupplierId, supplierBriefId);

    const assignment = await prisma.supplierBriefAssignment.create({
      data: {
        aosSupplierId,
        supplierBriefId,
        matchScore: score,
        matchBreakdown: breakdown,
        assignedById: ctx.userId,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: aosSupplierId,
        userId: ctx.userId,
        type: 'brief_assigned',
        description: `assigned to brief "${brief.name}"`,
        metadata: { supplierBriefId, matchScore: score },
      },
    });

    return { success: true, id: assignment.id, matchScore: score };
  });
}

export async function removeSupplierFromBrief(aosSupplierId: string, supplierBriefId: string) {
  return withAuth(async (ctx) => {
    const assignment = await prisma.supplierBriefAssignment.findUnique({
      where: { aosSupplierId_supplierBriefId: { aosSupplierId, supplierBriefId } },
      include: {
        supplierBrief: { select: { name: true, teamId: true } },
      },
    });
    if (!assignment || assignment.supplierBrief.teamId !== ctx.teamId) {
      return { error: 'Assignment not found' };
    }

    await prisma.supplierBriefAssignment.delete({
      where: { id: assignment.id },
    });

    return { success: true };
  });
}
