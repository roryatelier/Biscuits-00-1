import Link from 'next/link';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { BeakerIcon, BoxIcon, SparkleIcon, ClipboardIcon } from '@/components/icons/Icons';
import { listProjects } from '@/lib/actions/projects';
import { listSampleOrders } from '@/lib/actions/samples';
import styles from './Dashboard.module.css';
import DashboardClient from './DashboardClient';

const STATUS_COLORS: Record<string, string> = {
  'Brief': 'statusScoping',
  'In Development': 'statusDev',
  'In Scoping': 'statusScoping',
  'Sampling': 'statusTest',
  'In Testing': 'statusTest',
  'Launched': 'statusLaunched',
};

const ORDER_COLORS: Record<string, string> = {
  'Pending': 'orderReceived',
  'In Production': 'orderProd',
  'Shipped': 'orderShipped',
  'Delivered': 'orderDelivered',
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default async function DashboardPage() {
  const [projects, sampleOrders] = await Promise.all([
    listProjects(),
    listSampleOrders(),
  ]);

  // Stats
  const totalProjects = projects.length;
  const totalFormulations = projects.reduce((acc, p) => acc + p.formulations.length, 0);
  const totalSamples = sampleOrders.length;
  const deliveredSamples = sampleOrders.filter(o => o.status === 'Delivered').length;

  // Recent projects (top 3)
  const recentProjects = projects.slice(0, 3);

  // Recent sample orders (top 3)
  const recentOrders = sampleOrders.slice(0, 3);

  // Activity feed: combine project creations and sample order events, take 5 most recent
  type Activity = { id: string; text: string; time: string; date: Date };
  const activities: Activity[] = [];

  for (const p of projects) {
    activities.push({
      id: `project-${p.id}`,
      text: `Project "${p.name}" created`,
      time: timeAgo(p.createdAt),
      date: p.createdAt,
    });
  }

  for (const o of sampleOrders) {
    activities.push({
      id: `order-${o.id}`,
      text: `Sample order ${o.reference} — ${o.status}${o.formulation ? ` (${o.formulation.name})` : ''}`,
      time: timeAgo(o.createdAt),
      date: o.createdAt,
    });
  }

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivities = activities.slice(0, 5);

  // Serialize dates for client component
  const serializedProjects = recentProjects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    category: p.category,
    formulaCount: p.formulations.length,
    updatedAt: timeAgo(p.updatedAt),
  }));

  const serializedOrders = recentOrders.map(o => ({
    id: o.id,
    reference: o.reference,
    formulaName: o.formulation?.name ?? 'Unknown',
    status: o.status,
    date: o.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  }));

  return (
    <PlatformLayout>
      <div className={styles.page}>

        <DashboardClient
          totalProjects={totalProjects}
          totalFormulations={totalFormulations}
          totalSamples={totalSamples}
          deliveredSamples={deliveredSamples}
          projects={serializedProjects}
          orders={serializedOrders}
          activities={recentActivities.map(a => ({ id: a.id, text: a.text, time: a.time }))}
          statusColors={STATUS_COLORS}
          orderColors={ORDER_COLORS}
        />

      </div>
    </PlatformLayout>
  );
}
