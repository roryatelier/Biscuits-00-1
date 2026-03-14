'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function getTeamId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;
  return { userId: session.user.id, teamId: membership.teamId };
}

export async function listProjects(statusFilter?: string) {
  const ctx = await getTeamId();
  if (!ctx) return [];

  const where: Record<string, unknown> = { teamId: ctx.teamId };
  if (statusFilter) where.status = statusFilter;

  return prisma.project.findMany({
    where,
    include: {
      creator: { select: { name: true } },
      formulations: { include: { formulation: { select: { id: true, name: true, category: true } } } },
      sampleOrders: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProject(id: string) {
  const ctx = await getTeamId();
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
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  if (!data.name?.trim()) return { error: 'Project name is required' };

  const project = await prisma.project.create({
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

  return { success: true, id: project.id };
}

export async function updateProject(id: string, data: {
  name?: string;
  description?: string;
  status?: string;
  category?: string;
  market?: string;
  claims?: string[];
}) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  const project = await prisma.project.findFirst({ where: { id, teamId: ctx.teamId } });
  if (!project) return { error: 'Project not found' };

  await prisma.project.update({
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

  return { success: true };
}

export async function deleteProject(id: string) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  const project = await prisma.project.findFirst({ where: { id, teamId: ctx.teamId } });
  if (!project) return { error: 'Project not found' };

  await prisma.project.delete({ where: { id } });
  return { success: true };
}

export async function linkFormulation(projectId: string, formulationId: string) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  const project = await prisma.project.findFirst({ where: { id: projectId, teamId: ctx.teamId } });
  if (!project) return { error: 'Project not found' };

  const existing = await prisma.projectFormulation.findFirst({
    where: { projectId, formulationId },
  });
  if (existing) return { error: 'Formulation already linked to this project' };

  await prisma.projectFormulation.create({
    data: { projectId, formulationId },
  });

  return { success: true };
}

export async function unlinkFormulation(projectId: string, formulationId: string) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  await prisma.projectFormulation.deleteMany({
    where: { projectId, formulationId },
  });

  return { success: true };
}
