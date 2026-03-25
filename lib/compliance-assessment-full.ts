/**
 * Extended compliance assessment — generates ALL ~40 rows for Beck's
 * spreadsheet-style shortlisting view.
 *
 * PURE MODULE — no DB, no auth, no 'use server'. Fully testable.
 *
 * Imports and extends the base assessment from compliance-assessment.ts
 * without modifying the original module.
 */

import type { ComplianceAssessmentRow } from '@/types/supplier-database';
import { computeComplianceAssessment, computeComplianceScore } from './compliance-assessment';
import type { SupplierComplianceInput } from './compliance-assessment';

export type FullSupplierComplianceInput = SupplierComplianceInput & {
  companyName: string;
  contacts: Array<{
    name: string;
    email: string | null;
    mobile: string | null;
    isPrimary: boolean;
  }>;
  capabilityType: string;
  activeSkus: string[];
  keyBrands: string[];
};

/**
 * Derive a working-status label from the qualification stage.
 */
function deriveWorkingStatus(stage: string): {
  tier: ComplianceAssessmentRow['tier'];
  statusLabel: string;
} {
  switch (stage) {
    case 'Fully Qualified':
      return { tier: 'compliant', statusLabel: 'Active supplier' };
    case 'Conditionally Qualified':
      return { tier: 'compliant', statusLabel: 'Conditionally active' };
    case 'Capability Confirmed':
      return { tier: 'gap', statusLabel: 'Capability confirmed, not yet qualified' };
    case 'Outreached':
      return { tier: 'gap', statusLabel: 'In outreach' };
    case 'Identified':
      return { tier: 'not_assessed', statusLabel: 'Identified only' };
    case 'Paused':
      return { tier: 'gap', statusLabel: 'Paused' };
    case 'Blacklisted':
      return { tier: 'blocker', statusLabel: 'Blacklisted' };
    default:
      return { tier: 'not_assessed', statusLabel: stage || 'Unknown' };
  }
}

/**
 * Compute the full ~40-row compliance assessment for the shortlisting page.
 */
