'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { SidebarOpenIcon, HamburgerIcon } from '@/components/icons/Icons';
import NotificationBell from '@/components/NotificationBell/NotificationBell';
import styles from './PlatformLayout.module.css';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setMobileOpen(false);
    };
    onChange(mql);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const handleNavigation = useCallback(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <div className={styles.wrapper}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      <div className={isMobile ? `${styles.mobileSidebar} ${mobileOpen ? styles.mobileSidebarOpen : ''}` : undefined}>
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          onToggle={() => {
            if (isMobile) setMobileOpen(false);
            else setCollapsed(!collapsed);
          }}
          onNavigate={handleNavigation}
        />
      </div>

      {/* Desktop open button */}
      {!isMobile && (
        <button
          className={`${styles.openBtn} ${!collapsed ? styles.hidden : ''}`}
          onClick={() => setCollapsed(false)}
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <SidebarOpenIcon />
        </button>
      )}

      {/* Mobile hamburger */}
      {isMobile && !mobileOpen && (
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMobileOpen(true)}
          title="Open menu"
          aria-label="Open menu"
        >
          <HamburgerIcon />
        </button>
      )}

      <main className={styles.main}>
        <div className={styles.topBar}>
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
