'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './Formulations.module.css';

const ALL_FORMULATIONS = [
  { id: '1',  name: 'Hydra-Plump Moisture Serum',          category: 'Serum',       skinType: 'Dry',        market: 'EU',     status: 'Active',   version: 'v2.1', gradient: 'linear-gradient(135deg, #cfe7ff, #8ccafb)' },
  { id: '2',  name: 'Keratin Shield Repair Shampoo',        category: 'Shampoo',     skinType: 'All',        market: 'US',     status: 'Active',   version: 'v1.3', gradient: 'linear-gradient(135deg, #d1fae5, #6ee7b7)' },
  { id: '3',  name: 'Overnight Restore Night Cream',        category: 'Moisturiser', skinType: 'Mature',     market: 'UK',     status: 'Active',   version: 'v3.0', gradient: 'linear-gradient(135deg, #f3e7f9, #dfc5f0)' },
  { id: '4',  name: 'AHA Renewal Facial Toner',             category: 'Toner',       skinType: 'Oily',       market: 'EU',     status: 'Draft',    version: 'v1.0', gradient: 'linear-gradient(135deg, #fff7ea, #ffd9a8)' },
  { id: '5',  name: 'SPF50 Daily Defense Moisturiser',      category: 'SPF',         skinType: 'All',        market: 'Global', status: 'Active',   version: 'v2.2', gradient: 'linear-gradient(135deg, #fff3ef, #ffc9bb)' },
  { id: '6',  name: 'Marine Collagen Firming Mask',         category: 'Mask',        skinType: 'Mature',     market: 'KR',     status: 'Active',   version: 'v1.5', gradient: 'linear-gradient(135deg, #e0f4f8, #a8e0ef)' },
  { id: '7',  name: 'Scalp Purify Anti-Dandruff Treatment', category: 'Treatment',   skinType: 'Oily scalp', market: 'UK',     status: 'Active',   version: 'v4.0', gradient: 'linear-gradient(135deg, #edf6ff, #cfe7ff)' },
  { id: '8',  name: 'Biotin Strengthen Hair Conditioner',   category: 'Conditioner', skinType: 'Fine',       market: 'US',     status: 'Draft',    version: 'v1.1', gradient: 'linear-gradient(135deg, #fefce8, #fde68a)' },
  { id: '9',  name: 'Vitamin C Brightening Cleanser',       category: 'Cleanser',    skinType: 'Dull',       market: 'EU',     status: 'Active',   version: 'v2.0', gradient: 'linear-gradient(135deg, #fff7ea, #ffc45f)' },
  { id: '10', name: 'Rose Hip Recovery Face Oil',           category: 'Oil',         skinType: 'Sensitive',  market: 'UK',     status: 'Archived', version: 'v1.2', gradient: 'linear-gradient(135deg, #ffe4e4, #ffb3b3)' },
  { id: '11', name: 'Ceramide Barrier Repair Serum',        category: 'Serum',       skinType: 'Sensitive',  market: 'EU',     status: 'Active',   version: 'v3.1', gradient: 'linear-gradient(135deg, #e8f4fd, #bfdbfe)' },
  { id: '12', name: 'Tea Tree Clarifying Toner',            category: 'Toner',       skinType: 'Oily',       market: 'US',     status: 'Active',   version: 'v2.3', gradient: 'linear-gradient(135deg, #e8f8e8, #b5e0b5)' },
];

const CATEGORIES = ['Serum', 'Shampoo', 'Moisturiser', 'Toner', 'SPF', 'Mask', 'Treatment', 'Conditioner', 'Cleanser', 'Oil'];
const STATUSES   = ['Active', 'Draft', 'Archived'];
const MARKETS    = ['EU', 'US', 'UK', 'Global', 'KR'];

export default function FormulationsPage() {
  const router = useRouter();
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState<string[]>([]);
  const [statFilter, setStatFilter] = useState<string[]>([]);
  const [mktFilter, setMktFilter]   = useState<string[]>([]);
  const [hovered, setHovered]       = useState<string | null>(null);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const filtered = useMemo(() => ALL_FORMULATIONS.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter.length  && !catFilter.includes(f.category)) return false;
    if (statFilter.length && !statFilter.includes(f.status))  return false;
    if (mktFilter.length  && !mktFilter.includes(f.market))   return false;
    return true;
  }), [search, catFilter, statFilter, mktFilter]);

  const clearAll = () => { setCatFilter([]); setStatFilter([]); setMktFilter([]); setSearch(''); };
  const activeFilters = catFilter.length + statFilter.length + mktFilter.length;

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Formulation Catalog</h1>
            <p className={styles.pageSubtitle}>{ALL_FORMULATIONS.length} formulations available</p>
          </div>
          <div className={styles.topBarSearch}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search formulations…"
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

            <FilterGroup
              label="Category"
              options={CATEGORIES}
              selected={catFilter}
              onToggle={v => toggle(catFilter, v, setCatFilter)}
            />
            <FilterGroup
              label="Status"
              options={STATUSES}
              selected={statFilter}
              onToggle={v => toggle(statFilter, v, setStatFilter)}
            />
            <FilterGroup
              label="Regulatory market"
              options={MARKETS}
              selected={mktFilter}
              onToggle={v => toggle(mktFilter, v, setMktFilter)}
            />
          </aside>

          {/* ── Grid ── */}
          <div className={styles.gridWrap}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>No formulations match your filters</p>
                <button className={styles.clearBtn2} onClick={clearAll}>Clear all filters</button>
              </div>
            ) : (
              <div className={styles.grid}>
                {filtered.map(f => (
                  <div
                    key={f.id}
                    className={styles.card}
                    onMouseEnter={() => setHovered(f.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className={styles.cardImage} style={{ background: f.gradient }}>
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
                        <span className={styles.cardCategory}>{f.category}</span>
                        <StatusBadge status={f.status} />
                      </div>
                      <p
                        className={styles.cardName}
                        onClick={() => router.push(`/formulations/${f.id}`)}
                      >
                        {f.name}
                      </p>
                      <p className={styles.cardVersion}>{f.version} · {f.market}</p>
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
