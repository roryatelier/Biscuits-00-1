'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function listPackaging(filters?: {
  format?: string;
  material?: string;
  status?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return [];

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
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.packagingOption.findFirst({
    where: { id },
    include: {
      uploads: true,
    },
  });
}
