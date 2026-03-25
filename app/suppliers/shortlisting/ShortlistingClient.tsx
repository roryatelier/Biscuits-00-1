'use client';

import { useState, useEffect } from 'react';
import { getSupplierBrief } from '@/lib/actions/supplier-briefs';
import { getFullComplianceAssessment } from '@/lib/actions/compliance';
import type { ComplianceAssessmentRow, ComplianceScore } from '@/types/supplier-database';
import styles from './Shortlisting.module.css';

type BriefOption = {
  id: string;
  name: string;
  customerName: string | null;
  category: string;
  dueDate: string | null;
};

type AssignmentData = {
  id: string;
  aosSupplierId: string;
  matchScore: number | null;
  status: string;
  aosSupplier: {
    id: string;
    companyName: string;
  };
};

type BriefData = {
  id: string;
  name: string;
  customerName: string | null;
  category: string;
  subcategory: string | null;
  dueDate: Date | string | null;
  requiredCerts: string[];
  assignments: AssignmentData[];
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

function isRequiredCert(ruleKey: string | null, requiredCerts: string[]): boolean {
  if (!ruleKey || requiredCerts.length === 0) return false;
  const normalised = ruleKey.toLowerCase();
  return requiredCerts.some(cert => cert.toLowerCase() === normalised);
}

export default function ShortlistingClient({ briefs }: { briefs: BriefOption[] }) {
  const [selectedBriefId, setSelectedBriefId] = useState<string>('');
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [complianceRows, setComplianceRows] = useState<ComplianceAssessmentRow[]>([]);
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [supplierName, setSupplierName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When brief changes -> fetch brief data -> auto-select first supplier
  useEffect(() => {
    if (!selectedBriefId) {
      setBriefData(null);
      setSelectedSupplierId('');
      setComplianceRows([]);
      setScore(null);
      setSupplierName('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSupplierBrief(selectedBriefId).then(result => {
      if (cancelled) return;
      if (!result || (typeof result === 'object' && 'error' in result)) {
        setError((result as { error: string })?.error || 'Failed to load brief data');
        setBriefData(null);
        setSelectedSupplierId('');
        setLoading(false);
        return;
      }

      const data = result as unknown as BriefData;
      setBriefData(data);

      // Auto-select first supplier (sorted by matchScore desc from server)
      const assignments = data.assignments || [];
      if (assignments.length > 0) {
        setSelectedSupplierId(assignments[0].aosSupplierId);
      } else {
        setSelectedSupplierId('');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [selectedBriefId]);

  // When supplier tab changes -> fetch compliance assessment
  useEffect(() => {
    if (!selectedSupplierId) {
      setComplianceRows([]);
      setScore(null);
      setSupplierName('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getFullComplianceAssessment(selectedSupplierId).then(result => {
      if (cancelled) return;
      if (!result || (typeof result === 'object' && 'error' in result)) {
        setError((result as { error: string })?.error || 'Failed to load compliance data');
        setComplianceRows([]);
        setScore(null);
        setSupplierName('');
      } else {
        const data = result as {
          rows: ComplianceAssessmentRow[];
          score: ComplianceScore;
          supplierName: string;
        };
        setComplianceRows(data.rows);
        setScore(data.score);
        setSupplierName(data.supplierName);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedSupplierId]);

  // Filter out not_assessed rows
  const assessedRows = complianceRows.filter(r => r.tier !== 'not_assessed');
  const notAssessedCount = complianceRows.length - assessedRows.length;
  const grouped = groupBySection(assessedRows);

  const assignments = briefData?.assignments || [];
  const requiredCerts = briefData?.requiredCerts || [];

  // Format due date for display
  const formatDueDate = (d: Date | string | null): string | null => {
    if (!d) return null;
    try {
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Brief Shortlisting</h1>
      </div>

      {/* Brief selector */}
      <div className={styles.selectorRow}>
        <label className={styles.selectorLabel} htmlFor="brief-select">
          Brief
        </label>
        <select
          id="brief-select"
          className={styles.selectorDropdown}
          value={selectedBriefId}
          onChange={e => {
            setSelectedBriefId(e.target.value);
            setSelectedSupplierId('');
            setComplianceRows([]);
            setScore(null);
          }}
        >
          <option value="">Select a brief...</option>
          {briefs.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.customerName ? ` — ${b.customerName}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Brief context header */}
      {briefData && (
        <div className={styles.briefHeader}>
          <span className={styles.briefName}>{briefData.name}</span>
          {briefData.customerName && (
            <span className={styles.briefMeta}>{briefData.customerName}</span>
          )}
          <span className={styles.briefMeta}>{briefData.category}</span>
          {briefData.dueDate && (
            <span className={styles.briefMeta}>Due: {formatDueDate(briefData.dueDate)}</span>
          )}
          {requiredCerts.length > 0 && (
            <span className={styles.briefMeta}>
              Certs:
              {requiredCerts.map(cert => (
                <span key={cert} className={styles.briefCertChip}>{cert}</span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Supplier tabs */}
      {briefData && assignments.length > 0 && (
        <div className={styles.supplierTabs}>
          {assignments.map(a => (
            <button
              key={a.aosSupplierId}
              className={`${styles.supplierTab}${a.aosSupplierId === selectedSupplierId ? ` ${styles.supplierTabActive}` : ''}`}
              onClick={() => setSelectedSupplierId(a.aosSupplierId)}
            >
              {a.aosSupplier.companyName}
              {a.matchScore != null && (
                <span className={styles.supplierTabScore}>{a.matchScore}%</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && <div className={styles.loading}>Loading compliance assessment...</div>}

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Empty states */}
      {!selectedBriefId && !loading && (
        <div className={styles.emptyState}>
          Select a brief above to review supplier compliance.
        </div>
      )}

      {selectedBriefId && briefData && assignments.length === 0 && !loading && (
        <div className={styles.emptyState}>
          No suppliers assigned to this brief. Assign suppliers from the Briefs page.
        </div>
      )}

      {/* Assessment content */}
      {selectedSupplierId && !loading && !error && complianceRows.length > 0 && (
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
                        {isRequiredCert(row.ruleKey, requiredCerts) && (
                          <span className={styles.requiredTag}>Required</span>
                        )}
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
