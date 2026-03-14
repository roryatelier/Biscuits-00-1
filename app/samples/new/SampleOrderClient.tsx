'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSampleOrder } from '@/lib/actions/samples';
import styles from './SampleOrder.module.css';

const STEPS = ['Select formula', 'Quantity & format', 'Shipping', 'Confirm'];

type Formulation = {
  id: string;
  name: string;
  version: string;
  category: string;
};

type Project = {
  id: string;
  name: string;
};

export default function SampleOrderClient({
  formulations,
  projects,
}: {
  formulations: Formulation[];
  projects: Project[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Step 1
  const [selectedFormula, setSelectedFormula] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');

  // Step 2
  const [quantity, setQuantity] = useState('');
  const [format, setFormat] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Step 3
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [address, setAddress]     = useState('');
  const [city, setCity]           = useState('');
  const [country, setCountry]     = useState('');
  const [postcode, setPostcode]   = useState('');
  const [notes, setNotes]         = useState('');

  const formula = formulations.find(f => f.id === selectedFormula);
  const moqWarning = quantity !== '' && parseInt(quantity) < 50;

  const canAdvance = () => {
    if (step === 0) return !!selectedFormula;
    if (step === 1) return !!quantity && !!format;
    if (step === 2) return !!firstName && !!lastName && !!address && !!city && !!country && !!postcode;
    return true;
  };

  const shippingAddress = `${firstName} ${lastName}, ${address}, ${city}, ${country} ${postcode}`;

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      // Submit order
      setError('');
      startTransition(async () => {
        const result = await createSampleOrder({
          formulationId: selectedFormula,
          projectId: selectedProject || undefined,
          quantity: parseInt(quantity),
          format: format === 'bulk' ? 'Bulk sample' : format === 'filled' ? 'Filled retail unit' : 'Lab prototype',
          shippingAddress,
          notes: notes || undefined,
        });
        if (result && 'error' in result) {
          setError(result.error as string);
        } else if (result && 'reference' in result) {
          setOrderRef(result.reference as string);
          setSubmitted(true);
        }
      });
    }
  };

  if (submitted) {
    return (
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
            <span className={styles.successRefValue}>3-5 weeks from today</span>
          </div>
          <div className={styles.successActions}>
            <button className={styles.trackBtn} onClick={() => router.push('/samples')}>
              View order tracker &rarr;
            </button>
            <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <button className={styles.progressBack} onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}>
          &larr; Back
        </button>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s} className={styles.stepItem}>
              <div className={`${styles.stepDot} ${i < step ? styles.stepDone : ''} ${i === step ? styles.stepActive : ''}`}>
                {i < step ? '\u2713' : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : ''}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.content}>

        {/* Step 0: Select formula */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <h1 className={styles.stepTitle}>Select a formula</h1>
            <p className={styles.stepSub}>Choose the formulation you want to sample.</p>
            <div className={styles.formulaList}>
              {formulations.map(f => (
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

        {/* Step 1: Quantity & format */}
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
                    Warning: Minimum order quantity is 50 units. Additional fees may apply below MOQ.
                  </div>
                )}
                <p className={styles.helpText}>Minimum order quantity: 50 units. Lead time: 3-5 weeks.</p>
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

            {/* Project link */}
            {projects.length > 0 && (
              <div className={styles.field} style={{ marginTop: 16 }}>
                <label className={styles.label}>Link to project (optional)</label>
                <select
                  className={styles.select || styles.input}
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                >
                  <option value="">No project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Shipping */}
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
                <label className={styles.label}>Notes (optional)</label>
                <textarea
                  className={styles.input}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <h1 className={styles.stepTitle}>Confirm &amp; place order</h1>
            <p className={styles.stepSub}>Review your order before submitting.</p>
            <div className={styles.confirmCard}>
              <SummaryRow label="Formula" value={`${formula?.name} (${selectedVersion})`} />
              <SummaryRow label="Quantity" value={`${quantity} units`} />
              <SummaryRow label="Format" value={format === 'bulk' ? 'Bulk sample' : format === 'filled' ? 'Filled retail unit' : 'Lab prototype'} />
              <SummaryRow label="Ship to" value={shippingAddress} />
              {selectedProject && (
                <SummaryRow label="Project" value={projects.find(p => p.id === selectedProject)?.name ?? ''} />
              )}
              {notes && <SummaryRow label="Notes" value={notes} />}
              <div className={styles.confirmTotal}>
                <span>Estimated lead time</span>
                <strong>3-5 weeks</strong>
              </div>
            </div>
            {error && (
              <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>
            )}
            <p className={styles.confirmNote}>
              By placing this order you agree to Atelier&apos;s sample order terms. The manufacturer will confirm within 2 business days.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.continueBtn}
            onClick={advance}
            disabled={!canAdvance() || isPending}
          >
            {isPending ? 'Placing order...' : step === STEPS.length - 1 ? 'Place order' : 'Continue \u2192'}
          </button>
        </div>

      </div>
    </div>
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
