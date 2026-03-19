'use client';

import { useState, useEffect, useRef } from 'react';
import { listBrandDocuments } from '@/lib/actions/documents';
import styles from './Sidebar.module.css';
import { ChevronDownIcon, ChevronUpIcon } from '../icons/Icons';

type BrandDoc = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string | null;
};

function thumbColor(mimeType: string | null): string {
  if (mimeType === 'application/pdf') return styles.orange;
  if (mimeType?.startsWith('image/')) return styles.pink;
  return styles.orange;
}

function thumbLabel(mimeType: string | null): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType?.startsWith('image/')) return 'IMG';
  if (mimeType?.includes('spreadsheet') || mimeType === 'text/csv') return 'XLS';
  if (mimeType?.includes('word')) return 'DOC';
  return 'FILE';
}

export default function BrandDocumentsPanel() {
  const [open, setOpen] = useState(true);
  const [docs, setDocs] = useState<BrandDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listBrandDocuments().then((d) =>
      setDocs(d.map((doc) => ({
        id: doc.id,
        name: doc.name,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
      })))
    );
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      // No projectId = brand document
      await fetch('/api/uploads', { method: 'POST', body: formData });
    }

    const fresh = await listBrandDocuments();
    setDocs(fresh.map((doc) => ({
      id: doc.id,
      name: doc.name,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
    })));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className={styles.dropdown}>
      <div className={styles.dropdownHeader} onClick={() => setOpen(!open)}>
        <p className={styles.sectionLabel}>Brand Documents</p>
        {open
          ? <ChevronUpIcon className={styles.chevron} />
          : <ChevronDownIcon className={styles.chevron} />}
      </div>
      <div className={`${styles.dropdownContent} ${open ? styles.open : ''}`}>
        {docs.length > 0 ? (
          <div className={styles.brandsWrapper}>
            {docs.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.singleBrand}
                style={{ textDecoration: 'none' }}
              >
                <div className={`${styles.brandImgPlaceholder} ${thumbColor(doc.mimeType)}`}>
                  {thumbLabel(doc.mimeType)}
                </div>
                <p className={styles.brandLabel}>{doc.name}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className={styles.brandEmptyText}>No brand documents yet</p>
        )}

        <button
          className={styles.brandUploadBtn}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '+ Add document'}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.csv"
          onChange={(e) => handleUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
