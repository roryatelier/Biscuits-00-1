'use client';

import { useState, useEffect, useRef } from 'react';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listAllDocuments } from '@/lib/actions/documents';
import styles from './Documents.module.css';

type Document = {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date;
  uploadedBy: { name: string | null };
  project: { id: string; name: string } | null;
};

function formatSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeLabel(mimeType: string | null): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType?.startsWith('image/')) return 'Image';
  if (mimeType?.includes('spreadsheet') || mimeType === 'text/csv') return 'Spreadsheet';
  if (mimeType?.includes('word')) return 'Document';
  return 'File';
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'brand' | 'project'>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listAllDocuments().then((d) => {
      setDocs(d as unknown as Document[]);
      setLoading(false);
    });
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      await fetch('/api/uploads', { method: 'POST', body: formData });
    }
    const fresh = await listAllDocuments();
    setDocs(fresh as unknown as Document[]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const filtered = docs.filter((d) => {
    if (filter === 'brand') return !d.project;
    if (filter === 'project') return !!d.project;
    return true;
  });

  return (
    <PlatformLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Documents</h1>
            <p className={styles.subtitle}>{docs.length} documents</p>
          </div>
          <button
            className={styles.uploadBtn}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload'}
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

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'brand' ? styles.filterActive : ''}`}
            onClick={() => setFilter('brand')}
          >
            Brand
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'project' ? styles.filterActive : ''}`}
            onClick={() => setFilter('project')}
          >
            Project
          </button>
        </div>

        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>
            {filter === 'all'
              ? 'No documents yet — upload your first one.'
              : `No ${filter} documents.`}
          </p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colName}>Name</span>
              <span className={styles.colType}>Type</span>
              <span className={styles.colProject}>Project</span>
              <span className={styles.colSize}>Size</span>
              <span className={styles.colUploader}>Uploaded by</span>
            </div>
            {filtered.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tableRow}
              >
                <span className={styles.colName}>{doc.name}</span>
                <span className={styles.colType}>
                  <span className={styles.typeBadge}>{typeLabel(doc.mimeType)}</span>
                </span>
                <span className={styles.colProject}>
                  {doc.project ? doc.project.name : 'Brand'}
                </span>
                <span className={styles.colSize}>{formatSize(doc.fileSize)}</span>
                <span className={styles.colUploader}>{doc.uploadedBy.name || '—'}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
