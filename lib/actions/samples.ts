'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';
import { createNotifications } from '@/lib/actions/notifications';

export async function listSampleOrders(statusFilter?: string) {
  const ctx = await getAuthContext();
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
  const ctx = await getAuthContext();
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
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  if (!data.formulationId) return { error: 'Formulation is required' };
  if (!data.quantity || data.quantity < 1) return { error: 'Quantity must be at least 1' };

  const result = await prisma.$transaction(async (tx) => {
    // Generate next reference number inside transaction to prevent races
    const lastOrder = await tx.sampleOrder.findFirst({
      orderBy: { reference: 'desc' },
      select: { reference: true },
    });
    const lastNum = lastOrder ? parseInt(lastOrder.reference.replace('SMP-', ''), 10) : 0;
    const reference = `SMP-${String(lastNum + 1).padStart(4, '0')}`;

    const order = await tx.sampleOrder.create({
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

    // Emit activity if linked to a project
    if (data.projectId) {
      const formulation = await tx.formulation.findUnique({
        where: { id: data.formulationId },
        select: { name: true },
      });

      await tx.activity.create({
        data: {
          entityType: 'project',
          entityId: data.projectId,
          projectId: data.projectId,
          userId: ctx.userId,
          type: 'sample_ordered',
          description: `ordered sample ${reference} for "${formulation?.name || 'Unknown'}"`,
          metadata: { sampleOrderId: order.id, reference, formulationId: data.formulationId },
        },
      });
    }

    return { id: order.id, reference };
  });

  return { success: true, id: result.id, reference: result.reference };
}

const STATUS_ORDER = ['Pending', 'In Production', 'Shipped', 'Delivered'];

export async function advanceStatus(orderId: string) {
  const ctx = await getAuthContext();
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

  const { activityId } = await prisma.$transaction(async (tx) => {
    await tx.sampleOrder.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    let aId: string | null = null;

    // Emit activity if linked to a project
    if (order.projectId) {
      const activity = await tx.activity.create({
        data: {
          entityType: 'project',
          entityId: order.projectId,
          projectId: order.projectId,
          userId: ctx.userId,
          type: 'sample_status_changed',
          description: `advanced sample ${order.reference} to "${nextStatus}"`,
          metadata: { sampleOrderId: orderId, from: order.status, to: nextStatus },
        },
      });
      aId = activity.id;
    }

    return { activityId: aId };
  });

  // Fan-out notifications: sample status advanced -> order creator (if different from advancer)
  if (activityId && order.createdById !== ctx.userId) {
    await createNotifications(activityId, [order.createdById]);
  }

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
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const order = await prisma.sampleOrder.findFirst({
    where: { id: data.sampleOrderId, teamId: ctx.teamId },
    select: { id: true, reference: true, projectId: true, createdById: true },
  });
  if (!order) return { error: 'Sample order not found' };

  const { reviewId, activityId } = await prisma.$transaction(async (tx) => {
    const review = await tx.sampleReview.create({
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

    let aId: string | null = null;

    // Emit activity if linked to a project
    if (order.projectId) {
      const activity = await tx.activity.create({
        data: {
          entityType: 'project',
          entityId: order.projectId,
          projectId: order.projectId,
          userId: ctx.userId,
          type: 'review_submitted',
          description: `submitted a review for ${order.reference}`,
          metadata: { sampleOrderId: order.id, reviewId: review.id },
        },
      });
      aId = activity.id;
    }

    return { reviewId: review.id, activityId: aId };
  });

  // Fan-out notifications: review submitted -> order creator + project lead (if different from reviewer)
  if (activityId && order.projectId) {
    const leadAssignment = await prisma.projectAssignment.findFirst({
      where: { projectId: order.projectId, role: 'lead' },
      select: { userId: true },
    });
    const recipientSet = new Set<string>();
    if (order.createdById !== ctx.userId) {
      recipientSet.add(order.createdById);
    }
    if (leadAssignment && leadAssignment.userId !== ctx.userId) {
      recipientSet.add(leadAssignment.userId);
    }
    await createNotifications(activityId, Array.from(recipientSet));
  }

  return { success: true, id: reviewId };
}
