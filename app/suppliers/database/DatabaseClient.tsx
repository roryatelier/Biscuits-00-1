'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { linkCobaltToAos } from '@/lib/actions/suppliers';
import type { PermissionLevel } from '@/lib/constants/suppliers';
import type {
  AosSupplier,
  CobaltSupplier,
  UnifiedSupplier,
  ViewMode,
  SourceFilter,
} from '@/types/supplier-database';
import { buildUnifiedList } from '@/lib/suppliers/unified-list';
import DatabaseFilters from './DatabaseFilters';
import SupplierTable from './SupplierTable';
import SupplierSidePanel from './SupplierSidePanel';
import styles from './Database.module.css';

const STAGE_SORT_ORDER: Record<string, number> = {
  'Fully Qualified': 0,
  'Conditionally Qualified': 1,
  'Capability Confirmed': 2,
  'Outreached': 3,
  'Identified': 4,
  'Paused': 5,
  'Blacklisted': 6,
  'Historical': 7,
};

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
  }).sort((a, b) => {
    const aOrder = a.qualificationStage ? (STAGE_SORT_ORDER[a.qualificationStage] ?? 99) : 99;
    const bOrder = b.qualificationStage ? (STAGE_SORT_ORDER[b.qualificationStage] ?? 99) : 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.companyName.localeCompare(b.companyName);
  });

  const selected = selectedKey ? unified.find(s => s.key === selectedKey) : null;

  const handleLink = (cobaltId: string) => {
    startTransition(async () => {
      await linkCobaltToAos(cobaltId);
      router.refresh();
    });
  };

  const handleRowClick = (s: UnifiedSupplier) => {
    if (s.cobaltId || s.matchedProductsCount > 0) {
      setSelectedKey(s.key === selectedKey ? null : s.key);
    } else if (s.aosId) {
      router.push(`/suppliers/${s.aosId}`);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStageFilter('');
    setCategoryFilter('');
    setSourceFilter('');
    setCapabilityFilter('');
  };

  const totalAos = unified.filter(s => s.source === 'aos' || s.source === 'both').length;
  const totalCobalt = unified.filter(s => s.source === 'cobalt' || s.source === 'both').length;

  if (suppliers.length === 0 && cobaltSuppliers.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
              <a href="/suppliers" style={{ color: '#94a3b8', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#64748b')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Supplier Intelligence</a>
              <span style={{ margin: '0 6px' }}>/</span>
              <span style={{ color: '#64748b' }}>Database</span>
            </div>
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
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            <a href="/suppliers" style={{ color: '#94a3b8', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#64748b')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Supplier Intelligence</a>
            <span style={{ margin: '0 6px' }}>/</span>
            <span style={{ color: '#64748b' }}>Database</span>
          </div>
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

      <DatabaseFilters
        search={search}
        onSearchChange={setSearch}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        allCategories={allCategories}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        capabilityFilter={capabilityFilter}
        onCapabilityFilterChange={setCapabilityFilter}
      />

      <div className={styles.layout}>
        <div className={styles.mainPanel}>
          <SupplierTable
            filtered={filtered}
            selectedKey={selectedKey}
            permissionLevels={permissionLevels}
            onRowClick={handleRowClick}
            onClearFilters={clearFilters}
          />
        </div>

        {selected && (
          <SupplierSidePanel
            supplier={selected}
            isPending={isPending}
            onClose={() => setSelectedKey(null)}
            onViewProfile={(aosId) => router.push(`/suppliers/${aosId}`)}
            onLink={handleLink}
          />
        )}
      </div>
    </div>
  );
}
