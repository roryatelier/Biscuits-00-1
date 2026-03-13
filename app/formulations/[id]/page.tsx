'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './FormulationDetail.module.css';

interface Ingredient {
  inci: string;
  pct: string;
  fn: string;
  supplier: string;
  flag: string | null;
}

const INGREDIENTS: Ingredient[] = [
  { inci: 'Aqua',                    pct: '72.00', fn: 'Solvent',        supplier: 'In-house',        flag: null },
  { inci: 'Sodium Laureth Sulfate',  pct: '10.00', fn: 'Surfactant',     supplier: 'Stepan',          flag: 'advisory' },
  { inci: 'Cocamidopropyl Betaine',  pct: '8.00',  fn: 'Surfactant',     supplier: 'BASF',            flag: null },
  { inci: 'Zinc Pyrithione',         pct: '1.00',  fn: 'Antidandruff',   supplier: 'Arxada AG',       flag: 'restricted' },
  { inci: 'Niacinamide',             pct: '1.50',  fn: 'Active',         supplier: 'Lonza',           flag: null },
  { inci: 'Sodium Chloride',         pct: '1.00',  fn: 'Viscosity agent',supplier: 'In-house',        flag: null },
  { inci: 'Glycerin',                pct: '2.00',  fn: 'Humectant',      supplier: 'IOI Group',       flag: null },
  { inci: 'Salicylic Acid',          pct: '0.50',  fn: 'Exfoliant',      supplier: 'Clariant',        flag: 'restricted' },
  { inci: 'Panthenol',               pct: '0.50',  fn: 'Conditioner',    supplier: 'DSM',             flag: null },
  { inci: 'Piroctone Olamine',       pct: '0.50',  fn: 'Antidandruff',   supplier: 'Clariant',        flag: 'restricted' },
  { inci: 'Polyquaternium-10',       pct: '0.30',  fn: 'Film-former',    supplier: 'Lubrizol',        flag: null },
  { inci: 'Menthol',                 pct: '0.25',  fn: 'Active/Sensory', supplier: 'Sigma-Aldrich',   flag: null },
  { inci: 'Methylisothiazolinone',   pct: '0.15',  fn: 'Preservative',   supplier: 'Lonza',           flag: 'restricted' },
  { inci: 'Parfum',                  pct: '0.50',  fn: 'Fragrance',      supplier: 'Givaudan',        flag: null },
  { inci: 'Citric Acid',             pct: '0.20',  fn: 'pH Adjuster',    supplier: 'Jungbunzlauer',   flag: null },
  { inci: 'EDTA',                    pct: '0.10',  fn: 'Chelating agent',supplier: 'BASF',            flag: null },
];

