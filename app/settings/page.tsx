'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './Settings.module.css';
import { getUserProfile, updateProfile, changePassword } from '@/lib/actions/profile';

export default function SettingsPage() {
  const { update: updateSession } = useSession();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const loadProfile = useCallback(async () => {
    const data = await getUserProfile();
    if (data) {
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleProfileSave = async () => {
    setProfileError('');
    setProfileSuccess(false);
    setProfileSaving(true);

    const result = await updateProfile(firstName, lastName, email);
    setProfileSaving(false);

    if (result.error) {
      setProfileError(result.error);
      return;
    }

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
    await updateSession({ name: `${firstName.trim()} ${lastName.trim()}` });
  };

  const handlePasswordSave = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordSaving(false);

    if (result.error) {
      setPasswordError(result.error);
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  if (profileLoading) {
    return (
      <PlatformLayout>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.pageTitle}>Settings</h1>
              <p className={styles.pageSubtitle}>Loading...</p>
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className={styles.page}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>Manage your profile and account</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile details</h2>
          <div className={styles.card}>

            {profileSuccess && (
              <div className={styles.toast}>
                <span className={styles.toastIcon}>✓</span>
                Profile updated successfully
              </div>
            )}

            {profileError && (
              <div className={styles.errorBanner}>{profileError}</div>
            )}

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  className={styles.input}
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  className={styles.input}
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="email">Email address</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>

            <div className={styles.actions}>
              <button
                className={`${styles.primaryBtn} ${profileSaving ? styles.btnDisabled : ''}`}
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Change password</h2>
          <div className={styles.card}>

            {passwordSuccess && (
              <div className={styles.toast}>
                <span className={styles.toastIcon}>✓</span>
                Password changed successfully
              </div>
            )}

            {passwordError && (
              <div className={styles.errorBanner}>{passwordError}</div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                className={styles.input}
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  className={styles.input}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="confirmPassword">Confirm new password</label>
                <input
                  id="confirmPassword"
                  className={styles.input}
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  minLength={6}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={`${styles.primaryBtn} ${passwordSaving ? styles.btnDisabled : ''}`}
                onClick={handlePasswordSave}
                disabled={passwordSaving}
              >
                {passwordSaving ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </PlatformLayout>
  );
}
