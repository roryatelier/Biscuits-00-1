'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Formulations.module.css';

const GRADIENTS: Record<string, string> = {
  'Serum': 'linear-gradient(135deg, #cfe7ff, #8ccafb)',
  'Shampoo': 'linear-gradient(135deg, #d1fae5, #6ee7b7)',
  'Moisturiser': 'linear-gradient(135deg, #f3e7f9, #dfc5f0)',
  'Toner': 'linear-gradient(135deg, #fff7ea, #ffd9a8)',
  'SPF': 'linear-gradient(135deg, #fff3ef, #ffc9bb)',
  'Mask': 'linear-gradient(135deg, #e0f4f8, #a8e0ef)',
  'Treatment': 'linear-gradient(135deg, #edf6ff, #cfe7ff)',
  'Conditioner': 'linear-gradient(135deg, #fefce8, #fde68a)',
  'Cleanser': 'linear-gradient(135deg, #fff7ea, #ffc45f)',
  'Oil': 'linear-gradient(135deg, #ffe4e4, #ffb3b3)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #e8ecf1, #c8d0da)';

interface FormulationItem {
  id: string;
  name: string;
  category: string | null;
  status: string;
  market: string | null;
  version: string;
  description: string | null;
}

interface FormulationsListProps {
  formulations: FormulationItem[];
  categories: string[];
  statuses: string[];
  markets: string[];
}

export default function FormulationsList({ formulations, categories, statuses, markets }: FormulationsListProps) {
  const router = useRouter();
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState<string[]>([]);
  const [statFilter, setStatFilter] = useState<string[]>([]);
  const [mktFilter, setMktFilter]   = useState<string[]>([]);
  const [hovered, setHovered]       = useState<string | null>(null);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const filtered = useMemo(() => formulations.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter.length  && !catFilter.includes(f.category ?? '')) return false;
    if (statFilter.length && !statFilter.includes(f.status))  return false;
    if (mktFilter.length  && !mktFilter.includes(f.market ?? ''))   return false;
    return true;
  }), [formulations, search, catFilter, statFilter, mktFilter]);

  const clearAll = () => { setCatFilter([]); setStatFilter([]); setMktFilter([]); setSearch(''); };
  const activeFilters = catFilter.length + statFilter.length + mktFilter.length;

  return (
    <div className={styles.page}>

      {/* -- Top bar -- */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Formulation Catalog</h1>
          <p className={styles.pageSubtitle}>{formulations.length} formulations available</p>
        </div>
        <div className={styles.topBarSearch}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search formulations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.body}>

        {/* -- Filter sidebar -- */}
        <aside className={styles.filters}>
          <div className={styles.filterHeader}>
            <span className={styles.filterHeading}>Filters</span>
            {activeFilters > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
            )}
          </div>

          <FilterGroup
            label="Category"
            options={categories}
            selected={catFilter}
            onToggle={v => toggle(catFilter, v, setCatFilter)}
          />
          <FilterGroup
            label="Status"
            options={statuses}
            selected={statFilter}
            onToggle={v => toggle(statFilter, v, setStatFilter)}
          />
          <FilterGroup
            label="Regulatory market"
            options={markets}
            selected={mktFilter}
            onToggle={v => toggle(mktFilter, v, setMktFilter)}
          />
        </aside>

        {/* -- Grid -- */}
        <div className={styles.gridWrap}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No formulations match your filters</p>
              <button className={styles.clearBtn2} onClick={clearAll}>Clear all filters</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(f => {
                const gradient = GRADIENTS[f.category ?? ''] ?? DEFAULT_GRADIENT;
                return (
                  <div
                    key={f.id}
                    className={styles.card}
                    onMouseEnter={() => setHovered(f.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className={styles.cardImage} style={{ background: gradient }}>
                      {hovered === f.id && (
                        <div className={styles.cardActions}>
                          <button
                            className={styles.cardActionBtn}
                            onClick={() => router.push(`/formulations/${f.id}`)}
                          >
                            View details
                          </button>
                          <button className={styles.cardActionBtnSecondary}>
                            Add to project
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardCategory}>{f.category ?? 'Uncategorised'}</span>
                        <StatusBadge status={f.status} />
                      </div>
                      <p
                        className={styles.cardName}
                        onClick={() => router.push(`/formulations/${f.id}`)}
                      >
                        {f.name}
                      </p>
                      <p className={styles.cardVersion}>v{f.version} {f.market ? `\u00b7 ${f.market}` : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function FilterGroup({ label, options, selected, onToggle }: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterGroupLabel}>{label}</p>
      {options.map(opt => (
        <label key={opt} className={styles.filterOption}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className={styles.checkbox}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'badgeActive', Draft: 'badgeDraft', Archived: 'badgeArchived',
  };
  return <span className={`${styles.badge} ${styles[map[status] ?? 'badgeArchived']}`}>{status}</span>;
}
