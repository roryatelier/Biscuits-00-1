'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addReview } from '@/lib/actions/samples';
import styles from './Review.module.css';

const CATEGORIES = [
  { key: 'texture',  label: 'Texture & Feel',    description: 'How does the product feel on the skin/hair? Is it smooth, sticky, gritty, lightweight?' },
  { key: 'scent',    label: 'Scent',              description: 'Is the fragrance pleasant? Too strong or too subtle? Does it align with the product positioning?' },
  { key: 'colour',   label: 'Colour',             description: 'Is the colour consistent, appealing, and aligned with brand expectations?' },
  { key: 'overall',  label: 'Overall Impression',  description: 'Your overall assessment. Would you approve this sample for the next development stage?' },
];

type Review = {
  id: string;
  texture: number | null;
  scent: number | null;
  colour: number | null;
  overall: number | null;
  notes: string | null;
  createdAt: string;
  reviewerName: string;
};

type Order = {
  id: string;
  reference: string;
  status: string;
  formulation: { id: string; name: string; version: string } | null;
  project: { id: string; name: string } | null;
  createdAt: string;
  reviews: Review[];
};

export default function ReviewClient({ order }: { order: Order }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formulaName = order.formulation?.name ?? 'Unknown formula';
  const version = order.formulation?.version ?? '';

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
    if (!allScored) return;
    setError('');
    startTransition(async () => {
      const result = await addReview({
        sampleOrderId: order.id,
        texture: scores.texture,
        scent: scores.scent,
        colour: scores.colour,
        overall: scores.overall,
        notes: notes || undefined,
      });
      if (result && 'error' in result) {
        setError(result.error as string);
      } else {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>{'\u2713'}</div>
          <h2 className={styles.successTitle}>Review submitted</h2>
          <p className={styles.successSub}>
            Your review for {formulaName} ({version}) has been recorded.
            The team can now view all reviews to decide on next steps.
          </p>
          <div className={styles.successActions}>
            <button className={styles.primaryBtn} onClick={() => router.push('/samples')}>Back to orders</button>
            {order.project && (
              <button className={styles.secondaryBtn} onClick={() => router.push(`/projects/${order.project!.id}`)}>View project</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button onClick={() => router.push('/samples')} className={styles.breadLink}>Sample Orders</button>
        <span className={styles.breadSep}>{'\u203A'}</span>
        <button onClick={() => router.push('/samples')} className={styles.breadLink}>{order.reference}</button>
        <span className={styles.breadSep}>{'\u203A'}</span>
        <span>Review</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sample Review</h1>
          <p className={styles.subtitle}>
            {formulaName} · {version} · {order.status}
          </p>
        </div>
      </div>

      {/* Existing reviews */}
      {order.reviews.length > 0 && (
        <div className={styles.existingSection}>
          <h2 className={styles.sectionTitle}>Team reviews ({order.reviews.length})</h2>
          {order.reviews.map((rev) => (
            <div key={rev.id} className={styles.existingCard}>
              <div className={styles.existingHeader}>
                <div className={styles.reviewerAvatar}>{rev.reviewerName.charAt(0)}</div>
                <div>
                  <p className={styles.reviewerName}>{rev.reviewerName}</p>
                  <p className={styles.reviewerDate}>
                    {new Date(rev.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className={styles.existingOverall}>
                  <span className={styles.overallScore}>{rev.overall ?? '-'}/5</span>
                  <span className={styles.overallLabel}>Overall</span>
                </div>
              </div>
              <div className={styles.existingScores}>
                {CATEGORIES.filter(c => c.key !== 'overall').map(c => {
                  const val = rev[c.key as keyof Review] as number | null;
                  return (
                    <div key={c.key} className={styles.miniScore}>
                      <span className={styles.miniLabel}>{c.label}</span>
                      <div className={styles.miniDots}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} className={`${styles.miniDot} ${val !== null && n <= val ? styles.miniDotFilled : ''}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {rev.notes && <p className={styles.existingNotes}>{rev.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Your review */}
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
                  <button className={styles.photoRemove} onClick={() => removePhoto(i)}>{'\u00D7'}</button>
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
        {error && (
          <p style={{ color: '#dc2626', marginBottom: 8 }}>{error}</p>
        )}
        <div className={styles.submitRow}>
          <button className={styles.cancelBtn} onClick={() => router.push('/samples')}>Cancel</button>
          <button
            className={`${styles.submitBtn} ${!allScored ? styles.submitBtnDisabled : ''}`}
            onClick={handleSubmit}
            disabled={!allScored || isPending}
          >
            {isPending ? 'Submitting...' : 'Submit review'}
          </button>
        </div>
      </div>

    </div>
  );
}
