'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import styles from './SampleOrder.module.css';

const FORMULATIONS = [
  { id: '7',  name: 'Scalp Purify Anti-Dandruff Treatment', category: 'Treatment',   version: 'v4.0' },
  { id: '1',  name: 'Hydra-Plump Moisture Serum',           category: 'Serum',       version: 'v2.1' },
  { id: '11', name: 'Ceramide Barrier Repair Serum',        category: 'Serum',       version: 'v3.1' },
  { id: '3',  name: 'Overnight Restore Night Cream',        category: 'Moisturiser', version: 'v3.0' },
  { id: '9',  name: 'Vitamin C Brightening Cleanser',       category: 'Cleanser',    version: 'v2.0' },
  { id: '5',  name: 'SPF50 Daily Defense Moisturiser',      category: 'SPF',         version: 'v2.2' },
];

const STEPS = ['Select formula', 'Quantity & format', 'Shipping', 'Confirm'];

export default function SampleOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [orderRef] = useState('SMP-' + String(Math.floor(Math.random() * 9000) + 1000));

  // Step 1
  const [selectedFormula, setSelectedFormula] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');

  // Step 2
  const [quantity, setQuantity] = useState('');
  const [format, setFormat] = useState('');

  // Step 3
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [address, setAddress]     = useState('');
  const [city, setCity]           = useState('');
  const [country, setCountry]     = useState('');
  const [postcode, setPostcode]   = useState('');
  const [email, setEmail]         = useState('');

  const formula = FORMULATIONS.find(f => f.id === selectedFormula);
  const moqWarning = quantity !== '' && parseInt(quantity) < 50;

  const canAdvance = () => {
    if (step === 0) return !!selectedFormula;
    if (step === 1) return !!quantity && !!format;
    if (step === 2) return !!firstName && !!lastName && !!address && !!city && !!country && !!postcode && !!email;
    return true;
  };

  const advance = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else { setSubmitted(true); }
  };

  if (submitted) {
    return (
      <PlatformLayout>
        <div className={styles.successPage}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircleSVG />
            </div>
            <h1 className={styles.successTitle}>Order placed</h1>
            <p className={styles.successSub}>
              Your sample order has been received and sent to the manufacturer.
            </p>
            <div className={styles.successRef}>
              <span className={styles.successRefLabel}>Order reference</span>
              <span className={styles.successRefValue}>{orderRef}</span>
            </div>
            <div className={styles.successRef}>
              <span className={styles.successRefLabel}>Estimated delivery</span>
              <span className={styles.successRefValue}>3–5 weeks from today</span>
            </div>
            <div className={styles.successActions}>
              <button className={styles.trackBtn} onClick={() => router.push('/samples')}>
                View order tracker →
              </button>
              <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className={styles.page}>

        {/* ── Progress bar ── */}
        <div className={styles.progressBar}>
          <button className={styles.progressBack} onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}>
            ← Back
          </button>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div key={s} className={styles.stepItem}>
                <div className={`${styles.stepDot} ${i < step ? styles.stepDone : ''} ${i === step ? styles.stepActive : ''}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
              </div>
            ))}
          </div>
          <div style={{ width: 80 }} />
        </div>

        <div className={styles.content}>

          {/* ── Step 0: Select formula ── */}
          {step === 0 && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Select a formula</h1>
              <p className={styles.stepSub}>Choose the formulation you want to sample.</p>
              <div className={styles.formulaList}>
                {FORMULATIONS.map(f => (
                  <label key={f.id} className={`${styles.formulaRow} ${selectedFormula === f.id ? styles.formulaSelected : ''}`}>
                    <input
                      type="radio"
                      name="formula"
                      value={f.id}
                      checked={selectedFormula === f.id}
                      onChange={() => { setSelectedFormula(f.id); setSelectedVersion(f.version); }}
                      className={styles.radioInput}
                    />
                    <div className={styles.formulaInfo}>
                      <span className={styles.formulaName}>{f.name}</span>
                      <span className={styles.formulaMeta}>{f.category} · {f.version}</span>
                    </div>
                    <span className={styles.versionBadge}>{f.version}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Quantity & format ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Quantity &amp; format</h1>
              <p className={styles.stepSub}>
                Ordering for: <strong>{formula?.name}</strong> ({selectedVersion})
              </p>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Number of units</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                  {moqWarning && (
                    <div className={styles.moqWarning}>
                      ⚠ Minimum order quantity is 50 units. Additional fees may apply below MOQ.
                    </div>
                  )}
                  <p className={styles.helpText}>Minimum order quantity: 50 units. Lead time: 3–5 weeks.</p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Sample format</label>
                  <div className={styles.formatOptions}>
                    {[
                      { value: 'bulk',   label: 'Bulk sample',      desc: 'Raw product in container' },
                      { value: 'filled', label: 'Filled retail unit', desc: 'In production packaging' },
                      { value: 'lab',    label: 'Lab prototype',     desc: 'Unscaled lab batch' },
                    ].map(opt => (
                      <label key={opt.value} className={`${styles.formatOption} ${format === opt.value ? styles.formatSelected : ''}`}>
                        <input type="radio" name="format" value={opt.value} checked={format === opt.value} onChange={() => setFormat(opt.value)} className={styles.radioInput} />
                        <div>
                          <span className={styles.formatLabel}>{opt.label}</span>
                          <span className={styles.formatDesc}>{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Shipping ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Shipping details</h1>
              <p className={styles.stepSub}>Where should we send the sample?</p>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>First name</label>
                  <input className={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Last name</label>
                  <input className={styles.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div className={styles.field} style={{ marginBottom: 16 }}>
                <label className={styles.label}>Street address</label>
                <input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Example Street" />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>City</label>
                  <input className={styles.input} value={city} onChange={e => setCity(e.target.value)} placeholder="London" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Postcode</label>
                  <input className={styles.input} value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="EC1A 1BB" />
                </div>
              </div>
              <div className={styles.fieldRow} style={{ marginBottom: 20 }}>
                <div className={styles.field}>
                  <label className={styles.label}>Country</label>
                  <select className={styles.select} value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="">Select country</option>
                    <option>United Kingdom</option><option>United States</option><option>France</option>
                    <option>Germany</option><option>Australia</option><option>Japan</option><option>Canada</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Delivery contact email</label>
                  <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h1 className={styles.stepTitle}>Confirm &amp; place order</h1>
              <p className={styles.stepSub}>Review your order before submitting.</p>
              <div className={styles.confirmCard}>
                <SummaryRow label="Formula" value={`${formula?.name} (${selectedVersion})`} />
                <SummaryRow label="Quantity" value={`${quantity} units`} />
                <SummaryRow label="Format" value={format === 'bulk' ? 'Bulk sample' : format === 'filled' ? 'Filled retail unit' : 'Lab prototype'} />
                <SummaryRow label="Ship to" value={`${firstName} ${lastName}, ${address}, ${city}, ${country} ${postcode}`} />
                <SummaryRow label="Contact" value={email} />
                <div className={styles.confirmTotal}>
                  <span>Estimated lead time</span>
                  <strong>3–5 weeks</strong>
                </div>
              </div>
              <p className={styles.confirmNote}>
                By placing this order you agree to Atelier's sample order terms. The manufacturer will confirm within 2 business days.
              </p>
            </div>
          )}

          {/* ── Actions ── */}
          <div className={styles.actions}>
            <button
              className={styles.continueBtn}
              onClick={advance}
              disabled={!canAdvance()}
            >
              {step === STEPS.length - 1 ? 'Place order' : 'Continue →'}
            </button>
          </div>

        </div>
      </div>
    </PlatformLayout>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  );
}

function CheckCircleSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#2563eb" fillOpacity="0.08" />
      <circle cx="32" cy="32" r="24" fill="#2563eb" />
      <path d="M20 32L28 40L44 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
