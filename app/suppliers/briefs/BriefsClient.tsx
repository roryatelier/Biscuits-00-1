'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { getSupplierBrief, createSupplierBrief } from '@/lib/actions/supplier-briefs';
import {
  STAGE_COLORS,
  CAPABILITY_LABELS,
  CAPABILITY_BADGE_STYLES,
  PERMISSION_LABELS,
  PERMISSION_COLORS,
} from '@/lib/constants/suppliers';
import type { CapabilityType, PermissionLevel } from '@/lib/constants/suppliers';
import { computePermissionLevel } from '@/lib/suppliers/permission-logic';
import styles from './Briefs.module.css';

type Brief = {
  id: string;
  name: string;
  customerName: string | null;
  category: string;
  subcategory: string | null;
  blendFillType: string | null;
  dueDate: string | null;
  requiredCerts: string[];
  assignmentCount: number;
  createdAt: string;
};

type CertInfo = { certType: string; verificationStatus: string; expiryDate: string | null };
type AgreementInfo = { agreementType: string; status: string };

type AssignedSupplier = {
  id: string;
  matchScore: number | null;
  aosSupplier: {
    id: string;
    companyName: string;
    qualificationStage: string;
    capabilityType: string;
    categories: string[];
    factoryCountry: string | null;
    keyBrands: string[];
    certifications: CertInfo[];
    agreements: AgreementInfo[];
    cobaltSupplier: { id: string; matchedProducts: { brand?: string }[] } | null;
  };
};

type BriefDetail = {
  id: string;
  name: string;
  customerName: string | null;
  category: string;
  requiredCerts: string[];
  assignments: AssignedSupplier[];
};

const CATEGORY_OPTIONS = ['General', 'Skincare', 'Colour Cosmetics', 'Bodycare', 'Haircare'];

function CreateBriefModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createSupplierBrief({
        name: name.trim(),
        category,
        customerName: customerName.trim() || undefined,
      });
      if (result && 'error' in result) {
        setError(result.error as string);
        setIsSubmitting(false);
      } else {
        onCreated();
      }
    } catch {
      setError('Failed to create brief');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>New Brief</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Name *</label>
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Q3 Skincare Launch"
              autoFocus
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Category</label>
            <select
              className={styles.formSelect}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Customer Name</label>
            <input
              type="text"
              className={styles.formInput}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Brief'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Cert status helpers ────────────────────────────────────

function getCertStatus(certs: CertInfo[], certType: string): 'verified' | 'unverified' | 'expired' | 'none' {
  const cert = certs.find(c => c.certType === certType);
  if (!cert) return 'none';
  if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) return 'expired';
  if (cert.verificationStatus === 'verified') return 'verified';
  return 'unverified';
}

function CertStatusIcon({ status }: { status: 'verified' | 'unverified' | 'expired' | 'none' }) {
  switch (status) {
    case 'verified':
      return <span className={styles.certVerified} title="Verified">&#10003;</span>;
    case 'unverified':
      return <span className={styles.certUnverified} title="Unverified">&#9675;</span>;
    case 'expired':
      return <span className={styles.certExpired} title="Expired">&#10007;</span>;
    case 'none':
      return <span className={styles.certNone} title="Not held">&mdash;</span>;
  }
}

function AgreementStatus({ agreements, type }: { agreements: AgreementInfo[]; type: string }) {
  const ag = agreements.find(a => a.agreementType === type);
  if (!ag) return <span className={styles.agreementNone}>Not started</span>;
  if (ag.status === 'signed') return <span className={styles.agreementSigned}>Signed</span>;
  if (ag.status === 'sent') return <span className={styles.agreementSent}>Sent</span>;
  return <span className={styles.agreementNone}>Not started</span>;
}

// ─── Comparison Table ───────────────────────────────────────

