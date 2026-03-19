'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type AuthContext = {
  userId: string;
  teamId: string;
  role: string;
};

/**
 * Shared auth + team context for all server actions.
 * Returns userId, teamId, and team role — or null if unauthenticated.
 */
/**
 * Fetch everything needed for the invited user onboarding flow.
 */
export async function getOnboardingContext() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: { team: { select: { name: true } } },
  });
  if (!membership) return null;

  const [projects, deliveredSamples] = await Promise.all([
    prisma.project.findMany({
      where: { teamId: membership.teamId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true } } } },
        formulations: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.sampleOrder.findFirst({
      where: { teamId: membership.teamId, status: 'Delivered' },
      select: { id: true, reference: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const assignedProjectIds = projects
    .filter(p => p.assignments.some(a => a.userId === session.user!.id))
    .map(p => p.id);

  return {
    userId: session.user.id,
    userName: session.user.name || 'there',
    teamName: membership.team.name,
    teamRole: membership.role,
    projects: projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      category: p.category,
      description: p.description,
      formulationCount: p.formulations.length,
      assignees: p.assignments.map(a => ({ id: a.userId, name: a.user.name })),
    })),
    assignedProjectIds,
    deliveredSample: deliveredSamples ? { id: deliveredSamples.id, reference: deliveredSamples.reference } : null,
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  return {
    userId: session.user.id,
    teamId: membership.teamId,
    role: membership.role,
  };
}

/**
 * Wrapper that handles auth check for server actions.
 * Replaces the repeated getAuthContext() + null check pattern.
 */
export async function withAuth<T>(
  fn: (ctx: AuthContext) => Promise<T>
): Promise<T | { error: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: 'Not authenticated' };
  return fn(ctx);
}
