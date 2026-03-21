import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listAosSuppliers, listCobaltSuppliers } from '@/lib/actions/suppliers';
import { getPermissionLevels } from '@/lib/actions/certifications';
import DatabaseClient from './DatabaseClient';

export default async function DatabasePage() {
  const [suppliersResult, cobaltResult] = await Promise.all([
    listAosSuppliers(),
    listCobaltSuppliers(),
  ]);

  const suppliers = Array.isArray(suppliersResult) ? suppliersResult : [];
  const cobaltRaw = Array.isArray(cobaltResult) ? cobaltResult : [];

  // Batch permission lookups — 2 queries instead of 3N
  const permissionResult = await getPermissionLevels(suppliers.map(s => s.id));
  const permissionLevels: Record<string, 'none' | 'can_brief' | 'can_sample' | 'can_po'> =
    (permissionResult && !('error' in permissionResult)) ? permissionResult : {};

  const serializedAos = suppliers.map(s => ({
    id: s.id,
    companyName: s.companyName,
    qualificationStage: s.qualificationStage,
    categories: (s.categories as string[]) || [],
    moq: s.moq,
    cautionFlag: s.cautionFlag,
    cobaltEnabled: s.cobaltEnabled,
    capabilityType: s.capabilityType,
    certifications: s.certifications.map(c => ({
      id: c.id,
      certType: c.certType,
      verificationStatus: c.verificationStatus,
      expiryDate: c.expiryDate ? c.expiryDate.toISOString().split('T')[0] : null,
    })),
    agreements: s.agreements.map(a => ({
      id: a.id,
      agreementType: a.agreementType,
      status: a.status,
    })),
    cobaltSupplier: s.cobaltSupplier ? {
      id: s.cobaltSupplier.id,
      matchedProductsCount: s.cobaltSupplier.matchedProductsCount,
    } : null,
    briefCount: s._count.briefAssignments,
  }));

  const serializedCobalt = cobaltRaw.map(s => ({
    id: s.id,
    companyName: s.companyName,
    country: s.country,
    categories: (s.categories as string[]) || [],
    matchedProductsCount: s.matchedProductsCount,
    matchedProducts: (s.matchedProducts as Array<{
      name?: string;
      brand?: string;
      rrp?: string;
      markets?: string[];
      url?: string;
    }>) || [],
    keyBrands: (s.matchedProducts as Array<{ brand?: string }>)
      ?.map(p => p.brand)
      .filter((b): b is string => !!b)
      .filter((b, i, arr) => arr.indexOf(b) === i)
      .slice(0, 3) || [],
    linked: s.linked,
    aosId: s.aosId,
    aosSupplier: s.aosSupplier ? {
      id: s.aosSupplier.id,
      qualificationStage: s.aosSupplier.qualificationStage,
      cautionFlag: s.aosSupplier.cautionFlag,
      certifications: s.aosSupplier.certifications,
      agreements: s.aosSupplier.agreements,
    } : null,
  }));

  return (
    <PlatformLayout>
      <DatabaseClient
        suppliers={serializedAos}
        cobaltSuppliers={serializedCobalt}
        permissionLevels={permissionLevels}
      />
    </PlatformLayout>
  );
}
