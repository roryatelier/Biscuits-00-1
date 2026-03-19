'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState/EmptyState';
import { linkCobaltToAos } from '@/lib/actions/suppliers';
import styles from './BlendFill.module.css';

type CertInfo = { certType: string; verificationStatus: string };
type AgreementInfo = { agreementType: string; status: string };

type MatchedProduct = {
  name?: string;
  brand?: string;
  rrp?: string;
  markets?: string[];
  url?: string;
};

type CobaltSupplier = {
  id: string;
  companyName: string;
  country: string;
  categories: string[];
  matchedProductsCount: number;
  matchedProducts: MatchedProduct[];
  keyBrands: string[];
  linked: boolean;
  aosId: string | null;
  aosSupplier: {
    id: string;
    qualificationStage: string;
    cautionFlag: boolean;
    certifications: CertInfo[];
    agreements: AgreementInfo[];
  } | null;
};

const CERT_TYPES = ['GMP', 'ISO', 'Organic', 'Halal', 'Vegan', 'COSMOS'];

export default function BlendFillClient({ suppliers }: { suppliers: CobaltSupplier[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allCategories = Array.from(
    new Set(suppliers.flatMap(s => s.categories))
  ).sort();

  const filtered = suppliers.filter(s => {
    if (search && !s.companyName.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && !s.categories.includes(categoryFilter)) return false;
    return true;
  });

  const selected = selectedId ? suppliers.find(s => s.id === selectedId) : null;

  const handleLink = (cobaltId: string) => {
    startTransition(async () => {
      await linkCobaltToAos(cobaltId);
      router.refresh();
    });
  };

  if (suppliers.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Blend & Fill</h1>
            <p className={styles.pageSubtitle}>0 Cobalt suppliers</p>
          </div>
        </div>
        <EmptyState
          icon="projects"
          heading="No Cobalt suppliers yet"
          description="Cobalt suppliers will appear here once imported."
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainPanel}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.pageTitle}>Blend & Fill</h1>
              <p className={styles.pageSubtitle}>{suppliers.length} Cobalt suppliers</p>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className={styles.filterSelect}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Country</th>
                  <th className={styles.th}>Products</th>
                  <th className={styles.th}>Key Brands</th>
                  <th className={styles.th}>Categories</th>
                  <th className={styles.th}>Certs</th>
                  <th className={styles.th}>Linked</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const certSet = new Set(
                    s.aosSupplier?.certifications
                      .filter(c => c.verificationStatus === 'verified')
                      .map(c => c.certType) || []
                  );

                  return (
                    <tr
                      key={s.id}
                      className={`${styles.row} ${selectedId === s.id ? styles.rowActive : ''}`}
                      onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                    >
                      <td className={styles.td}>
                        <span className={styles.supplierName}>{s.companyName}</span>
                      </td>
                      <td className={styles.td}>{s.country || '--'}</td>
                      <td className={styles.td}>
                        <span className={styles.countBadge}>{s.matchedProductsCount}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.brandsText}>
                          {s.keyBrands.length > 0 ? s.keyBrands.join(', ') : '--'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.chips}>
                          {s.categories.slice(0, 3).map(c => (
                            <span key={c} className={styles.chip}>{c}</span>
                          ))}
                          {s.categories.length > 3 && (
                            <span className={styles.chipMore}>+{s.categories.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.certIcons}>
                          {CERT_TYPES.map(ct => (
                            <span
                              key={ct}
                              className={`${styles.certDot} ${certSet.has(ct) ? styles.certVerified : styles.certMissing}`}
                              title={ct}
                            >
                              {ct.charAt(0)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.td}>
                        {s.linked ? (
                          <span className={styles.linkedBadge}>Linked</span>
                        ) : (
                          <span className={styles.unlinkedBadge}>Unlinked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <EmptyState
                icon="projects"
                heading="No suppliers match your filters"
                description="Try adjusting your search or category filter."
                ctaLabel="Clear filters"
                onCtaClick={() => { setSearch(''); setCategoryFilter(''); }}
              />
            )}
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2 className={styles.sidePanelTitle}>{selected.companyName}</h2>
              <button className={styles.closePanelBtn} onClick={() => setSelectedId(null)}>&times;</button>
            </div>

            <div className={styles.sidePanelSection}>
              <h3 className={styles.sidePanelSectionTitle}>
                Matched Products ({selected.matchedProductsCount})
              </h3>
              {selected.matchedProducts.length === 0 ? (
                <p className={styles.emptyText}>No matched products.</p>
              ) : (
                <div className={styles.productList}>
                  {selected.matchedProducts.map((p, i) => (
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
              {selected.linked ? (
                <button
                  className={styles.actionBtnSecondary}
                  onClick={() => router.push(`/suppliers/${selected.aosId}`)}
                >
                  View AoS Profile &rarr;
                </button>
              ) : (
                <button
                  className={styles.actionBtn}
                  onClick={() => handleLink(selected.id)}
                  disabled={isPending}
                >
                  {isPending ? 'Linking...' : 'Link to AoS'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
