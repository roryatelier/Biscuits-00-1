'use client';

import { useRef, useState } from 'react';
import styles from './ChatInput.module.css';
import { LinkIcon, SendIcon } from '../icons/Icons';

const SUGGESTIONS = [
  'Identify a product opportunity',
  'Create a formulation',
  'See packaging options',
  'Supply chain update',
  'Research an ingredient',
];

export default function ChatInput() {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleChipClick = (chip: string) => {
    setValue(chip);
    textareaRef.current?.focus();
  };

  const hasValue = value.trim().length > 0;

  return (
    <div className={styles.inputContainer}>
      <div className={styles.inputTop}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Ask anything."
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
        />
        <div className={styles.topRight}>
          <div className={styles.linkBtn}>
            <LinkIcon />
          </div>
          <div className={`${styles.sendBtn} ${!hasValue ? styles.disabled : ''}`}>
            <SendIcon />
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <p key={s} className={styles.chip} onClick={() => handleChipClick(s)}>
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}
