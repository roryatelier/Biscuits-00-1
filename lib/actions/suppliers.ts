'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import {
  QUALIFICATION_STAGES,
  TRANSITION_MAP,
  DROPOUT_REASONS,
} from '@/lib/supplier-constants';

export type SupplierFilters = {
  category?: string;
  subcategory?: string;
  search?: string;
  stage?: string;
  linked?: boolean;
  cautionFlag?: boolean;
  certType?: string;
  agreementStatus?: string;
  cobaltEnabled?: boolean;
};

// ─── CobaltSupplier Actions ─────────────────────────────────

export async function listCobaltSuppliers(filters?: SupplierFilters) {
  return withAuth(async (ctx) => {
    const where: Record<string, unknown> = { teamId: ctx.teamId };

    if (filters?.linked !== undefined) where.linked = filters.linked;
    if (filters?.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { matchedProducts: { path: '$[*].name', string_contains: filters.search } },
      ];
    }
    if (filters?.category) {
      where.categories = { array_contains: [filters.category] };
    }

    return prisma.cobaltSupplier.findMany({
      where,
      include: {
        aosSupplier: {
          select: {
            id: true,
            qualificationStage: true,
            cautionFlag: true,
            certifications: { select: { certType: true, verificationStatus: true } },
            agreements: { select: { agreementType: true, status: true } },
          },
        },
      },
      orderBy: { matchedProductsCount: 'desc' },
    });
  });
}

export async function getCobaltSupplier(id: string) {
  return withAuth(async (ctx) => {
    return prisma.cobaltSupplier.findFirst({
      where: { id, teamId: ctx.teamId },
      include: {
        aosSupplier: {
          include: {
            certifications: true,
            agreements: true,
          },
        },
      },
    });
  });
}

export async function createCobaltSupplier(data: {
  companyName: string;
  country: string;
  cor?: string;
  categories: string[];
  dataSource?: string;
  matchedProducts?: unknown[];
}) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.cobaltSupplier.create({
      data: {
        companyName: data.companyName,
        country: data.country,
        cor: data.cor || null,
        categories: data.categories,
        dataSource: data.dataSource || 'Manual',
        matchedProducts: (data.matchedProducts || []) as Prisma.InputJsonValue,
        matchedProductsCount: data.matchedProducts?.length || 0,
        teamId: ctx.teamId,
      },
    });

    return { success: true, id: supplier.id };
  });
}

// ─── AosSupplier Actions ────────────────────────────────────

export async function listAosSuppliers(filters?: SupplierFilters) {
  return withAuth(async (ctx) => {
    const where: Record<string, unknown> = { teamId: ctx.teamId };

    if (filters?.stage) where.qualificationStage = filters.stage;
    if (filters?.cautionFlag !== undefined) where.cautionFlag = filters.cautionFlag;
    if (filters?.cobaltEnabled !== undefined) where.cobaltEnabled = filters.cobaltEnabled;
    if (filters?.search) {
      where.companyName = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters?.category) {
      where.categories = { array_contains: [filters.category] };
    }

    return prisma.aosSupplier.findMany({
      where,
      include: {
        certifications: { select: { id: true, certType: true, verificationStatus: true, expiryDate: true } },
        agreements: { select: { id: true, agreementType: true, status: true } },
        cobaltSupplier: { select: { id: true, matchedProductsCount: true } },
        _count: { select: { briefAssignments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  });
}

export async function getAosSupplier(id: string) {
  return withAuth(async (ctx) => {
    return prisma.aosSupplier.findFirst({
      where: { id, teamId: ctx.teamId },
      include: {
        certifications: true,
        agreements: true,
        cobaltSupplier: true,
        briefAssignments: {
          include: {
            supplierBrief: { select: { id: true, name: true, customerName: true, category: true } },
          },
        },
      },
    });
  });
}

export async function createAosSupplier(data: {
  companyName: string;
  categories: string[];
  subcategories?: string[];
  moq?: number;
  keyBrands?: string[];
}) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.create({
      data: {
        companyName: data.companyName,
        categories: data.categories,
        subcategories: data.subcategories || [],
        moq: data.moq || null,
        keyBrands: data.keyBrands || [],
        teamId: ctx.teamId,
      },
    });

    await createSupplierActivity(supplier.id, ctx.userId, 'project_created', `created supplier "${data.companyName}"`);

    return { success: true, id: supplier.id };
  });
}

export async function updateAosSupplier(id: string, data: {
  companyName?: string;
  categories?: string[];
  subcategories?: string[];
  moq?: number | null;
  keyBrands?: string[];
}) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id, teamId: ctx.teamId },
    });
    if (!supplier) return { error: 'Supplier not found' };

    await prisma.aosSupplier.update({
      where: { id },
      data: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.categories !== undefined && { categories: data.categories }),
        ...(data.subcategories !== undefined && { subcategories: data.subcategories }),
        ...(data.moq !== undefined && { moq: data.moq }),
        ...(data.keyBrands !== undefined && { keyBrands: data.keyBrands }),
      },
    });

    return { success: true };
  });
}

// ─── Caution Flags ──────────────────────────────────────────

export async function setCautionFlag(aosSupplierId: string, flag: boolean, note?: string) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
    });
    if (!supplier) return { error: 'Supplier not found' };

    await prisma.aosSupplier.update({
      where: { id: aosSupplierId },
      data: { cautionFlag: flag, cautionNote: flag ? (note || null) : null },
    });

    await createSupplierActivity(
      aosSupplierId,
      ctx.userId,
      'project_updated',
      flag ? `set caution flag: "${note || 'No note'}"` : 'cleared caution flag',
    );

    return { success: true };
  });
}

