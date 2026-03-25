'use client';

import { useState, useEffect } from 'react';
import { getComplianceAssessment } from '@/lib/actions/compliance';
import type { ComplianceAssessmentRow, ComplianceScore } from '@/types/supplier-database';
import styles from './ComplianceAssessment.module.css';

const TIER_ICON: Record<ComplianceAssessmentRow['tier'], string> = {
  compliant: '\u2713',
  gap: '\u2013',
  blocker: '\u2717',
  not_assessed: '\u2013',
};

const TIER_STYLE: Record<ComplianceAssessmentRow['tier'], string> = {
  compliant: styles.statusCompliant,
  gap: styles.statusGap,
  blocker: styles.statusBlocker,
  not_assessed: styles.statusNotAssessed,
};

function scoreColorClass(score: number | null): string {
  if (score === null) return styles.scoreGrey;
  if (score > 70) return styles.scoreGreen;
  if (score >= 40) return styles.scoreAmber;
  return styles.scoreRed;
}

function ScoreCard({ score }: { score: ComplianceScore }) {
  return (
    <div className={styles.scoreCard}>
      <div className={styles.overallScore}>
        <span className={`${styles.overallNumber} ${scoreColorClass(score.overall)}`}>
          {score.overall !== null ? score.overall : '--'}
        </span>
        <span className={styles.overallLabel}>Overall</span>
      </div>
      <div className={styles.scoreDetails}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Must-have</span>
          <span className={`${styles.scoreValue} ${scoreColorClass(score.mustHave)}`}>
            {score.mustHave !== null ? `${score.mustHave}%` : 'N/A'}
          </span>
        </div>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>Nice-to-have</span>
          <span className={`${styles.scoreValue} ${scoreColorClass(score.niceToHave)}`}>
            {score.niceToHave !== null ? `${score.niceToHave}%` : 'N/A'}
          </span>
        </div>
        {score.blockers.length > 0 && (
          <div className={styles.blockerSummary}>
            <span className={styles.blockerCount}>
              {score.blockers.length} blocker{score.blockers.length !== 1 ? 's' : ''}
            </span>
            <div className={styles.blockerList}>
              {score.blockers.map((b, i) => (
                <span key={i} className={styles.blockerItem}>
                  {b.requirement}: {b.statusLabel}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SECTION_ORDER = ['Status & Context', 'Certifications', 'Commercial Agreements'];

function groupBySection(rows: ComplianceAssessmentRow[]): Map<string, ComplianceAssessmentRow[]> {
  const map = new Map<string, ComplianceAssessmentRow[]>();
  for (const section of SECTION_ORDER) {
    map.set(section, []);
  }
  for (const row of rows) {
    const arr = map.get(row.section);
    if (arr) {
      arr.push(row);
    } else {
      map.set(row.section, [row]);
    }
  }
  return map;
}

export default function ComplianceAssessment({ supplierId }: { supplierId: string }) {
  const [rows, setRows] = useState<ComplianceAssessmentRow[]>([]);
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getComplianceAssessment(supplierId).then(result => {
      if (cancelled) return;
      if (!result || (typeof result === 'object' && 'error' in result)) {
        setError((result as { error: string })?.error || 'Failed to load compliance data');
      } else {
        const data = result as { rows: ComplianceAssessmentRow[]; score: ComplianceScore; supplierName: string };
        setRows(data.rows);
        setScore(data.score);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [supplierId]);

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return <div className={styles.loading}>Loading compliance assessment...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const grouped = groupBySection(rows);

  return (
    <div>
      {score && <ScoreCard score={score} />}

      {SECTION_ORDER.map(section => {
        const sectionRows = grouped.get(section) || [];
        if (sectionRows.length === 0) return null;
        const isCollapsed = !!collapsed[section];

        return (
          <div key={section}>
            <div
              className={`${styles.sectionHeader} ${isCollapsed ? styles.sectionHeaderCollapsed : ''}`}
              onClick={() => toggleSection(section)}
            >
              <span className={`${styles.sectionChevron} ${!isCollapsed ? styles.sectionChevronOpen : ''}`}>
                &#9654;
              </span>
              <span className={styles.sectionTitle}>{section}</span>
            </div>

            {!isCollapsed && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th} style={{ width: '35%' }}>Requirement</th>
                      <th className={styles.th} style={{ width: '25%' }}>Status</th>
                      <th className={styles.th} style={{ width: '40%' }}>Evidence / Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionRows.map((row, idx) => (
                      <tr key={idx} className={styles.tableRow}>
                        <td className={styles.td}>
                          <div className={styles.requirementCell}>
                            <span className={row.priority === 'must_have' ? styles.requirementTextMust : styles.requirementText}>
                              {row.requirement}
                            </span>
                            {row.priority === 'must_have' && (
                              <span className={styles.mustBadge}>M</span>
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusPill} ${TIER_STYLE[row.tier]}`}>
                            <span>{TIER_ICON[row.tier]}</span>
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.evidenceText}>{row.evidenceText}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
