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

const TIER_STYLE: Record<ComplianceAssessmentRow['tier'], string> = {
  compliant: styles.statusCompliant,
  gap: styles.statusGap,
  blocker: styles.statusBlocker,
  not_assessed: styles.statusNotAssessed,
};

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

  // Filter out not_assessed rows
  const assessedRows = rows.filter(r => r.tier !== 'not_assessed');
  const notAssessedCount = rows.length - assessedRows.length;

  const grouped = groupBySection(assessedRows);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Brief Shortlisting</h1>
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
          {/* Audit table */}
          <div className={styles.tableContainer}>
            <table className={styles.auditTable}>
              <thead>
                <tr>
                  <th className={styles.colRequirement}>Requirement</th>
                  <th className={styles.colStatus}>{supplierName || 'Supplier'}</th>
                  <th className={styles.colEvidence}>Validation / Evidence</th>
                </tr>
              </thead>
              <tbody>
                {SECTION_ORDER.map(section => {
                  const sectionRows = grouped.get(section) || [];
                  if (sectionRows.length === 0) return null;
                  return sectionRows.map((row, idx) => (
                    <tr
                      key={`${section}-${idx}`}
                      className={`${styles.dataRow}${idx === 0 ? ` ${styles.sectionFirst}` : ''}`}
                    >
                      <td>
                        <span className={styles.requirementText}>{row.requirement}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusCell} ${TIER_STYLE[row.tier]}`}>
                          {row.statusLabel}
                        </span>
                      </td>
                      <td>
                        <span className={styles.evidenceText}>{row.evidenceText}</span>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>

          {/* Footnote for not-assessed rows */}
          {notAssessedCount > 0 && (
            <p className={styles.footnote}>
              {notAssessedCount} requirement{notAssessedCount !== 1 ? 's' : ''} not yet assessed
            </p>
          )}
        </>
      )}
    </div>
  );
}
