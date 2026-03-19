import Link from 'next/link';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listProjects } from '@/lib/actions/projects';
import styles from './Projects.module.css';

const STATUS_CLASS: Record<string, string> = {
  'Brief': 'statusBrief',
  'In Development': 'statusDevelopment',
  'Sampling': 'statusSampling',
  'Launched': 'statusLaunched',
};

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <PlatformLayout>
      <div className={styles.page}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Projects</h1>
            <p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/projects/new" className={styles.newBtn}>
            + New project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No projects yet</p>
            <p className={styles.emptyText}>Create your first project to get started.</p>
            <Link href="/projects/new" className={styles.newBtn}>
              + New project
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className={styles.card}>
                <div className={styles.cardMeta}>
                  <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[p.status] ?? '']}`}>
                    {p.status}
                  </span>
                  {p.category && <span className={styles.categoryTag}>{p.category}</span>}
                </div>
                <p className={styles.cardName}>{p.name}</p>
                {p.market && <p className={styles.cardMarket}>Market: {p.market}</p>}
                <div className={styles.cardFooter}>
                  <div className={styles.cardStats}>
                    <span>{p.formulations.length} formula{p.formulations.length !== 1 ? 's' : ''}</span>
                    <span>{p.sampleOrders.length} sample{p.sampleOrders.length !== 1 ? 's' : ''}</span>
                  </div>
                  {p.assignments && p.assignments.length > 0 && (
                    <div className={styles.cardAvatars}>
                      {p.assignments.slice(0, 3).map((a) => (
                        <div key={a.user.id} className={styles.cardAvatar} title={`${a.user.name}${a.role === 'lead' ? ' (Lead)' : ''}`}>
                          {(a.user.name || '?').charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {p.assignments.length > 3 && (
                        <div className={styles.cardAvatarMore}>+{p.assignments.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </PlatformLayout>
  );
}
