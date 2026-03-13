import styles from './InDevelopment.module.css';
import { AtelierLogo } from '@/components/icons/Icons';

export default function InDevelopmentPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <AtelierLogo />
        </div>
        <h1 className={styles.title}>Coming Soon</h1>
        <p className={styles.subtitle}>This feature is currently in development.</p>
        <a href="/innovation/chat" className={styles.backLink}>← Back to Platform</a>
      </div>
    </div>
  );
}
