import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listAosSuppliers } from '@/lib/actions/suppliers';
import ShortlistingClient from './ShortlistingClient';

export default async function ShortlistingPage() {
  const suppliersResult = await listAosSuppliers();
  const suppliers = Array.isArray(suppliersResult) ? suppliersResult : [];

  const serialized = suppliers.map(s => ({
    id: s.id,
    companyName: s.companyName,
    qualificationStage: s.qualificationStage,
    factoryCountry: (s as Record<string, unknown>).factoryCountry as string | null,
  }));

  return (
    <PlatformLayout>
      <ShortlistingClient suppliers={serialized} />
    </PlatformLayout>
  );
}
