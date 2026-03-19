'use server';

import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/actions/context';

export async function listProjectDocuments(projectId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  const project = await prisma.project.findFirst({
    where: { id: projectId, teamId: ctx.teamId },
  });
  if (!project) return [];

  return prisma.document.findMany({
    where: { projectId, teamId: ctx.teamId },
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listAllDocuments() {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  return prisma.document.findMany({
    where: { teamId: ctx.teamId },
    include: {
      uploadedBy: { select: { name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listBrandDocuments() {
  const ctx = await getAuthContext();
  if (!ctx) return [];

  return prisma.document.findMany({
    where: { teamId: ctx.teamId, projectId: null },
    include: {
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteDocument(documentId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  const doc = await prisma.document.findFirst({
    where: { id: documentId, teamId: ctx.teamId },
  });
  if (!doc) return { error: 'Document not found' };

  await prisma.document.delete({ where: { id: documentId } });

  // Emit activity if linked to a project
  if (doc.projectId) {
    await prisma.activity.create({
      data: {
        entityType: 'project',
        entityId: doc.projectId,
        projectId: doc.projectId,
        userId: ctx.userId,
        type: 'document_deleted',
        description: `removed "${doc.name}"`,
        metadata: { documentId },
      },
    });
  }

  return { success: true };
}

export async function renameDocument(documentId: string, newName: string) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };

  if (!newName.trim()) return { error: 'Name is required' };

  const doc = await prisma.document.findFirst({
    where: { id: documentId, teamId: ctx.teamId },
  });
  if (!doc) return { error: 'Document not found' };

  await prisma.document.update({
    where: { id: documentId },
    data: { name: newName.trim() },
  });

  return { success: true };
}
