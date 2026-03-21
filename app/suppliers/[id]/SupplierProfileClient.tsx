'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transitionSupplierStage, setCautionFlag } from '@/lib/actions/suppliers';
import { addCertification, updateCertification, removeCertification, updateAgreementStatus } from '@/lib/actions/certifications';
import { addManualActivity } from '@/lib/actions/supplier-activities';
import {
  STAGE_COLORS,
  PERMISSION_LABELS,
  PERMISSION_COLORS,
  CAPABILITY_LABELS,
  CAPABILITY_COLORS,
  CERT_TYPES,
  type PermissionLevel,
  type CapabilityType,
} from '@/lib/constants/suppliers';
import styles from './SupplierProfile.module.css';

const TRANSITION_MAP: Record<string, string[]> = {
  'Identified': ['Outreached', 'Paused', 'Blacklisted'],
  'Outreached': ['Capability Confirmed', 'Paused', 'Blacklisted'],
  'Capability Confirmed': ['Conditionally Qualified', 'Outreached', 'Paused', 'Blacklisted'],
  'Conditionally Qualified': ['Fully Qualified', 'Capability Confirmed', 'Paused', 'Blacklisted'],
  'Fully Qualified': ['Conditionally Qualified', 'Paused', 'Blacklisted'],
  'Paused': ['Identified', 'Outreached'],
  'Blacklisted': [],
};

const AGREEMENT_STATUSES = ['draft', 'sent', 'signed', 'expired'];

type Certification = {
  id: string;
  certType: string;
  certBody: string | null;
  scope: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  documentRef: string | null;
  verificationStatus: string;
};

type Agreement = {
  id: string;
  agreementType: string;
  status: string;
  sentAt: string | null;
  signedAt: string | null;
};

type BriefAssignment = {
  id: string;
  matchScore: number | null;
  brief: {
    id: string;
    name: string;
    customerName: string | null;
    category: string;
  };
};

type SupplierProfile = {
  id: string;
  companyName: string;
  qualificationStage: string;
  categories: string[];
  subcategories: string[];
  moq: number | null;
  keyBrands: string[];
  cautionFlag: boolean;
  cautionNote: string | null;
  cobaltEnabled: boolean;
  capabilityType: string;
  permissionLevel: PermissionLevel;
  certifications: Certification[];
  agreements: Agreement[];
  briefAssignments: BriefAssignment[];
  cobaltSupplier: {
    id: string;
    companyName: string;
    matchedProductsCount: number;
  } | null;
};

type ActivityEntry = {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, string> | null;
  userName: string;
  createdAt: string;
};

const ENTRY_TYPE_ICONS: Record<string, string> = {
  email: '\u2709',
  call: '\u260E',
  meeting: '\uD83D\uDCC5',
  note: '\uD83D\uDCDD',
};

type ActivityFilter = 'all' | 'stage_change' | 'cert' | 'agreement' | 'manual' | 'system';

const ACTIVITY_FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'stage_change', label: 'Stage Change' },
  { key: 'cert', label: 'Cert' },
  { key: 'agreement', label: 'Agreement' },
  { key: 'manual', label: 'Manual' },
  { key: 'system', label: 'System' },
];

function matchesActivityFilter(activity: ActivityEntry, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'stage_change') return activity.type === 'stage_change';
  if (filter === 'cert') return activity.type.startsWith('cert_');
  if (filter === 'agreement') return activity.type.startsWith('agreement_');
  if (filter === 'manual') return activity.type === 'manual_entry';
  if (filter === 'system') return activity.type === 'caution_flag_set' || activity.type === 'caution_flag_removed' || activity.type === 'system';
  return true;
}

type TabName = 'overview' | 'certifications' | 'agreements' | 'briefs' | 'activity';

