'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { createProject } from '@/lib/actions/projects';
import styles from './NewProject.module.css';

const REGULATORY_MARKETS = [
  { value: 'uk', label: 'United Kingdom' },
  { value: 'eu', label: 'European Union' },
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'jp', label: 'Japan' },
  { value: 'cn', label: 'China' },
  { value: 'kr', label: 'South Korea' },
  { value: 'global', label: 'Global' },
];

const KEY_CLAIMS = [
  'Anti-dandruff', 'Moisturising', 'Strengthening', 'Brightening',
  'Soothing', 'Repairing', 'Volumising', 'Anti-ageing',
  'Hydrating', 'Balancing', 'Clarifying', 'SPF protection',
  'Detoxifying', 'Firming', 'Nourishing',
];

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [regulatoryMarkets, setRegulatoryMarkets] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleMarket = (market: string) =>
    setRegulatoryMarkets(prev =>
      prev.includes(market) ? prev.filter(m => m !== market) : [...prev, market]
    );

  const toggleClaim = (claim: string) =>
    setSelectedClaims(prev =>
      prev.includes(claim) ? prev.filter(c => c !== claim) : [...prev, claim]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        market: regulatoryMarkets.length > 0 ? regulatoryMarkets.join(',') : undefined,
        claims: selectedClaims.length > 0 ? selectedClaims : undefined,
      });

      if ('error' in result && result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      if ('id' in result && result.id) {
        router.push(`/projects/${result.id}`);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <PlatformLayout>
      <div className={styles.page}>

        <div className={styles.pageHeader}>
          <button className={styles.back} onClick={() => router.back()}>
            ← Back
          </button>
          <div>
            <h1 className={styles.pageTitle}>New innovation project</h1>
            <p className={styles.pageSubtitle}>Define your project and complete the product brief.</p>
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--red-400)', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* -- Section 1: Project basics -- */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>01</span>
              <h2 className={styles.sectionTitle}>Project basics</h2>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Project name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Q1 2026 Anti-Dandruff Launch"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Product category</label>
                <select
                  className={styles.select}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  <option>Shampoo</option>
                  <option>Conditioner</option>
                  <option>Serum</option>
                  <option>Moisturiser</option>
                  <option>Cleanser</option>
                  <option>Toner</option>
                  <option>Mask</option>
                  <option>SPF</option>
                  <option>Treatment</option>
                  <option>Body lotion</option>
                  <option>Oil</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Brief description</label>
              <textarea
                className={styles.textarea}
                placeholder="What problem are you solving? What makes this product different?"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* -- Section 2: Product brief -- */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>Product brief</h2>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Regulatory market</label>
              <p className={styles.helpText} style={{ marginBottom: 10 }}>
                Select all markets this product will be sold in. Determines which regulatory flags apply.
              </p>
              <div className={styles.claimGrid}>
                {REGULATORY_MARKETS.map(market => (
                  <button
                    key={market.value}
                    type="button"
                    className={`${styles.claimChip} ${regulatoryMarkets.includes(market.value) ? styles.claimActive : ''}`}
                    onClick={() => toggleMarket(market.value)}
                  >
                    {regulatoryMarkets.includes(market.value) && <span className={styles.chipCheck}>✓</span>}
                    {market.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Key claims</label>
              <p className={styles.helpText} style={{ marginBottom: 10 }}>
                Select all that apply to this product.
              </p>
              <div className={styles.claimGrid}>
                {KEY_CLAIMS.map(claim => (
                  <button
                    key={claim}
                    type="button"
                    className={`${styles.claimChip} ${selectedClaims.includes(claim) ? styles.claimActive : ''}`}
                    onClick={() => toggleClaim(claim)}
                  >
                    {selectedClaims.includes(claim) && <span className={styles.chipCheck}>✓</span>}
                    {claim}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* -- Actions -- */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create project →'}
            </button>
          </div>

        </form>
      </div>
    </PlatformLayout>
  );
}
