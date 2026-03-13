'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './Packaging.module.css';

const ALL_PACKAGING = [
  { id: '1',  name: 'Airless Pump Bottle 30ml',        format: 'Bottle',  material: 'PP',          finish: 'Matte White',   moq: '5,000',  status: 'Active',   gradient: 'linear-gradient(135deg, #edf6ff, #cfe7ff)' },
  { id: '2',  name: 'Amber Glass Dropper 30ml',         format: 'Bottle',  material: 'Glass',       finish: 'Amber',         moq: '3,000',  status: 'Active',   gradient: 'linear-gradient(135deg, #fff7ea, #ffd9a8)' },
  { id: '3',  name: 'Aluminium Tube 100ml',             format: 'Tube',    material: 'Aluminium',   finish: 'Brushed Silver',moq: '10,000', status: 'Active',   gradient: 'linear-gradient(135deg, #f3f4f6, #d1d5db)' },
  { id: '4',  name: 'Squeeze Tube 150ml',               format: 'Tube',    material: 'HDPE',        finish: 'Gloss White',   moq: '8,000',  status: 'Active',   gradient: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' },
  { id: '5',  name: 'Frosted Glass Jar 50ml',           format: 'Jar',     material: 'Glass',       finish: 'Frosted',       moq: '2,000',  status: 'Active',   gradient: 'linear-gradient(135deg, #f3e7f9, #dfc5f0)' },
  { id: '6',  name: 'Wide-Mouth Jar 100ml',             format: 'Jar',     material: 'PET',         finish: 'Clear',         moq: '5,000',  status: 'Draft',    gradient: 'linear-gradient(135deg, #e0f4f8, #a8e0ef)' },
  { id: '7',  name: 'HDPE Shampoo Bottle 250ml',        format: 'Bottle',  material: 'HDPE',        finish: 'Gloss White',   moq: '10,000', status: 'Active',   gradient: 'linear-gradient(135deg, #d1fae5, #6ee7b7)' },
  { id: '8',  name: 'PCR Flip-Top Tube 75ml',           format: 'Tube',    material: 'PCR',         finish: 'Natural',       moq: '15,000', status: 'Active',   gradient: 'linear-gradient(135deg, #fefce8, #fde68a)' },
  { id: '9',  name: 'Bamboo Cap Jar 30ml',              format: 'Jar',     material: 'Glass + Bamboo', finish: 'Natural',    moq: '3,000',  status: 'Draft',    gradient: 'linear-gradient(135deg, #fff3ef, #ffc9bb)' },
];

const FORMATS   = ['Bottle', 'Tube', 'Jar'];
const MATERIALS = ['Glass', 'PP', 'HDPE', 'PET', 'Aluminium', 'PCR', 'Glass + Bamboo'];
const STATUSES  = ['Active', 'Draft'];

export default function PackagingPage() {
  const router = useRouter();
  const [search, setSearch]         = useState('');
  const [fmtFilter, setFmtFilter]   = useState<string[]>([]);
  const [matFilter, setMatFilter]   = useState<string[]>([]);
  const [statFilter, setStatFilter] = useState<string[]>([]);
  const [hovered, setHovered]       = useState<string | null>(null);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const filtered = useMemo(() => ALL_PACKAGING.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (fmtFilter.length  && !fmtFilter.includes(p.format))   return false;
    if (matFilter.length  && !matFilter.includes(p.material))  return false;
    if (statFilter.length && !statFilter.includes(p.status))   return false;
    return true;
  }), [search, fmtFilter, matFilter, statFilter]);

  const clearAll = () => { setFmtFilter([]); setMatFilter([]); setStatFilter([]); setSearch(''); };
  const activeFilters = fmtFilter.length + matFilter.length + statFilter.length;

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Packaging Catalog</h1>
            <p className={styles.pageSubtitle}>{ALL_PACKAGING.length} packaging options available</p>
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

            <FilterGroup label="Format" options={FORMATS} selected={fmtFilter} onToggle={v => toggle(fmtFilter, v, setFmtFilter)} />
            <FilterGroup label="Material" options={MATERIALS} selected={matFilter} onToggle={v => toggle(matFilter, v, setMatFilter)} />
            <FilterGroup label="Status" options={STATUSES} selected={statFilter} onToggle={v => toggle(statFilter, v, setStatFilter)} />
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
                {filtered.map(p => (
                  <div
                    key={p.id}
                    className={styles.card}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className={styles.cardImage} style={{ background: p.gradient }}>
                      <span className={styles.formatIcon} aria-hidden="true">
                        {p.format === 'Bottle' && '⬡'}
                        {p.format === 'Tube' && '▭'}
                        {p.format === 'Jar' && '⬠'}
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
                        <span className={styles.cardFormat}>{p.format}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <p
                        className={styles.cardName}
                        onClick={() => router.push(`/packaging/${p.id}`)}
                      >
                        {p.name}
                      </p>
                      <p className={styles.cardSub}>{p.material} · {p.finish} · MOQ {p.moq}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </PlatformLayout>
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
  const map: Record<string, string> = { Active: 'badgeActive', Draft: 'badgeDraft' };
  return <span className={`${styles.badge} ${styles[map[status] ?? 'badgeDraft']}`}>{status}</span>;
}