// ─── Stage Transitions ──────────────────────────────────────

export async function getValidTransitions(currentStage: string) {
  return TRANSITION_MAP[currentStage] || [];
}

export async function transitionSupplierStage(
  aosSupplierId: string,
  toStage: string,
  reason?: { type: string; note?: string },
) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
    });
    if (!supplier) return { error: 'Supplier not found' };

    const validTransitions = TRANSITION_MAP[supplier.qualificationStage];
    if (!validTransitions || !validTransitions.includes(toStage)) {
      return { error: `Cannot transition from "${supplier.qualificationStage}" to "${toStage}"` };
    }

    // Require reason for Paused/Blacklisted
    if ((toStage === 'Paused' || toStage === 'Blacklisted') && !reason?.type) {
      return { error: 'A reason is required when pausing or blacklisting a supplier' };
    }

    await prisma.aosSupplier.update({
      where: { id: aosSupplierId },
      data: { qualificationStage: toStage },
    });

    await createSupplierActivity(
      aosSupplierId,
      ctx.userId,
      'stage_transition',
      `transitioned from "${supplier.qualificationStage}" to "${toStage}"`,
      {
        from: supplier.qualificationStage,
        to: toStage,
        ...(reason && { reason: reason.type, reasonNote: reason.note }),
      },
    );

    return { success: true, newStage: toStage };
  });
}

// ─── Linking ────────────────────────────────────────────────

export async function linkCobaltToAos(cobaltId: string, existingAosId?: string) {
  return withAuth(async (ctx) => {
    const cobalt = await prisma.cobaltSupplier.findFirst({
      where: { id: cobaltId, teamId: ctx.teamId },
    });
    if (!cobalt) return { error: 'Cobalt supplier not found' };
    if (cobalt.linked) return { success: true, aosId: cobalt.aosId }; // idempotent

    let aosId: string;

    if (existingAosId) {
      // Link to existing AoS record
      const aos = await prisma.aosSupplier.findFirst({
        where: { id: existingAosId, teamId: ctx.teamId },
      });
      if (!aos) return { error: 'AoS supplier not found' };
      if (aos.cobaltSupplierId) return { error: 'AoS supplier is already linked to another Cobalt supplier' };

      await prisma.$transaction([
        prisma.cobaltSupplier.update({
          where: { id: cobaltId },
          data: { linked: true, aosId: existingAosId },
        }),
        prisma.aosSupplier.update({
          where: { id: existingAosId },
          data: { cobaltSupplierId: cobaltId, cobaltEnabled: true },
        }),
      ]);
      aosId = existingAosId;
    } else {
      // Create new AoS record from Cobalt data — wrapped in transaction
      // to prevent orphaned records if the Cobalt update fails
      const newAos = await prisma.$transaction(async (tx) => {
        const created = await tx.aosSupplier.create({
          data: {
            companyName: cobalt.companyName,
            categories: cobalt.categories as Prisma.InputJsonValue,
            cobaltSupplierId: cobaltId,
            cobaltEnabled: true,
            teamId: ctx.teamId,
          },
        });

        await tx.cobaltSupplier.update({
          where: { id: cobaltId },
          data: { linked: true, aosId: created.id },
        });

        return created;
      });
      aosId = newAos.id;
    }

    await createSupplierActivity(
      aosId,
      ctx.userId,
      'supplier_linked',
      `linked Cobalt supplier "${cobalt.companyName}" to AoS`,
      { cobaltSupplierId: cobaltId, direction: 'cobalt_to_aos' },
    );

    return { success: true, aosId };
  });
}

export async function enableInCobalt(aosId: string, categories: string[]) {
  return withAuth(async (ctx) => {
    if (!categories.length) return { error: 'At least one category is required' };

    const aos = await prisma.aosSupplier.findFirst({
      where: { id: aosId, teamId: ctx.teamId },
    });
    if (!aos) return { error: 'AoS supplier not found' };
    if (aos.cobaltEnabled && aos.cobaltSupplierId) {
      return { success: true, cobaltId: aos.cobaltSupplierId }; // idempotent
    }

    const cobalt = await prisma.cobaltSupplier.create({
      data: {
        companyName: aos.companyName,
        country: aos.companyCountry || aos.factoryCountry || 'Unknown',
        categories: categories,
        dataSource: 'AoS',
        linked: true,
        aosId: aosId,
        teamId: ctx.teamId,
      },
    });

    await prisma.aosSupplier.update({
      where: { id: aosId },
      data: { cobaltSupplierId: cobalt.id, cobaltEnabled: true },
    });

    await createSupplierActivity(
      aosId,
      ctx.userId,
      'supplier_linked',
      `enabled "${aos.companyName}" in Cobalt`,
      { cobaltSupplierId: cobalt.id, direction: 'aos_to_cobalt' },
    );

    return { success: true, cobaltId: cobalt.id };
  });
}

// ─── Helpers ────────────────────────────────────────────────

async function createSupplierActivity(
  aosSupplierId: string,
  userId: string,
  type: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.activity.create({
    data: {
      entityType: 'supplier',
      entityId: aosSupplierId,
      userId,
      type,
      description,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

// Constants must be exported via async functions in 'use server' files
export async function getQualificationStages() { return [...QUALIFICATION_STAGES]; }
export async function getTransitionMap() { return { ...TRANSITION_MAP }; }
export async function getDropoutReasons() { return [...DROPOUT_REASONS]; }
