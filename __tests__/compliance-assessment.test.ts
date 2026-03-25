import { describe, it, expect } from 'vitest';
import {
  computeComplianceAssessment,
  computeComplianceScore,
  type SupplierComplianceInput,
} from '@/lib/compliance-assessment';
import type { ComplianceAssessmentRow } from '@/types/supplier-database';

// ─── Helpers ────────────────────────────────────────────────

function makeSupplier(overrides: Partial<SupplierComplianceInput> = {}): SupplierComplianceInput {
  return {
    qualificationStage: 'Identified',
    factoryCountry: null,
    companyCountry: null,
    certifications: [],
    agreements: [],
    cocAcknowledged: false,
    factoryAudits: [],
    ...overrides,
  };
}

function findRow(rows: ComplianceAssessmentRow[], ruleKey: string) {
  return rows.find(r => r.ruleKey === ruleKey);
}

// ─── computeComplianceAssessment ────────────────────────────

describe('computeComplianceAssessment', () => {
  // --- All certs verified ---
  it('marks all cert rows compliant when all certs are verified', () => {
    const supplier = makeSupplier({
      qualificationStage: 'Fully Qualified',
      certifications: [
        { certType: 'ISO_9001', certCategory: 'quality', verificationStatus: 'verified', expiryDate: '2027-06-01' },
        { certType: 'ISO_14001', certCategory: 'sustainability', verificationStatus: 'verified', expiryDate: null },
        { certType: 'ISO_45001', certCategory: 'safety', verificationStatus: 'verified', expiryDate: null },
        { certType: 'ISO_22716', certCategory: 'quality', verificationStatus: 'verified', expiryDate: null },
        { certType: 'GMP', certCategory: 'quality', verificationStatus: 'verified', expiryDate: null },
        { certType: 'SMETA', certCategory: 'ethics', verificationStatus: 'verified', expiryDate: null },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const certRows = rows.filter(r => r.section === 'Certifications');

    for (const row of certRows) {
      expect(row.tier).toBe('compliant');
    }
  });

  // --- No certs at all ---
  it('marks must-have certs as blocker and nice-to-have as gap when no certs exist', () => {
    const supplier = makeSupplier();
    const rows = computeComplianceAssessment(supplier);

    // Must-have certs should be blockers
    expect(findRow(rows, 'iso_9001')?.tier).toBe('blocker');
    expect(findRow(rows, 'iso_22716')?.tier).toBe('blocker');
    expect(findRow(rows, 'gmp')?.tier).toBe('blocker');

    // Nice-to-have certs should be gaps
    expect(findRow(rows, 'iso_14001')?.tier).toBe('gap');
    expect(findRow(rows, 'iso_45001')?.tier).toBe('gap');

    // Social audit is must-have, no cert → blocker
    expect(findRow(rows, 'social_audit')?.tier).toBe('blocker');
  });

  // --- Expired cert ---
  it('marks expired cert as blocker', () => {
    const supplier = makeSupplier({
      certifications: [
        { certType: 'ISO_9001', certCategory: 'quality', verificationStatus: 'expired', expiryDate: '2023-01-01' },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'iso_9001')!;
    expect(row.tier).toBe('blocker');
    expect(row.statusLabel).toBe('Expired');
    expect(row.evidenceText).toContain('Expired');
  });

  // --- Unverified cert ---
  it('marks unverified cert as gap', () => {
    const supplier = makeSupplier({
      certifications: [
        { certType: 'GMP', certCategory: 'quality', verificationStatus: 'unverified', expiryDate: null },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'gmp')!;
    expect(row.tier).toBe('gap');
    expect(row.statusLabel).toBe('Unverified');
    expect(row.evidenceText).toContain('not verified');
  });

  // --- Signed NDA ---
  it('marks signed NDA as compliant with date evidence', () => {
    const supplier = makeSupplier({
      agreements: [
        { agreementType: 'NDA', status: 'signed', signedAt: '2025-03-15T00:00:00Z', expiryDate: null },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'nda')!;
    expect(row.tier).toBe('compliant');
    expect(row.statusLabel).toBe('Signed');
    expect(row.evidenceText).toContain('Signed');
  });

  // --- Pending NDA ---
  it('marks pending NDA as gap', () => {
    const supplier = makeSupplier({
      agreements: [
        { agreementType: 'NDA', status: 'sent', signedAt: null, expiryDate: null },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'nda')!;
    expect(row.tier).toBe('gap');
    expect(row.statusLabel).toBe('Pending');
  });

  // --- No NDA (must-have → blocker) ---
  it('marks missing NDA as blocker', () => {
    const supplier = makeSupplier();
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'nda')!;
    expect(row.tier).toBe('blocker');
  });

  // --- CoC acknowledged ---
  it('marks CoC as compliant when acknowledged', () => {
    const supplier = makeSupplier({ cocAcknowledged: true });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'coc')!;
    expect(row.tier).toBe('compliant');
    expect(row.statusLabel).toBe('Acknowledged');
  });

  // --- CoC not acknowledged ---
  it('marks CoC as gap when not acknowledged', () => {
    const supplier = makeSupplier({ cocAcknowledged: false });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'coc')!;
    expect(row.tier).toBe('gap');
  });

  // --- Social audit cert verified ---
  it('marks social audit as compliant when SMETA is verified', () => {
    const supplier = makeSupplier({
      certifications: [
        { certType: 'SMETA', certCategory: 'ethics', verificationStatus: 'verified', expiryDate: '2027-01-01' },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'social_audit')!;
    expect(row.tier).toBe('compliant');
    expect(row.statusLabel).toContain('SMETA');
  });

  // --- No social audit → blocker ---
  it('marks social audit as blocker when no audit cert or factory audit', () => {
    const supplier = makeSupplier();
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'social_audit')!;
    expect(row.tier).toBe('blocker');
    expect(row.statusLabel).toBe('Not provided');
  });

  // --- Factory location present ---
  it('populates factory location row when present', () => {
    const supplier = makeSupplier({ factoryCountry: 'South Korea' });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'factory_location')!;
    expect(row.tier).toBe('compliant');
    expect(row.statusLabel).toBe('South Korea');
  });

  // --- Factory location missing ---
  it('marks factory location as not_assessed when missing', () => {
    const supplier = makeSupplier({ factoryCountry: null });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'factory_location')!;
    expect(row.tier).toBe('not_assessed');
    expect(row.statusLabel).toBe('Not specified');
  });

  // --- Qualification stages ---
  it.each([
    ['Fully Qualified', 'compliant'],
    ['Conditionally Qualified', 'compliant'],
    ['Identified', 'gap'],
    ['Outreached', 'gap'],
    ['Paused', 'gap'],
    ['Blacklisted', 'gap'],
  ] as const)('qualification stage "%s" maps to tier "%s"', (stage, expectedTier) => {
    const supplier = makeSupplier({ qualificationStage: stage });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'qualification_stage')!;
    expect(row.tier).toBe(expectedTier);
    expect(row.statusLabel).toBe(stage);
  });

  // --- MSA (nice-to-have) missing → gap, not blocker ---
  it('marks missing MSA as gap (nice-to-have)', () => {
    const supplier = makeSupplier();
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'msa')!;
    expect(row.tier).toBe('gap');
    expect(row.priority).toBe('nice_to_have');
  });

  // --- NDA not_started → blocker (must-have) ---
  it('marks NDA with not_started status as blocker', () => {
    const supplier = makeSupplier({
      agreements: [
        { agreementType: 'NDA', status: 'not_started', signedAt: null, expiryDate: null },
      ],
    });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'nda')!;
    expect(row.tier).toBe('blocker');
    expect(row.statusLabel).toBe('Not started');
  });

  // --- Verified cert with expiry date shows it in evidence ---
  it('shows expiry date in evidence for verified cert', () => {
    const supplier = makeSupplier({
      certifications: [
        { certType: 'ISO_9001', certCategory: 'quality', verificationStatus: 'verified', expiryDate: '2027-06-15' },
      ],
    });
    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'iso_9001')!;
    expect(row.evidenceText).toContain('valid to');
    expect(row.evidenceText).toContain('2027');
  });

  // --- BSCI audit verified ---
  it('marks social audit as compliant when BSCI is verified', () => {
    const supplier = makeSupplier({
      certifications: [
        { certType: 'BSCI', certCategory: 'ethics', verificationStatus: 'verified', expiryDate: null },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'social_audit')!;
    expect(row.tier).toBe('compliant');
    expect(row.statusLabel).toContain('BSCI');
  });

  // --- Unverified SMETA → gap ---
  it('marks social audit as gap when SMETA is unverified', () => {
    const supplier = makeSupplier({
      certifications: [
        { certType: 'SMETA', certCategory: 'ethics', verificationStatus: 'unverified', expiryDate: null },
      ],
    });

    const rows = computeComplianceAssessment(supplier);
    const row = findRow(rows, 'social_audit')!;
    expect(row.tier).toBe('gap');
    expect(row.statusLabel).toContain('unverified');
  });
});

// ─── computeComplianceScore ─────────────────────────────────

describe('computeComplianceScore', () => {
  it('returns 100 mustHave score when all must-haves are compliant', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R2', ruleKey: 'r2', priority: 'must_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.mustHave).toBe(100);
  });

  it('returns 0 mustHave score when no must-haves are met', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'blocker', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R2', ruleKey: 'r2', priority: 'must_have', tier: 'gap', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.mustHave).toBe(0);
  });

  it('computes correct percentage for mix of met/unmet', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R2', ruleKey: 'r2', priority: 'must_have', tier: 'blocker', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R3', ruleKey: 'r3', priority: 'must_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R4', ruleKey: 'r4', priority: 'must_have', tier: 'gap', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.mustHave).toBe(50); // 2/4 = 50%
  });

  it('weights overall score: 80% must-haves + 20% nice-to-haves', () => {
    const rows: ComplianceAssessmentRow[] = [
      // Must-haves: 1/2 = 50%
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R2', ruleKey: 'r2', priority: 'must_have', tier: 'blocker', statusLabel: '', evidenceText: '' },
      // Nice-to-haves: 1/1 = 100%
      { section: 'B', requirement: 'R3', ruleKey: 'r3', priority: 'nice_to_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    // 50 * 0.8 + 100 * 0.2 = 40 + 20 = 60
    expect(score.overall).toBe(60);
    expect(score.mustHave).toBe(50);
    expect(score.niceToHave).toBe(100);
  });

  it('blockers list contains only unmet must-haves with tier blocker', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'Certs', requirement: 'ISO 9001', ruleKey: 'iso_9001', priority: 'must_have', tier: 'blocker', statusLabel: 'Not provided', evidenceText: '' },
      { section: 'Certs', requirement: 'GMP', ruleKey: 'gmp', priority: 'must_have', tier: 'compliant', statusLabel: 'Certified', evidenceText: '' },
      { section: 'Agreements', requirement: 'NDA', ruleKey: 'nda', priority: 'must_have', tier: 'blocker', statusLabel: 'Not in place', evidenceText: '' },
      { section: 'Certs', requirement: 'ISO 14001', ruleKey: 'iso_14001', priority: 'nice_to_have', tier: 'gap', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.blockers).toHaveLength(2);
    expect(score.blockers).toEqual(
      expect.arrayContaining([
        { layer: 'Certs', requirement: 'ISO 9001', statusLabel: 'Not provided' },
        { layer: 'Agreements', requirement: 'NDA', statusLabel: 'Not in place' },
      ]),
    );
  });

  it('returns null scores for empty rows', () => {
    const score = computeComplianceScore([]);
    expect(score.overall).toBeNull();
    expect(score.mustHave).toBeNull();
    expect(score.niceToHave).toBeNull();
    expect(score.blockers).toEqual([]);
  });

  it('returns null scores when all rows are not_assessed', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'not_assessed', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R2', ruleKey: 'r2', priority: 'nice_to_have', tier: 'not_assessed', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.overall).toBeNull();
    expect(score.mustHave).toBeNull();
    expect(score.niceToHave).toBeNull();
  });

  it('uses only must-have score for overall when no nice-to-haves exist', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.overall).toBe(100);
    expect(score.niceToHave).toBeNull();
  });

  it('uses only nice-to-have score for overall when no must-haves are assessed', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'not_assessed', statusLabel: '', evidenceText: '' },
      { section: 'A', requirement: 'R2', ruleKey: 'r2', priority: 'nice_to_have', tier: 'compliant', statusLabel: '', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.overall).toBe(100);
    expect(score.mustHave).toBeNull();
    expect(score.niceToHave).toBe(100);
  });

  it('gap must-haves are not blockers', () => {
    const rows: ComplianceAssessmentRow[] = [
      { section: 'A', requirement: 'R1', ruleKey: 'r1', priority: 'must_have', tier: 'gap', statusLabel: 'Unverified', evidenceText: '' },
    ];

    const score = computeComplianceScore(rows);
    expect(score.blockers).toHaveLength(0);
    expect(score.mustHave).toBe(0);
  });
});
