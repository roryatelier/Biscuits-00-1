'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './NewProject.module.css';

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
  const [targetConsumer, setTargetConsumer] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [heroIngredients, setHeroIngredients] = useState('');
  const [regulatoryMarket, setRegulatoryMarket] = useState('');

  const toggleClaim = (claim: string) =>
    setSelectedClaims(prev =>
      prev.includes(claim) ? prev.filter(c => c !== claim) : [...prev, claim]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
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

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ── Section 1: Project basics ── */}
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
                  required
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

          {/* ── Section 2: Product brief ── */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionNum}>02</span>
              <h2 className={styles.sectionTitle}>Product brief</h2>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Target consumer</label>
                <textarea
                  className={styles.textarea}
                  placeholder="e.g. Women 25–45 with colour-treated, dry hair. Values clean ingredients and salon-quality results."
                  rows={3}
                  value={targetConsumer}
                  onChange={e => setTargetConsumer(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Regulatory market</label>
                <select
                  className={styles.select}
                  value={regulatoryMarket}
                  onChange={e => setRegulatoryMarket(e.target.value)}
                >
                  <option value="">Select market</option>
                  <option value="uk">United Kingdom</option>
                  <option value="eu">European Union</option>
                  <option value="us">United States</option>
                  <option value="ca">Canada</option>
                  <option value="au">Australia</option>
                  <option value="jp">Japan</option>
                  <option value="cn">China</option>
                  <option value="kr">South Korea</option>
                  <option value="global">Global</option>
                </select>
                <p className={styles.helpText}>
                  Determines which regulatory flags apply to ingredients.
                </p>
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

            <div className={styles.field}>
              <label className={styles.label}>Hero ingredients</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Zinc Pyrithione, Salicylic Acid, Panthenol (comma-separated)"
                value={heroIngredients}
                onChange={e => setHeroIngredients(e.target.value)}
              />
              <p className={styles.helpText}>
                These will be used to surface matching formulations in the catalog.
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Create project →
            </button>
          </div>

        </form>
      </div>
    </PlatformLayout>
  );
}
