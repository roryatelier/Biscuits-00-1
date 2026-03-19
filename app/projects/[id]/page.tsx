import { notFound } from 'next/navigation';
import Link from 'next/link';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { getProject } from '@/lib/actions/projects';
import { listActivities } from '@/lib/actions/activity';
import { listComments } from '@/lib/actions/comments';
import { getAuthContext } from '@/lib/actions/context';
import styles from './ProjectDetail.module.css';
import collabStyles from './Collaboration.module.css';
import ProjectMilestones from './ProjectMilestones';
import ActivityFeed from './ActivityFeed';
import Discussion from './Discussion';
import ShareButton from './ShareButton';
import DocumentsSection from './DocumentsSection';
import { listProjectDocuments } from '@/lib/actions/documents';

const STATUS_ORDER = ['Brief', 'In Development', 'Sampling', 'Launched'];

interface Milestone {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'upcoming';
}

function deriveMilestones(projectStatus: string): Milestone[] {
  const currentIdx = STATUS_ORDER.indexOf(projectStatus);
  return STATUS_ORDER.map((name, i) => ({
    id: String(i + 1),
    name,
    status: i < currentIdx ? 'completed' as const : i === currentIdx ? 'active' as const : 'upcoming' as const,
  }));
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project, activityResult, comments, ctx, documents] = await Promise.all([
    getProject(id),
    listActivities(id, { take: 20, skip: 0 }),
    listComments('project', id),
    getAuthContext(),
    listProjectDocuments(id),
  ]);

  if (!project) notFound();

  const milestones = deriveMilestones(project.status);
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  const claims: string[] = project.claims ? (() => { try { return JSON.parse(project.claims); } catch { return []; } })() : [];

  const createdDate = project.createdAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* -- Breadcrumb -- */}
        <div className={styles.breadcrumb}>
          <Link href="/projects" className={styles.breadLink}>Projects</Link>
          <span className={styles.breadSep}>›</span>
          <span>{project.name}</span>
        </div>

        {/* -- Header -- */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerMeta}>
              <span className={styles.statusBadge}>{project.status}</span>
              {project.category && <span className={styles.categoryTag}>{project.category}</span>}
            </div>
            <h1 className={styles.title}>{project.name}</h1>
            <p className={styles.subtitle}>
              Created {createdDate} · {project.formulations.length} formula{project.formulations.length !== 1 ? 's' : ''} · {project.sampleOrders.length} sample order{project.sampleOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={styles.headerRight}>
            <ShareButton projectId={id} />
            {/* Assignees */}
            {project.assignments && project.assignments.length > 0 ? (
              <div className={collabStyles.assigneesRow}>
                {project.assignments.map((a) => (
                  <div key={a.user.id} className={collabStyles.assigneeChip}>
                    <div className={collabStyles.assigneeChipAvatar}>
                      {(a.user.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span>{a.user.name || 'Unknown'}</span>
                    {a.role === 'lead' && <span className={collabStyles.leadBadge}>Lead</span>}
                  </div>
                ))}
              </div>
            ) : project.creator ? (
              <div className={styles.teamAvatars}>
                <div className={styles.avatar} title={`${project.creator.name} — Creator`}>
                  {project.creator.name?.charAt(0) ?? '?'}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* -- Description & details -- */}
        {(project.description || project.market || claims.length > 0) && (
          <div className={`${styles.progressSection} ${styles.detailsSection}`}>
            {project.description && (
              <div className={styles.detailBlock}>
                <p className={styles.detailLabel}>Description</p>
                <p className={styles.detailText}>{project.description}</p>
              </div>
            )}
            {project.market && (
              <div className={styles.detailBlock}>
                <p className={styles.detailLabel}>Market</p>
                <p className={styles.detailText}>{project.market}</p>
              </div>
            )}
            {claims.length > 0 && (
              <div className={styles.detailBlock}>
                <p className={styles.detailLabel}>Claims</p>
                <div className={styles.claimsRow}>
                  {claims.map((c: string) => (
                    <span key={c} className={styles.claimChip}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -- Progress bar -- */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Project progress</span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressSub}>{completedCount} of {milestones.length} milestones completed</p>
        </div>

        {/* -- Milestones -- */}
        <ProjectMilestones milestones={milestones} />

        {/* -- Formulations -- */}
        <div className={styles.milestonesSection}>
          <h2 className={styles.sectionTitle}>Formulations ({project.formulations.length})</h2>
          {project.formulations.length === 0 ? (
            <div className={styles.milestoneCard}>
              <div className={styles.milestoneHeader}>
                <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>No formulations linked to this project yet.</p>
              </div>
            </div>
          ) : (
            <div className={styles.milestoneList}>
              {project.formulations.map((pf) => (
                <Link
                  key={pf.formulation.id}
                  href={`/formulations/${pf.formulation.id}`}
                  className={styles.milestoneCard}
                  style={{ textDecoration: 'none' }}
                >
                  <div className={styles.milestoneHeader}>
                    <div className={styles.milestoneLeft}>
                      <div>
                        <p className={styles.milestoneName}>{pf.formulation.name}</p>
                        <p className={styles.milestoneMeta}>
                          {pf.formulation.category && `${pf.formulation.category} · `}v{pf.formulation.version} · {pf.formulation.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* -- Sample Orders -- */}
        <div className={styles.milestonesSection}>
          <h2 className={styles.sectionTitle}>Sample Orders ({project.sampleOrders.length})</h2>
          {project.sampleOrders.length === 0 ? (
            <div className={styles.milestoneCard}>
              <div className={styles.milestoneHeader}>
                <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>No sample orders for this project yet.</p>
              </div>
            </div>
          ) : (
            <div className={styles.milestoneList}>
              {project.sampleOrders.map((so) => (
                <Link
                  key={so.id}
                  href={`/samples/${so.id}`}
                  className={styles.milestoneCard}
                  style={{ textDecoration: 'none' }}
                >
                  <div className={styles.milestoneHeader}>
                    <div className={styles.milestoneLeft}>
                      <div>
                        <p className={styles.milestoneName}>
                          {so.formulation?.name ?? 'Unknown formulation'}
                        </p>
                        <p className={styles.milestoneMeta}>
                          {so.reference} · {so.status}
                          {so.reviews.length > 0 && ` · ${so.reviews.length} review${so.reviews.length !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    <span className={`${styles.milestoneBadge} ${
                      so.status === 'Delivered' ? styles.badgeCompleted :
                      so.status === 'Pending' ? styles.badgeUpcoming :
                      styles.badgeActive
                    }`}>
                      {so.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* -- Documents -- */}
        <DocumentsSection
          projectId={id}
          initialDocuments={documents}
        />

        {/* -- Discussion (Comments) -- */}
        <Discussion
          entityType="project"
          entityId={id}
          initialComments={comments}
          currentUserId={ctx?.userId ?? ''}
        />

        {/* -- Activity Feed -- */}
        <ActivityFeed
          projectId={id}
          initialActivities={activityResult.activities}
          initialTotal={activityResult.total}
          initialHasMore={activityResult.hasMore}
        />

      </div>
    </PlatformLayout>
  );
}
