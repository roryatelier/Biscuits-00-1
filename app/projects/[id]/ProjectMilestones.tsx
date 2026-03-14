'use client';

import { useState } from 'react';
import styles from './ProjectDetail.module.css';

interface Milestone {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'upcoming';
}

export default function ProjectMilestones({ milestones }: { milestones: Milestone[] }) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  return (
    <div className={styles.milestonesSection}>
      <h2 className={styles.sectionTitle}>Milestones</h2>
      <div className={styles.milestoneList}>
        {milestones.map((m, i) => (
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
                <p>
                  {m.status === 'completed' && `${m.name} phase has been completed.`}
                  {m.status === 'active' && `Currently in the ${m.name} phase.`}
                  {m.status === 'upcoming' && `${m.name} phase is upcoming.`}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
