'use client';

import EmptyState from '@/components/EmptyState/EmptyState';
import {
  STAGE_COLORS,
  PERMISSION_LABELS,
  PERMISSION_COLORS,
  CAPABILITY_LABELS,
  CAPABILITY_COLORS,
  CERT_TYPES,
  type PermissionLevel,
} from '@/lib/constants/suppliers';
import type { UnifiedSupplier } from '@/types/supplier-database';
import styles from './Database.module.css';

const CERT_TOOLTIPS: Record<string, string> = {
  ISO_9001: 'ISO 9001',
  ISO_14001: 'ISO 14001',
  ISO_22716: 'ISO 22716',
  GMP: 'GMP',
  FDA: 'FDA',
  FDA_OTC: 'FDA OTC',
  TGA: 'TGA',
  SMETA: 'SMETA',
  BSCI: 'BSCI',
  FSC: 'FSC',
  organic: 'Organic',
  vegan: 'Vegan',
  cruelty_free: 'Cruelty Free',
  other: 'Other',
};

/** First-letter badge for cert types — use unique abbreviations where first chars collide */
const CERT_BADGE_LETTERS: Record<string, string> = {
  ISO_9001: '9',
  ISO_14001: '1',
  ISO_22716: '2',
  GMP: 'G',
  FDA: 'F',
  FDA_OTC: 'X',
  TGA: 'T',
  SMETA: 'S',
  BSCI: 'B',
  FSC: 'C',
  organic: 'O',
  vegan: 'V',
  cruelty_free: 'R',
  other: '?',
};

const AGREEMENT_TYPES = ['NDA', 'MSA', 'IP', 'Payment'];
const AGREEMENT_TOOLTIPS: Record<string, string> = {
  NDA: 'NDA',
  MSA: 'MSA',
  IP: 'IP Agreement',
  Payment: 'Payment Terms',
};

type SupplierTableProps = {
  filtered: UnifiedSupplier[];
  selectedKey: string | null;
  permissionLevels: Record<string, PermissionLevel>;
  onRowClick: (supplier: UnifiedSupplier) => void;
  onClearFilters: () => void;
};

export default function SupplierTable({
  filtered,
  selectedKey,
  permissionLevels,
  onRowClick,
  onClearFilters,
}: SupplierTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Source</th>
            <th className={styles.th}>Stage</th>
            <th className={styles.th}>Capability</th>
            <th className={styles.th}>Permission</th>
            <th className={styles.th}>Categories</th>
            <th className={styles.th}>Certs</th>
            <th className={styles.th}>Agreements</th>
            <th className={styles.th}>Products</th>
            <th className={styles.th}>MOQ</th>
            <th className={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => {
            const certSet = new Set(
              s.certifications
                .filter(c => c.verificationStatus === 'verified')
                .map(c => c.certType)
            );
            const agreementSet = new Set(
              s.agreements
                .filter(a => a.status === 'signed')
                .map(a => a.agreementType)
            );

            const sourceBadgeClass =
              s.source === 'both' ? styles.sourceBadgeBoth
              : s.source === 'cobalt' ? styles.sourceBadgeCobalt
              : styles.sourceBadgeAos;

            const sourceLabel =
              s.source === 'both' ? 'Linked'
              : s.source === 'cobalt' ? 'Cobalt'
              : 'AoS';

            return (
              <tr
                key={s.key}
                className={`${styles.row} ${selectedKey === s.key ? styles.rowActive : ''}`}
                onClick={() => onRowClick(s)}
              >
                <td className={styles.td}>
                  <div className={styles.nameCell}>
                    <span className={styles.supplierName}>{s.companyName}</span>
                    {s.cautionFlag && (
                      <span className={styles.cautionIcon} title="Caution flag">&#x26A0;</span>
                    )}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={sourceBadgeClass}>{sourceLabel}</span>
                </td>
                <td className={styles.td}>
                  {s.qualificationStage ? (
                    <span
                      className={styles.stageBadge}
                      style={{ backgroundColor: STAGE_COLORS[s.qualificationStage] || '#94a3b8' }}
                    >
                      {s.qualificationStage}
                    </span>
                  ) : (
                    <span className={styles.cobaltOffBadge}>--</span>
                  )}
                </td>
                <td className={styles.td}>
                  <span
                    className={styles.capabilityBadge}
                    style={{ backgroundColor: CAPABILITY_COLORS[s.capabilityType] }}
                  >
                    {CAPABILITY_LABELS[s.capabilityType]}
                  </span>
                </td>
                <td className={styles.td}>
                  {s.aosId && permissionLevels[s.aosId] ? (
                    <span
                      className={styles.permissionBadge}
                      style={{ backgroundColor: PERMISSION_COLORS[permissionLevels[s.aosId]] }}
                    >
                      {PERMISSION_LABELS[permissionLevels[s.aosId]]}
                    </span>
                  ) : (
                    <span className={styles.cobaltOffBadge}>--</span>
                  )}
                </td>
                <td className={styles.td}>
                  <div className={styles.chips}>
                    {s.categories.slice(0, 2).map(c => (
                      <span key={c} className={styles.chip}>{c}</span>
                    ))}
                    {s.categories.length > 2 && (
                      <span className={styles.chipMore}>+{s.categories.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.certIcons}>
                    {CERT_TYPES.map(ct => (
                      <span
                        key={ct}
                        className={`${styles.certDot} ${certSet.has(ct) ? styles.certVerified : styles.certMissing}`}
                        title={CERT_TOOLTIPS[ct] || ct}
                      >
                        {CERT_BADGE_LETTERS[ct] || ct.charAt(0)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.certIcons}>
                    {AGREEMENT_TYPES.map(at => (
                      <span
                        key={at}
                        className={`${styles.certDot} ${agreementSet.has(at) ? styles.agreementSigned : styles.certMissing}`}
                        title={AGREEMENT_TOOLTIPS[at] || at}
                      >
                        {at.charAt(0)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>
                  {s.matchedProductsCount > 0 ? (
                    <span className={styles.countBadge}>{s.matchedProductsCount}</span>
                  ) : (
                    <span className={styles.cobaltOffBadge}>--</span>
                  )}
                </td>
                <td className={styles.td}>
                  {s.moq != null ? s.moq.toLocaleString() : '--'}
                </td>
                <td className={styles.td}>
                  <span className={styles.arrowIcon}>&rarr;</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <EmptyState
          icon="projects"
          heading="No suppliers match your filters"
          description="Try adjusting your search, stage, category, or source filters."
          ctaLabel="Clear filters"
          onCtaClick={onClearFilters}
        />
      )}
    </div>
  );
}
