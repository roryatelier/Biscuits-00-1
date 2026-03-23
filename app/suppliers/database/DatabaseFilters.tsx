'use client';

import { QUALIFICATION_STAGES as STAGES } from '@/lib/supplier-constants';
import type { SourceFilter } from '@/types/supplier-database';
import styles from './Database.module.css';

type DatabaseFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  allCategories: string[];
  sourceFilter: SourceFilter;
  onSourceFilterChange: (value: SourceFilter) => void;
  capabilityFilter: string;
  onCapabilityFilterChange: (value: string) => void;
};

export default function DatabaseFilters({
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  allCategories,
  sourceFilter,
  onSourceFilterChange,
  capabilityFilter,
  onCapabilityFilterChange,
}: DatabaseFiltersProps) {
  return (
    <div className={styles.filters}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search suppliers..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <select
        className={styles.filterSelect}
        value={stageFilter}
        onChange={e => onStageFilterChange(e.target.value)}
      >
        <option value="">All stages</option>
        {STAGES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select
        className={styles.filterSelect}
        value={categoryFilter}
        onChange={e => onCategoryFilterChange(e.target.value)}
      >
        <option value="">All categories</option>
        {allCategories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        className={styles.filterSelect}
        value={sourceFilter}
        onChange={e => onSourceFilterChange(e.target.value as SourceFilter)}
      >
        <option value="">All sources</option>
        <option value="aos">AoS only</option>
        <option value="cobalt">Cobalt only</option>
        <option value="both">Linked (both)</option>
      </select>
      <select
        className={styles.filterSelect}
        value={capabilityFilter}
        onChange={e => onCapabilityFilterChange(e.target.value)}
      >
        <option value="">All capabilities</option>
        <option value="turnkey">Turnkey</option>
        <option value="blend_fill">Blend &amp; Fill</option>
        <option value="both">Both</option>
      </select>
    </div>
  );
}
