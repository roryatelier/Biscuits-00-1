import { notFound } from 'next/navigation';
import { getSampleOrder } from '@/lib/actions/samples';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import ReviewClient from './ReviewClient';

export default async function SampleReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getSampleOrder(id);

  if (!order) {
    notFound();
  }

  // Serialize dates for client component
  const serializedOrder = {
    id: order.id,
    reference: order.reference,
    status: order.status,
    formulation: order.formulation,
    project: order.project,
    createdAt: order.createdAt.toISOString(),
    reviews: order.reviews.map((r: {
      id: string;
      texture: number | null;
      scent: number | null;
      colour: number | null;
      overall: number | null;
      notes: string | null;
      createdAt: Date;
      reviewer: { name: string | null } | null;
      uploads: unknown[];
    }) => ({
      id: r.id,
      texture: r.texture,
      scent: r.scent,
      colour: r.colour,
      overall: r.overall,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      reviewerName: r.reviewer?.name ?? 'Unknown',
    })),
  };

  return (
    <PlatformLayout>
      <ReviewClient order={serializedOrder} />
    </PlatformLayout>
  );
}
