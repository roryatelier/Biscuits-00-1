'use client';

import { useState, useEffect } from 'react';
import styles from './ToolSelectionPanel.module.css';
import { SparkleToolIcon, ArrowUpRightIcon, ChevronDownIcon, ChevronUpIcon } from '../icons/Icons';
import { TOOLS, type Tool } from './tools';

const COLLAPSED_COUNT = 4;

interface ToolSelectionPanelProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  onSelectTool: (tool: Tool) => void;
  selectedToolId?: string | null;
}

export default function ToolSelectionPanel({
  isOpen: controlledOpen,
  onToggle,
  onSelectTool,
  selectedToolId,
}: ToolSelectionPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Support both controlled and uncontrolled open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (onToggle) {
      onToggle(next);
    } else {
      setInternalOpen(next);
    }
  };

  // Reset showAll when panel closes
  useEffect(() => {
    if (!isOpen) setShowAll(false);
  }, [isOpen]);

  const visibleTools = showAll ? TOOLS : TOOLS.slice(0, COLLAPSED_COUNT);

  return (
    <div className={styles.panel}>
      {/* Header toggle */}
      <button
        className={styles.header}
        onClick={handleToggle}
        type="button"
        aria-expanded={isOpen}
      >
        <div className={styles.headerLeft}>
          <SparkleToolIcon className={styles.headerIcon} />
          <span className={styles.headerLabel}>
            {isOpen ? 'Select a tool to accelerate your work' : 'Research and innovation tools'}
          </span>
          <span className={styles.headerCount}>{TOOLS.length}</span>
        </div>
        <div className={styles.headerChevron}>
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </button>

      {/* Tool cards grid — animated expand/collapse */}
      <div className={`${styles.body} ${isOpen ? styles.bodyOpen : ''}`}>
        <div className={styles.bodyInner}>
          <div className={styles.grid}>
            {visibleTools.map((tool) => (
              <button
                key={tool.id}
                className={`${styles.card} ${selectedToolId === tool.id ? styles.cardSelected : ''}`}
                onClick={() => onSelectTool(tool)}
                type="button"
                aria-label={`Use ${tool.name}: ${tool.description}`}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardName}>{tool.name}</span>
                  <ArrowUpRightIcon className={styles.cardArrow} />
                </div>
                <p className={styles.cardDesc}>{tool.description}</p>
                <span className={styles.useToolBtn}>Use tool</span>
              </button>
            ))}
          </div>

          {TOOLS.length > COLLAPSED_COUNT && (
            <button
              className={styles.showMore}
              onClick={() => setShowAll(!showAll)}
              type="button"
            >
              <span>{showAll ? 'Show less' : 'Show more'}</span>
              <span className={`${styles.showMoreChevron} ${showAll ? styles.showMoreChevronUp : ''}`}>
                <ChevronDownIcon />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
