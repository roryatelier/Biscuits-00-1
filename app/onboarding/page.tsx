'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './Onboarding.module.css';
import { AtelierLogo } from '@/components/icons/Icons';
import { completeOnboarding } from '@/lib/actions/auth';
import { getAuthContext } from '@/lib/actions/context';

const TEMPLATES = [
  { id: 'anti-dandruff', name: 'Anti-Dandruff Shampoo', category: 'shampoo', market: 'uk', icon: '🧴' },
  { id: 'vitc-serum', name: 'Vitamin C Serum', category: 'serum', market: 'eu', icon: '✨' },
  { id: 'spf-moisturiser', name: 'SPF Moisturiser', category: 'moisturiser', market: 'global', icon: '☀️' },
  { id: 'scratch', name: 'Start from scratch', category: '', market: '', icon: '✏️' },
];

const STEPS = [
  { id: 1, label: 'Company profile' },
  { id: 2, label: 'Invite a teammate' },
  { id: 3, label: 'Create first project' },
];

type FormData = {
  companyName: string;
  industry: string;
  role: string;
  inviteEmail: string;
  inviteRole: string;
  projectName: string;
  productCategory: string;
  targetMarket: string;
};

const EMPTY_FORM: FormData = {
  companyName: '',
  industry: '',
  role: '',
  inviteEmail: '',
  inviteRole: 'editor',
  projectName: '',
  productCategory: '',
  targetMarket: '',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  // Redirect invitees to the invited onboarding flow
  useEffect(() => {
    getAuthContext().then((ctx) => {
      if (ctx && ctx.role !== 'admin') {
        router.replace('/onboarding/invited');
      }
    });
  }, [router]);

  // Restore progress from localStorage
  useEffect(() => {
    const savedDone = localStorage.getItem('atelier_ob_done');
    if (savedDone === 'true') { setDone(true); return; }

    const savedStep = localStorage.getItem('atelier_ob_step');
    const savedCompleted = localStorage.getItem('atelier_ob_completed');
    const savedForm = localStorage.getItem('atelier_ob_form');

    if (savedStep) setStep(parseInt(savedStep));
    if (savedCompleted) setCompleted(JSON.parse(savedCompleted));
    if (savedForm) setForm(JSON.parse(savedForm));
  }, []);

  const persist = (nextStep: number, nextCompleted: number[], nextForm: FormData, isDone = false) => {
    localStorage.setItem('atelier_ob_step', String(nextStep));
    localStorage.setItem('atelier_ob_completed', JSON.stringify(nextCompleted));
    localStorage.setItem('atelier_ob_form', JSON.stringify(nextForm));
    if (isDone) localStorage.setItem('atelier_ob_done', 'true');
  };

  const advance = (markComplete = true) => {
    const nextCompleted = markComplete ? [...completed, step] : [...completed];
    if (step >= STEPS.length) {
      setCompleted(nextCompleted);
      setDone(true);
      persist(step, nextCompleted, form, true);
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      setCompleted(nextCompleted);
      persist(nextStep, nextCompleted, form);
    }
    setSkipConfirm(false);
  };

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  const finish = async () => {
    localStorage.removeItem('atelier_ob_step');
    localStorage.removeItem('atelier_ob_done');
    localStorage.removeItem('atelier_ob_completed');
    localStorage.removeItem('atelier_ob_form');
    if (session?.user?.id) {
      await completeOnboarding(session.user.id);
      await updateSession({ onboardingComplete: true });
    }
    router.push('/innovation/chat');
  };

  return (
    <div className={styles.page}>

      {/* ── Left sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <AtelierLogo />
        </div>

        <nav className={styles.stepList}>
          {STEPS.map((s) => {
            const isDone = completed.includes(s.id) || done;
            const isActive = step === s.id && !done;
            return (
              <div
                key={s.id}
                className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}
              >
                <div className={styles.stepDot}>
                  {isDone ? <CheckSVG /> : <span>{s.id}</span>}
                </div>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            );
          })}
        </nav>

        <button className={styles.exitLink} onClick={() => router.push('/innovation/chat')}>
          Save &amp; exit
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className={styles.main}>
        {done ? (
          /* ── Completion screen ── */
          <div className={styles.completion}>
            <div className={styles.completionIcon}>
              <CheckCircleSVG />
            </div>
            <h1 className={styles.completionTitle}>Your workspace is ready.</h1>
            <p className={styles.completionSub}>
              You're all set to start innovating. Your projects, formulations, and samples all live in one place.
            </p>
            <button className={styles.finishBtn} onClick={finish}>
              Go to platform →
            </button>
          </div>
        ) : (
          /* ── Step form ── */
          <div className={styles.stepContent}>
            <div className={styles.stepMeta}>Step {step} of {STEPS.length}</div>

            {step === 1 && (
              <>
                <h1 className={styles.stepTitle}>Let's set up your workspace</h1>
                <p className={styles.stepSub}>Tell us about your company to personalise Atelier.</p>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Company name</label>
                  <input className={styles.input} type="text" placeholder="e.g. Maison Blanc" {...field('companyName')} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Industry</label>
                  <select className={styles.select} {...field('industry')}>
                    <option value="">Select industry</option>
                    <option value="skincare">Skincare</option>
                    <option value="haircare">Haircare</option>
                    <option value="bodycare">Bodycare</option>
                    <option value="fragrance">Fragrance</option>
                    <option value="colour">Colour cosmetics</option>
                    <option value="wellness">Wellness supplements</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Your role</label>
                  <select className={styles.select} {...field('role')}>
                    <option value="">Select your role</option>
                    <option value="brand-manager">Brand manager</option>
                    <option value="product-developer">Product developer</option>
                    <option value="formulator">Formulator</option>
                    <option value="packaging">Packaging manager</option>
                    <option value="founder">Founder / CEO</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className={styles.stepTitle}>Invite someone to collaborate</h1>
                <p className={styles.stepSub}>
                  Working with a team? Add them now — you can always add more later.
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Email address</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="colleague@company.com"
                    {...field('inviteEmail')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Their role</label>
                  <select className={styles.select} {...field('inviteRole')}>
                    <option value="viewer">Viewer — can view only</option>
                    <option value="editor">Editor — can edit projects</option>
                    <option value="admin">Admin — full access</option>
                  </select>
                </div>
                <p className={styles.helpText}>They'll receive an email invitation to join your workspace.</p>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className={styles.stepTitle}>Start your first innovation project</h1>
                <p className={styles.stepSub}>
                  Projects keep your formulations, packaging, and samples together in one place.
                </p>

                <div className={styles.templateGrid}>
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      className={`${styles.templateCard} ${selectedTemplate === t.id ? styles.templateCardSelected : ''}`}
                      onClick={() => {
                        setSelectedTemplate(t.id);
                        if (t.id === 'scratch') {
                          setForm(prev => ({ ...prev, projectName: '', productCategory: '', targetMarket: '' }));
                        } else {
                          setForm(prev => ({ ...prev, projectName: t.name, productCategory: t.category, targetMarket: t.market }));
                        }
                      }}
                    >
                      <div className={styles.templateIcon}>{t.icon}</div>
                      <div className={styles.templateName}>{t.name}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Project name</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Q1 2026 Anti-Dandruff Launch"
                    {...field('projectName')}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Product category</label>
                  <select className={styles.select} {...field('productCategory')}>
                    <option value="">Select category</option>
                    <option value="shampoo">Shampoo</option>
                    <option value="conditioner">Conditioner</option>
                    <option value="serum">Serum</option>
                    <option value="moisturiser">Moisturiser</option>
                    <option value="cleanser">Cleanser</option>
                    <option value="toner">Toner</option>
                    <option value="mask">Mask</option>
                    <option value="spf">SPF</option>
                    <option value="body-lotion">Body lotion</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Target market</label>
                  <select className={styles.select} {...field('targetMarket')}>
                    <option value="">Select market</option>
                    <option value="uk">United Kingdom</option>
                    <option value="eu">European Union</option>
                    <option value="us">United States</option>
                    <option value="ca">Canada</option>
                    <option value="au">Australia</option>
                    <option value="jp">Japan</option>
                    <option value="cn">China</option>
                    <option value="kr">South Korea</option>
                    <option value="global">Global</option>
                  </select>
                </div>
              </>
            )}

            {/* Actions */}
            {!skipConfirm ? (
              <div className={styles.actions}>
                <button className={styles.skipBtn} onClick={() => setSkipConfirm(true)}>
                  Skip this step
                </button>
                <button className={styles.continueBtn} onClick={() => advance()}>
                  {step === STEPS.length ? 'Finish setup' : 'Continue'}
                </button>
              </div>
            ) : (
              <div className={styles.skipConfirm}>
                <span className={styles.skipQuestion}>Skip this step?</span>
                <button className={styles.skipYes} onClick={() => advance(false)}>
                  Yes, skip
                </button>
                <button className={styles.skipCancel} onClick={() => setSkipConfirm(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </main>
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

function CheckCircleSVG() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="36" fill="#2563eb" fillOpacity="0.08" />
      <circle cx="36" cy="36" r="26" fill="#2563eb" />
      <path d="M23 36L32 45L50 27" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
