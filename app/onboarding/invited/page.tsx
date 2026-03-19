'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AtelierLogo, SparkleIcon, FormulationIcon, LocationPinIcon, ClipboardIcon } from '@/components/icons/Icons';
import { getOnboardingContext } from '@/lib/actions/context';
import { completeOnboarding } from '@/lib/actions/auth';
import styles from './InvitedOnboarding.module.css';

type OnboardingData = NonNullable<Awaited<ReturnType<typeof getOnboardingContext>>>;

const STEPS = [
  { id: 1, label: 'Profile' },
  { id: 2, label: 'Your projects' },
  { id: 3, label: 'How it works' },
  { id: 4, label: 'Dive in' },
];

const ROLES = [
  { value: 'brand-manager', label: 'Brand manager' },
  { value: 'product-developer', label: 'Product developer' },
  { value: 'formulator', label: 'Formulator' },
  { value: 'packaging', label: 'Packaging manager' },
  { value: 'founder', label: 'Founder / CEO' },
  { value: 'other', label: 'Other' },
];

const STATUS_CLASSES: Record<string, string> = {
  'Brief': 'statusBrief',
  'In Development': 'statusDev',
  'Sampling': 'statusSampling',
  'Launched': 'statusLaunched',
};

export default function InvitedOnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([]);

  useEffect(() => {
    getOnboardingContext().then((ctx) => {
      if (!ctx) {
        router.push('/login');
        return;
      }
      setData(ctx);
      setLoading(false);
    });
  }, [router]);

  const markVisited = (s: number) => {
    if (!visitedSteps.includes(s)) setVisitedSteps([...visitedSteps, s]);
  };

  const advance = () => {
    markVisited(step);
    if (step < STEPS.length) setStep(step + 1);
  };

  const finish = async (destination: string) => {
    if (session?.user?.id) {
      await completeOnboarding(session.user.id);
      await updateSession({ onboardingComplete: true });
    }
    router.push(destination);
  };

  if (loading || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const firstName = data.userName.split(' ')[0];

  return (
    <div className={styles.page}>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <AtelierLogo />
        </div>

        <nav className={styles.stepList}>
          {STEPS.map((s) => {
            const isDone = visitedSteps.includes(s.id);
            const isActive = step === s.id;
            return (
              <div
                key={s.id}
                className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isDone && !isActive ? styles.stepDone : ''}`}
              >
                <div className={styles.stepDot}>
                  {isDone && !isActive ? <CheckSVG /> : <span>{s.id}</span>}
                </div>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.stepContent}>

          {/* ── Step 1: Welcome + Profile ── */}
          {step === 1 && (
            <>
              <h1 className={styles.title}>Welcome to Atelier, {firstName}.</h1>
              <p className={styles.subtitle}>You've joined <strong>{data.teamName}</strong>.</p>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>What best describes your role?</label>
                <div className={styles.roleGrid}>
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      className={`${styles.roleCard} ${role === r.value ? styles.roleSelected : ''}`}
                      onClick={() => setRole(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.continueBtn} onClick={advance}>
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Your Team's Projects ── */}
          {step === 2 && (
            <>
              <h1 className={styles.title}>Here's what your team is working on</h1>
              <p className={styles.subtitle}>
                {data.projects.length} active project{data.projects.length !== 1 ? 's' : ''}
                {data.assignedProjectIds.length > 0 && (
                  <> — you're assigned to <strong>{data.assignedProjectIds.length}</strong> of them</>
                )}
              </p>

              <div className={styles.projectGrid}>
                {data.projects.map((p) => {
                  const isAssigned = data.assignedProjectIds.includes(p.id);
                  const isExpanded = expandedProject === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`${styles.projectCard} ${isAssigned ? styles.projectAssigned : ''} ${isExpanded ? styles.projectExpanded : ''}`}
                      onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                    >
                      <div className={styles.projectCardHeader}>
                        <div className={styles.projectMeta}>
                          <span className={`${styles.statusBadge} ${styles[STATUS_CLASSES[p.status] ?? '']}`}>
                            {p.status}
                          </span>
                          {p.category && <span className={styles.categoryTag}>{p.category}</span>}
                        </div>
                        {isAssigned && <span className={styles.youBadge}>You</span>}
                      </div>
                      <p className={styles.projectName}>{p.name}</p>
                      <p className={styles.projectStat}>
                        {p.formulationCount} formulation{p.formulationCount !== 1 ? 's' : ''}
                        {' · '}
                        {p.assignees.length} member{p.assignees.length !== 1 ? 's' : ''}
                      </p>
                      {isExpanded && (
                        <div className={styles.projectExpandedContent}>
                          {p.description && <p className={styles.projectDesc}>{p.description}</p>}
                          <button
                            className={styles.viewProjectLink}
                            onClick={(e) => { e.stopPropagation(); finish(`/projects/${p.id}`); }}
                          >
                            View project →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.actions}>
                <button className={styles.skipBtn} onClick={advance}>Skip</button>
                <button className={styles.continueBtn} onClick={advance}>Continue</button>
              </div>
            </>
          )}

          {/* ── Step 3: How Atelier Works ── */}
          {step === 3 && (
            <>
              <h1 className={styles.title}>How Atelier works</h1>
              <p className={styles.subtitle}>Four steps from idea to product</p>

              <div className={styles.tourGrid}>
                <TourCard
                  icon={<SparkleIcon />}
                  number={1}
                  title="Projects"
                  desc="Create a brief, set your target market and claims"
                />
                <div className={styles.tourArrow}>→</div>
                <TourCard
                  icon={<FormulationIcon />}
                  number={2}
                  title="Formulations"
                  desc="Browse the catalog or build custom formulations"
                />
                <div className={styles.tourArrow}>→</div>
                <TourCard
                  icon={<LocationPinIcon />}
                  number={3}
                  title="Samples"
                  desc="Order physical samples and track delivery"
                />
                <div className={styles.tourArrow}>→</div>
                <TourCard
                  icon={<ClipboardIcon />}
                  number={4}
                  title="Reviews"
                  desc="Score texture, scent, and colour — close the feedback loop"
                />
              </div>

              <p className={styles.tourHint}>
                This is the core innovation loop. Everything in Atelier connects back to these four steps.
              </p>

              <div className={styles.actions}>
                <button className={styles.skipBtn} onClick={advance}>Skip</button>
                <button className={styles.continueBtn} onClick={advance}>Continue</button>
              </div>
            </>
          )}

          {/* ── Step 4: Take Your First Action ── */}
          {step === 4 && (
            <>
              <h1 className={styles.title}>Dive in</h1>
              <p className={styles.subtitle}>Pick something to start with — you can do everything else from the dashboard</p>

              <div className={styles.actionGrid}>
                <button className={styles.actionCard} onClick={() => finish('/formulations')}>
                  <div className={styles.actionIcon}><FormulationIcon /></div>
                  <div>
                    <p className={styles.actionLabel}>Browse formulations</p>
                    <p className={styles.actionDesc}>Explore the formulation catalog</p>
                  </div>
                  <span className={styles.actionArrow}>→</span>
                </button>

                {data.deliveredSample && (
                  <button className={styles.actionCard} onClick={() => finish(`/samples/${data.deliveredSample!.id}/review`)}>
                    <div className={styles.actionIcon}><ClipboardIcon /></div>
                    <div>
                      <p className={styles.actionLabel}>Review a sample</p>
                      <p className={styles.actionDesc}>Score {data.deliveredSample.reference}</p>
                    </div>
                    <span className={styles.actionArrow}>→</span>
                  </button>
                )}

                {data.assignedProjectIds.length > 0 && (
                  <button
                    className={styles.actionCard}
                    onClick={() => finish(`/projects/${data.assignedProjectIds[0]}`)}
                  >
                    <div className={styles.actionIcon}><SparkleIcon /></div>
                    <div>
                      <p className={styles.actionLabel}>Comment on a project</p>
                      <p className={styles.actionDesc}>
                        Join the conversation on {data.projects.find(p => p.id === data.assignedProjectIds[0])?.name}
                      </p>
                    </div>
                    <span className={styles.actionArrow}>→</span>
                  </button>
                )}

                {!data.deliveredSample && data.assignedProjectIds.length === 0 && (
                  <>
                    <button className={styles.actionCard} onClick={() => finish('/projects')}>
                      <div className={styles.actionIcon}><SparkleIcon /></div>
                      <div>
                        <p className={styles.actionLabel}>Explore projects</p>
                        <p className={styles.actionDesc}>See what your team is working on</p>
                      </div>
                      <span className={styles.actionArrow}>→</span>
                    </button>
                    <button className={styles.actionCard} onClick={() => finish('/packaging')}>
                      <div className={styles.actionIcon}><LocationPinIcon /></div>
                      <div>
                        <p className={styles.actionLabel}>View packaging options</p>
                        <p className={styles.actionDesc}>Browse available formats and materials</p>
                      </div>
                      <span className={styles.actionArrow}>→</span>
                    </button>
                  </>
                )}
              </div>

              <button className={styles.skipDashboard} onClick={() => finish('/dashboard')}>
                Skip to dashboard →
              </button>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

function TourCard({ icon, number, title, desc }: { icon: React.ReactNode; number: number; title: string; desc: string }) {
  return (
    <div className={styles.tourCard}>
      <div className={styles.tourCardIcon}>{icon}</div>
      <p className={styles.tourCardTitle}>{title}</p>
      <p className={styles.tourCardDesc}>{desc}</p>
    </div>
  );
}

function CheckSVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
