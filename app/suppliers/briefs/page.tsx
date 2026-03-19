import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listSupplierBriefs } from '@/lib/actions/supplier-briefs';
import BriefsClient from './BriefsClient';

export default async function BriefsPage() {
  const briefsResult = await listSupplierBriefs();
  const briefs = Array.isArray(briefsResult) ? briefsResult : [];

  const serialized = briefs.map(b => ({
    id: b.id,
    name: b.name,
    customerName: b.customerName,
    category: b.category,
    subcategory: b.subcategory,
    blendFillType: b.blendFillType,
    dueDate: b.dueDate ? b.dueDate.toISOString().split('T')[0] : null,
    requiredCerts: (b.requiredCerts as string[]) || [],
    assignmentCount: b._count.assignments,
    createdAt: b.createdAt.toISOString().split('T')[0],
  }));

  return (
    <PlatformLayout>
      <BriefsClient briefs={serialized} />
    </PlatformLayout>
  );
}
