'use client';

import { useRef, useState, useEffect } from 'react';
import styles from './ChatInput.module.css';
import { LinkIcon, SendIcon, SparkleToolIcon, CloseIcon } from '../icons/Icons';
import type { Tool } from '../ToolSelectionPanel/tools';

const SUGGESTIONS = [
  'Identify a product opportunity',
  'Create a formulation',
  'See packaging options',
  'Supply chain update',
  'Research an ingredient',
];

const TOOL_PLACEHOLDERS: Record<string, string> = {
  'market-trend': 'e.g., Emerging trends in K-beauty skincare 2026',
  'whitespace': 'e.g., Gaps in men\'s grooming under $20',
  'competitor-benchmarking': 'e.g., Benchmark vs top products in this category',
  'ingredient-research': 'e.g., Compare niacinamide vs salicylic acid for acne',
  'product-sentiment': 'e.g., What do consumers say about our moisturiser?',
  'rrp-benchmarking': 'e.g., Pricing analysis for premium serums in AU market',
  'synthetic-consumer': 'e.g., Test this concept with 25-34 year old women',
  'generate-chart': 'e.g., Chart competitor market share by region',
  'create-pdf': 'e.g., Export formulation brief as PDF',
};

interface ChatInputProps {
  selectedTool?: Tool | null;
  onClearTool?: () => void;
  onSend?: (message: string, tool: Tool | null) => void;
  onSlashTyped?: () => void;
  toolPanelOpen?: boolean;
}

export default function ChatInput({
  selectedTool,
  onClearTool,
  onSend,
  onSlashTyped,
  toolPanelOpen,
}: ChatInputProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Trigger tool panel when user types "/" at the start
    if (newValue === '/' && onSlashTyped) {
      onSlashTyped();
    }
  };

  const handleSend = () => {
    if (!hasValue && !selectedTool) return;
    onSend?.(value.trim(), selectedTool ?? null);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear slash when a tool is selected
  useEffect(() => {
    if (selectedTool && value === '/') {
      setValue('');
    }
  }, [selectedTool, value]);

  const hasValue = value.trim().length > 0;
  const canSend = hasValue || !!selectedTool;
  const showSuggestions = !selectedTool && !hasValue && !toolPanelOpen;

  const placeholder = selectedTool
    ? TOOL_PLACEHOLDERS[selectedTool.id] ?? 'Describe what you want to analyse...'
    : 'Ask anything';

  return (
    <div className={styles.inputContainer}>
      {/* Tool chip above input */}
      {selectedTool && (
        <div className={styles.toolChipRow}>
          <div className={styles.toolChip}>
            <SparkleToolIcon className={styles.toolChipIcon} />
            <span>{selectedTool.name}</span>
            <button
              className={styles.toolChipClose}
              onClick={onClearTool}
              type="button"
              aria-label="Remove tool"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      <div className={styles.inputTop}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={placeholder}
          rows={1}
          value={value}
          onChange={handleChange}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.topRight}>
          <button className={styles.linkBtn} type="button" aria-label="Attach file">
            <LinkIcon />
          </button>
          <button
            className={`${styles.sendBtn} ${!canSend ? styles.disabled : ''}`}
            onClick={handleSend}
            disabled={!canSend}
            type="button"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Suggestion chips — hidden when tool panel is open or tool is selected */}
      {showSuggestions && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className={styles.chip}
              onClick={() => handleChipClick(s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
