'use client';

import { useState } from 'react';
import styles from './LeftPanel.module.css';
import ChatInput from '../ChatInput/ChatInput';
import { AtelierABadge, ChevronDownIcon } from '../icons/Icons';

export default function LeftPanel() {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className={styles.leftPanel}>

      {/* Project title */}
      <div className={styles.titleHeader}>
        <h1 className={styles.projectTitle}>Anti-Dandruff Shampoo Innovation Project</h1>
      </div>

      {/* Messages / chat thread */}
      <div className={styles.messagesArea}>

        {/* Date divider */}
        <div className={styles.dateDivider}>
          <span className={styles.dateDividerLabel}>Today</span>
        </div>

        <div className={styles.msgPosition}>
          <div className={styles.typewriterBlock}>

            {/* Atelier AI message */}
            <div className={styles.pWithLogo}>
              <AtelierABadge className={styles.aIcon} />
              <div className={styles.typewriterText}>
                <span className={styles.titleBlue}>
                  The best anti-Dandruff shampoos and masks to get rid of that itchy scalp by Stephanie Hua
                </span>
                <span className={styles.cursor}>|</span>
              </div>
            </div>

            {/* Transcript accordion */}
            <div className={styles.transcriptToggle} onClick={() => setShowTranscript(!showTranscript)}>
              <h2>Open conversation transcript</h2>
              <ChevronDownIcon />
            </div>

            {showTranscript && (
              <div style={{ padding: '12px 0 0 42px', fontSize: 13, color: 'var(--slate-500)', lineHeight: 1.6 }}>
                <p>Full conversation transcript will appear here.</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Chat input pinned at bottom */}
      <div className={styles.leftBottom}>
        <ChatInput />
      </div>

    </div>
  );
}
