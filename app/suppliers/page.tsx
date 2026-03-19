import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listAosSuppliers } from '@/lib/actions/suppliers';
import { listSupplierBriefs } from '@/lib/actions/supplier-briefs';
import SupplierDashboardClient from './SupplierDashboardClient';

const STAGE_ORDER = [
  'Identified',
  'Outreached',
  'Capability Confirmed',
  'Conditionally Qualified',
  'Fully Qualified',
  'Paused',
  'Blacklisted',
] as const;

export default async function SuppliersPage() {
  const [suppliersResult, briefsResult] = await Promise.all([
    listAosSuppliers(),
    listSupplierBriefs(),
  ]);

  const suppliers = Array.isArray(suppliersResult) ? suppliersResult : [];
  const briefs = Array.isArray(briefsResult) ? briefsResult : [];

  const totalSuppliers = suppliers.length;
  const fullyQualified = suppliers.filter(s => s.qualificationStage === 'Fully Qualified').length;
  const activeBriefs = briefs.length;
  const identified = suppliers.filter(s => s.qualificationStage === 'Identified').length;
  const conversionRate = identified > 0
    ? Math.round((fullyQualified / (identified + fullyQualified)) * 100)
    : 0;

  const stageCounts: Record<string, number> = {};
  for (const stage of STAGE_ORDER) {
    stageCounts[stage] = suppliers.filter(s => s.qualificationStage === stage).length;
  }

  const categoryMap: Record<string, { total: number; qualified: number }> = {};
  for (const s of suppliers) {
    const cats = (s.categories as string[]) || [];
    for (const cat of cats) {
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, qualified: 0 };
      categoryMap[cat].total++;
      if (s.qualificationStage === 'Fully Qualified') categoryMap[cat].qualified++;
    }
  }

  const categoryCoverage = Object.entries(categoryMap)
    .map(([category, counts]) => ({ category, ...counts }))
    .sort((a, b) => b.total - a.total);

  // Compute coverage heatmap: categories x countries for qualified suppliers
  const HEATMAP_CATEGORIES = ['Face Care', 'Hair Care', 'SPF', 'Body Care', 'Colour'];
  const HEATMAP_COUNTRIES = ['AU', 'KR', 'CN', 'US', 'IT', 'IN', 'JP', 'FR', 'PL', 'DE'];
  const QUALIFIED_STAGES = ['Conditionally Qualified', 'Fully Qualified'];

  const coverageMatrix: Record<string, Record<string, number>> = {};
  for (const cat of HEATMAP_CATEGORIES) {
    coverageMatrix[cat] = {};
    for (const country of [...HEATMAP_COUNTRIES, 'Other']) {
      coverageMatrix[cat][country] = 0;
    }
  }

  for (const s of suppliers) {
    if (!QUALIFIED_STAGES.includes(s.qualificationStage)) continue;
    const cats = (s.categories as string[]) || [];
    const rawCountry = (s.companyCountry as string) || '';
    const country = HEATMAP_COUNTRIES.includes(rawCountry) ? rawCountry : 'Other';
    for (const cat of cats) {
      if (HEATMAP_CATEGORIES.includes(cat)) {
        coverageMatrix[cat][country]++;
      }
    }
  }

  const heatmapData = HEATMAP_CATEGORIES.map(cat => ({
    category: cat,
    counts: [...HEATMAP_COUNTRIES, 'Other'].map(country => ({
      country,
      count: coverageMatrix[cat][country],
    })),
  }));

  return (
    <PlatformLayout>
      <SupplierDashboardClient
        totalSuppliers={totalSuppliers}
        fullyQualified={fullyQualified}
        activeBriefs={activeBriefs}
        conversionRate={conversionRate}
        stageCounts={stageCounts}
        categoryCoverage={categoryCoverage}
        heatmapData={heatmapData}
        heatmapCountries={[...HEATMAP_COUNTRIES, 'Other']}
      />
    </PlatformLayout>
  );
}
