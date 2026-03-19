'use client';

import { useState } from 'react';
import { listActivities } from '@/lib/actions/activity';
import { timeAgo } from '@/lib/utils/timeAgo';
import styles from './Collaboration.module.css';

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  user: { id: string; name: string | null };
};

interface Props {
  projectId: string;
  initialActivities: Activity[];
  initialTotal: number;
  initialHasMore: boolean;
}

const FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Status changes', value: 'status_change' },
  { label: 'Comments', value: 'comment' },
  { label: 'Samples', value: 'sample_ordered' },
];

function activityIcon(type: string): string {
  switch (type) {
    case 'project_created': return 'P';
    case 'status_change': return 'S';
    case 'formulation_linked': return 'F';
    case 'formulation_unlinked': return 'F';
    case 'sample_ordered': return 'O';
    case 'sample_status_changed': return 'O';
    case 'review_submitted': return 'R';
    case 'comment': return 'C';
    case 'shared': return 'L';
    default: return 'A';
  }
}

export default function ActivityFeed({ projectId, initialActivities, initialTotal, initialHasMore }: Props) {
  const [activities, setActivities] = useState(initialActivities);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFilter(type: string) {
    setFilter(type);
    setLoading(true);
    const result = await listActivities(projectId, { type: type || undefined, take: 20, skip: 0 });
    setActivities(result.activities);
    setTotal(result.total);
    setHasMore(result.hasMore);
    setLoading(false);
  }

  async function loadMore() {
    setLoading(true);
    const result = await listActivities(projectId, {
      type: filter || undefined,
      take: 20,
      skip: activities.length,
    });
    setActivities(prev => [...prev, ...result.activities]);
    setHasMore(result.hasMore);
    setLoading(false);
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Activity</h2>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => handleFilter(e.target.value)}
        >
          {FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {activities.length === 0 && !loading ? (
        <p className={styles.emptyText}>No activity yet.</p>
      ) : (
        <div className={styles.activityList}>
          {activities.map((a) => (
            <div key={a.id} className={styles.activityItem}>
              <span className={styles.activityIcon}>{activityIcon(a.type)}</span>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>
                  <strong>{a.user.name || 'Unknown'}</strong>{' '}
                  {a.description}
                </p>
                <span className={styles.activityTime}>{timeAgo(a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          className={styles.loadMoreBtn}
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : `Load more (${total - activities.length} remaining)`}
        </button>
      )}
    </div>
  );
}
