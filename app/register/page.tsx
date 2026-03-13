'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/Login.module.css';
import { AtelierLogo } from '@/components/icons/Icons';
import { registerAction } from '@/lib/actions/auth';
import { getInviteDetails } from '@/lib/actions/team';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<{
    email: string;
    role: string;
    teamName: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  useEffect(() => {
    if (!inviteToken) return;

    getInviteDetails(inviteToken).then((details) => {
      if (details) {
        setInvite(details);
      } else {
        setInviteError(true);
      }
      setInviteLoading(false);
    });
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get('firstName') as string).trim();
    const lastName = (formData.get('lastName') as string).trim();
    formData.set('name', `${firstName} ${lastName}`);

    if (inviteToken) {
      formData.set('inviteToken', inviteToken);
    }

    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If no error, the server action redirects via signIn
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <AtelierLogo />
        </div>

        {invite && (
          <div className={styles.inviteBanner}>
            You&apos;ve been invited to join <strong>{invite.teamName}</strong> as {invite.role}
          </div>
        )}

        {inviteError && (
          <p className={styles.error}>
            This invite link is invalid or has expired.
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {inviteLoading ? (
          <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>Loading invite details...</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>First name</label>
                <input
                  className={styles.input}
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Last name</label>
                <input
                  className={styles.input}
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                name="email"
                placeholder="Email address"
                defaultValue={invite?.email || ''}
                readOnly={!!invite}
                required
                style={invite ? { backgroundColor: 'var(--slate-100)', color: 'var(--slate-500)' } : undefined}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                name="password"
                placeholder="At least 12 characters (upper, lower, number)"
                minLength={12}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading || inviteError}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className={styles.link}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>

        <p className={styles.footnote}>Platform01 · The future of manufacturing</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <AtelierLogo />
          </div>
          <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>Loading...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
