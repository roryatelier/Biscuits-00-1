'use client';

import { useState, useEffect } from 'react';
import { getFullComplianceAssessment } from '@/lib/actions/compliance';
import type { ComplianceAssessmentRow, ComplianceScore } from '@/types/supplier-database';
import styles from './Shortlisting.module.css';

type SupplierOption = {
  id: string;
  companyName: string;
  qualificationStage: string;
  factoryCountry: string | null;
};

const SECTION_ORDER = [
  'Status & Context',
  'Certifications',
  'Commercial Agreements',
  'Social Audit Detail',
  'SDS Compliance',
  'Product-Brief Match',
  'Contact & Commercial',
];

const TIER_ICON: Record<ComplianceAssessmentRow['tier'], string> = {
  compliant: '\u2705',    // green checkmark
  gap: '\uD83D\uDD34',   // red dot
  blocker: '\u274C',      // red X
  not_assessed: '\u2014', // em dash
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

export default function ShortlistingClient({ suppliers }: { suppliers: SupplierOption[] }) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [rows, setRows] = useState<ComplianceAssessmentRow[]>([]);
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [supplierName, setSupplierName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setRows([]);
      setScore(null);
      setSupplierName('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getFullComplianceAssessment(selectedId).then(result => {
      if (cancelled) return;
      if (!result || (typeof result === 'object' && 'error' in result)) {
        setError((result as { error: string })?.error || 'Failed to load compliance data');
        setRows([]);
        setScore(null);
        setSupplierName('');
      } else {
        const data = result as {
          rows: ComplianceAssessmentRow[];
          score: ComplianceScore;
          supplierName: string;
        };
        setRows(data.rows);
        setScore(data.score);
        setSupplierName(data.supplierName);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedId]);

  const grouped = groupBySection(rows);

  const breadcrumb = (
    <div className={styles.breadcrumb}>
      <a href="/suppliers" className={styles.breadcrumbLink}>Supplier Intelligence</a>
      <span className={styles.breadcrumbSep}>/</span>
      <span className={styles.breadcrumbCurrent}>Brief Shortlisting</span>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {breadcrumb}
        <h1 className={styles.pageTitle}>Brief Shortlisting</h1>
        <p className={styles.pageSubtitle}>Single-supplier compliance audit document</p>
      </div>

      {/* Supplier selector */}
      <div className={styles.selectorRow}>
        <label className={styles.selectorLabel} htmlFor="supplier-select">
          Supplier
        </label>
        <select
          id="supplier-select"
          className={styles.selectorDropdown}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">Select a supplier...</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.companyName}
              {s.factoryCountry ? ` (${s.factoryCountry})` : ''}
              {' — '}
              {s.qualificationStage}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && <div className={styles.loading}>Loading compliance assessment...</div>}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Empty state */}
      {!selectedId && !loading && (
        <div className={styles.emptyState}>
          Select a supplier above to generate their compliance audit document.
        </div>
      )}

      {/* Assessment content */}
      {selectedId && !loading && !error && rows.length > 0 && (
        <>
          {/* Supplier name */}
          <div className={styles.supplierNameBar}>{supplierName}</div>

          {/* Score summary — compact single line */}
          {score && (
            <div className={styles.scoreSummary}>
              <div className={styles.scoreItem}>
                <span className={styles.scoreItemLabel}>Overall</span>
                <span className={`${styles.scoreItemValue} ${scoreColorClass(score.overall)}`}>
                  {score.overall !== null ? `${score.overall}%` : 'N/A'}
                </span>
              </div>
              <div className={styles.scoreItem}>
                <span className={styles.scoreItemLabel}>Must-have</span>
                <span className={`${styles.scoreItemValue} ${scoreColorClass(score.mustHave)}`}>
                  {score.mustHave !== null ? `${score.mustHave}%` : 'N/A'}
                </span>
              </div>
              {score.blockers.length > 0 && (
                <div className={styles.blockerPill}>
                  {score.blockers.length} blocker{score.blockers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Audit table */}
          <div className={styles.tableContainer}>
            <table className={styles.auditTable}>
              <thead>
                <tr>
                  <th className={styles.colRequirement}>Requirement</th>
                  <th className={styles.colStatus}>Status</th>
                  <th className={styles.colEvidence}>Validation / Evidence</th>
                </tr>
              </thead>
              <tbody>
                {SECTION_ORDER.map(section => {
                  const sectionRows = grouped.get(section) || [];
                  if (sectionRows.length === 0) return null;
                  return [
                    <tr key={`section-${section}`} className={styles.sectionRow}>
                      <td colSpan={3}>{section}</td>
                    </tr>,
                    ...sectionRows.map((row, idx) => (
                      <tr key={`${section}-${idx}`} className={styles.dataRow}>
                        <td>
                          <span className={styles.requirementText}>{row.requirement}</span>
                        </td>
                        <td>
                          <span className={`${styles.statusCell} ${TIER_STYLE[row.tier]}`}>
                            {TIER_ICON[row.tier]} {row.statusLabel}
                          </span>
                        </td>
                        <td>
                          <span className={styles.evidenceText}>{row.evidenceText}</span>
                        </td>
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
