'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { transitionSupplierStage } from '@/lib/actions/suppliers';
import {
  STAGE_COLORS,
  PERMISSION_LABELS,
  PERMISSION_COLORS,
  CAPABILITY_LABELS,
  CAPABILITY_BADGE_STYLES,
  type PermissionLevel,
  type CapabilityType,
} from '@/lib/constants/suppliers';
import styles from './Pipeline.module.css';

const STAGES = [
  'Identified',
  'Outreached',
  'Capability Confirmed',
  'Conditionally Qualified',
  'Fully Qualified',
  'Paused',
  'Blacklisted',
] as const;

const TRANSITION_MAP: Record<string, string[]> = {
  'Identified': ['Outreached', 'Paused', 'Blacklisted'],
  'Outreached': ['Capability Confirmed', 'Paused', 'Blacklisted'],
  'Capability Confirmed': ['Conditionally Qualified', 'Outreached', 'Paused', 'Blacklisted'],
  'Conditionally Qualified': ['Fully Qualified', 'Capability Confirmed', 'Paused', 'Blacklisted'],
  'Fully Qualified': ['Conditionally Qualified', 'Paused', 'Blacklisted'],
  'Paused': ['Identified', 'Outreached'],
  'Blacklisted': [],
};

type PipelineSupplier = {
  id: string;
  companyName: string;
  qualificationStage: string;
  categories: string[];
  cautionFlag: boolean;
  certCount: number;
  capabilityType: string;
};

type BriefAssignment = {
  aosSupplierId: string;
  matchScore: number | null;
  status: string;
  supplier: PipelineSupplier;
};

type PipelineBrief = {
  id: string;
  name: string;
  customerName: string | null;
  category: string;
  assignments: BriefAssignment[];
};

type ViewMode = 'network' | 'brief';

function MatchScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  let colorClass = styles.matchRed;
  if (pct >= 80) colorClass = styles.matchGreen;
  else if (pct >= 50) colorClass = styles.matchAmber;
  return <span className={`${styles.matchBadge} ${colorClass}`}>{pct}%</span>;
}

