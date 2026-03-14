'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PackagingDetail.module.css';

interface PackagingData {
  id: string;
  name: string;
  format: string | null;
  material: string | null;
  moq: number | null;
  unitCost: number | null;
  leadTime: string | null;
  status: string;
  description: string | null;
}

interface PackagingDetailProps {
  packaging: PackagingData;
}

const FORMAT_VARIANTS = [
  { id: 'bottle', label: 'Bottle', icon: '\u2B21' },
  { id: 'tube',   label: 'Tube',   icon: '\u25AD' },
  { id: 'jar',    label: 'Jar',    icon: '\u2B20' },
];

const COLOR_OPTIONS = ['Matte White', 'Matte Black', 'Frosted Clear', 'Custom'];

const TABS = ['Specifications', 'Artwork & Preview', 'Ordering'];

export default function PackagingDetail({ packaging }: PackagingDetailProps) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const formatId = (packaging.format ?? 'bottle').toLowerCase();
  const [selectedFormat, setSelectedFormat] = useState(formatId);
  const [selectedColor, setSelectedColor] = useState('Matte White');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const moqDisplay = packaging.moq != null ? packaging.moq.toLocaleString() : '—';
  const unitCostDisplay = packaging.unitCost != null ? `$${packaging.unitCost.toFixed(2)}` : '—';

  const specs = [
    { label: 'Format',    value: packaging.format ?? '—' },
    { label: 'Material',  value: packaging.material ?? '—' },
    { label: 'MOQ',       value: moqDisplay },
    { label: 'Unit cost', value: unitCostDisplay },
    { label: 'Lead time', value: packaging.leadTime ?? '—' },
    { label: 'Status',    value: packaging.status },
    ...(packaging.description ? [{ label: 'Description', value: packaging.description }] : []),
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file.name);
  };

  return (
    <div className={styles.page}>

      {/* ── Breadcrumb ── */}
      <div className={styles.breadcrumb}>
        <button onClick={() => router.push('/packaging')} className={styles.breadLink}>Packaging</button>
        <span className={styles.breadSep}>{'\u203A'}</span>
        <span>{packaging.name}</span>
      </div>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerMeta}>
            <span className={styles.formatBadge}>{packaging.format ?? 'Unknown'}</span>
            <span className={styles.statusBadge}>{packaging.status}</span>
          </div>
          <h1 className={styles.title}>{packaging.name}</h1>
          <p className={styles.subtitle}>{packaging.material ?? '—'} · MOQ {moqDisplay}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={() => router.push('/samples/new')}>Request sample</button>
          <button className={styles.actionBtnSecondary}>Add to project</button>
          <button className={styles.actionBtnSecondary}>Export</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map((t, i) => (
          <button key={t} className={`${styles.tab} ${tab === i ? styles.tabActive : ''}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab: Specifications ── */}
      {tab === 0 && (
        <div className={styles.tabContent}>
          <div className={styles.specGrid}>
            {specs.map(s => (
              <div key={s.label} className={styles.specRow}>
                <span className={styles.specLabel}>{s.label}</span>
                <span className={styles.specValue}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Artwork & Preview ── */}
      {tab === 1 && (
        <div className={styles.tabContent}>
          <div className={styles.artworkLayout}>

            {/* Preview area */}
            <div className={styles.previewArea}>
              <div className={styles.previewBox}>
                <span className={styles.previewIcon} aria-hidden="true">
                  {selectedFormat === 'bottle' && '\u2B21'}
                  {selectedFormat === 'tube' && '\u25AD'}
                  {selectedFormat === 'jar' && '\u2B20'}
                </span>
                <p className={styles.previewLabel}>{packaging.name}</p>
                <p className={styles.previewSub}>{selectedColor}</p>
              </div>
              <p className={styles.previewNote}>3D rotation available in V2</p>
            </div>

            {/* Controls */}
            <div className={styles.artworkControls}>
              {/* Format selector */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Format</label>
                <div className={styles.formatSelector}>
                  {FORMAT_VARIANTS.map(v => (
                    <button
                      key={v.id}
                      className={`${styles.formatOption} ${selectedFormat === v.id ? styles.formatOptionActive : ''}`}
                      onClick={() => setSelectedFormat(v.id)}
                      aria-pressed={selectedFormat === v.id}
                    >
                      <span className={styles.formatOptionIcon}>{v.icon}</span>
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Color / Finish</label>
                <div className={styles.colorSelector}>
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      className={`${styles.colorOption} ${selectedColor === c ? styles.colorOptionActive : ''}`}
                      onClick={() => setSelectedColor(c)}
                      aria-pressed={selectedColor === c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Upload artwork</label>
                <div
                  className={`${styles.uploadZone} ${isDragOver ? styles.uploadZoneDragOver : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".png,.jpg,.svg,.ai,.pdf" onChange={handleFileChange} hidden />
                  {uploadedFile ? (
                    <div className={styles.uploadSuccess}>
                      <span className={styles.uploadCheckIcon}>{'\u2713'}</span>
                      <span>{uploadedFile}</span>
                      <button className={styles.uploadRemove} onClick={e => { e.stopPropagation(); setUploadedFile(null); }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <p className={styles.uploadText}>Drag and drop or click to browse</p>
                      <p className={styles.uploadSub}>PNG, JPG, SVG, AI, PDF — max 25MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Ordering ── */}
      {tab === 2 && (
        <div className={styles.tabContent}>
          <div className={styles.orderInfo}>
            <div className={styles.orderCard}>
              <h3 className={styles.orderCardTitle}>Minimum order</h3>
              <p className={styles.orderCardValue}>{moqDisplay}</p>
              <p className={styles.orderCardSub}>Per SKU, per production run</p>
            </div>
            <div className={styles.orderCard}>
              <h3 className={styles.orderCardTitle}>Lead time</h3>
              <p className={styles.orderCardValue}>{packaging.leadTime ?? '—'}</p>
              <p className={styles.orderCardSub}>From artwork approval to delivery</p>
            </div>
            <div className={styles.orderCard}>
              <h3 className={styles.orderCardTitle}>Unit cost</h3>
              <p className={styles.orderCardValue}>{unitCostDisplay}</p>
              <p className={styles.orderCardSub}>Per unit at MOQ</p>
            </div>
          </div>
          <div className={styles.orderAction}>
            <button className={styles.actionBtn} onClick={() => router.push('/samples/new')}>
              Request packaging sample
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