/* Version-specific ingredient snapshots for comparison */
const VERSION_INGREDIENTS: Record<string, Ingredient[]> = {
  'v4.0': INGREDIENTS,
  'v3.2': [
    { inci: 'Aqua',                    pct: '72.00', fn: 'Solvent',        supplier: 'In-house',        flag: null },
    { inci: 'Sodium Laureth Sulfate',  pct: '10.00', fn: 'Surfactant',     supplier: 'Stepan',          flag: 'advisory' },
    { inci: 'Cocamidopropyl Betaine',  pct: '8.00',  fn: 'Surfactant',     supplier: 'BASF',            flag: null },
    { inci: 'Zinc Pyrithione',         pct: '1.00',  fn: 'Antidandruff',   supplier: 'Arxada AG',       flag: 'restricted' },
    { inci: 'Niacinamide',             pct: '1.00',  fn: 'Active',         supplier: 'Lonza',           flag: null },
    { inci: 'Sodium Chloride',         pct: '1.00',  fn: 'Viscosity agent',supplier: 'In-house',        flag: null },
    { inci: 'Glycerin',                pct: '2.00',  fn: 'Humectant',      supplier: 'IOI Group',       flag: null },
    { inci: 'Salicylic Acid',          pct: '0.50',  fn: 'Exfoliant',      supplier: 'Clariant',        flag: 'restricted' },
    { inci: 'Panthenol',               pct: '0.50',  fn: 'Conditioner',    supplier: 'DSM',             flag: null },
    { inci: 'Piroctone Olamine',       pct: '0.50',  fn: 'Antidandruff',   supplier: 'Clariant',        flag: 'restricted' },
    { inci: 'Polyquaternium-10',       pct: '0.30',  fn: 'Film-former',    supplier: 'Lubrizol',        flag: null },
    { inci: 'Menthol',                 pct: '0.25',  fn: 'Active/Sensory', supplier: 'Sigma-Aldrich',   flag: null },
    { inci: 'Methylisothiazolinone',   pct: '0.15',  fn: 'Preservative',   supplier: 'Lonza',           flag: 'restricted' },
    { inci: 'Parfum',                  pct: '0.50',  fn: 'Fragrance',      supplier: 'Givaudan',        flag: null },
    { inci: 'Citric Acid',             pct: '0.20',  fn: 'pH Adjuster',    supplier: 'Jungbunzlauer',   flag: null },
    { inci: 'EDTA',                    pct: '0.10',  fn: 'Chelating agent',supplier: 'BASF',            flag: null },
  ],
  'v3.1': [
    { inci: 'Aqua',                    pct: '72.00', fn: 'Solvent',        supplier: 'In-house',        flag: null },
    { inci: 'Sodium Laureth Sulfate',  pct: '10.00', fn: 'Surfactant',     supplier: 'Stepan',          flag: 'advisory' },
    { inci: 'Cocamidopropyl Betaine',  pct: '8.00',  fn: 'Surfactant',     supplier: 'BASF',            flag: null },
    { inci: 'Zinc Pyrithione',         pct: '1.00',  fn: 'Antidandruff',   supplier: 'Arxada AG',       flag: 'restricted' },
    { inci: 'Niacinamide',             pct: '1.00',  fn: 'Active',         supplier: 'Lonza',           flag: null },
    { inci: 'Sodium Chloride',         pct: '1.00',  fn: 'Viscosity agent',supplier: 'In-house',        flag: null },
    { inci: 'Glycerin',                pct: '2.00',  fn: 'Humectant',      supplier: 'IOI Group',       flag: null },
    { inci: 'Salicylic Acid',          pct: '0.50',  fn: 'Exfoliant',      supplier: 'Clariant',        flag: 'restricted' },
    { inci: 'Panthenol',               pct: '0.50',  fn: 'Conditioner',    supplier: 'DSM',             flag: null },
    { inci: 'Piroctone Olamine',       pct: '0.50',  fn: 'Antidandruff',   supplier: 'Symrise',         flag: 'restricted' },
    { inci: 'Polyquaternium-10',       pct: '0.30',  fn: 'Film-former',    supplier: 'Lubrizol',        flag: null },
    { inci: 'Menthol',                 pct: '0.25',  fn: 'Active/Sensory', supplier: 'Sigma-Aldrich',   flag: null },
    { inci: 'Methylisothiazolinone',   pct: '0.15',  fn: 'Preservative',   supplier: 'Lonza',           flag: 'restricted' },
    { inci: 'Parfum',                  pct: '0.50',  fn: 'Fragrance',      supplier: 'Givaudan',        flag: null },
    { inci: 'Citric Acid',             pct: '0.20',  fn: 'pH Adjuster',    supplier: 'Jungbunzlauer',   flag: null },
    { inci: 'EDTA',                    pct: '0.10',  fn: 'Chelating agent',supplier: 'BASF',            flag: null },
  ],
  'v3.0': [
    { inci: 'Aqua',                    pct: '72.25', fn: 'Solvent',        supplier: 'In-house',        flag: null },
    { inci: 'Sodium Laureth Sulfate',  pct: '10.00', fn: 'Surfactant',     supplier: 'Stepan',          flag: 'advisory' },
    { inci: 'Cocamidopropyl Betaine',  pct: '8.00',  fn: 'Surfactant',     supplier: 'BASF',            flag: null },
    { inci: 'Zinc Pyrithione',         pct: '1.00',  fn: 'Antidandruff',   supplier: 'Arxada AG',       flag: 'restricted' },
    { inci: 'Niacinamide',             pct: '1.00',  fn: 'Active',         supplier: 'Lonza',           flag: null },
    { inci: 'Sodium Chloride',         pct: '1.00',  fn: 'Viscosity agent',supplier: 'In-house',        flag: null },
    { inci: 'Glycerin',                pct: '2.00',  fn: 'Humectant',      supplier: 'IOI Group',       flag: null },
    { inci: 'Salicylic Acid',          pct: '0.50',  fn: 'Exfoliant',      supplier: 'Clariant',        flag: 'restricted' },
    { inci: 'Panthenol',               pct: '0.50',  fn: 'Conditioner',    supplier: 'DSM',             flag: null },
    { inci: 'Piroctone Olamine',       pct: '0.50',  fn: 'Antidandruff',   supplier: 'Symrise',         flag: 'restricted' },
    { inci: 'Polyquaternium-10',       pct: '0.30',  fn: 'Film-former',    supplier: 'Lubrizol',        flag: null },
    { inci: 'Menthol',                 pct: '0.25',  fn: 'Active/Sensory', supplier: 'Sigma-Aldrich',   flag: null },
    { inci: 'Methylisothiazolinone',   pct: '0.20',  fn: 'Preservative',   supplier: 'Lonza',           flag: 'restricted' },
    { inci: 'Parfum',                  pct: '0.30',  fn: 'Fragrance',      supplier: 'Givaudan',        flag: null },
    { inci: 'Citric Acid',             pct: '0.20',  fn: 'pH Adjuster',    supplier: 'Jungbunzlauer',   flag: null },
    { inci: 'EDTA',                    pct: '0.10',  fn: 'Chelating agent',supplier: 'BASF',            flag: null },
  ],
  'v2.1': [
    { inci: 'Aqua',                    pct: '72.55', fn: 'Solvent',        supplier: 'In-house',        flag: null },
    { inci: 'Sodium Laureth Sulfate',  pct: '10.00', fn: 'Surfactant',     supplier: 'Stepan',          flag: 'advisory' },
    { inci: 'Cocamidopropyl Betaine',  pct: '8.00',  fn: 'Surfactant',     supplier: 'BASF',            flag: null },
    { inci: 'Zinc Pyrithione',         pct: '1.00',  fn: 'Antidandruff',   supplier: 'Arxada AG',       flag: 'restricted' },
    { inci: 'Niacinamide',             pct: '1.00',  fn: 'Active',         supplier: 'Lonza',           flag: null },
    { inci: 'Sodium Chloride',         pct: '1.00',  fn: 'Viscosity agent',supplier: 'In-house',        flag: null },
    { inci: 'Glycerin',                pct: '2.00',  fn: 'Humectant',      supplier: 'IOI Group',       flag: null },
    { inci: 'Salicylic Acid',          pct: '0.50',  fn: 'Exfoliant',      supplier: 'Clariant',        flag: 'restricted' },
    { inci: 'Panthenol',               pct: '0.50',  fn: 'Conditioner',    supplier: 'DSM',             flag: null },
    { inci: 'Piroctone Olamine',       pct: '0.50',  fn: 'Antidandruff',   supplier: 'Symrise',         flag: 'restricted' },
    { inci: 'Polyquaternium-10',       pct: '0.30',  fn: 'Film-former',    supplier: 'Lubrizol',        flag: null },
    { inci: 'Methylisothiazolinone',   pct: '0.20',  fn: 'Preservative',   supplier: 'Lonza',           flag: 'restricted' },
    { inci: 'Parfum',                  pct: '0.30',  fn: 'Fragrance',      supplier: 'Givaudan',        flag: null },
    { inci: 'Citric Acid',             pct: '0.15',  fn: 'pH Adjuster',    supplier: 'Jungbunzlauer',   flag: null },
    { inci: 'EDTA',                    pct: '0.10',  fn: 'Chelating agent',supplier: 'BASF',            flag: null },
  ],
};

