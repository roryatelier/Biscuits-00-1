'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Packaging.module.css';

const GRADIENTS: Record<string, string> = {
  'Bottle': 'linear-gradient(135deg, #edf6ff, #cfe7ff)',
  'Tube': 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
  'Jar': 'linear-gradient(135deg, #f3e7f9, #dfc5f0)',
  'Sachet': 'linear-gradient(135deg, #fff7ea, #ffd9a8)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #f3f4f6, #d1d5db)';

interface PackagingItem {
  id: string;
  name: string;
  format: string | null;
  material: string | null;
  moq: number | null;
  unitCost: number | null;
  leadTime: string | null;
  status: string;
  description: string | null;
}

interface PackagingCatalogProps {
  packaging: PackagingItem[];
}

export default function PackagingCatalog({ packaging }: PackagingCatalogProps) {
  const router = useRouter();
  const [search, setSearch]         = useState('');
  const [fmtFilter, setFmtFilter]   = useState<string[]>([]);
  const [matFilter, setMatFilter]   = useState<string[]>([]);
  const [statFilter, setStatFilter] = useState<string[]>([]);
  const [hovered, setHovered]       = useState<string | null>(null);

  const formats = useMemo(() => [...new Set(packaging.map(p => p.format).filter(Boolean) as string[])].sort(), [packaging]);
  const materials = useMemo(() => [...new Set(packaging.map(p => p.material).filter(Boolean) as string[])].sort(), [packaging]);
  const statuses = useMemo(() => [...new Set(packaging.map(p => p.status).filter(Boolean))].sort(), [packaging]);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const filtered = useMemo(() => packaging.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (fmtFilter.length  && (!p.format || !fmtFilter.includes(p.format)))     return false;
    if (matFilter.length  && (!p.material || !matFilter.includes(p.material))) return false;
    if (statFilter.length && !statFilter.includes(p.status))                    return false;
    return true;
  }), [packaging, search, fmtFilter, matFilter, statFilter]);

  const clearAll = () => { setFmtFilter([]); setMatFilter([]); setStatFilter([]); setSearch(''); };
  const activeFilters = fmtFilter.length + matFilter.length + statFilter.length;

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Packaging Catalog</h1>
          <p className={styles.pageSubtitle}>{packaging.length} packaging options available</p>
        </div>
        <div className={styles.topBarSearch}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search packaging..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.body}>

        {/* ── Filter sidebar ── */}
        <aside className={styles.filters}>
          <div className={styles.filterHeader}>
            <span className={styles.filterHeading}>Filters</span>
            {activeFilters > 0 && (
              <button className={styles.clearBtn} onClick={clearAll}>Clear all</button>
            )}
          </div>

          <FilterGroup label="Format" options={formats} selected={fmtFilter} onToggle={v => toggle(fmtFilter, v, setFmtFilter)} />
          <FilterGroup label="Material" options={materials} selected={matFilter} onToggle={v => toggle(matFilter, v, setMatFilter)} />
          <FilterGroup label="Status" options={statuses} selected={statFilter} onToggle={v => toggle(statFilter, v, setStatFilter)} />
        </aside>

        {/* ── Grid ── */}
        <div className={styles.gridWrap}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="14" width="32" height="24" rx="4" stroke="#b1aaa8" strokeWidth="2"/><path d="M8 22h32" stroke="#b1aaa8" strokeWidth="2"/><circle cx="24" cy="30" r="3" stroke="#b1aaa8" strokeWidth="2"/></svg>
              </div>
              <p className={styles.emptyTitle}>No packaging matches your filters</p>
              <button className={styles.clearBtn2} onClick={clearAll}>Clear all filters</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(p => {
                const gradient = (p.format && GRADIENTS[p.format]) || DEFAULT_GRADIENT;
                const moqDisplay = p.moq != null ? p.moq.toLocaleString() : '—';
                return (
                  <div
                    key={p.id}
                    className={styles.card}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className={styles.cardImage} style={{ background: gradient }}>
                      <span className={styles.formatIcon} aria-hidden="true">
                        {p.format === 'Bottle' && '\u2B21'}
                        {p.format === 'Tube' && '\u25AD'}
                        {p.format === 'Jar' && '\u2B20'}
                        {p.format === 'Sachet' && '\u25C7'}
                      </span>
                      {hovered === p.id && (
                        <div className={styles.cardActions}>
                          <button
                            className={styles.cardActionBtn}
                            onClick={() => router.push(`/packaging/${p.id}`)}
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
                        <span className={styles.cardFormat}>{p.format ?? 'Unknown'}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p
                        className={styles.cardName}
                        onClick={() => router.push(`/packaging/${p.id}`)}
                      >
                        {p.name}
                      </p>
                      <p className={styles.cardSub}>{p.material ?? '—'} · MOQ {moqDisplay}</p>
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
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterGroupLabel}>{label}</p>
      {options.map(opt => (
        <label key={opt} className={styles.filterOption}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} className={styles.checkbox} />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { Active: 'badgeActive', Available: 'badgeActive', Draft: 'badgeDraft', Limited: 'badgeDraft', 'Coming Soon': 'badgeDraft' };
  return <span className={`${styles.badge} ${styles[map[status] ?? 'badgeDraft']}`}>{status}</span>;
}
