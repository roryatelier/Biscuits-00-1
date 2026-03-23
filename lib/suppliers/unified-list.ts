// Builds a unified supplier list from AoS and Cobalt data sources.
// Extracted from DatabaseClient.tsx — pure function, no React dependency.

import type { CapabilityType } from '@/lib/constants/suppliers';
import type {
  AosSupplier,
  CobaltSupplier,
  UnifiedSupplier,
} from '@/types/supplier-database';

/**
 * Merge AoS and Cobalt supplier records into a single unified list.
 *
 * Uses a Map<aosId, CobaltSupplier> for O(n+m) lookup instead of the
 * previous O(n*m) .find() approach (CTO review item #20).
 */
export function buildUnifiedList(
  aosSuppliers: AosSupplier[],
  cobaltSuppliers: CobaltSupplier[],
): UnifiedSupplier[] {
  const unified: UnifiedSupplier[] = [];
  const linkedCobaltIds = new Set<string>();

  // Pre-build lookup map: aosId -> CobaltSupplier (fixes O(n*m) bug)
  const cobaltByAosId = new Map<string, CobaltSupplier>();
  for (const c of cobaltSuppliers) {
    if (c.aosId) {
      cobaltByAosId.set(c.aosId, c);
    }
  }

  // Process AoS suppliers first
  for (const aos of aosSuppliers) {
    const hasCobalt = aos.cobaltEnabled && aos.cobaltSupplier != null;
    if (hasCobalt && aos.cobaltSupplier) {
      linkedCobaltIds.add(aos.cobaltSupplier.id);
    }
    // Find matching cobalt record for product data — O(1) via Map
    const cobalt = hasCobalt ? cobaltByAosId.get(aos.id) ?? null : null;

    unified.push({
      key: `aos-${aos.id}`,
      companyName: aos.companyName,
      source: hasCobalt ? 'both' : 'aos',
      aosId: aos.id,
      qualificationStage: aos.qualificationStage,
      categories: aos.categories,
      moq: aos.moq,
      cautionFlag: aos.cautionFlag,
      certifications: aos.certifications,
      agreements: aos.agreements,
      briefCount: aos.briefCount,
      capabilityType: (aos.capabilityType || 'unknown') as CapabilityType,
      cobaltId: cobalt?.id ?? null,
      country: cobalt?.country ?? null,
      matchedProductsCount:
        cobalt?.matchedProductsCount ?? aos.cobaltSupplier?.matchedProductsCount ?? 0,
      matchedProducts: cobalt?.matchedProducts ?? [],
      keyBrands: cobalt?.keyBrands ?? [],
      linked: hasCobalt,
    });
  }

  // Add unlinked Cobalt suppliers
  for (const cobalt of cobaltSuppliers) {
    if (cobalt.linked) continue; // already added via AoS side
    unified.push({
      key: `cobalt-${cobalt.id}`,
      companyName: cobalt.companyName,
      source: 'cobalt',
      aosId: null,
      qualificationStage: null,
      categories: cobalt.categories,
      moq: null,
      cautionFlag: false,
      certifications: cobalt.aosSupplier?.certifications ?? [],
      agreements: cobalt.aosSupplier?.agreements ?? [],
      briefCount: 0,
      capabilityType: 'unknown' as CapabilityType,
      cobaltId: cobalt.id,
      country: cobalt.country,
      matchedProductsCount: cobalt.matchedProductsCount,
      matchedProducts: cobalt.matchedProducts,
      keyBrands: cobalt.keyBrands,
      linked: false,
    });
  }

  return unified;
}
