'use client';

import { useState } from 'react';
import styles from './Chat.module.css';
import Sidebar from '@/components/Sidebar/Sidebar';
import LeftPanel from '@/components/LeftPanel/LeftPanel';
import RightPanel from '@/components/RightPanel/RightPanel';
import { SidebarOpenIcon, SidebarCloseIcon } from '@/components/icons/Icons';

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 60;

export default function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [rhpCollapsed, setRhpCollapsed] = useState(false);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div className={styles.wrapper}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={() => {}}
      />

      {sidebarCollapsed && (
        <button
          className={styles.sidebarToggle}
          onClick={() => setSidebarCollapsed(false)}
          type="button"
        >
          <SidebarOpenIcon />
        </button>
      )}

      <div className={styles.mainContent} style={{ marginLeft: sidebarWidth }}>
        <div
          className={styles.leftPanel}
          style={{ width: rhpCollapsed ? '100%' : '50%' }}
        >
          <LeftPanel />
        </div>

        {!rhpCollapsed && <div className={styles.divider} />}

        <div
          className={`${styles.rightPanel} ${rhpCollapsed ? styles.rightPanelCollapsed : ''}`}
          style={{ width: rhpCollapsed ? 0 : '50%' }}
        >
          <RightPanel onCollapse={() => setRhpCollapsed(true)} />
        </div>

        {/* Floating button to re-open RHP when collapsed */}
        {rhpCollapsed && (
          <button
            className={styles.rhpExpandBtn}
            onClick={() => setRhpCollapsed(false)}
            type="button"
            aria-label="Show product brief"
          >
            <SidebarCloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
