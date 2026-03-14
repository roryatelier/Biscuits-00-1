'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './FormulationDetail.module.css';

interface IngredientRow {
  inci: string;
  pct: string;
  fn: string;
  role: string;
  casNumber: string | null;
}

interface FormulationData {
  id: string;
  name: string;
  category: string | null;
  status: string;
  market: string | null;
  version: string;
  description: string | null;
  creatorName: string | null;
  updatedAt: string;
  ingredients: IngredientRow[];
}

const FLAG_CONFIG: Record<string, { label: string; className: string; tip: string }> = {
  restricted: { label: 'Restricted', className: 'flagRestricted', tip: 'Use levels restricted in EU Cosmetics Regulation.' },
  advisory:   { label: 'Advisory',   className: 'flagAdvisory',   tip: 'Advisory guidance in certain markets. Review SDS.' },
};

const TABS = ['Ingredients', 'Version history', 'Regulatory summary'];

export default function FormulationDetailClient({ formulation }: { formulation: FormulationData }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [flagFilter, setFlagFilter] = useState<string | null>(null);

  const f = formulation;

  // We don't have flag data in DB, so flags are empty for now
  const restricted = 0;
  const advisory = 0;

  const displayedIngredients = flagFilter
    ? [] // no flag data from DB
    : f.ingredients;

  const formattedDate = new Date(f.updatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={styles.page}>

      {/* -- Breadcrumb -- */}
      <div className={styles.breadcrumb}>
        <button onClick={() => router.push('/formulations')} className={styles.breadLink}>Formulations</button>
        <span className={styles.breadSep}>&rsaquo;</span>
        <span>{f.name}</span>
      </div>

      {/* -- Header -- */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerMeta}>
            <span className={styles.versionBadge}>v{f.version}</span>
            <span className={styles.statusBadge}>{f.status}</span>
            {f.category && <span className={styles.categoryTag}>{f.category}</span>}
          </div>
          <h1 className={styles.title}>{f.name}</h1>
          <p className={styles.subtitle}>
            {f.market ? `${f.market} regulatory market` : 'No market assigned'}
            {' \u00b7 '}
            {f.ingredients.length} ingredient{f.ingredients.length !== 1 ? 's' : ''}
            {f.creatorName && ` \u00b7 Last updated ${formattedDate} by ${f.creatorName}`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={() => router.push('/samples/new')}>
            Request sample
          </button>
          <button className={styles.actionBtnSecondary}>Clone formula</button>
          <button className={styles.actionBtnSecondary}>Export</button>
        </div>
      </div>

      {/* -- Tabs -- */}
      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
            {t === 'Ingredients' && (restricted + advisory) > 0 && (
              <span className={styles.tabBadge}>{restricted + advisory}</span>
            )}
          </button>
        ))}
      </div>

      {/* -- Tab: Ingredients -- */}
      {tab === 0 && (
        <div className={styles.tabContent}>
          <div className={styles.tableHeader}>
            <div className={styles.flagFilters}>
              <span className={styles.filterLabel}>Filter by flag:</span>
              <button className={`${styles.flagFilter} ${flagFilter === null ? styles.flagFilterActive : ''}`} onClick={() => setFlagFilter(null)}>
                All ({f.ingredients.length})
              </button>
              <button className={`${styles.flagFilter} ${styles.flagFilterRestricted} ${flagFilter === 'restricted' ? styles.flagFilterActive : ''}`} onClick={() => setFlagFilter(flagFilter === 'restricted' ? null : 'restricted')}>
                Restricted ({restricted})
              </button>
              <button className={`${styles.flagFilter} ${styles.flagFilterAdvisory} ${flagFilter === 'advisory' ? styles.flagFilterActive : ''}`} onClick={() => setFlagFilter(flagFilter === 'advisory' ? null : 'advisory')}>
                Advisory ({advisory})
              </button>
            </div>
          </div>

          {displayedIngredients.length === 0 ? (
            <div className={styles.tabContent}>
              <p>No ingredients found{flagFilter ? ' matching this filter' : ''}.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>INCI Name</th>
                    <th>%</th>
                    <th>Function</th>
                    <th>Role</th>
                    <th>CAS Number</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedIngredients.map((ing, i) => (
                    <tr key={ing.inci}>
                      <td className={styles.tdNum}>{i + 1}</td>
                      <td className={styles.tdInci}>{ing.inci}</td>
                      <td className={styles.tdPct}>{ing.pct}%</td>
                      <td className={styles.tdFn}>{ing.fn}</td>
                      <td className={styles.tdSupplier}>{ing.role}</td>
                      <td>
                        {ing.casNumber ? (
                          <span>{ing.casNumber}</span>
                        ) : (
                          <span className={styles.flagNone}>&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* -- Tab: Version history -- */}
      {tab === 1 && (
        <div className={styles.tabContent}>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineBody}>
                <div className={styles.timelineMeta}>
                  <span className={styles.timelineVersion}>v{f.version}</span>
                  <span className={styles.timelineDate}>
                    {formattedDate}
                    {f.creatorName && ` \u00b7 ${f.creatorName}`}
                  </span>
                  <span className={styles.currentBadge}>Current</span>
                </div>
                <p className={styles.timelineNote}>
                  {f.description || 'Current version of this formulation.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- Tab: Regulatory summary -- */}
      {tab === 2 && (
        <div className={styles.tabContent}>
          <div className={styles.regGrid}>
            <div className={styles.regCard}>
              <div className={styles.regCardHeader}>
                <span className={styles.regMarket}>{f.market ?? 'Global'}</span>
                <span className={`${styles.regStatus} ${styles.statusOk}`}>Not yet assessed</span>
              </div>
              <p className={styles.regOk}>Regulatory assessment has not been performed for this formulation yet.</p>
            </div>
          </div>
          <p className={styles.regDisclaimer}>
            Regulatory flags are indicative only. Always verify with a qualified regulatory affairs professional before market submission.
          </p>
        </div>
      )}

    </div>
  );
}
