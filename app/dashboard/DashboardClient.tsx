'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BeakerIcon, BoxIcon, SparkleIcon, ClipboardIcon } from '@/components/icons/Icons';
import styles from './Dashboard.module.css';

interface DashboardClientProps {
  totalProjects: number;
  totalFormulations: number;
  totalSamples: number;
  deliveredSamples: number;
  projects: {
    id: string;
    name: string;
    status: string;
    category: string | null;
    formulaCount: number;
    updatedAt: string;
  }[];
  orders: {
    id: string;
    reference: string;
    formulaName: string;
    status: string;
    date: string;
  }[];
  activities: {
    id: string;
    text: string;
    time: string;
  }[];
  statusColors: Record<string, string>;
  orderColors: Record<string, string>;
}

export default function DashboardClient({
  totalProjects,
  totalFormulations,
  totalSamples,
  deliveredSamples,
  projects,
  orders,
  activities,
  statusColors,
  orderColors,
}: DashboardClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name || 'there';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const pendingSamples = totalSamples - deliveredSamples;

  return (
    <>
      {/* -- Header -- */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Hello, {userName}.</h1>
          <p className={styles.date}>{today}</p>
        </div>
        <button className={styles.newProjectBtn} onClick={() => router.push('/projects/new')}>
          + New project
        </button>
      </div>

      {/* -- Team invite banner -- */}
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

      {/* -- Stats row -- */}
      <div className={styles.stats}>
        <StatCard label="Active projects" value={String(totalProjects)} sub={`${totalProjects} total`} />
        <StatCard label="Formulations" value={String(totalFormulations)} sub="Linked to projects" />
        <StatCard label="Sample orders" value={String(totalSamples)} sub={`${deliveredSamples} delivered`} />
        <StatCard label="Pending samples" value={String(pendingSamples)} sub="In progress" />
      </div>

      {/* -- Main grid -- */}
      <div className={styles.mainGrid}>

        {/* Recent projects */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Active projects</h2>
            <button className={styles.viewAll} onClick={() => router.push('/projects')}>View all →</button>
          </div>
          {projects.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--slate-400)', marginBottom: 12 }}>No projects yet.</p>
              <button className={styles.viewAll} onClick={() => router.push('/projects/new')}>Create your first project →</button>
            </div>
          ) : (
            <div className={styles.projectList}>
              {projects.map(p => (
                <div key={p.id} className={styles.projectRow} onClick={() => router.push(`/projects/${p.id}`)}>
                  <div className={styles.projectInfo}>
                    <div className={styles.projectMeta}>
                      <span className={`${styles.statusBadge} ${styles[statusColors[p.status] ?? '']}`}>{p.status}</span>
                      {p.category && <span className={styles.projectCategory}>{p.category}</span>}
                    </div>
                    <p className={styles.projectName}>{p.name}</p>
                  </div>
                  <div className={styles.projectRight}>
                    <span className={styles.projectFormulas}>{p.formulaCount} formula{p.formulaCount !== 1 ? 's' : ''}</span>
                    <span className={styles.projectUpdated}>{p.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>

          {/* Recent samples */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sample orders</h2>
              <button className={styles.viewAll} onClick={() => router.push('/samples')}>View all →</button>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>No sample orders yet.</p>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map(o => (
                  <div key={o.id} className={styles.orderRow} onClick={() => router.push(`/samples/${o.id}`)}>
                    <div className={styles.orderInfo}>
                      <p className={styles.orderFormula}>{o.formulaName}</p>
                      <p className={styles.orderId}>{o.reference} · {o.date}</p>
                    </div>
                    <span className={`${styles.orderBadge} ${styles[orderColors[o.status] ?? '']}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
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
                desc="Explore base formulas"
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
                desc="Review your backlog"
                onClick={() => router.push('/backlog')}
              />
            </div>
          </div>

          {/* Activity feed */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent activity</h2>
            </div>
            {activities.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>No recent activity.</p>
              </div>
            ) : (
              <div className={styles.activityList}>
                {activities.map(a => (
                  <div key={a.id} className={styles.activityRow}>
                    <div className={styles.activityDot} />
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>{a.text}</p>
                      <p className={styles.activityTime}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
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