export default function SupplierProfileClient({ supplier, activities = [] }: { supplier: SupplierProfile; activities?: ActivityEntry[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCertType, setNewCertType] = useState('');
  const [newCertBody, setNewCertBody] = useState('');
  const [newCertExpiry, setNewCertExpiry] = useState('');
  // Manual activity entry
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityEntryType, setActivityEntryType] = useState('note');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  // Activity filter
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  // Caution flag modal
  const [cautionModal, setCautionModal] = useState(false);
  const [cautionNote, setCautionNote] = useState('');

  const validTransitions = TRANSITION_MAP[supplier.qualificationStage] || [];

  const handleTransition = (toStage: string) => {
    startTransition(async () => {
      await transitionSupplierStage(supplier.id, toStage);
      router.refresh();
    });
  };

  const handleToggleCaution = () => {
    if (supplier.cautionFlag) {
      // Removing caution — no note needed
      startTransition(async () => {
        await setCautionFlag(supplier.id, false);
        router.refresh();
      });
    } else {
      // Setting caution — open modal for note
      setCautionNote('');
      setCautionModal(true);
    }
  };

  const handleCautionConfirm = () => {
    startTransition(async () => {
      await setCautionFlag(supplier.id, true, cautionNote.trim() || undefined);
      setCautionModal(false);
      setCautionNote('');
      router.refresh();
    });
  };

  const handleAddCert = () => {
    if (!newCertType) return;
    startTransition(async () => {
      await addCertification(supplier.id, {
        certType: newCertType,
        certBody: newCertBody || undefined,
        expiryDate: newCertExpiry || undefined,
      });
      setShowAddCert(false);
      setNewCertType('');
      setNewCertBody('');
      setNewCertExpiry('');
      router.refresh();
    });
  };

  const handleUpdateCertStatus = (certId: string, status: string) => {
    startTransition(async () => {
      await updateCertification(certId, { verificationStatus: status });
      router.refresh();
    });
  };

  const handleRemoveCert = (certId: string) => {
    if (!confirm('Remove this certification?')) return;
    startTransition(async () => {
      await removeCertification(certId);
      router.refresh();
    });
  };

  const handleUpdateAgreement = (agreementId: string, status: string) => {
    startTransition(async () => {
      await updateAgreementStatus(agreementId, status);
      router.refresh();
    });
  };

  const tabs: { key: TabName; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'certifications', label: `Certifications (${supplier.certifications.length})` },
    { key: 'agreements', label: `Agreements (${supplier.agreements.length})` },
    { key: 'briefs', label: `Briefs (${supplier.briefAssignments.length})` },
    { key: 'activity', label: `Activity (${activities.length})` },
  ];

  return (
    <div className={styles.page}>
      {/* Caution banner */}
      {supplier.cautionFlag && (
        <div className={styles.cautionBanner}>
          <span className={styles.cautionBannerIcon}>&#x26A0;</span>
          <span>Caution flag is set{supplier.cautionNote ? `: ${supplier.cautionNote}` : ''}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            <a href="/suppliers" style={{ color: '#94a3b8', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#64748b')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Supplier Intelligence</a>
            <span style={{ margin: '0 6px' }}>/</span>
            <span style={{ color: '#64748b' }}>{supplier.companyName}</span>
          </div>
          <button className={styles.backBtn} onClick={() => router.back()}>&larr; Back</button>
          <h1 className={styles.pageTitle}>{supplier.companyName}</h1>
          <div className={styles.badges}>
            <span
              className={styles.stageBadge}
              style={{ backgroundColor: STAGE_COLORS[supplier.qualificationStage] || '#94a3b8' }}
            >
              {supplier.qualificationStage}
            </span>
            <span
              className={styles.permissionBadge}
              style={{ backgroundColor: PERMISSION_COLORS[supplier.permissionLevel] }}
            >
              {PERMISSION_LABELS[supplier.permissionLevel]}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={supplier.cautionFlag ? styles.cautionBtnActive : styles.cautionBtn}
            onClick={handleToggleCaution}
            disabled={isPending}
          >
            &#x26A0; {supplier.cautionFlag ? 'Remove caution' : 'Set caution'}
          </button>
          {validTransitions.length > 0 && (
            <select
              className={styles.transitionSelect}
              value=""
              onChange={e => { if (e.target.value) handleTransition(e.target.value); }}
              disabled={isPending}
            >
              <option value="">{isPending ? 'Transitioning...' : 'Move stage...'}</option>
              {validTransitions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Details</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Categories</span>
                <div className={styles.chips}>
                  {supplier.categories.map(c => (
                    <span key={c} className={styles.chip}>{c}</span>
                  ))}
                  {supplier.categories.length === 0 && <span className={styles.emptyValue}>None</span>}
                </div>
              </div>
              {supplier.subcategories.length > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Subcategories</span>
                  <div className={styles.chips}>
                    {supplier.subcategories.map(c => (
                      <span key={c} className={styles.chip}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>MOQ</span>
                <span className={styles.infoValue}>
                  {supplier.moq != null ? supplier.moq.toLocaleString() : 'Not set'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Capability Type</span>
                <span
                  className={styles.capabilityBadge}
                  style={{ backgroundColor: CAPABILITY_COLORS[(supplier.capabilityType as CapabilityType) || 'unknown'] }}
                >
                  {CAPABILITY_LABELS[(supplier.capabilityType as CapabilityType) || 'unknown']}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Key Brands</span>
                <span className={styles.infoValue}>
                  {supplier.keyBrands.length > 0 ? supplier.keyBrands.join(', ') : 'None'}
                </span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Cobalt Link</h3>
              {supplier.cobaltSupplier ? (
                <div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.cobaltBadge}>Linked</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Matched Products</span>
                    <span className={styles.infoValue}>{supplier.cobaltSupplier.matchedProductsCount}</span>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyValue}>Not linked to Cobalt</p>
              )}
            </div>

            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Quick Summary</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Certifications</span>
                <span className={styles.infoValue}>{supplier.certifications.length}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Agreements</span>
                <span className={styles.infoValue}>{supplier.agreements.length}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Brief Assignments</span>
                <span className={styles.infoValue}>{supplier.briefAssignments.length}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Certifications</h2>
              <button className={styles.addBtn} onClick={() => setShowAddCert(!showAddCert)}>
                {showAddCert ? 'Cancel' : '+ Add certification'}
              </button>
            </div>

            {showAddCert && (
              <div className={styles.addForm}>
                <select
                  className={styles.formSelect}
                  value={newCertType}
                  onChange={e => setNewCertType(e.target.value)}
                >
                  <option value="">Select type...</option>
                  {CERT_TYPES.map(ct => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Cert body (optional)"
                  value={newCertBody}
                  onChange={e => setNewCertBody(e.target.value)}
                />
                <input
                  className={styles.formInput}
                  type="date"
                  placeholder="Expiry date"
                  value={newCertExpiry}
                  onChange={e => setNewCertExpiry(e.target.value)}
                />
                <button
                  className={styles.submitBtn}
                  onClick={handleAddCert}
                  disabled={isPending || !newCertType}
                >
                  {isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            )}

            {supplier.certifications.length === 0 ? (
              <p className={styles.emptyValue}>No certifications added yet.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Type</th>
                      <th className={styles.th}>Body</th>
                      <th className={styles.th}>Expiry</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.certifications.map(cert => (
                      <tr key={cert.id} className={styles.tableRow}>
                        <td className={styles.td}>
                          <span className={styles.certType}>{cert.certType}</span>
                        </td>
                        <td className={styles.td}>{cert.certBody || '--'}</td>
                        <td className={styles.td}>{cert.expiryDate || '--'}</td>
                        <td className={styles.td}>
                          <select
                            className={styles.inlineSelect}
                            value={cert.verificationStatus}
                            onChange={e => handleUpdateCertStatus(cert.id, e.target.value)}
                            disabled={isPending}
                          >
                            <option value="unverified">Unverified</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className={styles.td}>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleRemoveCert(cert.id)}
                            disabled={isPending}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'agreements' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Agreements</h2>
            </div>

            {supplier.agreements.length === 0 ? (
              <p className={styles.emptyValue}>No agreements yet.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Type</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Sent</th>
                      <th className={styles.th}>Signed</th>
                      <th className={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.agreements.map(ag => (
                      <tr key={ag.id} className={styles.tableRow}>
                        <td className={styles.td}>
                          <span className={styles.certType}>{ag.agreementType}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusPill} ${styles[`status_${ag.status}`]}`}>
                            {ag.status}
                          </span>
                        </td>
                        <td className={styles.td}>{ag.sentAt || '--'}</td>
                        <td className={styles.td}>{ag.signedAt || '--'}</td>
                        <td className={styles.td}>
                          <select
                            className={styles.inlineSelect}
                            value=""
                            onChange={e => { if (e.target.value) handleUpdateAgreement(ag.id, e.target.value); }}
                            disabled={isPending}
                          >
                            <option value="">Update...</option>
                            {AGREEMENT_STATUSES.filter(s => s !== ag.status).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'briefs' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Brief Assignments</h2>
            </div>

            {supplier.briefAssignments.length === 0 ? (
              <p className={styles.emptyValue}>Not assigned to any briefs yet.</p>
            ) : (
              <div className={styles.briefList}>
                {supplier.briefAssignments.map(ba => (
                  <div
                    key={ba.id}
                    className={styles.briefCard}
                    onClick={() => router.push(`/suppliers/briefs`)}
                  >
                    <div className={styles.briefInfo}>
                      <p className={styles.briefName}>{ba.brief.name}</p>
                      {ba.brief.customerName && (
                        <p className={styles.briefMeta}>Customer: {ba.brief.customerName}</p>
                      )}
                      <p className={styles.briefMeta}>Category: {ba.brief.category}</p>
                    </div>
                    <div className={styles.matchScore}>
                      {ba.matchScore != null ? (
                        <span className={`${styles.scoreBadge} ${ba.matchScore >= 80 ? styles.scoreHigh : ba.matchScore >= 50 ? styles.scoreMed : styles.scoreLow}`}>
                          {ba.matchScore}%
                        </span>
                      ) : (
                        <span className={styles.scoreNA}>N/A</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Activity Log</h2>
              <button className={styles.addBtn} onClick={() => setShowAddActivity(!showAddActivity)}>
                {showAddActivity ? 'Cancel' : '+ Add Entry'}
              </button>
            </div>

            <div className={styles.activityFilters}>
              {ACTIVITY_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`${styles.filterChip} ${activityFilter === f.key ? styles.filterChipActive : ''}`}
                  onClick={() => setActivityFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {showAddActivity && (
              <div className={styles.addForm}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Type</label>
                    <select
                      className={styles.formSelect}
                      value={activityEntryType}
                      onChange={e => setActivityEntryType(e.target.value)}
                    >
                      <option value="email">Email</option>
                      <option value="call">Call</option>
                      <option value="meeting">Meeting</option>
                      <option value="note">Note</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={activityDate}
                      onChange={e => setActivityDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="What happened?"
                    value={activityDescription}
                    onChange={e => setActivityDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  className={styles.saveBtn}
                  disabled={isPending || !activityDescription.trim()}
                  onClick={() => {
                    startTransition(async () => {
                      await addManualActivity({
                        aosSupplierId: supplier.id,
                        entryType: activityEntryType,
                        description: activityDescription,
                        date: activityDate,
                      });
                      setActivityDescription('');
                      setShowAddActivity(false);
                      router.refresh();
                    });
                  }}
                >
                  {isPending ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            )}

            {activities.length === 0 ? (
              <p className={styles.emptyValue}>No activity recorded yet.</p>
            ) : (
              <div className={styles.activityTimeline}>
                {activities.filter(a => matchesActivityFilter(a, activityFilter)).map(a => {
                  const entryType = a.metadata?.entryType || a.type;
                  const icon = ENTRY_TYPE_ICONS[entryType] || '\u25CF';
                  const date = new Date(a.createdAt);
                  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={a.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>{icon}</div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityDesc}>{a.description}</p>
                        <p className={styles.activityMeta}>
                          {a.userName} &middot; {dateStr} at {timeStr}
                          {a.type === 'manual_entry' && ` \u00B7 ${entryType}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caution Flag Modal */}
      {cautionModal && (
        <div className={styles.modalBackdrop} onClick={() => setCautionModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Set Caution Flag</h3>
            <p className={styles.modalSubtitle}>
              Add an optional note explaining why this supplier has been flagged.
            </p>
            <label className={styles.modalLabel}>Note (optional)</label>
            <textarea
              className={styles.modalTextarea}
              placeholder="Reason for caution flag..."
              value={cautionNote}
              onChange={e => setCautionNote(e.target.value)}
              rows={3}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setCautionModal(false)}>
                Cancel
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={handleCautionConfirm}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
