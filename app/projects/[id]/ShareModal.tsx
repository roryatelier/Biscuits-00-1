'use client';

import { useState, useEffect, useCallback } from 'react';
import { createShareLink, revokeShareLink, listShareLinks } from '@/lib/actions/sharing';
import styles from './Collaboration.module.css';

interface ShareLink {
  id: string;
  token: string;
  expiresAt: Date;
  includeIngredients: boolean;
  includeReviews: boolean;
  creator: { name: string | null };
  createdAt: Date;
}

interface ShareModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ projectId, open, onClose }: ShareModalProps) {
  const [includeIngredients, setIncludeIngredients] = useState(false);
  const [includeReviews, setIncludeReviews] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLinks, setActiveLinks] = useState<ShareLink[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    const links = await listShareLinks(projectId);
    setActiveLinks(links as ShareLink[]);
  }, [projectId]);

  useEffect(() => {
    if (open) {
      fetchLinks();
      setGeneratedLink(null);
      setCopied(false);
      setError(null);
    }
  }, [open, fetchLinks]);

  if (!open) return null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await createShareLink(projectId, {
      includeIngredients,
      includeReviews,
      expiresInDays: expiryDays,
    });

    if ('error' in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ('link' in result && result.link) {
      const url = `${window.location.origin}/share/${result.link.token}`;
      setGeneratedLink(url);
      await fetchLinks();
    }
    setLoading(false);
  }

  async function handleCopy() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(linkId: string) {
    setRevoking(linkId);
    await revokeShareLink(linkId);
    await fetchLinks();
    setRevoking(null);
  }

  return (
    <div className={styles.shareOverlay} onClick={onClose}>
      <div className={styles.shareModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.shareModalHeader}>
          <h3 className={styles.shareModalTitle}>Share project</h3>
          <button className={styles.shareCloseBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.shareModalBody}>
          {/* Options */}
          <div className={styles.shareOptionGroup}>
            <label className={styles.shareToggleLabel}>
              <input
                type="checkbox"
                checked={includeIngredients}
                onChange={(e) => setIncludeIngredients(e.target.checked)}
              />
              <span>Include ingredients</span>
            </label>
            <label className={styles.shareToggleLabel}>
              <input
                type="checkbox"
                checked={includeReviews}
                onChange={(e) => setIncludeReviews(e.target.checked)}
              />
              <span>Include review scores</span>
            </label>
          </div>

          <div className={styles.shareOptionGroup}>
            <label className={styles.shareFieldLabel}>Link expires in</label>
            <select
              className={styles.shareSelect}
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {error && <p className={styles.shareError}>{error}</p>}

          <button
            className={styles.shareGenerateBtn}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate link'}
          </button>

          {generatedLink && (
            <div className={styles.shareLinkResult}>
              <input
                className={styles.shareLinkInput}
                value={generatedLink}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button className={styles.shareCopyBtn} onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}

          {/* Active links */}
          {activeLinks.length > 0 && (
            <div className={styles.shareActiveSection}>
              <p className={styles.shareFieldLabel}>Active links</p>
              <div className={styles.shareActiveList}>
                {activeLinks.map((link) => (
                  <div key={link.id} className={styles.shareActiveItem}>
                    <div className={styles.shareActiveMeta}>
                      <span className={styles.shareActiveCreator}>
                        {link.creator.name ?? 'Unknown'}
                      </span>
                      <span className={styles.shareActiveExpiry}>
                        Expires{' '}
                        {new Date(link.expiresAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {link.includeIngredients && (
                        <span className={styles.shareActiveTag}>Ingredients</span>
                      )}
                      {link.includeReviews && (
                        <span className={styles.shareActiveTag}>Reviews</span>
                      )}
                    </div>
                    <button
                      className={styles.shareRevokeBtn}
                      onClick={() => handleRevoke(link.id)}
                      disabled={revoking === link.id}
                    >
                      {revoking === link.id ? 'Revoking...' : 'Revoke'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
