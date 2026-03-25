/**
 * Auto-compute compliance assessment rows from existing supplier data.
 * This generates the single-supplier compliance view.
 *
 * PURE MODULE — no DB, no auth, no 'use server'. Fully testable.
 */

import type { ComplianceAssessmentRow, ComplianceScore } from '@/types/supplier-database';

export type SupplierComplianceInput = {
  qualificationStage: string;
  factoryCountry: string | null;
  companyCountry: string | null;
  certifications: Array<{
    certType: string;
    certCategory: string | null;
    verificationStatus: string;
    expiryDate: string | null;
  }>;
  agreements: Array<{
    agreementType: string;
    status: string;
    signedAt: string | null;
    expiryDate: string | null;
  }>;
  cocAcknowledged: boolean;
  factoryAudits?: Array<{
    score: number | null;
    auditedOn: string | null;
    auditor: string | null;
  }>;
};

export function computeComplianceAssessment(supplier: SupplierComplianceInput): ComplianceAssessmentRow[] {
  const rows: ComplianceAssessmentRow[] = [];

  // --- Status & Context Section ---
  rows.push({
    section: 'Status & Context',
    requirement: 'Qualification Stage',
    ruleKey: 'qualification_stage',
    priority: 'must_have',
    tier: ['Fully Qualified', 'Conditionally Qualified'].includes(supplier.qualificationStage) ? 'compliant' : 'gap',
    statusLabel: supplier.qualificationStage,
    evidenceText: 'Internal qualification pipeline',
  });

  rows.push({
    section: 'Status & Context',
    requirement: 'Factory Location',
    ruleKey: 'factory_location',
    priority: 'nice_to_have',
    tier: supplier.factoryCountry ? 'compliant' : 'not_assessed',
    statusLabel: supplier.factoryCountry || 'Not specified',
    evidenceText: supplier.factoryCountry ? 'Supplier profile' : 'No factory location on file',
  });

  // --- Certifications Section ---
  const certChecks = [
    { certType: 'ISO_9001', label: 'ISO 9001', priority: 'must_have' as const },
    { certType: 'ISO_14001', label: 'ISO 14001', priority: 'nice_to_have' as const },
    { certType: 'ISO_45001', label: 'ISO 45001', priority: 'nice_to_have' as const },
    { certType: 'ISO_22716', label: 'ISO 22716 (Cosmetic GMP)', priority: 'must_have' as const },
    { certType: 'GMP', label: 'GMP', priority: 'must_have' as const },
  ];

  for (const check of certChecks) {
    const cert = supplier.certifications.find(c => c.certType === check.certType);
    let tier: ComplianceAssessmentRow['tier'] = 'not_assessed';
    let statusLabel = 'Not provided';
    let evidenceText = 'No certificate shared';

    if (cert) {
      if (cert.verificationStatus === 'verified') {
        tier = 'compliant';
        statusLabel = 'Certified';
        evidenceText = cert.expiryDate
          ? `Certificate (valid to ${new Date(cert.expiryDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })})`
          : 'Certificate on file';
      } else if (cert.verificationStatus === 'expired') {
        tier = 'blocker';
        statusLabel = 'Expired';
        evidenceText = cert.expiryDate
          ? `Expired ${new Date(cert.expiryDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`
          : 'Certificate expired';
      } else {
        tier = 'gap';
        statusLabel = 'Unverified';
        evidenceText = 'Certificate provided but not verified';
      }
    } else {
      tier = check.priority === 'must_have' ? 'blocker' : 'gap';
    }

    rows.push({
      section: 'Certifications',
      requirement: check.label,
      ruleKey: check.certType.toLowerCase(),
      priority: check.priority,
      tier,
      statusLabel,
      evidenceText,
    });
  }

  // Social Audit summary row
  const socialAuditCerts = supplier.certifications.filter(c => ['SMETA', 'BSCI'].includes(c.certType));
  const latestAudit = supplier.factoryAudits?.[0];
  if (socialAuditCerts.length > 0 || latestAudit) {
    const auditCert = socialAuditCerts[0];
    let tier: ComplianceAssessmentRow['tier'] = 'gap';
    let statusLabel = 'Not provided';
    let evidenceText = 'No audit report shared';

    if (auditCert?.verificationStatus === 'verified') {
      tier = 'compliant';
      const auditType = auditCert.certType === 'SMETA' ? 'SMETA' : 'BSCI';
      statusLabel = `${auditType} audit valid`;
      evidenceText = auditCert.expiryDate
        ? `${auditType} audit report (valid to ${new Date(auditCert.expiryDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })})`
        : `${auditType} audit on file`;
    } else if (auditCert) {
      tier = 'gap';
      statusLabel = `${auditCert.certType} — unverified`;
      evidenceText = 'Audit report provided but not verified';
    }

    rows.push({
      section: 'Certifications',
      requirement: 'Social Audit (SMETA, BSCI)',
      ruleKey: 'social_audit',
      priority: 'must_have',
      tier,
      statusLabel,
      evidenceText,
    });
  } else {
    rows.push({
      section: 'Certifications',
      requirement: 'Social Audit (SMETA, BSCI)',
      ruleKey: 'social_audit',
      priority: 'must_have',
      tier: 'blocker',
      statusLabel: 'Not provided',
      evidenceText: 'No audit report shared',
    });
  }

  // --- Commercial Agreements Section ---
  const agreementChecks = [
    { type: 'NDA', label: 'NDA & Non-Circumvent', priority: 'must_have' as const },
    { type: 'MSA', label: 'Supply Agreement', priority: 'nice_to_have' as const },
  ];

  for (const check of agreementChecks) {
    const agreement = supplier.agreements.find(a => a.agreementType === check.type);
    let tier: ComplianceAssessmentRow['tier'] = 'not_assessed';
    let statusLabel = 'Not in place';
    let evidenceText = 'No agreement on file';

    if (agreement) {
      if (agreement.status === 'signed') {
        tier = 'compliant';
        statusLabel = 'Signed';
        evidenceText = agreement.signedAt
          ? `Signed ${new Date(agreement.signedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Agreement signed';
      } else if (agreement.status === 'sent') {
        tier = 'gap';
        statusLabel = 'Pending';
        evidenceText = 'Agreement sent, awaiting signature';
      } else {
        tier = check.priority === 'must_have' ? 'blocker' : 'gap';
        statusLabel = 'Not started';
        evidenceText = 'Agreement not initiated';
      }
    } else {
      tier = check.priority === 'must_have' ? 'blocker' : 'gap';
    }

    rows.push({
      section: 'Commercial Agreements',
      requirement: check.label,
      ruleKey: check.type.toLowerCase(),
      priority: check.priority,
      tier,
      statusLabel,
      evidenceText,
    });
  }

  // Code of Conduct
  rows.push({
    section: 'Commercial Agreements',
    requirement: 'Code of Conduct',
    ruleKey: 'coc',
    priority: 'nice_to_have',
    tier: supplier.cocAcknowledged ? 'compliant' : 'gap',
    statusLabel: supplier.cocAcknowledged ? 'Acknowledged' : 'Not acknowledged',
    evidenceText: supplier.cocAcknowledged ? 'CoC acknowledged on file' : 'No CoC acknowledgement',
  });

  return rows;
}

/**
 * Compute compliance scores from assessment rows.
 */
export function computeComplianceScore(rows: ComplianceAssessmentRow[]): ComplianceScore {
  const assessed = rows.filter(r => r.tier !== 'not_assessed');
  const mustHaves = assessed.filter(r => r.priority === 'must_have');
  const niceToHaves = assessed.filter(r => r.priority === 'nice_to_have');

  const mustHaveMet = mustHaves.filter(r => r.tier === 'compliant').length;
  const niceToHaveMet = niceToHaves.filter(r => r.tier === 'compliant').length;

  const mustHaveScore = mustHaves.length > 0 ? (mustHaveMet / mustHaves.length) * 100 : null;
  const niceToHaveScore = niceToHaves.length > 0 ? (niceToHaveMet / niceToHaves.length) * 100 : null;

  // Overall: must-haves weighted 80%, nice-to-haves 20%
  let overall: number | null = null;
  if (mustHaveScore !== null && niceToHaveScore !== null) {
    overall = Math.round(mustHaveScore * 0.8 + niceToHaveScore * 0.2);
  } else if (mustHaveScore !== null) {
    overall = Math.round(mustHaveScore);
  } else if (niceToHaveScore !== null) {
    overall = Math.round(niceToHaveScore);
  }

  const blockers = mustHaves
    .filter(r => r.tier === 'blocker')
    .map(r => ({ layer: r.section, requirement: r.requirement, statusLabel: r.statusLabel }));

  return {
    overall,
    mustHave: mustHaveScore !== null ? Math.round(mustHaveScore) : null,
    niceToHave: niceToHaveScore !== null ? Math.round(niceToHaveScore) : null,
    blockers,
  };
}
