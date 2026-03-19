'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';
import { createNotifications } from '@/lib/actions/notifications';

export async function listProjects(statusFilter?: string) {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  const where: Record<string, unknown> = { teamId: ctx.teamId };
  if (statusFilter) where.status = statusFilter;

  return prisma.project.findMany({
    where,
    include: {
      creator: { select: { name: true } },
      formulations: { include: { formulation: { select: { id: true, name: true, category: true } } } },
      sampleOrders: { select: { id: true, status: true } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProject(id: string) {
  const ctx = await getAuthContext();
  if (!ctx) return null;

  return prisma.project.findFirst({
    where: { id, teamId: ctx.teamId },
    include: {
      creator: { select: { name: true, email: true } },
      formulations: {
        include: {
          formulation: {
            select: { id: true, name: true, category: true, status: true, version: true },
          },
        },
      },
      sampleOrders: {
        include: {
          formulation: { select: { name: true } },
          reviews: { select: { id: true, overall: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  category?: string;
  market?: string;
  claims?: string[];
}) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  if (!data.name?.trim()) return { error: 'Project name is required' };

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category || null,
        market: data.market || null,
        claims: data.claims ? JSON.stringify(data.claims) : null,
        teamId: ctx.teamId,
        createdById: ctx.userId,
      },
    });

    // Auto-assign creator as project lead
    await tx.projectAssignment.create({
      data: {
        projectId: project.id,
        userId: ctx.userId,
        role: 'lead',
      },
    });

    await tx.activity.create({
      data: {
        entityType: 'project',
        entityId: project.id,
        projectId: project.id,
        userId: ctx.userId,
        type: 'project_created',
        description: `created this project`,
      },
    });

    return project;
  });

  return { success: true, id: result.id };
}

export async function updateProject(id: string, data: {
  name?: string;
  description?: string;
  status?: string;
  category?: string;
  market?: string;
  claims?: string[];
}) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const project = await prisma.project.findFirst({ where: { id, teamId: ctx.teamId } });
  if (!project) return { error: 'Project not found' };

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.status && { status: data.status }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.market !== undefined && { market: data.market || null }),
        ...(data.claims && { claims: JSON.stringify(data.claims) }),
      },
    });

    // Emit status_change if status changed, otherwise project_updated
    if (data.status && data.status !== project.status) {
      await tx.activity.create({
        data: {
          entityType: 'project',
          entityId: id,
          projectId: id,
          userId: ctx.userId,
          type: 'status_change',
          description: `changed status to "${data.status}"`,
          metadata: { from: project.status, to: data.status },
        },
      });
    } else {
      const changes = Object.keys(data).filter(k => k !== 'status');
      if (changes.length > 0) {
        await tx.activity.create({
          data: {
            entityType: 'project',
            entityId: id,
            projectId: id,
            userId: ctx.userId,
            type: 'project_updated',
            description: `updated project details`,
            metadata: { fields: changes },
          },
        });
      }
    }
  });

  // Fan-out notifications: project status changed -> all assignees except changer
  if (data.status && data.status !== project.status) {
    const activity = await prisma.activity.findFirst({
      where: { projectId: id, userId: ctx.userId, type: 'status_change' },
      orderBy: { createdAt: 'desc' },
    });
    if (activity) {
      const assignments = await prisma.projectAssignment.findMany({
        where: { projectId: id },
        select: { userId: true },
      });
      const recipients = assignments
        .map((a) => a.userId)
        .filter((uid) => uid !== ctx.userId);
      await createNotifications(activity.id, recipients);
    }
  }

  return { success: true };
}

export async function deleteProject(id: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const project = await prisma.project.findFirst({ where: { id, teamId: ctx.teamId } });
  if (!project) return { error: 'Project not found' };

  await prisma.project.delete({ where: { id } });
  return { success: true };
}

export async function linkFormulation(projectId: string, formulationId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const project = await prisma.project.findFirst({ where: { id: projectId, teamId: ctx.teamId } });
  if (!project) return { error: 'Project not found' };

  const existing = await prisma.projectFormulation.findFirst({
    where: { projectId, formulationId },
  });
  if (existing) return { error: 'Formulation already linked to this project' };

  await prisma.$transaction(async (tx) => {
    await tx.projectFormulation.create({
      data: { projectId, formulationId },
    });

    const formulation = await tx.formulation.findUnique({
      where: { id: formulationId },
      select: { name: true },
    });

    await tx.activity.create({
      data: {
        entityType: 'project',
        entityId: projectId,
        projectId,
        userId: ctx.userId,
        type: 'formulation_linked',
        description: `linked formulation "${formulation?.name || 'Unknown'}"`,
        metadata: { formulationId },
      },
    });
  });

  return { success: true };
}

export async function unlinkFormulation(projectId: string, formulationId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const formulation = await prisma.formulation.findUnique({
    where: { id: formulationId },
    select: { name: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.projectFormulation.deleteMany({
      where: { projectId, formulationId },
    });

    await tx.activity.create({
      data: {
        entityType: 'project',
        entityId: projectId,
        projectId,
        userId: ctx.userId,
        type: 'formulation_unlinked',
        description: `unlinked formulation "${formulation?.name || 'Unknown'}"`,
        metadata: { formulationId },
      },
    });
  });

  return { success: true };
}