const VERSIONS = [
  { version: 'v4.0', date: '12 Feb 2026', author: 'Rory G.',     note: 'Increased Niacinamide from 1% to 1.5% for improved scalp barrier support.' },
  { version: 'v3.2', date: '04 Jan 2026', author: 'Sara M.',     note: 'Switched Piroctone Olamine supplier from Symrise to Clariant. No formulation change.' },
  { version: 'v3.1', date: '18 Nov 2025', author: 'Rory G.',     note: 'Reduced Methylisothiazolinone from 0.2% to 0.15% to meet upcoming EU limits.' },
  { version: 'v3.0', date: '01 Oct 2025', author: 'Sara M.',     note: 'Added Menthol (0.25%) for sensory cooling effect. Reformulated fragrance blend.' },
  { version: 'v2.1', date: '14 Aug 2025', author: 'Rory G.',     note: 'Minor pH adjustment. Citric Acid increased from 0.15% to 0.20%.' },
];

const FLAG_CONFIG: Record<string, { label: string; className: string; tip: string }> = {
  restricted: { label: 'Restricted', className: 'flagRestricted', tip: 'Use levels restricted in EU Cosmetics Regulation.' },
  advisory:   { label: 'Advisory',   className: 'flagAdvisory',   tip: 'Advisory guidance in certain markets. Review SDS.' },
};