export function computeFullComplianceAssessment(
  supplier: FullSupplierComplianceInput
): ComplianceAssessmentRow[] {
  // Start with the base assessment rows (Status & Context, Certifications, Commercial)
  const baseRows = computeComplianceAssessment(supplier);
  const rows: ComplianceAssessmentRow[] = [];

  // ── Status & Context (extend base) ────────────────────────
  // Pull the existing Status & Context rows
  const baseStatusRows = baseRows.filter(r => r.section === 'Status & Context');
  rows.push(...baseStatusRows);

  // Add: Working status with Atelier
  const workingStatus = deriveWorkingStatus(supplier.qualificationStage);
  rows.push({
    section: 'Status & Context',
    requirement: 'Working Status with Atelier',
    ruleKey: 'working_status',
    priority: 'nice_to_have',
    tier: workingStatus.tier,
    statusLabel: workingStatus.statusLabel,
    evidenceText: 'Derived from qualification stage',
  });

  // Add: Brief Fit
  rows.push({
    section: 'Status & Context',
    requirement: 'Brief Fit',
    ruleKey: 'brief_fit',
    priority: 'nice_to_have',
    tier: 'not_assessed',
    statusLabel: 'Assessment pending',
    evidenceText: 'Requires brief-specific evaluation',
  });

  // ── Certifications (extend base) ──────────────────────────
  const baseCertRows = baseRows.filter(r => r.section === 'Certifications');
  rows.push(...baseCertRows);

  // Add: CAPR row
  const caprCert = supplier.certifications.find(c => c.certType === 'CAPR');
  if (caprCert) {
    let tier: ComplianceAssessmentRow['tier'] = 'gap';
    let statusLabel = 'Unverified';
    let evidenceText = 'CAPR document provided but not verified';
    if (caprCert.verificationStatus === 'verified') {
      tier = 'compliant';
      statusLabel = 'CAPR on file';
      evidenceText = caprCert.expiryDate
        ? `CAPR valid to ${new Date(caprCert.expiryDate).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`
        : 'CAPR document verified';
    } else if (caprCert.verificationStatus === 'expired') {
      tier = 'blocker';
      statusLabel = 'Expired';
      evidenceText = 'CAPR expired';
    }
    rows.push({
      section: 'Certifications',
      requirement: 'CAPR',
      ruleKey: 'capr',
      priority: 'nice_to_have',
      tier,
      statusLabel,
      evidenceText,
    });
  } else {
    rows.push({
      section: 'Certifications',
      requirement: 'CAPR',
      ruleKey: 'capr',
      priority: 'nice_to_have',
      tier: 'not_assessed',
      statusLabel: 'Not provided',
      evidenceText: 'No CAPR document on file',
    });
  }

  // ── Commercial Agreements (reuse base) ─────────────────────
  const baseCommercialRows = baseRows.filter(r => r.section === 'Commercial Agreements');
  rows.push(...baseCommercialRows);

  // ── Social Audit Detail (18 rows) ─────────────────────────
  const socialAuditChecks: Array<{ requirement: string; ruleKey: string }> = [
    { requirement: 'Compliance with labour laws', ruleKey: 'sa_labour_laws' },
    { requirement: 'Working hours', ruleKey: 'sa_working_hours' },
    { requirement: 'Social insurance coverage', ruleKey: 'sa_social_insurance' },
    { requirement: 'Wages compliant', ruleKey: 'sa_wages' },
    { requirement: 'Living wage aligned', ruleKey: 'sa_living_wage' },
    { requirement: 'No forced labour', ruleKey: 'sa_no_forced_labour' },
    { requirement: 'No child labour', ruleKey: 'sa_no_child_labour' },
    { requirement: 'Freedom of association', ruleKey: 'sa_freedom_association' },
    { requirement: 'Health & safety', ruleKey: 'sa_health_safety' },
    { requirement: 'Chemical safety', ruleKey: 'sa_chemical_safety' },
    { requirement: 'Fire/building safety', ruleKey: 'sa_fire_building' },
    { requirement: 'Hygiene facilities', ruleKey: 'sa_hygiene' },
    { requirement: 'Environmental compliance', ruleKey: 'sa_environmental' },
    { requirement: 'Business integrity', ruleKey: 'sa_business_integrity' },
    { requirement: 'Grievance mechanism (internal)', ruleKey: 'sa_grievance_internal' },
    { requirement: 'Grievance mechanism (external)', ruleKey: 'sa_grievance_external' },
    { requirement: 'Ethical management systems', ruleKey: 'sa_ethical_mgmt' },
    { requirement: 'Worker training', ruleKey: 'sa_worker_training' },
  ];

  // Check if we have a valid social audit — if so, mark critical rows as compliant
  const socialAuditCerts = supplier.certifications.filter(c =>
    ['SMETA', 'BSCI'].includes(c.certType)
  );
  const hasVerifiedAudit = socialAuditCerts.some(c => c.verificationStatus === 'verified');
  const auditType = socialAuditCerts[0]?.certType || null;

  for (const check of socialAuditChecks) {
    if (hasVerifiedAudit) {
      rows.push({
        section: 'Social Audit Detail',
        requirement: check.requirement,
        ruleKey: check.ruleKey,
        priority: 'must_have',
        tier: 'compliant',
        statusLabel: 'Covered by audit',
        evidenceText: `Assessed under ${auditType} audit`,
      });
    } else {
      rows.push({
        section: 'Social Audit Detail',
        requirement: check.requirement,
        ruleKey: check.ruleKey,
        priority: 'must_have',
        tier: 'not_assessed',
        statusLabel: 'Assessment pending',
        evidenceText: 'Requires social audit report',
      });
    }
  }

  // ── SDS Compliance (5 rows) ────────────────────────────────
  const sdsChecks: Array<{ requirement: string; ruleKey: string }> = [
    { requirement: 'SDS available', ruleKey: 'sds_available' },
    { requirement: 'SDS compliant', ruleKey: 'sds_compliant' },
    { requirement: 'Hazard classification present', ruleKey: 'sds_hazard' },
    { requirement: 'PPE guidance included', ruleKey: 'sds_ppe' },
    { requirement: 'Manufacturer traceability', ruleKey: 'sds_traceability' },
  ];

  for (const check of sdsChecks) {
    rows.push({
      section: 'SDS Compliance',
      requirement: check.requirement,
      ruleKey: check.ruleKey,
      priority: 'nice_to_have',
      tier: 'not_assessed',
      statusLabel: 'Assessment pending',
      evidenceText: 'Requires SDS document review',
    });
  }

  // ── Product-Brief Match (4 rows) ──────────────────────────
  rows.push({
    section: 'Product-Brief Match',
    requirement: 'Product matches brief',
    ruleKey: 'pbm_product_match',
    priority: 'must_have',
    tier: 'not_assessed',
    statusLabel: 'Assessment pending',
    evidenceText: 'Requires brief-specific evaluation',
  });

  rows.push({
    section: 'Product-Brief Match',
    requirement: 'Claims substantiation',
    ruleKey: 'pbm_claims',
    priority: 'nice_to_have',
    tier: 'not_assessed',
    statusLabel: 'Assessment pending',
    evidenceText: 'Requires claims review',
  });

  rows.push({
    section: 'Product-Brief Match',
    requirement: 'Brands worked with',
    ruleKey: 'pbm_brands',
    priority: 'nice_to_have',
    tier: supplier.keyBrands.length > 0 ? 'compliant' : 'not_assessed',
    statusLabel: supplier.keyBrands.length > 0
      ? `${supplier.keyBrands.length} brand${supplier.keyBrands.length !== 1 ? 's' : ''} on file`
      : 'Not provided',
    evidenceText: supplier.keyBrands.length > 0
      ? supplier.keyBrands.slice(0, 5).join(', ') + (supplier.keyBrands.length > 5 ? '...' : '')
      : 'No brand references on file',
  });

  rows.push({
    section: 'Product-Brief Match',
    requirement: 'Brand check (customer overlap)',
    ruleKey: 'pbm_brand_check',
    priority: 'nice_to_have',
    tier: 'not_assessed',
    statusLabel: 'Assessment pending',
    evidenceText: 'Requires customer-specific review',
  });

  // ── Contact & Commercial (4 rows) ─────────────────────────
  const primaryContact = supplier.contacts.find(c => c.isPrimary) || supplier.contacts[0];

  rows.push({
    section: 'Contact & Commercial',
    requirement: 'Contact',
    ruleKey: 'cc_contact',
    priority: 'nice_to_have',
    tier: primaryContact ? 'compliant' : 'not_assessed',
    statusLabel: primaryContact ? primaryContact.name : 'No contact on file',
    evidenceText: primaryContact
      ? `${primaryContact.isPrimary ? 'Primary contact' : 'Contact'} on file`
      : 'No contact information available',
  });

  rows.push({
    section: 'Contact & Commercial',
    requirement: 'Email',
    ruleKey: 'cc_email',
    priority: 'nice_to_have',
    tier: primaryContact?.email ? 'compliant' : 'not_assessed',
    statusLabel: primaryContact?.email || 'Not provided',
    evidenceText: primaryContact?.email ? 'Email on file' : 'No email available',
  });

  rows.push({
    section: 'Contact & Commercial',
    requirement: 'Quotes',
    ruleKey: 'cc_quotes',
    priority: 'nice_to_have',
    tier: 'not_assessed',
    statusLabel: 'Assessment pending',
    evidenceText: 'Requires commercial evaluation',
  });

  rows.push({
    section: 'Contact & Commercial',
    requirement: 'Notes',
    ruleKey: 'cc_notes',
    priority: 'nice_to_have',
    tier: 'not_assessed',
    statusLabel: 'No notes',
    evidenceText: '',
  });

  return rows;
}

// Re-export the score computation — works with any rows
export { computeComplianceScore };
