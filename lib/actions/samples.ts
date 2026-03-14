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

export async function listSampleOrders(statusFilter?: string) {
  const ctx = await getTeamId();
  if (!ctx) return [];

  const where: Record<string, unknown> = { teamId: ctx.teamId };
  if (statusFilter && statusFilter !== 'All') where.status = statusFilter;

  return prisma.sampleOrder.findMany({
    where,
    include: {
      formulation: { select: { id: true, name: true, version: true, category: true } },
      project: { select: { id: true, name: true } },
      creator: { select: { name: true, email: true } },
      reviews: { select: { id: true, overall: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSampleOrder(id: string) {
  const ctx = await getTeamId();
  if (!ctx) return null;

  return prisma.sampleOrder.findFirst({
    where: { id, teamId: ctx.teamId },
    include: {
      formulation: { select: { id: true, name: true, version: true } },
      project: { select: { id: true, name: true } },
      creator: { select: { name: true, email: true } },
      reviews: {
        include: {
          reviewer: { select: { name: true } },
          uploads: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createSampleOrder(data: {
  formulationId: string;
  projectId?: string;
  quantity: number;
  format: string;
  shippingAddress?: string;
  notes?: string;
}) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  if (!data.formulationId) return { error: 'Formulation is required' };
  if (!data.quantity || data.quantity < 1) return { error: 'Quantity must be at least 1' };

  // Generate next reference number
  const lastOrder = await prisma.sampleOrder.findFirst({
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const lastNum = lastOrder ? parseInt(lastOrder.reference.replace('SMP-', ''), 10) : 0;
  const reference = `SMP-${String(lastNum + 1).padStart(4, '0')}`;

  const order = await prisma.sampleOrder.create({
    data: {
      reference,
      formulationId: data.formulationId,
      projectId: data.projectId || null,
      quantity: data.quantity,
      format: data.format,
      shippingAddress: data.shippingAddress?.trim() || null,
      notes: data.notes?.trim() || null,
      teamId: ctx.teamId,
      createdById: ctx.userId,
    },
  });

  return { success: true, id: order.id, reference };
}

const STATUS_ORDER = ['Pending', 'In Production', 'Shipped', 'Delivered'];

export async function advanceStatus(orderId: string) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  const order = await prisma.sampleOrder.findFirst({
    where: { id: orderId, teamId: ctx.teamId },
  });
  if (!order) return { error: 'Order not found' };

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 1) {
    return { error: `Cannot advance from "${order.status}"` };
  }

  const nextStatus = STATUS_ORDER[currentIdx + 1];
  await prisma.sampleOrder.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  return { success: true, newStatus: nextStatus };
}

export async function addReview(data: {
  sampleOrderId: string;
  texture?: number;
  scent?: number;
  colour?: number;
  overall?: number;
  notes?: string;
}) {
  const ctx = await getTeamId();
  if (!ctx) return { error: 'Not authenticated' };

  const order = await prisma.sampleOrder.findFirst({
    where: { id: data.sampleOrderId, teamId: ctx.teamId },
  });
  if (!order) return { error: 'Sample order not found' };

  const review = await prisma.sampleReview.create({
    data: {
      sampleOrderId: data.sampleOrderId,
      reviewerId: ctx.userId,
      texture: data.texture || null,
      scent: data.scent || null,
      colour: data.colour || null,
      overall: data.overall || null,
      notes: data.notes?.trim() || null,
    },
  });

  return { success: true, id: review.id };
}
