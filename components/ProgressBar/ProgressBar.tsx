import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  variant?: 'continuous' | 'segmented';
  value: number;
  max?: number;
  segments?: number;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  variant = 'continuous',
  value,
  max = 100,
  segments = 5,
  label,
  showPercent = false,
}: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  if (variant === 'segmented') {
    const completed = Math.min(value, segments);
    return (
      <div className={styles.wrapper}>
        <div className={styles.segmentedBar}>
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`${styles.segment} ${i < completed ? styles.segmentDone : ''}`}
            />
          ))}
        </div>
        {label && <span className={styles.label}>{label}</span>}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.meta}>
        {label && <span className={styles.label}>{label}</span>}
        {showPercent && <span className={styles.percent}>{pct}%</span>}
      </div>
    </div>
  );
}