function ComparisonTable({
  assignments,
  onSupplierClick,
}: {
  assignments: AssignedSupplier[];
  onSupplierClick: (id: string) => void;
}) {
  // Collect all cert types present across all suppliers, plus the CERT_TYPES constant list
  const allCertTypes = new Set<string>();
  for (const a of assignments) {
    for (const c of a.aosSupplier.certifications) {
      allCertTypes.add(c.certType);
    }
  }
  // Show CERT_TYPES that are either held by at least one supplier, or always show the common ones
  const commonCerts = ['GMP', 'ISO_9001', 'ISO_22716', 'FDA', 'TGA', 'organic', 'vegan'];
  const certTypesToShow = [...new Set([...commonCerts, ...allCertTypes])];

  return (
    <div className={styles.compareTableWrapper}>
      <table className={styles.compareTable}>
        <thead>
          <tr>
            <th className={`${styles.compareAttrHeader} ${styles.compareStickyCol}`}>Attribute</th>
            {assignments.map(a => (
              <th key={a.id} className={styles.compareSupplierHeader}>
                <button
                  className={styles.compareSupplierLink}
                  onClick={() => onSupplierClick(a.aosSupplier.id)}
                >
                  {a.aosSupplier.companyName}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 1. Stage */}
          <tr className={styles.compareRowAlt}>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Stage</td>
            {assignments.map(a => {
              const stage = a.aosSupplier.qualificationStage;
              const color = STAGE_COLORS[stage] || '#94a3b8';
              return (
                <td key={a.id} className={styles.compareCell}>
                  <span
                    className={styles.stageBadge}
                    style={{ background: `${color}18`, color, borderColor: `${color}40` }}
                  >
                    {stage}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* 2. Capability Type */}
          <tr>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Capability Type</td>
            {assignments.map(a => {
              const cap = (a.aosSupplier.capabilityType || 'unknown') as CapabilityType;
              const label = CAPABILITY_LABELS[cap] || 'Unknown';
              const badgeStyle = CAPABILITY_BADGE_STYLES[cap] || CAPABILITY_BADGE_STYLES.unknown;
              return (
                <td key={a.id} className={styles.compareCell}>
                  <span
                    className={styles.capBadge}
                    style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                  >
                    {label}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* 3. Country */}
          <tr className={styles.compareRowAlt}>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Country</td>
            {assignments.map(a => (
              <td key={a.id} className={styles.compareCell}>
                {a.aosSupplier.factoryCountry || <span className={styles.emptyVal}>&mdash;</span>}
              </td>
            ))}
          </tr>

          {/* 4. Categories */}
          <tr>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Categories</td>
            {assignments.map(a => (
              <td key={a.id} className={styles.compareCell}>
                {a.aosSupplier.categories.length > 0
                  ? a.aosSupplier.categories.join(', ')
                  : <span className={styles.emptyVal}>&mdash;</span>}
              </td>
            ))}
          </tr>

          {/* 5. Certifications — one sub-row per cert type */}
          <tr className={styles.compareRowAlt}>
            <td
              className={`${styles.compareAttrLabel} ${styles.compareStickyCol} ${styles.compareSectionLabel}`}
              colSpan={1}
            >
              Certifications
            </td>
            {assignments.map(a => (
              <td key={a.id} className={`${styles.compareCell} ${styles.compareSectionLabel}`}>&nbsp;</td>
            ))}
          </tr>
          {certTypesToShow.map((certType, idx) => (
            <tr key={certType} className={idx % 2 === 0 ? styles.compareRowAlt : undefined}>
              <td className={`${styles.compareCertLabel} ${styles.compareStickyCol}`}>{certType}</td>
              {assignments.map(a => {
                const status = getCertStatus(a.aosSupplier.certifications, certType);
                return (
                  <td key={a.id} className={styles.compareCell}>
                    <CertStatusIcon status={status} />
                  </td>
                );
              })}
            </tr>
          ))}

          {/* 6. Agreements */}
          <tr className={styles.compareRowAlt}>
            <td
              className={`${styles.compareAttrLabel} ${styles.compareStickyCol} ${styles.compareSectionLabel}`}
            >
              Agreements
            </td>
            {assignments.map(a => (
              <td key={a.id} className={`${styles.compareCell} ${styles.compareSectionLabel}`}>&nbsp;</td>
            ))}
          </tr>
          <tr>
            <td className={`${styles.compareCertLabel} ${styles.compareStickyCol}`}>NDA</td>
            {assignments.map(a => (
              <td key={a.id} className={styles.compareCell}>
                <AgreementStatus agreements={a.aosSupplier.agreements} type="NDA" />
              </td>
            ))}
          </tr>
          <tr className={styles.compareRowAlt}>
            <td className={`${styles.compareCertLabel} ${styles.compareStickyCol}`}>MSA</td>
            {assignments.map(a => (
              <td key={a.id} className={styles.compareCell}>
                <AgreementStatus agreements={a.aosSupplier.agreements} type="MSA" />
              </td>
            ))}
          </tr>

          {/* 7. Permission Level */}
          <tr>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Permission Level</td>
            {assignments.map(a => {
              const level = computePermissionLevel(a.aosSupplier.agreements, a.aosSupplier.certifications);
              const label = PERMISSION_LABELS[level];
              const color = PERMISSION_COLORS[level];
              return (
                <td key={a.id} className={styles.compareCell}>
                  <span
                    className={styles.permLevel}
                    style={{ background: `${color}18`, color, borderColor: `${color}40` }}
                  >
                    {label}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* 8. Key Brands */}
          <tr className={styles.compareRowAlt}>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Key Brands</td>
            {assignments.map(a => {
              // Merge keyBrands from AoS and Cobalt matchedProducts
              const cobaltBrands = (a.aosSupplier.cobaltSupplier?.matchedProducts || [])
                .map(p => p.brand)
                .filter((b): b is string => !!b);
              const brands = [...a.aosSupplier.keyBrands, ...cobaltBrands];
              const unique = [...new Set(brands)];
              return (
                <td key={a.id} className={styles.compareCell}>
                  {unique.length > 0
                    ? unique.join(', ')
                    : <span className={styles.emptyVal}>&mdash;</span>}
                </td>
              );
            })}
          </tr>

          {/* 9. Match Score */}
          <tr>
            <td className={`${styles.compareAttrLabel} ${styles.compareStickyCol}`}>Match Score</td>
            {assignments.map(a => (
              <td key={a.id} className={styles.compareCell}>
                {a.matchScore != null ? (
                  <span className={`${styles.scoreBadgeInline} ${
                    a.matchScore >= 80 ? styles.scoreHigh
                    : a.matchScore >= 50 ? styles.scoreMed
                    : styles.scoreLow
                  }`}>
                    {a.matchScore}%
                  </span>
                ) : (
                  <span className={styles.emptyVal}>N/A</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function BriefsClient({ briefs }: { briefs: Brief[] }) {
  const router = useRouter();
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [briefDetail, setBriefDetail] = useState<BriefDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    if (!selectedBriefId) {
      setBriefDetail(null);
      return;
    }

    setIsLoading(true);
    getSupplierBrief(selectedBriefId).then((data) => {
      if (data && !('error' in data)) {
        const d = data as Record<string, unknown>;
        const rawAssignments = (d.assignments ?? []) as Record<string, unknown>[];
        setBriefDetail({
          id: data.id,
          name: data.name,
          customerName: data.customerName,
          category: data.category,
          requiredCerts: (data.requiredCerts as string[]) || [],
          assignments: rawAssignments.map((a: Record<string, unknown>) => {
            const sup = a.aosSupplier as Record<string, unknown>;
            return {
              id: a.id as string,
              matchScore: a.matchScore as number | null,
              aosSupplier: {
                id: sup.id as string,
                companyName: sup.companyName as string,
                qualificationStage: sup.qualificationStage as string,
                capabilityType: (sup.capabilityType as string) || 'unknown',
                categories: (sup.categories as string[]) || [],
                factoryCountry: (sup.factoryCountry as string | null) ?? null,
                keyBrands: (sup.keyBrands as string[]) || [],
                certifications: (sup.certifications as CertInfo[]) || [],
                agreements: (sup.agreements as AgreementInfo[]) || [],
                cobaltSupplier: sup.cobaltSupplier as AssignedSupplier['aosSupplier']['cobaltSupplier'],
              },
            };
          }),
        });
      }
      setIsLoading(false);
    });
  }, [selectedBriefId]);

  const handleBriefCreated = () => {
    setShowCreateModal(false);
    router.refresh();
  };

  const breadcrumb = (
    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
      <a href="/suppliers" style={{ color: '#94a3b8', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#64748b')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Supplier Intelligence</a>
      <span style={{ margin: '0 6px' }}>/</span>
      <span style={{ color: '#64748b' }}>Briefs</span>
    </div>
  );

  if (briefs.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            {breadcrumb}
            <h1 className={styles.pageTitle}>Brief Shortlists</h1>
            <p className={styles.pageSubtitle}>0 briefs</p>
          </div>
          <button className={styles.newBriefBtn} onClick={() => setShowCreateModal(true)}>
            + New Brief
          </button>
        </div>
        <EmptyState
          icon="projects"
          heading="No supplier briefs yet"
          description="Create a supplier brief to start building shortlists."
        />
        {showCreateModal && (
          <CreateBriefModal onClose={() => setShowCreateModal(false)} onCreated={handleBriefCreated} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          {breadcrumb}
          <h1 className={styles.pageTitle}>Brief Shortlists</h1>
          <p className={styles.pageSubtitle}>{briefs.length} briefs</p>
        </div>
        <button className={styles.newBriefBtn} onClick={() => setShowCreateModal(true)}>
          + New Brief
        </button>
      </div>

      <div className={styles.layout}>
        {/* Brief list */}
        <div className={styles.briefList}>
          {briefs.map(b => (
            <div
              key={b.id}
              className={`${styles.briefCard} ${selectedBriefId === b.id ? styles.briefCardActive : ''}`}
              onClick={() => setSelectedBriefId(b.id === selectedBriefId ? null : b.id)}
            >
              <div className={styles.briefCardTop}>
                <p className={styles.briefName}>{b.name}</p>
                <span className={styles.assignmentCount}>{b.assignmentCount} suppliers</span>
              </div>
              {b.customerName && (
                <p className={styles.briefMeta}>Customer: {b.customerName}</p>
              )}
              <div className={styles.briefCardBottom}>
                <span className={styles.categoryChip}>{b.category}</span>
                {b.dueDate && <span className={styles.briefDate}>Due: {b.dueDate}</span>}
              </div>
              {b.requiredCerts.length > 0 && (
                <div className={styles.requiredCerts}>
                  {b.requiredCerts.map(c => (
                    <span key={c} className={styles.certChip}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className={styles.detailPanel}>
          {!selectedBriefId && (
            <div className={styles.detailEmpty}>
              <p>Select a brief to view assigned suppliers.</p>
            </div>
          )}

          {selectedBriefId && isLoading && (
            <div className={styles.detailEmpty}>
              <p>Loading...</p>
            </div>
          )}

          {briefDetail && !isLoading && (
            <div>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>{briefDetail.name}</h2>
                {briefDetail.assignments.length >= 2 && (
                  <button
                    className={`${styles.compareToggle} ${compareMode ? styles.compareToggleActive : ''}`}
                    onClick={() => setCompareMode(!compareMode)}
                  >
                    {compareMode ? 'List View' : 'Compare'}
                  </button>
                )}
              </div>
              {briefDetail.customerName && (
                <p className={styles.detailMeta}>Customer: {briefDetail.customerName}</p>
              )}
              <p className={styles.detailMeta}>Category: {briefDetail.category}</p>

              {briefDetail.requiredCerts.length > 0 && (
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Required Certifications</h3>
                  <div className={styles.requiredCerts}>
                    {briefDetail.requiredCerts.map(c => (
                      <span key={c} className={styles.certChip}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>
                  Assigned Suppliers ({briefDetail.assignments.length})
                </h3>

                {briefDetail.assignments.length === 0 ? (
                  <p className={styles.emptyText}>No suppliers assigned to this brief.</p>
                ) : compareMode ? (
                  <ComparisonTable assignments={briefDetail.assignments} onSupplierClick={(id) => router.push(`/suppliers/${id}`)} />
                ) : (
                  <div className={styles.supplierList}>
                    {briefDetail.assignments.map(a => {
                      const certCount = a.aosSupplier.certifications.length;
                      const hasNDA = a.aosSupplier.agreements.some(ag => ag.agreementType === 'NDA' && ag.status === 'signed');
                      const hasMSA = a.aosSupplier.agreements.some(ag => ag.agreementType === 'MSA' && ag.status === 'signed');

                      return (
                        <div
                          key={a.id}
                          className={styles.supplierCard}
                          onClick={() => router.push(`/suppliers/${a.aosSupplier.id}`)}
                        >
                          <div className={styles.supplierInfo}>
                            <p className={styles.supplierName}>{a.aosSupplier.companyName}</p>
                            <div className={styles.supplierMetaRow}>
                              <span className={styles.supplierMeta}>{a.aosSupplier.qualificationStage}</span>
                              {a.aosSupplier.factoryCountry && (
                                <span className={styles.supplierMeta}>{a.aosSupplier.factoryCountry}</span>
                              )}
                              {certCount > 0 && (
                                <span className={styles.certCountBadge}>{certCount} cert{certCount !== 1 ? 's' : ''}</span>
                              )}
                              {(hasNDA || hasMSA) && (
                                <span className={styles.permissionBadge}>
                                  {[hasNDA && 'NDA', hasMSA && 'MSA'].filter(Boolean).join(' + ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={styles.matchScoreCol}>
                            {a.matchScore != null ? (
                              <span className={`${styles.scoreBadge} ${a.matchScore >= 80 ? styles.scoreHigh : a.matchScore >= 50 ? styles.scoreMed : styles.scoreLow}`}>
                                {a.matchScore}%
                              </span>
                            ) : (
                              <span className={styles.scoreNA}>N/A</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateBriefModal onClose={() => setShowCreateModal(false)} onCreated={handleBriefCreated} />
      )}
    </div>
  );
}
