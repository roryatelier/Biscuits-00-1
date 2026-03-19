'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { linkCobaltToAos } from '@/lib/actions/suppliers';
import styles from './Database.module.css';

const STAGES = [
  'Identified',
  'Outreached',
  'Capability Confirmed',
  'Conditionally Qualified',
  'Fully Qualified',
  'Paused',
  'Blacklisted',
];

const STAGE_COLORS: Record<string, string> = {
  'Identified': '#94a3b8',
  'Outreached': '#3b82f6',
  'Capability Confirmed': '#8b5cf6',
  'Conditionally Qualified': '#f59e0b',
  'Fully Qualified': '#22c55e',
  'Paused': '#94a3b8',
  'Blacklisted': '#ef4444',
};

type PermissionLevel = 'none' | 'can_brief' | 'can_sample' | 'can_po';

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  none: 'No Permissions',
  can_brief: 'Can Brief',
  can_sample: 'Can Sample',
  can_po: 'Can PO',
};

const PERMISSION_COLORS: Record<PermissionLevel, string> = {
  none: '#94a3b8',
  can_brief: '#3b82f6',
  can_sample: '#22c55e',
  can_po: '#8b5cf6',
};

const CERT_TYPES = ['GMP', 'ISO', 'Organic', 'Halal', 'Vegan', 'COSMOS'];
const AGREEMENT_TYPES = ['NDA', 'MSA', 'IP', 'Payment'];

type CertInfo = { id?: string; certType: string; verificationStatus: string; expiryDate?: string | null };
type AgreementInfo = { id?: string; agreementType: string; status: string };

type MatchedProduct = {
  name?: string;
  brand?: string;
  rrp?: string;
  markets?: string[];
  url?: string;
};

type CapabilityType = 'turnkey' | 'blend_fill' | 'both' | 'unknown';

const CAPABILITY_LABELS: Record<CapabilityType, string> = {
  turnkey: 'Turnkey',
  blend_fill: 'B&F Only',
  both: 'Both',
  unknown: 'Unknown',
};

const CAPABILITY_COLORS: Record<CapabilityType, string> = {
  turnkey: '#22c55e',
  blend_fill: '#3b82f6',
  both: '#8b5cf6',
  unknown: '#94a3b8',
};

type AosSupplier = {
  id: string;
  companyName: string;
  qualificationStage: string;
  categories: string[];
  moq: number | null;
  cautionFlag: boolean;
  cobaltEnabled: boolean;
  capabilityType: string;
  certifications: CertInfo[];
  agreements: AgreementInfo[];
  cobaltSupplier: { id: string; matchedProductsCount: number } | null;
  briefCount: number;
};

type CobaltSupplier = {
  id: string;
  companyName: string;
  country: string;
  categories: string[];
  matchedProductsCount: number;
  matchedProducts: MatchedProduct[];
  keyBrands: string[];
  linked: boolean;
  aosId: string | null;
  aosSupplier: {
    id: string;
    qualificationStage: string;
    cautionFlag: boolean;
    certifications: CertInfo[];
    agreements: AgreementInfo[];
  } | null;
};

type UnifiedSupplier = {
  key: string;
  companyName: string;
  source: 'aos' | 'cobalt' | 'both';
  // AoS fields
  aosId: string | null;
  qualificationStage: string | null;
  categories: string[];
  moq: number | null;
  cautionFlag: boolean;
  certifications: CertInfo[];
  agreements: AgreementInfo[];
  briefCount: number;
  capabilityType: CapabilityType;
  // Cobalt fields
  cobaltId: string | null;
  country: string | null;
  matchedProductsCount: number;
  matchedProducts: MatchedProduct[];
  keyBrands: string[];
  linked: boolean;
};

