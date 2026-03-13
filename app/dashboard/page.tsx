'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { BeakerIcon, BoxIcon, SparkleIcon, ClipboardIcon } from '@/components/icons/Icons';
import styles from './Dashboard.module.css';

const PROJECTS = [
  { id: '1', name: 'Anti-Dandruff Shampoo Innovation', category: 'Shampoo', status: 'In Development', phase: 3, phases: 5, formulas: 3, updated: '2 hours ago' },
  { id: '2', name: 'Vitamin C Brightening Serum',       category: 'Serum',   status: 'In Scoping',    phase: 1, phases: 5, formulas: 1, updated: 'Yesterday' },
  { id: '3', name: 'SPF50 Daily Defense Launch',         category: 'SPF',     status: 'In Testing',    phase: 4, phases: 5, formulas: 2, updated: '3 days ago' },
];

const ORDERS = [
  { id: 'SMP-0012', formula: 'Scalp Purify Anti-Dandruff Treatment', status: 'In Production', stage: 1, date: '14 Feb 2026' },
  { id: 'SMP-0011', formula: 'Hydra-Plump Moisture Serum',           status: 'Shipped',       stage: 3, date: '01 Feb 2026' },
  { id: 'SMP-0010', formula: 'Vitamin C Brightening Cleanser',       status: 'Delivered',     stage: 4, date: '20 Jan 2026' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Scoping':    'statusScoping',
  'In Development':'statusDev',
  'In Testing':    'statusTest',
  'Launched':      'statusLaunched',
};

const ORDER_COLORS: Record<string, string> = {
  'Received':     'orderReceived',
  'In Production':'orderProd',
  'Quality Check':'orderQC',
  'Shipped':      'orderShipped',
  'Delivered':    'orderDelivered',
};

const ACTIVITIES = [
  { id: '1', text: 'Anti-Dandruff Shampoo moved to Phase 3', time: '2 hours ago' },
  { id: '2', text: 'Sara M. submitted a review for SMP-0010', time: '5 hours ago' },
  { id: '3', text: 'New formulation added: Ceramide Barrier Repair Serum v3.1', time: 'Yesterday' },
  { id: '4', text: 'Sample order SMP-0012 status changed to In Production', time: '2 days ago' },
  { id: '5', text: 'SPF50 Daily Defense moved to Phase 4 (Testing)', time: '3 days ago' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name || 'there';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Hello, {userName}.</h1>
            <p className={styles.date}>{today}</p>
          </div>
          <button className={styles.newProjectBtn} onClick={() => router.push('/innovation/cobalt')}>
            + New project
          </button>
        </div>

        {/* ── Team invite banner ── */}
        {!bannerDismissed && (
          <div className={styles.inviteBanner}>
            <div className={styles.inviteBannerText}>
              <strong>Teams that collaborate ship 3x faster.</strong>{' '}
              Invite a teammate to get started.
            </div>
            <div className={styles.inviteBannerActions}>
              <button className={styles.inviteBannerBtn} onClick={() => router.push('/team')}>Invite teammate</button>
              <button className={styles.inviteBannerDismiss} onClick={() => setBannerDismissed(true)}>Dismiss</button>
            </div>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className={styles.stats}>
          <StatCard label="Active projects"    value="3"  sub="2 updated this week" />
          <StatCard label="Formulations"       value="12" sub="4 categories covered" />
          <StatCard label="Pending samples"    value="2"  sub="Est. 3–5 weeks" />
          <StatCard label="Team members"       value="1"  sub="Invite your team" action={() => router.push('/onboarding')} actionLabel="Invite" />
        </div>

        {/* ── Main grid ── */}
        <div className={styles.mainGrid}>

          {/* Recent projects */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Active projects</h2>
              <button className={styles.viewAll} onClick={() => router.push('/projects/new')}>New project →</button>
            </div>
            <div className={styles.projectList}>
              {PROJECTS.map(p => (
                <div key={p.id} className={styles.projectRow} onClick={() => router.push(`/projects/${p.id}`)}>
                  <div className={styles.projectInfo}>
                    <div className={styles.projectMeta}>
                      <span className={`${styles.statusBadge} ${styles[STATUS_COLORS[p.status]]}`}>{p.status}</span>
                      <span className={styles.projectCategory}>{p.category}</span>
                    </div>
                    <p className={styles.projectName}>{p.name}</p>
                    <div className={styles.phaseTrack}>
                      <div className={styles.phaseBar}>
                        {Array.from({ length: p.phases }).map((_, i) => (
                          <div key={i} className={`${styles.phaseSegment} ${i < p.phase ? styles.phaseSegmentDone : ''}`} />
                        ))}
                      </div>
                      <span className={styles.phaseLabel}>Phase {p.phase} of {p.phases}</span>
                    </div>
                  </div>
                  <div className={styles.projectRight}>
                    <span className={styles.projectFormulas}>{p.formulas} formula{p.formulas !== 1 ? 's' : ''}</span>
                    <span className={styles.projectUpdated}>{p.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className={styles.rightCol}>

            {/* Recent samples */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Sample orders</h2>
                <button className={styles.viewAll} onClick={() => router.push('/samples')}>View all →</button>
              </div>
              <div className={styles.orderList}>
                {ORDERS.map(o => (
                  <div key={o.id} className={styles.orderRow} onClick={() => router.push('/samples')}>
                    <div className={styles.orderInfo}>
                      <p className={styles.orderFormula}>{o.formula}</p>
                      <p className={styles.orderId}>{o.id} · {o.date}</p>
                    </div>
                    <span className={`${styles.orderBadge} ${styles[ORDER_COLORS[o.status]]}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Quick actions</h2>
              </div>
              <div className={styles.quickActions}>
                <QuickAction
                  icon={<BeakerIcon />}
                  label="Browse formulations"
                  desc="Explore 12 base formulas"
                  onClick={() => router.push('/formulations')}
                />
                <QuickAction
                  icon={<BoxIcon />}
                  label="Order a sample"
                  desc="Request from a formulation"
                  onClick={() => router.push('/samples/new')}
                />
                <QuickAction
                  icon={<SparkleIcon />}
                  label="Start AI innovation"
                  desc="Explore with Atelier AI"
                  onClick={() => router.push('/innovation/chat')}
                />
                <QuickAction
                  icon={<ClipboardIcon />}
                  label="View backlog"
                  desc="15 items in backlog"
                  onClick={() => router.push('/backlog')}
                />
              </div>
            </div>

            {/* Activity feed */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent activity</h2>
              </div>
              <div className={styles.activityList}>
                {ACTIVITIES.map(a => (
                  <div key={a.id} className={styles.activityRow}>
                    <div className={styles.activityDot} />
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>{a.text}</p>
                      <p className={styles.activityTime}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </PlatformLayout>
  );
}

function StatCard({ label, value, sub, action, actionLabel }: {
  label: string; value: string; sub: string; action?: () => void; actionLabel?: string;
}) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statSub}>
        {sub}
        {action && <button className={styles.statAction} onClick={action}>{actionLabel}</button>}
      </p>
    </div>
  );
}

function QuickAction({ icon, label, desc, onClick }: {
  icon: React.ReactNode; label: string; desc: string; onClick: () => void;
}) {
  return (
    <button className={styles.quickAction} onClick={onClick}>
      <span className={styles.quickIcon}>{icon}</span>
      <div>
        <p className={styles.quickLabel}>{label}</p>
        <p className={styles.quickDesc}>{desc}</p>
      </div>
      <span className={styles.quickArrow}>→</span>
    </button>
  );
}
