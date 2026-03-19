'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';

export async function listPackaging(filters?: {
  format?: string;
  material?: string;
  status?: string;
  search?: string;
}) {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  const where: Record<string, unknown> = {};
  if (filters?.format) where.format = filters.format;
  if (filters?.material) where.material = filters.material;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.name = { contains: filters.search };
  }

  return prisma.packagingOption.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function getPackaging(id: string) {
  const ctx = await getAuthContext();
  if (!ctx) return null;

  return prisma.packagingOption.findFirst({
    where: { id },
    include: {
      uploads: true,
    },
  });
}
