'use client';

import { useRef, useState } from 'react';
import styles from './Cobalt.module.css';
import { AtelierLogo, SendIcon } from '@/components/icons/Icons';

const SUGGESTIONS = [
  { id: 1, text: 'Identify a product opportunity for anti-dandruff haircare' },
  { id: 2, text: 'Create a formulation for a moisturising shampoo' },
  { id: 3, text: 'See packaging options for a 250ml bottle' },
  { id: 4, text: 'Research an ingredient — pyrithione zinc efficacy' },
];

export default function CobaltPage() {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        <div className={styles.logo}>
          <AtelierLogo />
        </div>

        <h1 className={styles.heading}>What would you like to develop?</h1>

        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Ask anything."
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onInput={handleInput}
          />
          <div className={styles.sendBtn}>
            <SendIcon />
          </div>
        </div>

        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <div
              key={s.id}
              className={styles.suggestionCard}
              onClick={() => setValue(s.text)}
            >
              <p>{s.text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
