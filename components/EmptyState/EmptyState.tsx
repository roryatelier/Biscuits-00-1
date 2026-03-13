import { type ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: 'projects' | 'formulations' | 'samples' | 'packaging' | 'reviews';
  heading: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

const ICONS: Record<string, ReactNode> = {
  projects: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="#b1aaa8" strokeWidth="2"/>
      <path d="M16 18h16M16 24h10M16 30h13" stroke="#b1aaa8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  formulations: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M20 8v12l-8 16a4 4 0 004 4h16a4 4 0 004-4l-8-16V8" stroke="#b1aaa8" strokeWidth="2"/>
      <path d="M16 8h16" stroke="#b1aaa8" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="32" r="2" fill="#b1aaa8"/>
      <circle cx="28" cy="28" r="1.5" fill="#b1aaa8"/>
    </svg>
  ),
  samples: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="14" width="32" height="24" rx="4" stroke="#b1aaa8" strokeWidth="2"/>
      <path d="M8 22h32" stroke="#b1aaa8" strokeWidth="2"/>
      <circle cx="16" cy="30" r="2" fill="#b1aaa8"/>
    </svg>
  ),
  packaging: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="12" y="10" width="24" height="30" rx="3" stroke="#b1aaa8" strokeWidth="2"/>
      <path d="M12 20h24" stroke="#b1aaa8" strokeWidth="2"/>
      <path d="M20 10v10M28 10v10" stroke="#b1aaa8" strokeWidth="2"/>
    </svg>
  ),
  reviews: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 6l5.5 11.2L42 19l-9 8.8L35.1 40 24 34l-11.1 6L15 27.8 6 19l12.5-1.8L24 6z" stroke="#b1aaa8" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  ),
};

export default function EmptyState({ icon, heading, description, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>{ICONS[icon]}</div>
      <h3 className={styles.heading}>{heading}</h3>
      <p className={styles.description}>{description}</p>
      {ctaLabel && onCtaClick && (
        <button className={styles.cta} onClick={onCtaClick}>{ctaLabel}</button>
      )}
    </div>
  );
}
