'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './LeftPanel.module.css';
import ChatInput from '../ChatInput/ChatInput';
import ToolSelectionPanel from '../ToolSelectionPanel/ToolSelectionPanel';
import { AtelierABadge, ChevronDownIcon, SparkleToolIcon } from '../icons/Icons';
import type { Tool } from '../ToolSelectionPanel/tools';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool?: Tool | null;
  status?: 'thinking' | 'researching' | 'done';
}

export default function LeftPanel() {
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolPanelOpen, setToolPanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool);
    setToolPanelOpen(false);
  };

  const handleClearTool = () => {
    setSelectedTool(null);
  };

  const handleSlashTyped = () => {
    setToolPanelOpen(true);
  };

  const handleSend = (message: string, tool: Tool | null) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      tool,
    };

    setMessages((prev) => [...prev, userMsg]);
    setSelectedTool(null);

    if (tool) {
      // Simulate tool execution: thinking → researching → done
      const assistantId = crypto.randomUUID();

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            tool,
            status: 'thinking',
          },
        ]);
      }, 300);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, status: 'researching' as const } : m
          )
        );
      }, 1500);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  status: 'done' as const,
                  content: `${tool.name}: ${tool.description}. Analysis complete — results are ready for review.`,
                }
              : m
          )
        );
      }, 3500);
    } else if (message) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Thanks for your message. How would you like to proceed?',
            status: 'done',
          },
        ]);
      }, 800);
    }
  };

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

        {/* Initial Atelier AI message */}
        <div className={styles.msgPosition}>
          <div className={styles.typewriterBlock}>
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
              <div className={styles.transcriptContent}>
                <p>Full conversation transcript will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={styles.msgPosition}>
            {msg.role === 'user' ? (
              <div className={styles.userMessage}>
                {msg.tool && (
                  <div className={styles.msgToolChip}>
                    <SparkleToolIcon className={styles.msgToolIcon} />
                    <span>{msg.tool.name}</span>
                  </div>
                )}
                {msg.content && <p>{msg.content}</p>}
              </div>
            ) : (
              <div className={styles.typewriterBlock}>
                <div className={styles.pWithLogo}>
                  <AtelierABadge className={styles.aIcon} />
                  <div className={styles.assistantContent}>
                    {msg.status === 'thinking' && (
                      <span className={styles.statusText}>Thinking...</span>
                    )}
                    {msg.status === 'researching' && msg.tool && (
                      <div className={styles.researchingBlock}>
                        <p className={styles.statusText}>Researching...</p>
                        <div className={styles.researchCard}>
                          <p className={styles.researchTitle}>
                            {msg.tool.name}: {msg.tool.description}
                          </p>
                          <p className={styles.researchSubtext}>Research takes up to 5 minutes.</p>
                          <div className={styles.researchSpinner} />
                        </div>
                      </div>
                    )}
                    {msg.status === 'done' && (
                      <div className={styles.doneBlock}>
                        <p>{msg.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom: tool panel + chat input */}
      <div className={styles.leftBottom}>
        <ToolSelectionPanel
          isOpen={toolPanelOpen}
          onToggle={setToolPanelOpen}
          onSelectTool={handleSelectTool}
          selectedToolId={selectedTool?.id ?? null}
        />
        <ChatInput
          selectedTool={selectedTool}
          onClearTool={handleClearTool}
          onSend={handleSend}
          onSlashTyped={handleSlashTyped}
          toolPanelOpen={toolPanelOpen}
        />
      </div>
    </div>
  );
}
