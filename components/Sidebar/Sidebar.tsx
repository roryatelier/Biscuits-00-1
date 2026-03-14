'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logoutAction } from '@/lib/actions/auth';
import styles from './Sidebar.module.css';
import {
  AtelierLogo,
  HomeIcon,
  SparkleIcon,
  LocationPinIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FormulationIcon,
  PackagingIcon,
  TeamIcon,
  SettingsIcon,
} from '../icons/Icons';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [sampleTrackingOpen, setSampleTrackingOpen] = useState(false);
  const [projectDocsOpen, setProjectDocsOpen] = useState(false);
  const [brandDocsOpen, setBrandDocsOpen] = useState(true);

  const nav = (path: string) => { router.push(path); onNavigate?.(); };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>

      <button className={styles.toggleBtn} onClick={onToggle} title="Close sidebar" aria-label="Toggle sidebar">
        ‹
      </button>

      {/* ATELIER Logo */}
      <div className={styles.logo}>
        <AtelierLogo />
      </div>

      {/* Scrollable content */}
      <div className={styles.sidebarContent}>

        {/* Profile */}
        <div
          className={styles.profileWrapper}
          onClick={() => nav('/settings')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && nav('/settings')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.profilePlaceholder}>{userInitial}</div>
          <div>
            <p className={styles.greeting}>Hello!</p>
            <p className={styles.username}>{userName}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.iconsWrapper} aria-label="Main navigation">

          {/* Dashboard */}
          <div
            className={`${styles.iconRow} ${isActive('/dashboard') ? styles.active : ''}`}
            onClick={() => nav('/dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav('/dashboard')}
          >
            <HomeIcon />
            <p className={styles.navLabel}>Dashboard</p>
          </div>

          {/* Projects */}
          <div
            className={`${styles.iconRow} ${isActive('/projects') ? styles.active : ''}`}
            onClick={() => nav('/projects')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav('/projects')}
          >
            <SparkleIcon />
            <p className={styles.navLabel}>Projects</p>
          </div>

          {/* Catalogs */}
          <div className={styles.dropdown}>
            <div
              className={`${styles.dropdownHeader} ${catalogOpen ? styles.active : ''}`}
              onClick={() => setCatalogOpen(!catalogOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={catalogOpen}
              onKeyDown={e => e.key === 'Enter' && setCatalogOpen(!catalogOpen)}
            >
              <div className={styles.dropdownHeaderLeft}>
                <FormulationIcon />
                <p className={styles.navLabel}>Catalogs</p>
              </div>
              {catalogOpen
                ? <ChevronUpIcon className={styles.chevron} />
                : <ChevronDownIcon className={styles.chevron} />}
            </div>
            <div className={`${styles.dropdownContent} ${catalogOpen ? styles.open : ''}`}>
              <div className={styles.optionsList}>
                <p
                  className={`${styles.optionItem} ${isActive('/formulations') ? styles.active : ''}`}
                  onClick={() => nav('/formulations')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/formulations')}
                >
                  Formulations
                </p>
                <p
                  className={`${styles.optionItem} ${isActive('/packaging') ? styles.active : ''}`}
                  onClick={() => nav('/packaging')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/packaging')}
                >
                  Packaging
                </p>
              </div>
            </div>
          </div>

          {/* Sample Tracking */}
          <div className={styles.dropdown}>
            <div
              className={`${styles.dropdownHeader} ${sampleTrackingOpen ? styles.active : ''}`}
              onClick={() => setSampleTrackingOpen(!sampleTrackingOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={sampleTrackingOpen}
              onKeyDown={e => e.key === 'Enter' && setSampleTrackingOpen(!sampleTrackingOpen)}
            >
              <div className={styles.dropdownHeaderLeft}>
                <LocationPinIcon />
                <p className={styles.navLabel}>Sample Tracking</p>
              </div>
              {sampleTrackingOpen
                ? <ChevronUpIcon className={styles.chevron} />
                : <ChevronDownIcon className={styles.chevron} />}
            </div>
            <div className={`${styles.dropdownContent} ${sampleTrackingOpen ? styles.open : ''}`}>
              <div className={styles.optionsList}>
                <p
                  className={`${styles.optionItem} ${isActive('/samples') && !pathname.includes('/new') ? styles.active : ''}`}
                  onClick={() => nav('/samples')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/samples')}
                >
                  All orders
                </p>
                <p
                  className={`${styles.optionItem} ${pathname === '/samples/new' ? styles.active : ''}`}
                  onClick={() => nav('/samples/new')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/samples/new')}
                >
                  New order
                </p>
              </div>
            </div>
          </div>

          {/* Approved Innovations */}
          <div
            className={`${styles.iconRow} ${isActive('/in-development') ? styles.active : ''}`}
            onClick={() => nav('/in-development')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav('/in-development')}
          >
            <CheckmarkIcon />
            <p className={styles.navLabel}>Approved Innovations</p>
          </div>

          {/* Team */}
          <div
            className={`${styles.iconRow} ${isActive('/team') ? styles.active : ''}`}
            onClick={() => nav('/team')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav('/team')}
          >
            <TeamIcon />
            <p className={styles.navLabel}>Team</p>
          </div>

          {/* Settings */}
          <div
            className={`${styles.iconRow} ${isActive('/settings') ? styles.active : ''}`}
            onClick={() => nav('/settings')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav('/settings')}
          >
            <SettingsIcon />
            <p className={styles.navLabel}>Settings</p>
          </div>

          {/* AI Assistant — coming soon */}

        </nav>

        {/* Divider */}
        <div className={styles.dividerLine} />

        {/* Projects & Brands */}
        <div className={styles.projectsSection}>

          {/* Project Documents */}
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader} onClick={() => setProjectDocsOpen(!projectDocsOpen)}>
              <p className={styles.sectionLabel}>Project Documents</p>
              {projectDocsOpen
                ? <ChevronUpIcon className={styles.chevron} />
                : <ChevronDownIcon className={styles.chevron} />}
            </div>
            <div className={`${styles.dropdownContent} ${projectDocsOpen ? styles.open : ''}`}>
              <div className={styles.optionsList}>
                <p className={styles.optionItem}>Product Brief</p>
                <p className={styles.optionItem}>Regulatory Notes</p>
              </div>
            </div>
          </div>

          {/* Brand Documents */}
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader} onClick={() => setBrandDocsOpen(!brandDocsOpen)}>
              <p className={styles.sectionLabel}>Brand Documents</p>
              {brandDocsOpen
                ? <ChevronUpIcon className={styles.chevron} />
                : <ChevronDownIcon className={styles.chevron} />}
            </div>
            <div className={`${styles.dropdownContent} ${brandDocsOpen ? styles.open : ''}`}>
              <div className={styles.brandsWrapper}>
                <div className={styles.singleBrand}>
                  <div className={`${styles.brandImgPlaceholder} ${styles.orange}`}>PDF</div>
                  <p className={styles.brandLabel}>Brand_Guidelines.pdf</p>
                </div>
                <div className={styles.singleBrand}>
                  <div className={`${styles.brandImgPlaceholder} ${styles.pink}`}>PDF</div>
                  <p className={styles.brandLabel}>Competitor_analysis.pdf</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <div className={styles.btnWrapper}>
        <button className={styles.newProjectBtn} onClick={() => { router.push('/projects/new'); onNavigate?.(); }}>
          New Innovation Project
        </button>
        <button className={styles.logoutBtn} onClick={() => logoutAction()}>
          Sign out
        </button>
      </div>

    </div>
  );
}
