import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listFormulations } from '@/lib/actions/formulations';
import FormulationsList from './FormulationsList';

export default async function FormulationsPage() {
  const formulations = await listFormulations();

  // Derive filter options from actual data
  const categories = [...new Set(formulations.map(f => f.category).filter(Boolean))] as string[];
  const statuses   = [...new Set(formulations.map(f => f.status).filter(Boolean))];
  const markets    = [...new Set(formulations.map(f => f.market).filter(Boolean))] as string[];

  // Serialise to plain objects for the client component
  const items = formulations.map(f => ({
    id: f.id,
    name: f.name,
    category: f.category,
    status: f.status,
    market: f.market,
    version: f.version,
    description: f.description,
  }));

  return (
    <PlatformLayout>
      <FormulationsList
        formulations={items}
        categories={categories}
        statuses={statuses}
        markets={markets}
      />
    </PlatformLayout>
  );
}
