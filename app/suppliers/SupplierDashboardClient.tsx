'use client';

import { useRouter } from 'next/navigation';
import styles from './SupplierDashboard.module.css';

const STAGE_COLORS: Record<string, string> = {
  'Identified': '#94a3b8',
  'Outreached': '#3b82f6',
  'Capability Confirmed': '#8b5cf6',
  'Conditionally Qualified': '#f59e0b',
  'Fully Qualified': '#22c55e',
  'Paused': '#94a3b8',
  'Blacklisted': '#ef4444',
};

type HeatmapRow = {
  category: string;
  counts: { country: string; count: number }[];
};

interface SupplierDashboardClientProps {
  totalSuppliers: number;
  fullyQualified: number;
  activeBriefs: number;
  conversionRate: number;
  stageCounts: Record<string, number>;
  categoryCoverage: { category: string; total: number; qualified: number }[];
  heatmapData: HeatmapRow[];
  heatmapCountries: string[];
}

export default function SupplierDashboardClient({
  totalSuppliers,
  fullyQualified,
  activeBriefs,
  conversionRate,
  stageCounts,
  categoryCoverage,
  heatmapData,
  heatmapCountries,
}: SupplierDashboardClientProps) {
  const router = useRouter();

  const maxStageCount = Math.max(...Object.values(stageCounts), 1);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Supplier Intelligence</h1>
          <p className={styles.pageSubtitle}>Overview of your supplier network</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{totalSuppliers}</p>
          <p className={styles.metricLabel}>Total suppliers</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{fullyQualified}</p>
          <p className={styles.metricLabel}>Fully qualified</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{activeBriefs}</p>
          <p className={styles.metricLabel}>Active briefs</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{conversionRate}%</p>
          <p className={styles.metricLabel}>Conversion rate</p>
        </div>
      </div>

      {/* Navigation cards */}
      <div className={styles.navCards}>
        <button className={styles.navCard} onClick={() => router.push('/suppliers/database')}>
          <span className={styles.navIcon}>&#x1F4CB;</span>
          <div>
            <p className={styles.navCardTitle}>Supplier Database</p>
            <p className={styles.navCardDesc}>All AoS & Cobalt suppliers</p>
          </div>
          <span className={styles.navArrow}>&rarr;</span>
        </button>
        <button className={styles.navCard} onClick={() => router.push('/suppliers/pipeline')}>
          <span className={styles.navIcon}>&#x1F4CA;</span>
          <div>
            <p className={styles.navCardTitle}>Pipeline Board</p>
            <p className={styles.navCardDesc}>Qualification pipeline</p>
          </div>
          <span className={styles.navArrow}>&rarr;</span>
        </button>
        <button className={styles.navCard} onClick={() => router.push('/suppliers/briefs')}>
          <span className={styles.navIcon}>&#x1F4DD;</span>
          <div>
            <p className={styles.navCardTitle}>Brief Shortlists</p>
            <p className={styles.navCardDesc}>Supplier brief assignments</p>
          </div>
          <span className={styles.navArrow}>&rarr;</span>
        </button>
      </div>

      <div className={styles.gridRow}>
        {/* Pipeline funnel */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pipeline Funnel</h2>
          <div className={styles.funnel}>
            {Object.entries(stageCounts).map(([stage, count]) => (
              <div key={stage} className={styles.funnelRow}>
                <span className={styles.funnelLabel}>{stage}</span>
                <div className={styles.funnelBarTrack}>
                  <div
                    className={styles.funnelBar}
                    style={{
                      width: `${(count / maxStageCount) * 100}%`,
                      backgroundColor: STAGE_COLORS[stage] || '#94a3b8',
                    }}
                  />
                </div>
                <span className={styles.funnelCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category coverage */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Category Coverage</h2>
          {categoryCoverage.length === 0 ? (
            <p className={styles.emptyText}>No categories yet.</p>
          ) : (
            <table className={styles.coverageTable}>
              <thead>
                <tr>
                  <th className={styles.coverageTh}>Category</th>
                  <th className={styles.coverageTh}>Total</th>
                  <th className={styles.coverageTh}>Qualified</th>
                </tr>
              </thead>
              <tbody>
                {categoryCoverage.map(row => (
                  <tr key={row.category} className={styles.coverageRow}>
                    <td className={styles.coverageTd}>{row.category}</td>
                    <td className={styles.coverageTd}>{row.total}</td>
                    <td className={styles.coverageTd}>
                      <span className={styles.qualifiedCount}>{row.qualified}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Network Coverage Heatmap */}
      <div className={styles.heatmapSection}>
        <h2 className={styles.cardTitle}>
          Network Coverage — Qualified Suppliers by Category × Region
        </h2>
        <div className={styles.heatmapWrapper}>
          <table className={styles.heatmapTable}>
            <thead>
              <tr>
                <th className={styles.heatmapTh}>Category</th>
                {heatmapCountries.map(c => (
                  <th key={c} className={styles.heatmapThCountry}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(row => (
                <tr key={row.category}>
                  <td className={styles.heatmapCategory}>{row.category}</td>
                  {row.counts.map(cell => {
                    const cellClass =
                      cell.count === 0
                        ? styles.heatmapCellRed
                        : cell.count <= 2
                          ? styles.heatmapCellAmber
                          : styles.heatmapCellGreen;
                    return (
                      <td key={cell.country} className={`${styles.heatmapCell} ${cellClass}`}>
                        {cell.count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
