'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';

type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'status_change'
  | 'formulation_linked'
  | 'formulation_unlinked'
  | 'sample_ordered'
  | 'sample_status_changed'
  | 'review_submitted'
  | 'comment'
  | 'shared'
  | 'stage_transition'
  | 'cert_changed'
  | 'agreement_changed'
  | 'supplier_linked'
  | 'brief_assigned'
  | 'manual_entry';

/**
 * Create an activity record.
 * Supports both project activities (backwards compat) and supplier activities (polymorphic).
 */
export async function createActivity(params: {
  projectId: string;
  userId: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activity.create({
    data: {
      entityType: 'project',
      entityId: params.projectId,
      projectId: params.projectId,
      userId: params.userId,
      type: params.type,
      description: params.description,
      metadata: params.metadata ? (params.metadata as Record<string, string | number | boolean>) : undefined,
    },
  });
}

/**
 * List activities for a project with optional type filter and pagination.
 */
export async function listActivities(
  projectId: string,
  options?: {
    type?: string;
    take?: number;
    skip?: number;
  }
) {
  const ctx = await getAuthContext();
  if (!ctx) return { activities: [], total: 0, hasMore: false };

  // Verify user has access to this project
  const project = await prisma.project.findFirst({
    where: { id: projectId, teamId: ctx.teamId },
    select: { id: true },
  });
  if (!project) return { activities: [], total: 0, hasMore: false };

  const where: Record<string, unknown> = { projectId };
  if (options?.type) where.type = options.type;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.take ?? 20,
      skip: options?.skip ?? 0,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    total,
    hasMore: (options?.skip ?? 0) + activities.length < total,
  };
}
