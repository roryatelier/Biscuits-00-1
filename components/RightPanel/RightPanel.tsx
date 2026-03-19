'use client';

import { useState } from 'react';
import styles from './RightPanel.module.css';
import {
  FormulationIcon,
  PackagingIcon,
  SampleOrderIcon,
  GreenCheckCircleIcon,
  SidebarOpenIcon,
} from '../icons/Icons';

type CardId = 'formulation' | 'packaging' | 'sampleOrder';

interface RightPanelProps {
  onCollapse?: () => void;
}

export default function RightPanel({ onCollapse }: RightPanelProps) {
  const [openCard, setOpenCard] = useState<CardId | null>('sampleOrder');

  const toggleCard = (id: CardId) => {
    setOpenCard(openCard === id ? null : id);
  };

  return (
    <div className={styles.rightPanel}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            {onCollapse && (
              <button
                className={styles.collapseBtn}
                onClick={onCollapse}
                type="button"
                aria-label="Collapse product brief panel"
              >
                <SidebarOpenIcon />
              </button>
            )}
            <h2 className={styles.panelTitle}>Product Brief</h2>
          </div>
          <button className={styles.specsBtn} disabled>
            Preview brief
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className={styles.selectionsWrapper}>

        {/* Formulation */}
        <div className={styles.card}>
          <div className={styles.cardHeader} onClick={() => toggleCard('formulation')}>
            <FormulationIcon className={styles.cardIcon} />
            <div className={styles.cardRight}>
              <h2 className={styles.cardTitle}>Formulation</h2>
              <p className={styles.cardSubtitle}>Begin formulating in the chat</p>
            </div>
          </div>
          <div className={`${styles.cardContent} ${openCard === 'formulation' ? styles.open : ''}`}>
            <div className={styles.orderDetail}>
              <p className={styles.placeholderText}>
                Formulation details will appear here once you begin chatting.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Packaging */}
        <div className={styles.card}>
          <div className={styles.cardHeader} onClick={() => toggleCard('packaging')}>
            <PackagingIcon className={styles.cardIcon} />
            <div className={styles.cardRight}>
              <h2 className={styles.cardTitle}>Primary Packaging</h2>
              <p className={styles.cardSubtitle}>Create your packaging in the chat</p>
            </div>
          </div>
          <div className={`${styles.cardContent} ${openCard === 'packaging' ? styles.open : ''}`}>
            <div className={styles.orderDetail}>
              <p className={styles.placeholderText}>
                Packaging options will appear here once you begin chatting.
              </p>
            </div>
          </div>
        </div>

        {/* Sample Order */}
        <div className={styles.card}>
          <div className={styles.cardHeader} onClick={() => toggleCard('sampleOrder')}>
            <SampleOrderIcon className={styles.cardIcon} />
            <div className={styles.cardRight}>
              <h2 className={styles.cardTitle}>Sample Order</h2>
              <p className={styles.cardSubtitle}>Place your order to receive your custom product in hand</p>
            </div>
          </div>
          <div className={`${styles.cardContent} ${openCard === 'sampleOrder' ? styles.open : ''}`}>
            <div className={styles.orderDetail}>

              {/* Delivery Location */}
              <div className={styles.orderRow}>
                <GreenCheckCircleIcon className={styles.orderRowIcon} />
                <div className={styles.orderRowContent}>
                  <p className={styles.orderRowTitle}>Delivery Location</p>
                  <p className={styles.orderRowValue}>660 5th Ave, New York</p>
                </div>
              </div>

              {/* Contact Person */}
              <div className={styles.orderRow}>
                <GreenCheckCircleIcon className={styles.orderRowIcon} />
                <div className={styles.orderRowContent}>
                  <p className={styles.orderRowTitle}>Contact Person</p>
                  <p className={styles.orderRowValue}>Rory Gass | (555) 555-1234 | rory@miora.com</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className={styles.summarySection}>
                <p className={styles.summaryTitle}>Order Summary</p>
                <p className={styles.summaryProject}>MIORA-04</p>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemName}>Primary Packaging sample (P01)</span>
                  <span className={styles.summaryItemPrice}>$500.00</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryItemName}>Tax</span>
                  <span className={styles.summaryItemPrice}>$45.00</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span className={styles.summaryTotalLabel}>Order Total</span>
                  <span className={styles.summaryTotalAmount}>USD $545.00</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
