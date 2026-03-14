import { notFound } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { getFormulation } from '@/lib/actions/formulations';
import FormulationDetailClient from './FormulationDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FormulationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const formulation = await getFormulation(id);

  if (!formulation) {
    notFound();
  }

  // Serialise to plain object for the client component
  const data = {
    id: formulation.id,
    name: formulation.name,
    category: formulation.category,
    status: formulation.status,
    market: formulation.market,
    version: formulation.version,
    description: formulation.description,
    creatorName: formulation.creator?.name ?? null,
    updatedAt: formulation.updatedAt.toISOString(),
    ingredients: formulation.ingredients.map((fi, idx) => ({
      inci: fi.ingredient.name,
      pct: fi.percentage != null ? fi.percentage.toFixed(2) : '0.00',
      fn: fi.ingredient.function ?? '',
      role: fi.role ?? '',
      casNumber: fi.ingredient.casNumber ?? null,
    })),
  };

  return (
    <PlatformLayout>
      <FormulationDetailClient formulation={data} />
    </PlatformLayout>
  );
}
