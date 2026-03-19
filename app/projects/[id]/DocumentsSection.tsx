'use client';

import { useState, useRef } from 'react';
import { deleteDocument, renameDocument } from '@/lib/actions/documents';
import { timeAgo } from '@/lib/utils/timeAgo';
import styles from './Documents.module.css';

type DocumentItem = {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: { name: string | null };
  createdAt: Date;
};

interface Props {
  projectId: string;
  initialDocuments: DocumentItem[];
}

function fileIcon(mimeType: string | null): string {
  if (!mimeType) return 'F';
  if (mimeType === 'application/pdf') return 'P';
  if (mimeType.startsWith('image/')) return 'I';
  if (mimeType.includes('spreadsheet') || mimeType === 'text/csv') return 'X';
  if (mimeType.includes('word')) return 'W';
  return 'F';
}

function fileIconColor(mimeType: string | null): string {
  if (!mimeType) return styles.iconDefault;
  if (mimeType === 'application/pdf') return styles.iconPdf;
  if (mimeType.startsWith('image/')) return styles.iconImage;
  if (mimeType.includes('spreadsheet') || mimeType === 'text/csv') return styles.iconSpreadsheet;
  if (mimeType.includes('word')) return styles.iconWord;
  return styles.iconDefault;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsSection({ projectId, initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const { listProjectDocuments } = await import('@/lib/actions/documents');
    const docs = await listProjectDocuments(projectId);
    setDocuments(docs);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('name', file.name);

      const res = await fetch('/api/uploads', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    }

    await refresh();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  async function handleDelete(docId: string, docName: string) {
    if (!confirm(`Delete "${docName}"?`)) return;
    const result = await deleteDocument(docId);
    if (result.success) await refresh();
  }

  async function handleRename(docId: string) {
    if (!editName.trim()) return;
    const result = await renameDocument(docId, editName);
    if (result.success) {
      setEditingId(null);
      await refresh();
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Documents ({documents.length})</h2>
        <button
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '+ Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.csv"
          onChange={(e) => handleUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {documents.length === 0 && !uploading ? (
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.dropIcon}>+</div>
          <p className={styles.dropText}>
            Drop files here or click to upload
          </p>
          <p className={styles.dropHint}>
            PDF, images, Word, Excel — up to 10MB
          </p>
        </div>
      ) : (
        <div
          className={`${styles.documentList} ${dragOver ? styles.listDragOver : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {documents.map((doc) => (
            <div key={doc.id} className={styles.documentRow}>
              <div className={`${styles.docIcon} ${fileIconColor(doc.mimeType)}`}>
                {fileIcon(doc.mimeType)}
              </div>

              <div className={styles.docInfo}>
                {editingId === doc.id ? (
                  <div className={styles.editRow}>
                    <input
                      className={styles.editInput}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(doc.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button className={styles.editSave} onClick={() => handleRename(doc.id)}>Save</button>
                    <button className={styles.editCancel} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.docName}
                    >
                      {doc.name}
                    </a>
                    <p className={styles.docMeta}>
                      {doc.uploadedBy.name ?? 'Unknown'} · {timeAgo(doc.createdAt)}
                      {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ''}
                    </p>
                  </>
                )}
              </div>

              <div className={styles.docActions}>
                <a
                  href={doc.fileUrl}
                  download={doc.fileName}
                  className={styles.docActionBtn}
                  title="Download"
                >
                  ↓
                </a>
                <button
                  className={styles.docActionBtn}
                  onClick={() => { setEditingId(doc.id); setEditName(doc.name); }}
                  title="Rename"
                >
                  ✎
                </button>
                <button
                  className={styles.docActionBtn}
                  onClick={() => handleDelete(doc.id, doc.name)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
