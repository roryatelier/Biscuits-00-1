'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './Review.module.css';

interface Rating {
  category: string;
  description: string;
  score: number;
}

const CATEGORIES = [
  { key: 'texture',   label: 'Texture & Feel',  description: 'How does the product feel on the skin/hair? Is it smooth, sticky, gritty, lightweight?' },
  { key: 'scent',     label: 'Scent',            description: 'Is the fragrance pleasant? Too strong or too subtle? Does it align with the product positioning?' },
  { key: 'efficacy',  label: 'Efficacy',         description: 'Does the product deliver on its primary claims (e.g., anti-dandruff, moisturising, brightening)?' },
  { key: 'packaging', label: 'Packaging Fit',    description: 'Does the formula work well with the selected packaging? Dispensing, stability, visual appeal?' },
  { key: 'overall',   label: 'Overall Impression', description: 'Your overall assessment. Would you approve this sample for the next development stage?' },
];

const SAMPLE_INFO = {
  orderId: 'SMP-0010',
  formula: 'Vitamin C Brightening Cleanser',
  version: 'v2.0',
  deliveredDate: '25 Jan 2026',
  project: 'Vitamin C Brightening Serum',
};

const EXISTING_REVIEWS = [
  {
    reviewer: 'Sara M.',
    date: '27 Jan 2026',
    scores: { texture: 4, scent: 3, efficacy: 4, packaging: 5, overall: 4 },
    notes: 'Texture is excellent — light and non-greasy. Scent is slightly medicinal; could use more citrus. Efficacy promising after 3-day test. Packaging dispenses perfectly.',
  },
];

export default function SampleReviewPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setScore = (key: string, score: number) => {
    setScores(prev => ({ ...prev, [key]: score }));
  };

  const allScored = CATEGORIES.every(c => scores[c.key] && scores[c.key] > 0);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotos(prev => prev.length < 5 ? [...prev, result] : prev);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (allScored) setSubmitted(true);
  };

  if (submitted) {
    return (
      <PlatformLayout>
        <div className={styles.page}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Review submitted</h2>
            <p className={styles.successSub}>
              Your review for {SAMPLE_INFO.formula} ({SAMPLE_INFO.version}) has been recorded.
              The team can now view all reviews to decide on next steps.
            </p>
            <div className={styles.successActions}>
              <button className={styles.primaryBtn} onClick={() => router.push('/samples')}>Back to orders</button>
              <button className={styles.secondaryBtn} onClick={() => router.push(`/projects/2`)}>View project</button>
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Breadcrumb ── */}
        <div className={styles.breadcrumb}>
          <button onClick={() => router.push('/samples')} className={styles.breadLink}>Sample Orders</button>
          <span className={styles.breadSep}>›</span>
          <button onClick={() => router.push('/samples')} className={styles.breadLink}>{SAMPLE_INFO.orderId}</button>
          <span className={styles.breadSep}>›</span>
          <span>Review</span>
        </div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Sample Review</h1>
            <p className={styles.subtitle}>
              {SAMPLE_INFO.formula} · {SAMPLE_INFO.version} · Delivered {SAMPLE_INFO.deliveredDate}
            </p>
          </div>
        </div>

        {/* ── Existing reviews ── */}
        {EXISTING_REVIEWS.length > 0 && (
          <div className={styles.existingSection}>
            <h2 className={styles.sectionTitle}>Team reviews ({EXISTING_REVIEWS.length})</h2>
            {EXISTING_REVIEWS.map((rev, i) => (
              <div key={i} className={styles.existingCard}>
                <div className={styles.existingHeader}>
                  <div className={styles.reviewerAvatar}>{rev.reviewer.charAt(0)}</div>
                  <div>
                    <p className={styles.reviewerName}>{rev.reviewer}</p>
                    <p className={styles.reviewerDate}>{rev.date}</p>
                  </div>
                  <div className={styles.existingOverall}>
                    <span className={styles.overallScore}>{rev.scores.overall}/5</span>
                    <span className={styles.overallLabel}>Overall</span>
                  </div>
                </div>
                <div className={styles.existingScores}>
                  {CATEGORIES.filter(c => c.key !== 'overall').map(c => (
                    <div key={c.key} className={styles.miniScore}>
                      <span className={styles.miniLabel}>{c.label}</span>
                      <div className={styles.miniDots}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={`${styles.miniDot} ${n <= rev.scores[c.key as keyof typeof rev.scores] ? styles.miniDotFilled : ''}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {rev.notes && <p className={styles.existingNotes}>{rev.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── Your review ── */}
        <div className={styles.reviewSection}>
          <h2 className={styles.sectionTitle}>Your review</h2>

          <div className={styles.ratingCards}>
            {CATEGORIES.map(cat => (
              <div key={cat.key} className={styles.ratingCard}>
                <div className={styles.ratingInfo}>
                  <h3 className={styles.ratingLabel}>{cat.label}</h3>
                  <p className={styles.ratingDesc}>{cat.description}</p>
                </div>
                <div>
                  <div className={styles.ratingInput}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className={`${styles.scoreDot} ${scores[cat.key] === n ? styles.scoreDotActive : ''} ${scores[cat.key] && scores[cat.key] >= n ? styles.scoreDotFilled : ''}`}
                        onClick={() => setScore(cat.key, n)}
                        aria-label={`Rate ${cat.label} ${n} out of 5`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className={styles.scaleLabels}>
                    <span className={styles.scaleLabel}>Poor</span>
                    <span className={styles.scaleLabel}>Average</span>
                    <span className={styles.scaleLabel}>Excellent</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Photo upload */}
          <div className={styles.photoSection}>
            <span className={styles.photoSectionLabel}>Photos ({photos.length}/5)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
            {photos.length < 5 && (
              <div
                className={styles.photoDropZone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              >
                <p className={styles.photoDropText}>
                  Drag photos here or <span className={styles.photoDropLink}>browse</span>
                </p>
              </div>
            )}
            {photos.length > 0 && (
              <div className={styles.photoPreviews}>
                {photos.map((src, i) => (
                  <div key={i} className={styles.photoPreview}>
                    <img src={src} alt={`Upload ${i + 1}`} />
                    <button className={styles.photoRemove} onClick={() => removePhoto(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.notesSection}>
            <label className={styles.notesLabel} htmlFor="review-notes">Additional notes</label>
            <textarea
              id="review-notes"
              className={styles.notesInput}
              placeholder="Share any additional observations about texture, scent, performance, or concerns..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit */}
          <div className={styles.submitRow}>
            <button className={styles.cancelBtn} onClick={() => router.push('/samples')}>Cancel</button>
            <button
              className={`${styles.submitBtn} ${!allScored ? styles.submitBtnDisabled : ''}`}
              onClick={handleSubmit}
              disabled={!allScored}
            >
              Submit review
            </button>
          </div>
        </div>

      </div>
    </PlatformLayout>
  );
}
