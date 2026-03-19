'use server';

import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/actions/context';
import { computeMatchScorePure } from '@/lib/match-scoring';

export async function computeMatchScore(
  aosSupplierId: string,
  supplierBriefId: string,
): Promise<{ score: number | null; breakdown: Record<string, boolean> }> {
  const result = await withAuth(async (ctx) => {
    // Verify supplier belongs to team
    const supplier = await prisma.aosSupplier.findFirst({
      where: { id: aosSupplierId, teamId: ctx.teamId },
      select: { id: true },
    });
    if (!supplier) return { score: null, breakdown: {} };

    const [brief, certifications] = await Promise.all([
      prisma.supplierBrief.findFirst({ where: { id: supplierBriefId, teamId: ctx.teamId } }),
      prisma.certification.findMany({ where: { aosSupplierId } }),
    ]);

    if (!brief) return { score: null, breakdown: {} };

    const requiredCerts = (brief.requiredCerts as string[]) || [];
    return computeMatchScorePure(certifications, requiredCerts);
  });

  if (result && 'error' in result) return { score: null, breakdown: {} };
  return result as { score: number | null; breakdown: Record<string, boolean> };
}

/**
 * Recalculate match scores for all briefs a supplier is assigned to.
 * Called when supplier certifications change.
 * On failure: sets matchScoreStaleAt instead of silently leaving stale data.
 */
export async function recalculateMatchScores(aosSupplierId: string): Promise<void> {
  const assignments = await prisma.supplierBriefAssignment.findMany({
    where: { aosSupplierId },
    select: { id: true, supplierBriefId: true },
  });

  for (const assignment of assignments) {
    try {
      const { score, breakdown } = await computeMatchScore(aosSupplierId, assignment.supplierBriefId);
      await prisma.supplierBriefAssignment.update({
        where: { id: assignment.id },
        data: {
          matchScore: score,
          matchBreakdown: breakdown,
          matchScoreStaleAt: null, // clear stale flag on success
        },
      });
    } catch {
      // Set stale flag — don't silently leave bad data
      await prisma.supplierBriefAssignment.update({
        where: { id: assignment.id },
        data: { matchScoreStaleAt: new Date() },
      }).catch(() => {}); // best effort
    }
  }
}

/**
 * Recalculate match scores for all suppliers assigned to a brief.
 * Called when brief requirements change.
 */
export async function recalculateMatchScoresForBrief(supplierBriefId: string): Promise<void> {
  const assignments = await prisma.supplierBriefAssignment.findMany({
    where: { supplierBriefId },
    select: { id: true, aosSupplierId: true },
  });

  for (const assignment of assignments) {
    try {
      const { score, breakdown } = await computeMatchScore(assignment.aosSupplierId, supplierBriefId);
      await prisma.supplierBriefAssignment.update({
        where: { id: assignment.id },
        data: {
          matchScore: score,
          matchBreakdown: breakdown,
          matchScoreStaleAt: null,
        },
      });
    } catch {
      await prisma.supplierBriefAssignment.update({
        where: { id: assignment.id },
        data: { matchScoreStaleAt: new Date() },
      }).catch(() => {});
    }
  }
}
