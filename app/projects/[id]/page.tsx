'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './ProjectDetail.module.css';

interface Milestone {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'upcoming';
  date: string;
  owner: string;
  notes: string;
}

const PROJECT = {
  name: 'Anti-Dandruff Shampoo Innovation',
  category: 'Shampoo',
  status: 'In Development',
  owner: 'Rory G.',
  created: '15 Oct 2025',
  formulas: 3,
  samples: 2,
  team: [
    { name: 'Rory G.', role: 'Brand Manager', avatar: 'R' },
    { name: 'Sara M.', role: 'Formulation Scientist', avatar: 'S' },
  ],
};

const MILESTONES: Milestone[] = [
  { id: '1', name: 'Brief Lock',      status: 'completed', date: '22 Oct 2025', owner: 'Rory G.', notes: 'Product brief finalized with target claims and regulatory markets.' },
  { id: '2', name: 'Formula Selection', status: 'completed', date: '15 Nov 2025', owner: 'Sara M.', notes: 'Base formulation selected from catalog. Zinc Pyrithione + Niacinamide combination.' },
  { id: '3', name: 'Sample Review',   status: 'active',    date: '28 Feb 2026', owner: 'Rory G.', notes: 'First sample batch (SMP-0012) in production. Sensory testing planned.' },
  { id: '4', name: 'Final Formula',   status: 'upcoming',  date: 'Mar 2026',    owner: 'Sara M.', notes: 'Final formulation sign-off after sample review feedback.' },
  { id: '5', name: 'Packaging Lock',  status: 'upcoming',  date: 'Apr 2026',    owner: 'Rory G.', notes: 'Artwork approval and packaging production kick-off.' },
  { id: '6', name: 'Launch',          status: 'upcoming',  date: 'Jun 2026',    owner: 'Rory G.', notes: 'Market launch — UK market first, EU to follow.' },
];

const GANTT_PHASES = [
  { name: 'Scoping',     start: 0, width: 15, color: 'var(--green-300)' },
  { name: 'Development', start: 15, width: 30, color: 'var(--brand-300)' },
  { name: 'Testing',     start: 45, width: 20, color: 'var(--orange-300)' },
  { name: 'Packaging',   start: 55, width: 15, color: 'var(--purple-200)' },
  { name: 'Launch Prep', start: 70, width: 30, color: 'var(--green-200)' },
];

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function ProjectDetailPage() {
  const router = useRouter();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  const completedCount = MILESTONES.filter(m => m.status === 'completed').length;
  const progress = Math.round((completedCount / MILESTONES.length) * 100);

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Breadcrumb ── */}
        <div className={styles.breadcrumb}>
          <button onClick={() => router.push('/dashboard')} className={styles.breadLink}>Dashboard</button>
          <span className={styles.breadSep}>›</span>
          <span>{PROJECT.name}</span>
        </div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerMeta}>
              <span className={styles.statusBadge}>{PROJECT.status}</span>
              <span className={styles.categoryTag}>{PROJECT.category}</span>
            </div>
            <h1 className={styles.title}>{PROJECT.name}</h1>
            <p className={styles.subtitle}>
              Created {PROJECT.created} · {PROJECT.formulas} formulas · {PROJECT.samples} sample orders
            </p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.teamAvatars}>
              {PROJECT.team.map(t => (
                <div key={t.name} className={styles.avatar} title={`${t.name} — ${t.role}`}>
                  {t.avatar}
                </div>
              ))}
            </div>
            <button className={styles.actionBtn} onClick={() => router.push('/projects/new')}>Edit project</button>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Project progress</span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressSub}>{completedCount} of {MILESTONES.length} milestones completed</p>
        </div>

        {/* ── Gantt chart ── */}
        <div className={styles.ganttSection}>
          <h2 className={styles.sectionTitle}>Timeline</h2>
          <div className={styles.ganttChart}>
            {/* Month headers */}
            <div className={styles.ganttMonths}>
              {MONTHS.map((m, i) => (
                <div key={m} className={styles.ganttMonth}>
                  <span>{m}</span>
                  {i < MONTHS.length - 1 && <div className={styles.ganttMonthLine} />}
                </div>
              ))}
            </div>

            {/* Phase bars */}
            <div className={styles.ganttBars}>
              {GANTT_PHASES.map(phase => (
                <div key={phase.name} className={styles.ganttRow}>
                  <span className={styles.ganttPhaseLabel}>{phase.name}</span>
                  <div className={styles.ganttTrack}>
                    <div
                      className={styles.ganttBar}
                      style={{
                        left: `${phase.start}%`,
                        width: `${phase.width}%`,
                        background: phase.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Today marker */}
            <div className={styles.ganttToday} style={{ left: `calc(${(4.5 / 9) * 100}% + 100px)` }}>
              <div className={styles.ganttTodayLine} />
              <span className={styles.ganttTodayLabel}>Today</span>
            </div>
          </div>
        </div>

        {/* ── Milestones ── */}
        <div className={styles.milestonesSection}>
          <h2 className={styles.sectionTitle}>Milestones</h2>
          <div className={styles.milestoneList}>
            {MILESTONES.map((m, i) => (
              <div
                key={m.id}
                className={`${styles.milestoneCard} ${styles[`milestone${m.status.charAt(0).toUpperCase() + m.status.slice(1)}`]}`}
                onClick={() => setSelectedMilestone(selectedMilestone === m.id ? null : m.id)}
              >
                <div className={styles.milestoneHeader}>
                  <div className={styles.milestoneLeft}>
                    <div className={styles.milestoneIcon}>
                      {m.status === 'completed' && <span className={styles.checkIcon}>✓</span>}
                      {m.status === 'active' && <span className={styles.activeIcon} />}
                      {m.status === 'upcoming' && <span className={styles.upcomingIcon}>{i + 1}</span>}
                    </div>
                    <div>
                      <p className={styles.milestoneName}>{m.name}</p>
                      <p className={styles.milestoneMeta}>{m.date} · {m.owner}</p>
                    </div>
                  </div>
                  <span className={`${styles.milestoneBadge} ${styles[`badge${m.status.charAt(0).toUpperCase() + m.status.slice(1)}`]}`}>
                    {m.status === 'completed' && 'Done'}
                    {m.status === 'active' && 'In Progress'}
                    {m.status === 'upcoming' && 'Upcoming'}
                  </span>
                </div>
                {selectedMilestone === m.id && (
                  <div className={styles.milestoneDetail}>
                    <p>{m.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </PlatformLayout>
  );
}
