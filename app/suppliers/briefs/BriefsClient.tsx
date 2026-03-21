'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { getSupplierBrief, createSupplierBrief } from '@/lib/actions/supplier-briefs';
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

type AssignedSupplier = {
  id: string;
  matchScore: number | null;
  aosSupplier: {
    id: string;
    companyName: string;
    qualificationStage: string;
    categories: string[];
    factoryCountry: string | null;
    certifications: { certType: string; verificationStatus: string; expiryDate: string | null }[];
    agreements: { agreementType: string; status: string }[];
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
        setBriefDetail({
          id: data.id,
          name: data.name,
          customerName: data.customerName,
          category: data.category,
          requiredCerts: (data.requiredCerts as string[]) || [],
          assignments: data.assignments.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            matchScore: a.matchScore as number | null,
            aosSupplier: a.aosSupplier as AssignedSupplier['aosSupplier'],
          })),
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
                  <div className={styles.compareTableWrapper}>
                    <table className={styles.compareTable}>
                      <thead>
                        <tr>
                          <th className={styles.compareAttrHeader}>Attribute</th>
                          {briefDetail.assignments.map(a => (
                            <th key={a.id} className={styles.compareSupplierHeader}>
                              <button
                                className={styles.compareSupplierLink}
                                onClick={() => router.push(`/suppliers/${a.aosSupplier.id}`)}
                              >
                                {a.aosSupplier.companyName}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={styles.compareAttrLabel}>Stage</td>
                          {briefDetail.assignments.map(a => (
                            <td key={a.id} className={styles.compareCell}>{a.aosSupplier.qualificationStage}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className={styles.compareAttrLabel}>Country</td>
                          {briefDetail.assignments.map(a => (
                            <td key={a.id} className={styles.compareCell}>{a.aosSupplier.factoryCountry || '--'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className={styles.compareAttrLabel}>Categories</td>
                          {briefDetail.assignments.map(a => (
                            <td key={a.id} className={styles.compareCell}>{a.aosSupplier.categories.join(', ') || '--'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className={styles.compareAttrLabel}>Certifications</td>
                          {briefDetail.assignments.map(a => (
                            <td key={a.id} className={styles.compareCell}>
                              {a.aosSupplier.certifications.length > 0
                                ? a.aosSupplier.certifications.map(c => c.certType).join(', ')
                                : '--'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className={styles.compareAttrLabel}>Agreements</td>
                          {briefDetail.assignments.map(a => {
                            const signed = a.aosSupplier.agreements.filter(ag => ag.status === 'signed').map(ag => ag.agreementType);
                            return (
                              <td key={a.id} className={styles.compareCell}>
                                {signed.length > 0 ? signed.join(', ') : '--'}
                              </td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className={styles.compareAttrLabel}>Match Score</td>
                          {briefDetail.assignments.map(a => (
                            <td key={a.id} className={styles.compareCell}>
                              {a.matchScore != null ? `${a.matchScore}%` : 'N/A'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
