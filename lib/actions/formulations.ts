'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function listFormulations(filters?: {
  category?: string;
  status?: string;
  market?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const where: Record<string, unknown> = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.status) where.status = filters.status;
  if (filters?.market) where.market = filters.market;
  if (filters?.search) {
    where.name = { contains: filters.search };
  }

  return prisma.formulation.findMany({
    where,
    include: {
      ingredients: {
        include: { ingredient: { select: { name: true, function: true } } },
        orderBy: { percentage: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getFormulation(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.formulation.findFirst({
    where: { id },
    include: {
      creator: { select: { name: true } },
      ingredients: {
        include: {
          ingredient: true,
        },
        orderBy: { percentage: 'desc' },
      },
      projects: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getFormulationCategories() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const formulations = await prisma.formulation.findMany({
    select: { category: true },
    distinct: ['category'],
  });

  return formulations.map(f => f.category).filter(Boolean) as string[];
}
