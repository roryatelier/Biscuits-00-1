'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { getSupplierBrief } from '@/lib/actions/supplier-briefs';
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

export default function BriefsClient({ briefs }: { briefs: Brief[] }) {
  const router = useRouter();
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [briefDetail, setBriefDetail] = useState<BriefDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  if (briefs.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Brief Shortlists</h1>
            <p className={styles.pageSubtitle}>0 briefs</p>
          </div>
        </div>
        <EmptyState
          icon="projects"
          heading="No supplier briefs yet"
          description="Create a supplier brief to start building shortlists."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Brief Shortlists</h1>
          <p className={styles.pageSubtitle}>{briefs.length} briefs</p>
        </div>
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
              <h2 className={styles.detailTitle}>{briefDetail.name}</h2>
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
                ) : (
                  <div className={styles.supplierList}>
                    {briefDetail.assignments.map(a => (
                      <div
                        key={a.id}
                        className={styles.supplierCard}
                        onClick={() => router.push(`/suppliers/${a.aosSupplier.id}`)}
                      >
                        <div className={styles.supplierInfo}>
                          <p className={styles.supplierName}>{a.aosSupplier.companyName}</p>
                          <p className={styles.supplierMeta}>{a.aosSupplier.qualificationStage}</p>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