function buildUnifiedList(aosSuppliers: AosSupplier[], cobaltSuppliers: CobaltSupplier[]): UnifiedSupplier[] {
  const unified: UnifiedSupplier[] = [];
  const linkedCobaltIds = new Set<string>();

  // Process AoS suppliers first
  for (const aos of aosSuppliers) {
    const hasCobalt = aos.cobaltEnabled && aos.cobaltSupplier != null;
    if (hasCobalt && aos.cobaltSupplier) {
      linkedCobaltIds.add(aos.cobaltSupplier.id);
    }
    // Find matching cobalt record for product data
    const cobalt = hasCobalt
      ? cobaltSuppliers.find(c => c.aosId === aos.id)
      : null;

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
      matchedProductsCount: cobalt?.matchedProductsCount ?? aos.cobaltSupplier?.matchedProductsCount ?? 0,
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

type ViewMode = 'all' | 'aos' | 'discovery';
type SourceFilter = '' | 'aos' | 'cobalt' | 'both';

export default function DatabaseClient({
  suppliers,
  cobaltSuppliers,
  permissionLevels = {},
}: {
  suppliers: AosSupplier[];
  cobaltSuppliers: CobaltSupplier[];
  permissionLevels?: Record<string, PermissionLevel>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [capabilityFilter, setCapabilityFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const unified = buildUnifiedList(suppliers, cobaltSuppliers);

  const allCategories = Array.from(
    new Set(unified.flatMap(s => s.categories))
  ).sort();

  const filtered = unified.filter(s => {
    if (search && !s.companyName.toLowerCase().includes(search.toLowerCase())) return false;
    if (stageFilter && s.qualificationStage !== stageFilter) return false;
    if (categoryFilter && !s.categories.includes(categoryFilter)) return false;
    if (sourceFilter && s.source !== sourceFilter) return false;
    if (capabilityFilter && s.capabilityType !== capabilityFilter) return false;
    if (viewMode === 'aos' && s.source === 'cobalt') return false;
    if (viewMode === 'discovery' && s.source === 'aos') return false;
    return true;
  });

  const selected = selectedKey ? unified.find(s => s.key === selectedKey) : null;

  const handleLink = (cobaltId: string) => {
    startTransition(async () => {
      await linkCobaltToAos(cobaltId);
      router.refresh();
    });
  };

  const handleRowClick = (s: UnifiedSupplier) => {
    // If it has cobalt product data, open the side panel
    if (s.cobaltId || s.matchedProductsCount > 0) {
      setSelectedKey(s.key === selectedKey ? null : s.key);
    } else if (s.aosId) {
      // Pure AoS supplier -- navigate to profile
      router.push(`/suppliers/${s.aosId}`);
    }
  };

  const totalAos = unified.filter(s => s.source === 'aos' || s.source === 'both').length;
  const totalCobalt = unified.filter(s => s.source === 'cobalt' || s.source === 'both').length;

  if (suppliers.length === 0 && cobaltSuppliers.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Supplier Database</h1>
            <p className={styles.pageSubtitle}>0 suppliers</p>
          </div>
        </div>
        <EmptyState
          icon="projects"
          heading="No suppliers yet"
          description="Suppliers will appear here once added to AoS or imported from Cobalt."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Supplier Database</h1>
          <p className={styles.pageSubtitle}>
            {unified.length} suppliers &middot; {totalAos} AoS &middot; {totalCobalt} Discovery
          </p>
        </div>
        <div className={styles.viewTabs}>
          <button
            className={`${styles.viewTab} ${viewMode === 'all' ? styles.viewTabActive : ''}`}
            onClick={() => setViewMode('all')}
          >
            All
          </button>
          <button
            className={`${styles.viewTab} ${viewMode === 'aos' ? styles.viewTabActive : ''}`}
            onClick={() => setViewMode('aos')}
          >
            AoS
          </button>
          <button
            className={`${styles.viewTab} ${viewMode === 'discovery' ? styles.viewTabActive : ''}`}
            onClick={() => setViewMode('discovery')}
          >
            Discovery
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
        >
          <option value="">All stages</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {allCategories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as SourceFilter)}
        >
          <option value="">All sources</option>
          <option value="aos">AoS only</option>
          <option value="cobalt">Cobalt only</option>
          <option value="both">Linked (both)</option>
        </select>
        <select
          className={styles.filterSelect}
          value={capabilityFilter}
          onChange={e => setCapabilityFilter(e.target.value)}
        >
          <option value="">All capabilities</option>
          <option value="turnkey">Turnkey</option>
          <option value="blend_fill">Blend &amp; Fill</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainPanel}>
          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Source</th>
                  <th className={styles.th}>Stage</th>
                  <th className={styles.th}>Capability</th>
                  <th className={styles.th}>Permission</th>
                  <th className={styles.th}>Categories</th>
                  <th className={styles.th}>Certs</th>
                  <th className={styles.th}>Agreements</th>
                  <th className={styles.th}>Products</th>
                  <th className={styles.th}>MOQ</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const certSet = new Set(
                    s.certifications
                      .filter(c => c.verificationStatus === 'verified')
                      .map(c => c.certType)
                  );
                  const agreementSet = new Set(
                    s.agreements
                      .filter(a => a.status === 'signed')
                      .map(a => a.agreementType)
                  );

                  const sourceBadgeClass =
                    s.source === 'both' ? styles.sourceBadgeBoth
                    : s.source === 'cobalt' ? styles.sourceBadgeCobalt
                    : styles.sourceBadgeAos;

                  const sourceLabel =
                    s.source === 'both' ? 'Linked'
                    : s.source === 'cobalt' ? 'Cobalt'
                    : 'AoS';

                  return (
                    <tr
                      key={s.key}
                      className={`${styles.row} ${selectedKey === s.key ? styles.rowActive : ''}`}
                      onClick={() => handleRowClick(s)}
                    >
                      <td className={styles.td}>
                        <div className={styles.nameCell}>
                          <span className={styles.supplierName}>{s.companyName}</span>
                          {s.cautionFlag && (
                            <span className={styles.cautionIcon} title="Caution flag">&#x26A0;</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={sourceBadgeClass}>{sourceLabel}</span>
                      </td>
                      <td className={styles.td}>
                        {s.qualificationStage ? (
                          <span
                            className={styles.stageBadge}
                            style={{ backgroundColor: STAGE_COLORS[s.qualificationStage] || '#94a3b8' }}
                          >
                            {s.qualificationStage}
                          </span>
                        ) : (
                          <span className={styles.cobaltOffBadge}>--</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span
                          className={styles.capabilityBadge}
                          style={{ backgroundColor: CAPABILITY_COLORS[s.capabilityType] }}
                        >
                          {CAPABILITY_LABELS[s.capabilityType]}
                        </span>
                      </td>
                      <td className={styles.td}>
                        {s.aosId && permissionLevels[s.aosId] ? (
                          <span
                            className={styles.permissionBadge}
                            style={{ backgroundColor: PERMISSION_COLORS[permissionLevels[s.aosId]] }}
                          >
                            {PERMISSION_LABELS[permissionLevels[s.aosId]]}
                          </span>
                        ) : (
                          <span className={styles.cobaltOffBadge}>--</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div className={styles.chips}>
                          {s.categories.slice(0, 2).map(c => (
                            <span key={c} className={styles.chip}>{c}</span>
                          ))}
                          {s.categories.length > 2 && (
                            <span className={styles.chipMore}>+{s.categories.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.certIcons}>
                          {CERT_TYPES.map(ct => (
                            <span
                              key={ct}
                              className={`${styles.certDot} ${certSet.has(ct) ? styles.certVerified : styles.certMissing}`}
                              title={ct}
                            >
                              {ct.charAt(0)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.certIcons}>
                          {AGREEMENT_TYPES.map(at => (
                            <span
                              key={at}
                              className={`${styles.certDot} ${agreementSet.has(at) ? styles.agreementSigned : styles.certMissing}`}
                              title={at}
                            >
                              {at.charAt(0)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.td}>
                        {s.matchedProductsCount > 0 ? (
                          <span className={styles.countBadge}>{s.matchedProductsCount}</span>
                        ) : (
                          <span className={styles.cobaltOffBadge}>--</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {s.moq != null ? s.moq.toLocaleString() : '--'}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.arrowIcon}>&rarr;</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <EmptyState
                icon="projects"
                heading="No suppliers match your filters"
                description="Try adjusting your search, stage, category, or source filters."
                ctaLabel="Clear filters"
                onCtaClick={() => {
                  setSearch('');
                  setStageFilter('');
                  setCategoryFilter('');
                  setSourceFilter('');
                  setCapabilityFilter('');
                }}
              />
            )}
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2 className={styles.sidePanelTitle}>{selected.companyName}</h2>
              <button className={styles.closePanelBtn} onClick={() => setSelectedKey(null)}>&times;</button>
            </div>

            {/* Supplier info */}
            <div className={styles.sidePanelSection}>
              <h3 className={styles.sidePanelSectionTitle}>Details</h3>
              {selected.country && <p className={styles.sidePanelMeta}>Country: {selected.country}</p>}
              {selected.qualificationStage && (
                <p className={styles.sidePanelMeta}>Stage: {selected.qualificationStage}</p>
              )}
              {selected.keyBrands.length > 0 && (
                <p className={styles.sidePanelMeta}>Key brands: {selected.keyBrands.join(', ')}</p>
              )}
            </div>

            {/* Matched products */}
            <div className={styles.sidePanelSection}>
              <h3 className={styles.sidePanelSectionTitle}>
                Matched Products ({selected.matchedProductsCount})
              </h3>
              {selected.matchedProducts.length === 0 ? (
                <p className={styles.emptyText}>No matched products.</p>
              ) : (
                <div className={styles.productList}>
                  {selected.matchedProducts.map((p, i) => (
                    <div key={i} className={styles.productCard}>
                      <p className={styles.productName}>{p.name || 'Unnamed product'}</p>
                      {p.brand && <p className={styles.productMeta}>Brand: {p.brand}</p>}
                      {p.rrp && <p className={styles.productMeta}>RRP: {p.rrp}</p>}
                      {p.markets && p.markets.length > 0 && (
                        <p className={styles.productMeta}>Markets: {p.markets.join(', ')}</p>
                      )}
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className={styles.productLink}>
                          View product &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.sidePanelActions}>
              {selected.aosId && (
                <button
                  className={styles.actionBtnSecondary}
                  onClick={() => router.push(`/suppliers/${selected.aosId}`)}
                >
                  View AoS Profile &rarr;
                </button>
              )}
              {selected.cobaltId && !selected.linked && (
                <button
                  className={styles.actionBtn}
                  onClick={() => handleLink(selected.cobaltId!)}
                  disabled={isPending}
                >
                  {isPending ? 'Linking...' : 'Link to AoS'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