const TABS = ['Ingredients', 'Version history', 'Compare versions', 'Regulatory summary'];

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

interface DiffRow {
  inci: string;
  type: DiffType;
  oldPct?: string;
  newPct?: string;
  oldSupplier?: string;
  newSupplier?: string;
  fn: string;
}

function computeDiff(oldIngredients: Ingredient[], newIngredients: Ingredient[]): DiffRow[] {
  const oldMap = new Map(oldIngredients.map(i => [i.inci, i]));
  const newMap = new Map(newIngredients.map(i => [i.inci, i]));
  const rows: DiffRow[] = [];

  for (const ing of newIngredients) {
    const old = oldMap.get(ing.inci);
    if (!old) {
      rows.push({ inci: ing.inci, type: 'added', newPct: ing.pct, newSupplier: ing.supplier, fn: ing.fn });
    } else if (old.pct !== ing.pct || old.supplier !== ing.supplier) {
      rows.push({ inci: ing.inci, type: 'modified', oldPct: old.pct, newPct: ing.pct, oldSupplier: old.supplier, newSupplier: ing.supplier, fn: ing.fn });
    } else {
      rows.push({ inci: ing.inci, type: 'unchanged', oldPct: old.pct, newPct: ing.pct, oldSupplier: old.supplier, newSupplier: ing.supplier, fn: ing.fn });
    }
  }

  for (const ing of oldIngredients) {
    if (!newMap.has(ing.inci)) {
      rows.push({ inci: ing.inci, type: 'removed', oldPct: ing.pct, oldSupplier: ing.supplier, fn: ing.fn });
    }
  }

  return rows;
}

