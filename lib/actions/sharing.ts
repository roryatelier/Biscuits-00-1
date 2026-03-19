'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';

// ─── Create a share link ────────────────────────────────────

export async function createShareLink(
  projectId: string,
  options: {
    includeIngredients?: boolean;
    includeReviews?: boolean;
    expiresInDays?: number;
  } = {},
) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  // Only admins and project leads can generate share links
  const isAdmin = ctx.role === 'admin';
  if (!isAdmin) {
    const assignment = await prisma.projectAssignment.findUnique({
      where: { projectId_userId: { projectId, userId: ctx.userId } },
    });
    if (!assignment || assignment.role !== 'lead') {
      return { error: 'Only admins and project leads can create share links' };
    }
  }

  // Verify project belongs to team
  const project = await prisma.project.findFirst({
    where: { id: projectId, teamId: ctx.teamId },
  });
  if (!project) return { error: 'Project not found' };

  const token = crypto.randomBytes(32).toString('hex');
  const days = options.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const link = await tx.shareLink.create({
      data: {
        token,
        projectId,
        createdById: ctx.userId,
        expiresAt,
        includeIngredients: options.includeIngredients ?? false,
        includeReviews: options.includeReviews ?? false,
      },
    });

    await tx.activity.create({
      data: {
        entityType: 'project',
        entityId: projectId,
        projectId,
        userId: ctx.userId,
        type: 'shared',
        description: `created a share link (expires in ${days} days)`,
        metadata: {
          shareLinkId: link.id,
          includeIngredients: link.includeIngredients,
          includeReviews: link.includeReviews,
        },
      },
    });

    return link;
  });

  return { success: true, link: result };
}

// ─── Revoke a share link ────────────────────────────────────

export async function revokeShareLink(linkId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const link = await prisma.shareLink.findFirst({
    where: { id: linkId },
    include: { project: { select: { teamId: true } } },
  });
  if (!link || link.project.teamId !== ctx.teamId) {
    return { error: 'Share link not found' };
  }

  await prisma.shareLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  });

  return { success: true };
}

// ─── List active share links ────────────────────────────────

export async function listShareLinks(projectId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  const project = await prisma.project.findFirst({
    where: { id: projectId, teamId: ctx.teamId },
  });
  if (!project) return [];

  return prisma.shareLink.findMany({
    where: {
      projectId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Get shared project (PUBLIC — no auth) ──────────────────

export type SharedIngredient = {
  percentage: number | null;
  role: string | null;
  ingredient: { name: string; casNumber: string | null; function: string | null };
};

export type SharedReview = {
  texture: number | null;
  scent: number | null;
  colour: number | null;
  overall: number | null;
  notes: string | null;
  createdAt: Date;
};

export type SharedFormulation = {
  formulation: {
    name: string;
    category: string | null;
    version: string;
    status: string;
    ingredients: SharedIngredient[];
  };
};

export type SharedSampleOrder = {
  reference: string;
  status: string;
  format: string | null;
  quantity: number;
  formulation: { name: string } | null;
  reviews: SharedReview[];
};

export type SharedProject = {
  name: string;
  status: string;
  category: string | null;
  market: string | null;
  claims: string | null;
  formulations: SharedFormulation[];
  sampleOrders: SharedSampleOrder[];
};

export type SharedProjectResult =
  | { error: 'not_found' | 'revoked' | 'expired' }
  | { project: SharedProject; includeIngredients: boolean; includeReviews: boolean };

export async function getSharedProject(token: string): Promise<SharedProjectResult> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
  });

  if (!link) return { error: 'not_found' };
  if (link.revokedAt) return { error: 'revoked' };
  if (link.expiresAt < new Date()) return { error: 'expired' };

  const project = await prisma.project.findUnique({
    where: { id: link.projectId },
    select: {
      name: true,
      status: true,
      category: true,
      market: true,
      claims: true,
      formulations: {
        select: {
          formulation: {
            select: {
              name: true,
              category: true,
              version: true,
              status: true,
              ingredients: {
                select: {
                  percentage: true,
                  role: true,
                  ingredient: {
                    select: { name: true, casNumber: true, function: true },
                  },
                },
              },
            },
          },
        },
      },
      sampleOrders: {
        select: {
          reference: true,
          status: true,
          format: true,
          quantity: true,
          formulation: { select: { name: true } },
          reviews: {
            select: {
              texture: true,
              scent: true,
              colour: true,
              overall: true,
              notes: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) return { error: 'not_found' };

  // Strip ingredients/reviews from response when not included
  const sanitised: SharedProject = {
    ...project,
    formulations: project.formulations.map((pf) => ({
      formulation: {
        name: pf.formulation.name,
        category: pf.formulation.category,
        version: pf.formulation.version,
        status: pf.formulation.status,
        ingredients: link.includeIngredients ? pf.formulation.ingredients : [],
      },
    })),
    sampleOrders: project.sampleOrders.map((so) => ({
      ...so,
      reviews: link.includeReviews ? so.reviews : [],
    })),
  };

  return {
    project: sanitised,
    includeIngredients: link.includeIngredients,
    includeReviews: link.includeReviews,
  };
}
