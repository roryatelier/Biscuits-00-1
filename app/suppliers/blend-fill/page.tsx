import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listCobaltSuppliers } from '@/lib/actions/suppliers';
import BlendFillClient from './BlendFillClient';

export default async function BlendFillPage() {
  const suppliersResult = await listCobaltSuppliers();
  const suppliers = Array.isArray(suppliersResult) ? suppliersResult : [];

  const serialized = suppliers.map(s => ({
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
      <BlendFillClient suppliers={serialized} />
    </PlatformLayout>
  );
}
