'use server';

import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';

export async function listSupplierActivities(aosSupplierId: string) {
  return withAuth(async (ctx) => {
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
      select: { id: true },
    });
    if (!supplier) return [];

    return prisma.activity.findMany({
      where: { entityType: 'supplier', entityId: aosSupplierId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
}

export async function addManualActivity(data: {
  aosSupplierId: string;
  entryType: string; // email, call, meeting, note
  description: string;
  date?: string;
}) {
  return withAuth(async (ctx) => {
    if (!data.description.trim()) return { error: 'Description is required' };

    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: data.aosSupplierId, teamId: ctx.teamId },
      select: { id: true },
    });
    if (!supplier) return { error: 'Supplier not found' };

    await prisma.activity.create({
      data: {
        entityType: 'supplier',
        entityId: data.aosSupplierId,
        userId: ctx.userId,
        type: 'manual_entry',
        description: data.description.trim(),
        metadata: {
          entryType: data.entryType,
          date: data.date || new Date().toISOString().split('T')[0],
        },
      },
    });

    return { success: true };
  });
}
