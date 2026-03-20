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
  BuildingIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FormulationIcon,
  DocumentsIcon,
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
  const [catalogOpen, setCatalogOpen] = useState(
    pathname.startsWith('/formulations') || pathname.startsWith('/packaging')
  );
  const [sampleTrackingOpen, setSampleTrackingOpen] = useState(
    pathname.startsWith('/samples')
  );
  const [supplierIntelOpen, setSupplierIntelOpen] = useState(
    pathname.startsWith('/suppliers')
  );

  const nav = (path: string) => { router.push(path); onNavigate?.(); };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>

      {/* Logo row */}
      <div className={styles.logoRow}>
        <div className={styles.logo}>
          <AtelierLogo />
        </div>
        <button className={styles.toggleBtn} onClick={onToggle} title="Close sidebar" aria-label="Toggle sidebar">
          ‹
        </button>
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

          {/* Supplier Intelligence */}
          <div className={styles.dropdown}>
            <div
              className={`${styles.dropdownHeader} ${supplierIntelOpen ? styles.active : ''}`}
              onClick={() => setSupplierIntelOpen(!supplierIntelOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={supplierIntelOpen}
              onKeyDown={e => e.key === 'Enter' && setSupplierIntelOpen(!supplierIntelOpen)}
            >
              <div className={styles.dropdownHeaderLeft}>
                <BuildingIcon />
                <p className={styles.navLabel}>Suppliers</p>
              </div>
              {supplierIntelOpen
                ? <ChevronUpIcon className={styles.chevron} />
                : <ChevronDownIcon className={styles.chevron} />}
            </div>
            <div className={`${styles.dropdownContent} ${supplierIntelOpen ? styles.open : ''}`}>
              <div className={styles.optionsList}>
                <p
                  className={`${styles.optionItem} ${pathname === '/suppliers' ? styles.active : ''}`}
                  onClick={() => nav('/suppliers')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/suppliers')}
                >
                  Dashboard
                </p>
                <p
                  className={`${styles.optionItem} ${isActive('/suppliers/pipeline') ? styles.active : ''}`}
                  onClick={() => nav('/suppliers/pipeline')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/suppliers/pipeline')}
                >
                  Pipeline
                </p>
                <p
                  className={`${styles.optionItem} ${isActive('/suppliers/database') ? styles.active : ''}`}
                  onClick={() => nav('/suppliers/database')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/suppliers/database')}
                >
                  Supplier DB
                </p>
                <p
                  className={`${styles.optionItem} ${isActive('/suppliers/briefs') ? styles.active : ''}`}
                  onClick={() => nav('/suppliers/briefs')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/suppliers/briefs')}
                >
                  Briefs
                </p>
                <p
                  className={`${styles.optionItem} ${isActive('/suppliers/import') ? styles.active : ''}`}
                  onClick={() => nav('/suppliers/import')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav('/suppliers/import')}
                >
                  Import
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div
            className={`${styles.iconRow} ${isActive('/documents') ? styles.active : ''}`}
            onClick={() => nav('/documents')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && nav('/documents')}
          >
            <DocumentsIcon />
            <p className={styles.navLabel}>Documents</p>
          </div>

          {/* Divider — separates workflow from admin */}
          <div className={styles.navDivider} />

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

        </nav>

      </div>

      <div className={styles.btnWrapper}>
        <button className={styles.newProjectBtn} onClick={() => { router.push('/projects/new'); onNavigate?.(); }}>
          + New Project
        </button>
        <button className={styles.logoutBtn} onClick={() => logoutAction()}>
          Sign out
        </button>
        <p className={styles.version}>v0.2.0</p>
      </div>

    </div>
  );
}
