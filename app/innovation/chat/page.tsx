'use client';

import { useState } from 'react';
import styles from './Chat.module.css';
import Sidebar from '@/components/Sidebar/Sidebar';
import LeftPanel from '@/components/LeftPanel/LeftPanel';
import RightPanel from '@/components/RightPanel/RightPanel';
import { SidebarOpenIcon } from '@/components/icons/Icons';

export default function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Widths matching the live platform (49.45% / 50.55% of content area)
  const leftWidth = '49.4516%';
  const rightWidth = '50.5484%';

  return (
    <div className={styles.wrapper}>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Reopen button — only visible when sidebar is collapsed */}
      <button
        className={`${styles.sidebarToggle} ${!sidebarCollapsed ? styles.hidden : ''}`}
        onClick={() => setSidebarCollapsed(false)}
        title="Open sidebar"
      >
        <SidebarOpenIcon />
      </button>

      {/* Main panels */}
      <div className={styles.mainContent}>

        {/* Left: chat panel */}
        <div className={styles.leftPanel} style={{ width: leftWidth }}>
          <LeftPanel />
        </div>

        {/* Vertical divider */}
        <div className={styles.divider} />

        {/* Right: project selections */}
        <div className={styles.rightPanel} style={{ width: rightWidth }}>
          <RightPanel />
        </div>

      </div>
    </div>
  );
}
