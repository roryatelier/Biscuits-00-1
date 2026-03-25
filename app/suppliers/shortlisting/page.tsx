import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listSupplierBriefs } from '@/lib/actions/supplier-briefs';
import ShortlistingClient from './ShortlistingClient';

export default async function ShortlistingPage() {
  const briefsResult = await listSupplierBriefs();
  const briefs = Array.isArray(briefsResult) ? briefsResult : [];

  const serialized = briefs.map(b => ({
    id: b.id,
    name: b.name,
    customerName: b.customerName,
    category: b.category,
    dueDate: b.dueDate ? b.dueDate.toISOString() : null,
  }));

  return (
    <PlatformLayout>
      <ShortlistingClient briefs={serialized} />
    </PlatformLayout>
  );
}
