'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { advanceStatus } from '@/lib/actions/samples';
import styles from './Samples.module.css';

const STAGES = ['Pending', 'In Production', 'Shipped', 'Delivered'];
const FILTER_TABS = ['All', 'In Progress', 'Shipped', 'Delivered'];

type Order = {
  id: string;
  reference: string;
  status: string;
  quantity: number;
  format: string | null;
  shippingAddress: string | null;
  notes: string | null;
  createdAt: Date;
  formulation: { id: string; name: string; version: string; category: string | null } | null;
  project: { id: string; name: string } | null;
  creator: { name: string | null; email: string | null } | null;
  reviews: { id: string; overall: number | null; createdAt: Date }[];
};

function stageIndex(status: string): number {
  const idx = STAGES.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function SamplesClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = orders.filter(o => {
    if (filterTab === 'All') return true;
    const stage = stageIndex(o.status);
    if (filterTab === 'In Progress') return stage < 2;
    if (filterTab === 'Shipped') return stage === 2;
    if (filterTab === 'Delivered') return stage === 3;
    return true;
  });

  const counts = {
    All: orders.length,
    'In Progress': orders.filter(o => stageIndex(o.status) < 2).length,
    Shipped: orders.filter(o => stageIndex(o.status) === 2).length,
    Delivered: orders.filter(o => stageIndex(o.status) === 3).length,
  };

  const toggle = (id: string) => setExpanded(e => e === id ? null : id);

  const handleAdvance = (orderId: string) => {
    startTransition(async () => {
      await advanceStatus(orderId);
      router.refresh();
    });
  };

  if (orders.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Sample Orders</h1>
            <p className={styles.pageSubtitle}>0 orders total</p>
          </div>
          <button className={styles.newOrderBtn} onClick={() => router.push('/samples/new')}>
            + New sample order
          </button>
        </div>
        <EmptyState
          icon="samples"
          heading="No sample orders yet"
          description="Create your first sample order to get started."
          ctaLabel="+ New sample order"
          onCtaClick={() => router.push('/samples/new')}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Sample Orders</h1>
          <p className={styles.pageSubtitle}>{orders.length} orders total</p>
        </div>
        <button className={styles.newOrderBtn} onClick={() => router.push('/samples/new')}>
          + New sample order
        </button>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`${styles.filterTab} ${filterTab === tab ? styles.filterTabActive : ''}`}
            onClick={() => setFilterTab(tab)}
          >
            {tab}
            <span className={styles.filterCount}>
              {counts[tab as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className={styles.orderList}>
        {filtered.map(order => {
          const stage = stageIndex(order.status);
          const formulaName = order.formulation?.name ?? 'Unknown formula';
          const version = order.formulation?.version ?? '';
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          });

          return (
            <div key={order.id} className={styles.orderCard}>

              {/* Summary row */}
              <div className={styles.orderSummary} onClick={() => toggle(order.id)}>
                <div className={styles.orderLeft}>
                  <div className={styles.orderTop}>
                    <span className={styles.orderId}>{order.reference}</span>
                    <span className={styles.orderDate}>{dateStr}</span>
                    <StatusBadge stage={stage} />
                  </div>
                  <p className={styles.orderFormula}>{formulaName}</p>
                  <p className={styles.orderMeta}>{order.quantity} units · {order.format ?? 'N/A'} · {version}</p>
                </div>
                <div className={styles.orderRight}>
                  <StageProgress stage={stage} />
                  <span className={styles.expandIcon}>{expanded === order.id ? '\u25B2' : '\u25BC'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className={styles.orderDetail}>
                  <div className={styles.detailGrid}>
                    <DetailRow label="Formula" value={`${formulaName} (${version})`} />
                    <DetailRow label="Quantity" value={`${order.quantity} units`} />
                    <DetailRow label="Format" value={order.format ?? 'N/A'} />
                    {order.shippingAddress && (
                      <DetailRow label="Ship to" value={order.shippingAddress} />
                    )}
                    {order.creator?.email && (
                      <DetailRow label="Contact" value={order.creator.email} />
                    )}
                    {order.project && (
                      <DetailRow label="Project" value={order.project.name} />
                    )}
                    {order.notes && (
                      <DetailRow label="Notes" value={order.notes} />
                    )}
                  </div>

                  {/* Full stage timeline */}
                  <div className={styles.stageTimeline}>
                    {STAGES.map((s, i) => (
                      <div key={s} className={`${styles.stageStep} ${i <= stage ? styles.stageDone : ''} ${i === stage ? styles.stageCurrent : ''}`}>
                        <div className={styles.stageDot} />
                        {i < STAGES.length - 1 && <div className={styles.stageLine} />}
                        <span className={styles.stageLabel}>{s}</span>
                      </div>
                    ))}
                  </div>

                  {/* Advance status button */}
                  {order.status !== 'Delivered' && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        className={styles.reviewLink}
                        onClick={() => handleAdvance(order.id)}
                        disabled={isPending}
                      >
                        {isPending ? 'Advancing...' : `Advance to ${STAGES[stage + 1]} \u2192`}
                      </button>
                    </div>
                  )}

                  {order.status === 'Delivered' && (
                    <div className={styles.deliveredNote}>
                      Sample delivered. <button className={styles.reviewLink} onClick={() => router.push(`/samples/${order.id}/review`)}>Log your review &rarr;</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

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
  if (stage === 3) return <span className={`${styles.badge} ${styles.badgeDelivered}`}>Delivered</span>;
  if (stage === 2) return <span className={`${styles.badge} ${styles.badgeShipped}`}>Shipped</span>;
  if (stage >= 1) return <span className={`${styles.badge} ${styles.badgeProd}`}>In Production</span>;
  return <span className={`${styles.badge} ${styles.badgeReceived}`}>Pending</span>;
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${highlight ? styles.detailHighlight : ''}`}>{value}</span>
    </div>
  );
}