export default function FormulationDetailPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [flagFilter, setFlagFilter] = useState<string | null>(null);
  const [compareFrom, setCompareFrom] = useState('v3.2');
  const [compareTo, setCompareTo] = useState('v4.0');

  const restricted = INGREDIENTS.filter(i => i.flag === 'restricted').length;
  const advisory   = INGREDIENTS.filter(i => i.flag === 'advisory').length;

  const displayedIngredients = flagFilter
    ? INGREDIENTS.filter(i => i.flag === flagFilter)
    : INGREDIENTS;

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Breadcrumb ── */}
        <div className={styles.breadcrumb}>
          <button onClick={() => router.push('/formulations')} className={styles.breadLink}>Formulations</button>
          <span className={styles.breadSep}>›</span>
          <span>Scalp Purify Anti-Dandruff Treatment</span>
        </div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerMeta}>
              <span className={styles.versionBadge}>v4.0</span>
              <span className={styles.statusBadge}>Active</span>
              <span className={styles.categoryTag}>Treatment</span>
            </div>
            <h1 className={styles.title}>Scalp Purify Anti-Dandruff Treatment</h1>
            <p className={styles.subtitle}>UK regulatory market · 16 ingredients · Last updated 12 Feb 2026 by Rory G.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.actionBtn} onClick={() => router.push('/samples/new')}>
              Request sample
            </button>
            <button className={styles.actionBtnSecondary}>Clone formula</button>
            <button className={styles.actionBtnSecondary}>Export</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
              {t === 'Ingredients' && restricted > 0 && (
                <span className={styles.tabBadge}>{restricted + advisory}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Ingredients ── */}
        {tab === 0 && (
          <div className={styles.tabContent}>
            <div className={styles.tableHeader}>
              <div className={styles.flagFilters}>
                <span className={styles.filterLabel}>Filter by flag:</span>
                <button className={`${styles.flagFilter} ${flagFilter === null ? styles.flagFilterActive : ''}`} onClick={() => setFlagFilter(null)}>
                  All ({INGREDIENTS.length})
                </button>
                <button className={`${styles.flagFilter} ${styles.flagFilterRestricted} ${flagFilter === 'restricted' ? styles.flagFilterActive : ''}`} onClick={() => setFlagFilter(flagFilter === 'restricted' ? null : 'restricted')}>
                  ⚠ Restricted ({restricted})
                </button>
                <button className={`${styles.flagFilter} ${styles.flagFilterAdvisory} ${flagFilter === 'advisory' ? styles.flagFilterActive : ''}`} onClick={() => setFlagFilter(flagFilter === 'advisory' ? null : 'advisory')}>
                  ℹ Advisory ({advisory})
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>INCI Name</th>
                    <th>%</th>
                    <th>Function</th>
                    <th>Supplier</th>
                    <th>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedIngredients.map((ing, i) => (
                    <tr key={ing.inci} className={ing.flag ? styles.rowFlagged : ''}>
                      <td className={styles.tdNum}>{INGREDIENTS.indexOf(ing) + 1}</td>
                      <td className={styles.tdInci}>{ing.inci}</td>
                      <td className={styles.tdPct}>{ing.pct}%</td>
                      <td className={styles.tdFn}>{ing.fn}</td>
                      <td className={styles.tdSupplier}>{ing.supplier}</td>
                      <td>
                        {ing.flag ? (
                          <span className={`${styles.flagBadge} ${styles[FLAG_CONFIG[ing.flag].className]}`} title={FLAG_CONFIG[ing.flag].tip}>
                            {FLAG_CONFIG[ing.flag].label}
                          </span>
                        ) : (
                          <span className={styles.flagNone}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Version history ── */}
        {tab === 1 && (
          <div className={styles.tabContent}>
            <div className={styles.timeline}>
              {VERSIONS.map((v, i) => (
                <div key={v.version} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  {i < VERSIONS.length - 1 && <div className={styles.timelineLine} />}
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineMeta}>
                      <span className={styles.timelineVersion}>{v.version}</span>
                      <span className={styles.timelineDate}>{v.date} · {v.author}</span>
                      {i === 0 && <span className={styles.currentBadge}>Current</span>}
                    </div>
                    <p className={styles.timelineNote}>{v.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Compare versions ── */}
        {tab === 2 && (
          <div className={styles.tabContent}>
            <div className={styles.compareHeader}>
              <div className={styles.compareSelectors}>
                <div className={styles.compareGroup}>
                  <label className={styles.compareLabel}>Base version</label>
                  <select className={styles.compareSelect} value={compareFrom} onChange={e => setCompareFrom(e.target.value)}>
                    {VERSIONS.map(v => <option key={v.version} value={v.version}>{v.version} — {v.date}</option>)}
                  </select>
                </div>
                <span className={styles.compareArrow} aria-hidden="true">→</span>
                <div className={styles.compareGroup}>
                  <label className={styles.compareLabel}>Compare to</label>
                  <select className={styles.compareSelect} value={compareTo} onChange={e => setCompareTo(e.target.value)}>
                    {VERSIONS.map(v => <option key={v.version} value={v.version}>{v.version} — {v.date}</option>)}
                  </select>
                </div>
              </div>
              {compareFrom === compareTo && (
                <p className={styles.compareSameWarning}>Select two different versions to see changes.</p>
              )}
            </div>

            {compareFrom !== compareTo && (() => {
              const diff = computeDiff(
                VERSION_INGREDIENTS[compareFrom] || [],
                VERSION_INGREDIENTS[compareTo] || []
              );
              const added = diff.filter(d => d.type === 'added').length;
              const removed = diff.filter(d => d.type === 'removed').length;
              const modified = diff.filter(d => d.type === 'modified').length;

              return (
                <>
                  <div className={styles.diffSummary}>
                    {added > 0 && <span className={styles.diffCountAdded} aria-label={`${added} ingredients added`}>+ {added} added</span>}
                    {removed > 0 && <span className={styles.diffCountRemoved} aria-label={`${removed} ingredients removed`}>- {removed} removed</span>}
                    {modified > 0 && <span className={styles.diffCountModified} aria-label={`${modified} ingredients modified`}>~ {modified} modified</span>}
                    {added === 0 && removed === 0 && modified === 0 && <span className={styles.diffCountNone}>No changes between these versions</span>}
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Change</th>
                          <th>INCI Name</th>
                          <th>% ({compareFrom})</th>
                          <th>% ({compareTo})</th>
                          <th>Function</th>
                          <th>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diff.filter(d => d.type !== 'unchanged').map(d => (
                          <tr key={d.inci} className={styles[`diffRow${d.type.charAt(0).toUpperCase() + d.type.slice(1)}`]}>
                            <td>
                              <span className={`${styles.diffBadge} ${styles[`diffBadge${d.type.charAt(0).toUpperCase() + d.type.slice(1)}`]}`} aria-label={d.type}>
                                {d.type === 'added' && '+ Added'}
                                {d.type === 'removed' && '- Removed'}
                                {d.type === 'modified' && '~ Modified'}
                              </span>
                            </td>
                            <td className={styles.tdInci}>{d.inci}</td>
                            <td className={styles.tdPct}>{d.oldPct ? `${d.oldPct}%` : '—'}</td>
                            <td className={styles.tdPct}>{d.newPct ? `${d.newPct}%` : '—'}</td>
                            <td className={styles.tdFn}>{d.fn}</td>
                            <td className={styles.tdSupplier}>
                              {d.type === 'modified' && d.oldSupplier !== d.newSupplier
                                ? <>{d.oldSupplier} → {d.newSupplier}</>
                                : d.newSupplier || d.oldSupplier || '—'
                              }
                            </td>
                          </tr>
                        ))}
                        {diff.filter(d => d.type === 'unchanged').length > 0 && (
                          <tr className={styles.diffUnchangedSeparator}>
                            <td colSpan={6}>{diff.filter(d => d.type === 'unchanged').length} unchanged ingredients</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── Tab: Regulatory summary ── */}
        {tab === 3 && (
          <div className={styles.tabContent}>
            <div className={styles.regGrid}>
              <RegCard
                market="🇬🇧 United Kingdom"
                status="Review required"
                statusClass="statusWarning"
                flags={[
                  'Zinc Pyrithione — restricted per UK Cosmetics Reg. Schedule 3',
                  'Salicylic Acid — max 0.5% leave-on; rinse-off OK at current level',
                  'Methylisothiazolinone — at EU limit (0.15%); UK limit equivalent',
                ]}
              />
              <RegCard
                market="🇪🇺 European Union"
                status="Review required"
                statusClass="statusWarning"
                flags={[
                  'Zinc Pyrithione — listed in Annex III, restricted concentration',
                  'Salicylic Acid — Annex III restriction applies to leave-on only',
                  'Methylisothiazolinone — at maximum permitted level (0.15%)',
                ]}
              />
              <RegCard
                market="🇺🇸 United States"
                status="Compliant"
                statusClass="statusOk"
                flags={[]}
              />
            </div>
            <p className={styles.regDisclaimer}>
              Regulatory flags are indicative only. Always verify with a qualified regulatory affairs professional before market submission.
            </p>
          </div>
        )}

      </div>
    </PlatformLayout>
  );
}

function RegCard({ market, status, statusClass, flags }: {
  market: string; status: string; statusClass: string; flags: string[];
}) {
  return (
    <div className={styles.regCard}>
      <div className={styles.regCardHeader}>
        <span className={styles.regMarket}>{market}</span>
        <span className={`${styles.regStatus} ${styles[statusClass]}`}>{status}</span>
      </div>
      {flags.length === 0 ? (
        <p className={styles.regOk}>No flagged ingredients for this market.</p>
      ) : (
        <ul className={styles.regFlags}>
          {flags.map(f => <li key={f}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}