export default function PipelineClient({
  suppliers,
  briefs,
  permissionLevels = {},
}: {
  suppliers: PipelineSupplier[];
  briefs: PipelineBrief[];
  permissionLevels?: Record<string, PermissionLevel>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [selectedBriefId, setSelectedBriefId] = useState<string>('');
  const [search, setSearch] = useState('');
  // Dropout reason modal
  const [reasonModal, setReasonModal] = useState<{ supplierId: string; toStage: string } | null>(null);
  const [reasonType, setReasonType] = useState('');
  const [reasonNote, setReasonNote] = useState('');

  const selectedBrief = briefs.find(b => b.id === selectedBriefId);

  // Build a map of supplierId -> matchScore for the selected brief
  const matchScoreMap = new Map<string, number | null>();
  if (selectedBrief) {
    for (const a of selectedBrief.assignments) {
      matchScoreMap.set(a.aosSupplierId, a.matchScore);
    }
  }

  // Determine which suppliers to display
  const baseSuppliers: PipelineSupplier[] =
    viewMode === 'network'
      ? suppliers
      : selectedBrief
        ? selectedBrief.assignments.map(a => a.supplier)
        : [];

  const displaySuppliers = search.trim()
    ? baseSuppliers.filter(s =>
        s.companyName.toLowerCase().includes(search.trim().toLowerCase())
      )
    : baseSuppliers;

  const grouped: Record<string, PipelineSupplier[]> = {};
  for (const stage of STAGES) {
    grouped[stage] = displaySuppliers.filter(s => s.qualificationStage === stage);
  }

  const DROPOUT_REASONS = [
    'Failed capability match',
    'Failed certification requirements',
    'Legal hold',
    'Supplier declined',
    'Commercial terms not agreed',
    'Volume mismatch',
    'Quality concerns',
    'Other',
  ];

  const handleTransition = (supplierId: string, toStage: string) => {
    if (toStage === 'Paused' || toStage === 'Blacklisted') {
      setReasonModal({ supplierId, toStage });
      setReasonType('');
      setReasonNote('');
      return;
    }
    executeTransition(supplierId, toStage);
  };

  const executeTransition = (supplierId: string, toStage: string, reason?: { type: string; note?: string }) => {
    setTransitioningId(supplierId);
    startTransition(async () => {
      await transitionSupplierStage(supplierId, toStage, reason);
      setTransitioningId(null);
      setReasonModal(null);
      router.refresh();
    });
  };

  const handleReasonSubmit = () => {
    if (!reasonModal || !reasonType) return;
    if (reasonType === 'Other' && !reasonNote.trim()) return;
    executeTransition(reasonModal.supplierId, reasonModal.toStage, {
      type: reasonType,
      note: reasonNote.trim() || undefined,
    });
  };

  const showEmptyBriefState = viewMode === 'brief' && !selectedBriefId;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            <a href="/suppliers" style={{ color: '#94a3b8', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#64748b')} onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>Supplier Intelligence</a>
            <span style={{ margin: '0 6px' }}>/</span>
            <span style={{ color: '#64748b' }}>Pipeline</span>
          </div>
          <h1 className={styles.pageTitle}>Pipeline Board</h1>
          <p className={styles.pageSubtitle}>
            {viewMode === 'network'
              ? `${suppliers.length} suppliers across ${STAGES.length} stages`
              : selectedBrief
                ? `${displaySuppliers.length} assigned suppliers`
                : 'Select a brief to view assigned suppliers'}
          </p>
        </div>
      </div>

      {/* View toggle + brief selector */}
      <div className={styles.toolbar}>
        <div className={styles.toggleBar}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'network' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('network')}
          >
            Network
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'brief' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('brief')}
          >
            Brief
          </button>
        </div>

        {viewMode === 'brief' && (
          <select
            className={styles.briefSelect}
            value={selectedBriefId}
            onChange={e => setSelectedBriefId(e.target.value)}
          >
            <option value="">Select a brief...</option>
            {briefs.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}{b.customerName ? ` — ${b.customerName}` : ''}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search suppliers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showEmptyBriefState ? (
        <div className={styles.emptyBriefState}>
          <p className={styles.emptyBriefText}>Select a brief to view assigned suppliers</p>
        </div>
      ) : (
        <div className={styles.board}>
          {STAGES.map(stage => {
            const cards = grouped[stage];
            const validTransitions = TRANSITION_MAP[stage] || [];

            return (
              <div key={stage} className={styles.column}>
                <div className={styles.columnHeader}>
                  <span
                    className={styles.columnDot}
                    style={{ backgroundColor: STAGE_COLORS[stage] }}
                  />
                  <span className={styles.columnTitle}>{stage}</span>
                  <span className={styles.columnCount}>{cards.length}</span>
                </div>

                <div className={styles.columnCards}>
                  {cards.map(s => {
                    const isPausedCaution = stage === 'Paused' && s.cautionFlag;
                    return (
                    <div key={s.id} className={`${styles.card} ${isPausedCaution ? styles.cardNotViable : ''}`}>
                      <div
                        className={styles.cardBody}
                        onClick={() => router.push(`/suppliers/${s.id}`)}
                      >
                        <div className={styles.cardNameRow}>
                          <span className={`${styles.cardName} ${isPausedCaution ? styles.cardNameMuted : ''}`}>{s.companyName}</span>
                          {s.cautionFlag && (
                            <span className={`${styles.cautionIcon} ${isPausedCaution ? styles.cautionIconProminent : ''}`} title="Caution flag">&#x26A0;</span>
                          )}
                          {viewMode === 'brief' && matchScoreMap.has(s.id) && (
                            <MatchScoreBadge score={matchScoreMap.get(s.id) ?? null} />
                          )}
                        </div>
                        {s.capabilityType && s.capabilityType !== 'unknown' && (
                          <span
                            className={styles.capabilityBadge}
                            style={{
                              backgroundColor: CAPABILITY_BADGE_STYLES[(s.capabilityType as CapabilityType) || 'unknown'].bg,
                              color: CAPABILITY_BADGE_STYLES[(s.capabilityType as CapabilityType) || 'unknown'].color,
                            }}
                          >
                            {CAPABILITY_LABELS[(s.capabilityType as CapabilityType) || 'unknown']}
                          </span>
                        )}
                        <div className={styles.cardChips}>
                          {s.categories.slice(0, 2).map(c => (
                            <span key={c} className={styles.cardChip}>{c}</span>
                          ))}
                          {s.categories.length > 2 && (
                            <span className={styles.cardChipMore}>+{s.categories.length - 2}</span>
                          )}
                        </div>
                        <div className={styles.cardFooter}>
                          <span className={styles.certBadge}>{s.certCount} cert{s.certCount !== 1 ? 's' : ''}</span>
                          {permissionLevels[s.id] && (
                            <span
                              className={styles.permissionBadge}
                              style={{ backgroundColor: PERMISSION_COLORS[permissionLevels[s.id]] }}
                            >
                              {PERMISSION_LABELS[permissionLevels[s.id]]}
                            </span>
                          )}
                        </div>
                      </div>

                      {validTransitions.length > 0 && (
                        <div className={styles.cardTransition}>
                          <select
                            className={styles.transitionSelect}
                            value=""
                            onChange={e => {
                              if (e.target.value) handleTransition(s.id, e.target.value);
                            }}
                            disabled={isPending && transitioningId === s.id}
                          >
                            <option value="">
                              {isPending && transitioningId === s.id ? 'Moving...' : 'Move to...'}
                            </option>
                            {validTransitions.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ); })}

                  {cards.length === 0 && (
                    <div className={styles.emptyColumn}>
                      <p className={styles.emptyText}>No suppliers</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropout Reason Modal */}
      {reasonModal && (
        <div className={styles.modalBackdrop} onClick={() => setReasonModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {reasonModal.toStage === 'Blacklisted' ? 'Blacklist' : 'Pause'} Supplier
            </h3>
            <p className={styles.modalSubtitle}>
              Please provide a reason for this action. This will be logged in the audit trail.
            </p>
            <label className={styles.modalLabel}>Reason</label>
            <select
              className={styles.modalSelect}
              value={reasonType}
              onChange={e => setReasonType(e.target.value)}
            >
              <option value="">Select a reason...</option>
              {DROPOUT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <label className={styles.modalLabel}>
              Notes {reasonType === 'Other' ? '(required)' : '(optional)'}
            </label>
            <textarea
              className={styles.modalTextarea}
              placeholder="Additional context..."
              value={reasonNote}
              onChange={e => setReasonNote(e.target.value)}
              rows={3}
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancelBtn} onClick={() => setReasonModal(null)}>
                Cancel
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={handleReasonSubmit}
                disabled={!reasonType || (reasonType === 'Other' && !reasonNote.trim()) || isPending}
                style={{
                  backgroundColor: reasonModal.toStage === 'Blacklisted' ? '#ef4444' : '#f59e0b',
                }}
              >
                {isPending ? 'Saving...' : `Confirm ${reasonModal.toStage === 'Blacklisted' ? 'Blacklist' : 'Pause'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
