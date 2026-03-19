'use client';

import { useState } from 'react';
import styles from './ProjectDetail.module.css';
import ShareModal from './ShareModal';

export default function ShareButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={styles.actionBtn} onClick={() => setOpen(true)}>
        Share
      </button>
      <ShareModal projectId={projectId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
