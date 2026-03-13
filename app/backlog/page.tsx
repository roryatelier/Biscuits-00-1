'use client';

import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './Backlog.module.css';

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  Urgent: { label: 'Urgent', className: 'priorityUrgent' },
  High:   { label: 'High',   className: 'priorityHigh' },
  Medium: { label: 'Medium', className: 'priorityMedium' },
  Low:    { label: 'Low',    className: 'priorityLow' },
};

const STATUS_CLASSES: Record<string, string> = {
  'Triage': 'statusTriage',
  'Brief Under Review': 'statusReview',
  'GRWAllocation in Progress': 'statusInProgress',
  'GRW Allocation Complete': 'statusComplete',
  'Blocked': 'statusBlocked',
  'Opportunity Lost': 'statusLost',
};

const BACKLOG_ITEMS = [
  { id: 'GRO-176', title: 'NOYZ Dry de Parfum | Powdered Fragrance', status: 'Triage', priority: '', assignee: '', labels: [], project: '', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-176' },
  { id: 'GRO-171', title: 'Maesa | Men & Womens Body Mists RFQ', status: 'Brief Under Review', priority: '', assignee: 'Beck', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-171' },
  { id: 'GRO-175', title: 'Soulea Scent Stick', status: 'Brief Under Review', priority: '', assignee: 'Beck', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-175' },
  { id: 'GRO-172', title: 'Soulea Balance Body Lotion', status: 'Brief Under Review', priority: '', assignee: 'Beck', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-172' },
  { id: 'GRO-169', title: 'Frenshe Serum Stick Tech Transfer', status: 'Brief Under Review', priority: '', assignee: '', labels: [], project: '', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-169' },
  { id: 'GRO-164', title: 'Bouf | UK Supplier Options', status: 'Brief Under Review', priority: '', assignee: 'Marion', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-164' },
  { id: 'GRO-173', title: 'Soulea Body Wash', status: 'Brief Under Review', priority: '', assignee: 'Beck', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-173' },
  { id: 'GRO-174', title: 'Soulea Lip Balm', status: 'Brief Under Review', priority: '', assignee: 'Beck', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-174' },
  { id: 'GRO-170', title: 'HALEA-19 + 20 | Refill Pouches', status: 'GRW Allocation Complete', priority: '', assignee: 'Marion', labels: [], project: '', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-170' },
  { id: 'GRO-168', title: 'MUDOR 06/07/08 - SB Serum', status: 'GRWAllocation in Progress', priority: '', assignee: 'Marion', labels: [], project: 'Growth Ops', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-168' },
  { id: 'GRO-128', title: 'NADS - Hair Removal Cream', status: 'Opportunity Lost', priority: '', assignee: 'Marion', labels: ['New Capability'], project: 'Growth Ops', dueDate: '7 Jan 2026', url: 'https://linear.app/atelier-design/issue/GRO-128' },
  { id: 'GRO-123', title: 'Wow Brows | Thick & Slick Tinted Growth Gel', status: 'GRW Allocation Complete', priority: 'High', assignee: 'Samantha', labels: ['Tier 1', 'Existing Capability'], project: 'Growth Ops', dueDate: '17 Dec 2025', url: 'https://linear.app/atelier-design/issue/GRO-123' },
  { id: 'GRO-163', title: 'UPUP-06 | Compare-to TRESemme Conditioner', status: 'Triage', priority: '', assignee: '', labels: [], project: '', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-163' },
  { id: 'GRO-162', title: 'UPUP-05 | Compare-to TRESemme Shampoo', status: 'Triage', priority: '', assignee: '', labels: [], project: '', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-162' },
  { id: 'GRO-157', title: 'THAIR-11 | Heat Protectant & Anti Frizz Spray', status: 'Triage', priority: '', assignee: '', labels: [], project: '', dueDate: null, url: 'https://linear.app/atelier-design/issue/GRO-157' },
];

export default function BacklogPage() {
  return (
    <PlatformLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Growth Backlog</h1>
            <p className={styles.subtitle}>{BACKLOG_ITEMS.length} items in backlog</p>
          </div>
          <a
            href="https://linear.app/atelier-design/backlog"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linearLink}
          >
            Open in Linear →
          </a>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colId}>ID</span>
            <span className={styles.colTitle}>Title</span>
            <span className={styles.colStatus}>Status</span>
            <span className={styles.colPriority}>Priority</span>
            <span className={styles.colAssignee}>Assignee</span>
            <span className={styles.colDue}>Due</span>
          </div>

          {BACKLOG_ITEMS.map(item => {
            const pri = PRIORITY_LABELS[item.priority];
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.row}
              >
                <span className={styles.colId}>{item.id}</span>
                <span className={styles.colTitle}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  {item.labels.length > 0 && (
                    <span className={styles.labels}>
                      {item.labels.map(l => (
                        <span key={l} className={styles.label}>{l}</span>
                      ))}
                    </span>
                  )}
                </span>
                <span className={styles.colStatus}>
                  <span className={`${styles.statusBadge} ${styles[STATUS_CLASSES[item.status] || 'statusDefault']}`}>
                    {item.status}
                  </span>
                </span>
                <span className={styles.colPriority}>
                  {pri && (
                    <span className={`${styles.priorityBadge} ${styles[pri.className]}`}>
                      {pri.label}
                    </span>
                  )}
                </span>
                <span className={styles.colAssignee}>{item.assignee || '—'}</span>
                <span className={styles.colDue}>{item.dueDate || '—'}</span>
              </a>
            );
          })}
        </div>
      </div>
    </PlatformLayout>
  );
}
