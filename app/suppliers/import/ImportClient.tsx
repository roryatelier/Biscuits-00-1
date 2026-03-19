'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { previewCsvImport, commitCsvImport } from '@/lib/actions/csv-import';
import styles from './Import.module.css';

type ParsedSupplier = {
  row: number;
  companyName: string;
  country: string;
  categories: string[];
  subcategories: string[];
  capabilityType: string;
  moq: number | null;
  keyBrands: string[];
  companyCity: string | null;
  factoryCity: string | null;
  factoryCountry: string | null;
  certTypes: string[];
  agreementTypes: string[];
  contactName: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  raw: Record<string, string>;
};

type ImportPreview = {
  valid: ParsedSupplier[];
  duplicates: ParsedSupplier[];
  rejected: { row: number; reason: string; data: Record<string, string> }[];
  totalRows: number;
};

type Step = 'upload' | 'preview' | 'done';

export default function ImportClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; certsCreated: number; agreementsCreated: number; contactsCreated: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data or upload a file');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await previewCsvImport(csvText);
      if (res && 'error' in res) {
        setError(res.error);
      } else if (res) {
        setPreview(res as ImportPreview);
        setStep('preview');
      }
    });
  };

  const handleCommit = () => {
    if (!preview) return;
    startTransition(async () => {
      const res = await commitCsvImport(preview.valid);
      if (res && 'error' in res) {
        setError(res.error as string);
      } else if (res && 'success' in res) {
        setResult(res as { created: number; certsCreated: number; agreementsCreated: number; contactsCreated: number });
        setStep('done');
      }
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Import Suppliers</h1>
        <p className={styles.pageSubtitle}>Upload a CSV file to bulk import suppliers into the database</p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {step === 'upload' && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <h2 className={styles.sectionTitle}>Upload CSV File</h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
            <div className={styles.divider}>or paste CSV data</div>
            <textarea
              className={styles.textArea}
              placeholder={'Company Name,Country,Categories,MOQ,Key Brands,Certifications\nCosmax Inc.,South Korea,"face-care,spf",50000,"CosRX,Skin1004","GMP,ISO"'}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={12}
            />
            <div className={styles.columnHelp}>
              <h3 className={styles.helpTitle}>Recognised columns</h3>
              <p className={styles.helpText}>
                Company Name, Country, Categories, Subcategories, Capability Type, MOQ, Key Brands,
                Company City, Factory City, Factory Country, Certifications, Agreements,
                Contact Name, Contact Email, Contact Mobile
              </p>
            </div>
            <button
              className={styles.primaryBtn}
              onClick={handlePreview}
              disabled={isPending || !csvText.trim()}
            >
              {isPending ? 'Parsing...' : 'Preview Import'}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className={styles.previewSection}>
          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.summaryValid}`}>
              <span className={styles.summaryCount}>{preview.valid.length}</span>
              <span className={styles.summaryLabel}>Ready to import</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryDupe}`}>
              <span className={styles.summaryCount}>{preview.duplicates.length}</span>
              <span className={styles.summaryLabel}>Duplicates (skipped)</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryRejected}`}>
              <span className={styles.summaryCount}>{preview.rejected.length}</span>
              <span className={styles.summaryLabel}>Rejected</span>
            </div>
          </div>

          {preview.valid.length > 0 && (
            <div className={styles.previewTable}>
              <h3 className={styles.sectionTitle}>Ready to import ({preview.valid.length})</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Company</th>
                    <th>Country</th>
                    <th>Categories</th>
                    <th>Type</th>
                    <th>MOQ</th>
                    <th>Certs</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.valid.slice(0, 20).map((s) => (
                    <tr key={s.row}>
                      <td>{s.row}</td>
                      <td className={styles.bold}>{s.companyName}</td>
                      <td>{s.country}</td>
                      <td>{s.categories.join(', ') || '—'}</td>
                      <td>{s.capabilityType}</td>
                      <td>{s.moq?.toLocaleString() || '—'}</td>
                      <td>{s.certTypes.join(', ') || '—'}</td>
                      <td>{s.contactName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.valid.length > 20 && (
                <p className={styles.moreRows}>...and {preview.valid.length - 20} more rows</p>
              )}
            </div>
          )}

          {preview.duplicates.length > 0 && (
            <div className={styles.previewTable}>
              <h3 className={styles.sectionTitle}>Duplicates — will be skipped ({preview.duplicates.length})</h3>
              <table className={styles.table}>
                <thead>
                  <tr><th>Row</th><th>Company</th><th>Country</th></tr>
                </thead>
                <tbody>
                  {preview.duplicates.map((s) => (
                    <tr key={s.row} className={styles.dupeRow}>
                      <td>{s.row}</td>
                      <td>{s.companyName}</td>
                      <td>{s.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.rejected.length > 0 && (
            <div className={styles.previewTable}>
              <h3 className={styles.sectionTitle}>Rejected ({preview.rejected.length})</h3>
              <table className={styles.table}>
                <thead>
                  <tr><th>Row</th><th>Reason</th><th>Data</th></tr>
                </thead>
                <tbody>
                  {preview.rejected.map((r) => (
                    <tr key={r.row} className={styles.rejectedRow}>
                      <td>{r.row}</td>
                      <td className={styles.errorText}>{r.reason}</td>
                      <td className={styles.mono}>{JSON.stringify(r.data).slice(0, 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.secondaryBtn} onClick={() => { setStep('upload'); setPreview(null); }}>
              Back
            </button>
            <button
              className={styles.primaryBtn}
              onClick={handleCommit}
              disabled={isPending || preview.valid.length === 0}
            >
              {isPending ? 'Importing...' : `Import ${preview.valid.length} suppliers`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className={styles.doneSection}>
          <div className={styles.doneCard}>
            <h2 className={styles.doneTitle}>Import Complete</h2>
            <div className={styles.doneStats}>
              <p><strong>{result.created}</strong> suppliers created</p>
              <p><strong>{result.certsCreated}</strong> certifications added</p>
              <p><strong>{result.agreementsCreated}</strong> agreements added</p>
              <p><strong>{result.contactsCreated}</strong> contacts added</p>
            </div>
            <button className={styles.primaryBtn} onClick={() => router.push('/suppliers/database')}>
              View Supplier Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
