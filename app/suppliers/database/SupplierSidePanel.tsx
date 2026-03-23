'use client';

import type { UnifiedSupplier } from '@/types/supplier-database';
import styles from './Database.module.css';

type SupplierSidePanelProps = {
  supplier: UnifiedSupplier;
  isPending: boolean;
  onClose: () => void;
  onViewProfile: (aosId: string) => void;
  onLink: (cobaltId: string) => void;
};

export default function SupplierSidePanel({
  supplier,
  isPending,
  onClose,
  onViewProfile,
  onLink,
}: SupplierSidePanelProps) {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.sidePanelHeader}>
        <h2 className={styles.sidePanelTitle}>{supplier.companyName}</h2>
        <button className={styles.closePanelBtn} onClick={onClose}>&times;</button>
      </div>

      {/* Supplier info */}
      <div className={styles.sidePanelSection}>
        <h3 className={styles.sidePanelSectionTitle}>Details</h3>
        {supplier.country && <p className={styles.sidePanelMeta}>Country: {supplier.country}</p>}
        {supplier.qualificationStage && (
          <p className={styles.sidePanelMeta}>Stage: {supplier.qualificationStage}</p>
        )}
        {supplier.keyBrands.length > 0 && (
          <p className={styles.sidePanelMeta}>Key brands: {supplier.keyBrands.join(', ')}</p>
        )}
      </div>

      {/* Matched products */}
      <div className={styles.sidePanelSection}>
        <h3 className={styles.sidePanelSectionTitle}>
          Matched Products ({supplier.matchedProductsCount})
        </h3>
        {supplier.matchedProducts.length === 0 ? (
          <p className={styles.emptyText}>No matched products.</p>
        ) : (
          <div className={styles.productList}>
            {supplier.matchedProducts.map((p, i) => (
              <div key={i} className={styles.productCard}>
                <p className={styles.productName}>{p.name || 'Unnamed product'}</p>
                {p.brand && <p className={styles.productMeta}>Brand: {p.brand}</p>}
                {p.rrp && <p className={styles.productMeta}>RRP: {p.rrp}</p>}
                {p.markets && p.markets.length > 0 && (
                  <p className={styles.productMeta}>Markets: {p.markets.join(', ')}</p>
                )}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className={styles.productLink}>
                    View product &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sidePanelActions}>
        {supplier.aosId && (
          <button
            className={styles.actionBtnSecondary}
            onClick={() => onViewProfile(supplier.aosId!)}
          >
            View AoS Profile &rarr;
          </button>
        )}
        {supplier.cobaltId && !supplier.linked && (
          <button
            className={styles.actionBtn}
            onClick={() => onLink(supplier.cobaltId!)}
            disabled={isPending}
          >
            {isPending ? 'Linking...' : 'Link to AoS'}
          </button>
        )}
      </div>
    </div>
  );
}
