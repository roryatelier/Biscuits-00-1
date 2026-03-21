import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listAosSuppliers } from '@/lib/actions/suppliers';
import { listSupplierBriefsWithAssignments } from '@/lib/actions/supplier-briefs';
import { getPermissionLevels } from '@/lib/actions/certifications';
import PipelineClient from './PipelineClient';

export default async function PipelinePage() {
  const [suppliersResult, briefsResult] = await Promise.all([
    listAosSuppliers(),
    listSupplierBriefsWithAssignments(),
  ]);

  const suppliers = Array.isArray(suppliersResult) ? suppliersResult : [];
  const briefs = Array.isArray(briefsResult) ? briefsResult : [];

  // Batch permission lookups — 2 queries instead of 3N
  const permissionResult = await getPermissionLevels(suppliers.map(s => s.id));
  const permissionLevels: Record<string, 'none' | 'can_brief' | 'can_sample' | 'can_po'> =
    (permissionResult && !('error' in permissionResult)) ? permissionResult : {};

  const serialized = suppliers.map(s => ({
    id: s.id,
    companyName: s.companyName,
    qualificationStage: s.qualificationStage,
    categories: (s.categories as string[]) || [],
    cautionFlag: s.cautionFlag,
    certCount: s.certifications.length,
    capabilityType: s.capabilityType,
  }));

  const serializedBriefs = briefs.map(b => ({
    id: b.id,
    name: b.name,
    customerName: b.customerName,
    category: b.category,
    assignments: b.assignments.map(a => ({
      aosSupplierId: a.aosSupplierId,
      matchScore: a.matchScore,
      status: a.status,
      supplier: {
        id: a.aosSupplier.id,
        companyName: a.aosSupplier.companyName,
        qualificationStage: a.aosSupplier.qualificationStage,
        categories: (a.aosSupplier.categories as string[]) || [],
        cautionFlag: a.aosSupplier.cautionFlag,
        certCount: a.aosSupplier.certifications.length,
        capabilityType: a.aosSupplier.capabilityType,
      },
    })),
  }));

  return (
    <PlatformLayout>
      <PipelineClient suppliers={serialized} briefs={serializedBriefs} permissionLevels={permissionLevels} />
    </PlatformLayout>
  );
}
