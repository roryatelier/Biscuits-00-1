import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant: 'card-grid' | 'table' | 'list' | 'detail';
  count?: number;
}

export default function Skeleton({ variant, count = 6 }: SkeletonProps) {
  if (variant === 'card-grid') {
    return (
      <div className={styles.cardGrid} aria-busy="true" aria-label="Loading content">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={`${styles.block} ${styles.cardImage}`} />
            <div className={styles.cardBody}>
              <div className={`${styles.block} ${styles.lineSm}`} />
              <div className={`${styles.block} ${styles.lineMd}`} />
              <div className={`${styles.block} ${styles.lineXs}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={styles.tableWrap} aria-busy="true" aria-label="Loading table">
        <div className={styles.tableHeader}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${styles.block} ${styles.thBlock}`} />
          ))}
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.tableRow}>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className={`${styles.block} ${styles.tdBlock}`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={styles.list} aria-busy="true" aria-label="Loading list">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.listItem}>
            <div className={`${styles.block} ${styles.listAvatar}`} />
            <div className={styles.listContent}>
              <div className={`${styles.block} ${styles.lineMd}`} />
              <div className={`${styles.block} ${styles.lineLg}`} />
              <div className={`${styles.block} ${styles.lineXs}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* detail */
  return (
    <div className={styles.detail} aria-busy="true" aria-label="Loading details">
      <div className={`${styles.block} ${styles.detailHeader}`} />
      <div className={`${styles.block} ${styles.detailTitle}`} />
      <div className={`${styles.block} ${styles.detailSub}`} />
      <div className={styles.detailBody}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${styles.block} ${styles.detailRow}`} />
        ))}
      </div>
    </div>
  );
}
