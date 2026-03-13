'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './Samples.module.css';

const STAGES = ['Received', 'In Production', 'Quality Check', 'Shipped', 'Delivered'];

const ORDERS = [
  {
    id: 'SMP-0012',
    formula: 'Scalp Purify Anti-Dandruff Treatment',
    version: 'v4.0',
    quantity: '100 units',
    format: 'Filled retail unit',
    stage: 1,
    date: '14 Feb 2026',
    tracking: null,
    address: 'Rory G., 12 Innovation Way, London, UK',
    contact: 'rory@maison.co',
  },
  {
    id: 'SMP-0011',
    formula: 'Hydra-Plump Moisture Serum',
    version: 'v2.1',
    quantity: '50 units',
    format: 'Bulk sample',
    stage: 3,
    date: '01 Feb 2026',
    tracking: 'DHL12345678',
    address: 'Rory G., 12 Innovation Way, London, UK',
    contact: 'rory@maison.co',
  },
  {
    id: 'SMP-0010',
    formula: 'Vitamin C Brightening Cleanser',
    version: 'v2.0',
    quantity: '25 units',
    format: 'Filled retail unit',
    stage: 4,
    date: '20 Jan 2026',
    tracking: 'UPS87654321',
    address: 'Rory G., 12 Innovation Way, London, UK',
    contact: 'rory@maison.co',
  },
  {
    id: 'SMP-0009',
    formula: 'Marine Collagen Firming Mask',
    version: 'v1.5',
    quantity: '75 units',
    format: 'Lab prototype',
    stage: 4,
    date: '08 Jan 2026',
    tracking: 'FED98765432',
    address: 'Sara M., 5 Brand Studio, Paris, FR',
    contact: 'sara@maison.co',
  },
];

const FILTER_TABS = ['All', 'In Progress', 'Shipped', 'Delivered'];

export default function SamplesPage() {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = ORDERS.filter(o => {
    if (filterTab === 'All') return true;
    if (filterTab === 'In Progress') return o.stage < 3;
    if (filterTab === 'Shipped') return o.stage === 3;
    if (filterTab === 'Delivered') return o.stage === 4;
    return true;
  });

  const toggle = (id: string) => setExpanded(e => e === id ? null : id);

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Sample Orders</h1>
            <p className={styles.pageSubtitle}>{ORDERS.length} orders total</p>
          </div>
          <button className={styles.newOrderBtn} onClick={() => router.push('/samples/new')}>
            + New sample order
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <div className={styles.filterTabs}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.filterTab} ${filterTab === tab ? styles.filterTabActive : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab}
              <span className={styles.filterCount}>
                {tab === 'All' ? ORDERS.length
                  : tab === 'In Progress' ? ORDERS.filter(o => o.stage < 3).length
                  : tab === 'Shipped' ? ORDERS.filter(o => o.stage === 3).length
                  : ORDERS.filter(o => o.stage === 4).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Order cards ── */}
        <div className={styles.orderList}>
          {filtered.map(order => (
            <div key={order.id} className={styles.orderCard}>

              {/* Summary row */}
              <div className={styles.orderSummary} onClick={() => toggle(order.id)}>
                <div className={styles.orderLeft}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderId}>{order.id}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                    <StatusBadge stage={order.stage} />
                  </div>
                  <p className={styles.orderFormula}>{order.formula}</p>
                  <p className={styles.orderMeta}>{order.quantity} · {order.format} · {order.version}</p>
                </div>
                <div className={styles.orderRight}>
                  <StageProgress stage={order.stage} />
                  <span className={styles.expandIcon}>{expanded === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className={styles.orderDetail}>
                  <div className={styles.detailGrid}>
                    <DetailRow label="Formula" value={`${order.formula} (${order.version})`} />
                    <DetailRow label="Quantity" value={order.quantity} />
                    <DetailRow label="Format" value={order.format} />
                    <DetailRow label="Ship to" value={order.address} />
                    <DetailRow label="Contact" value={order.contact} />
                    {order.tracking && (
                      <DetailRow label="Tracking" value={order.tracking} highlight />
                    )}
                  </div>

                  {/* Full stage timeline */}
                  <div className={styles.stageTimeline}>
                    {STAGES.map((s, i) => (
                      <div key={s} className={`${styles.stageStep} ${i <= order.stage ? styles.stageDone : ''} ${i === order.stage ? styles.stageCurrent : ''}`}>
                        <div className={styles.stageDot} />
                        {i < STAGES.length - 1 && <div className={styles.stageLine} />}
                        <span className={styles.stageLabel}>{s}</span>
                      </div>
                    ))}
                  </div>

                  {order.stage === 4 && (
                    <div className={styles.deliveredNote}>
                      Sample delivered. <button className={styles.reviewLink} onClick={() => router.push(`/samples/${order.id}/review`)}>Log your review →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <EmptyState
              icon="samples"
              heading="No orders match this filter"
              description="Try changing or clearing your filter to see sample orders."
              ctaLabel="View all orders"
              onCtaClick={() => setFilterTab('All')}
            />
          )}
        </div>

      </div>
    </PlatformLayout>
  );
}

function StageProgress({ stage }: { stage: number }) {
  return (
    <div className={styles.stageBar}>
      {STAGES.map((s, i) => (
        <div
          key={s}
          className={`${styles.stageBarSeg} ${i <= stage ? styles.stageBarDone : ''}`}
          title={s}
        />
      ))}
      <span className={styles.stageBarLabel}>{STAGES[stage]}</span>
    </div>
  );
}

function StatusBadge({ stage }: { stage: number }) {
  if (stage === 4) return <span className={`${styles.badge} ${styles.badgeDelivered}`}>Delivered</span>;
  if (stage === 3) return <span className={`${styles.badge} ${styles.badgeShipped}`}>Shipped</span>;
  if (stage >= 1) return <span className={`${styles.badge} ${styles.badgeProd}`}>In Production</span>;
  return <span className={`${styles.badge} ${styles.badgeReceived}`}>Received</span>;
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${highlight ? styles.detailHighlight : ''}`}>{value}</span>
    </div>
  );
}
