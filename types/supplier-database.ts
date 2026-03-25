// Shared type definitions for the supplier database views.
// Used by DatabaseClient, SupplierTable, SupplierSidePanel, DatabaseFilters,
// and the buildUnifiedList utility.

import type { CapabilityType } from '@/lib/constants/suppliers';

export type CertInfo = {
  id?: string;
  certType: string;
  certCategory?: string | null;
  verificationStatus: string;
  expiryDate?: string | null;
};

export type AgreementInfo = {
  id?: string;
  agreementType: string;
  status: string;
  documentLink?: string | null;
  startDate?: string | null;
  expiryDate?: string | null;
  nonCircumventMonths?: number | null;
  notes?: string | null;
};

export type MatchedProduct = {
  name?: string;
  brand?: string;
  rrp?: string;
  markets?: string[];
  url?: string;
};

export type FactoryAuditInfo = {
  id?: string;
  score?: number | null;
  auditedOn?: string | null;
  auditor?: string | null;
  location?: string | null;
  visitType?: string | null;
  actionItems?: string | null;
  followUp?: string | null;
};

export type AosSupplier = {
  id: string;
  companyName: string;
  companyLegalName?: string | null;
  qualificationStage: string;
  categories: string[];
  subcategories?: string[];
  moq: number | null;
  moqInfo?: string | null;
  cautionFlag: boolean;
  cautionNote?: string | null;
  cobaltEnabled: boolean;
  capabilityType: string;
  // Lead times
  productionLeadTimeDayMin?: number | null;
  productionLeadTimeDayMax?: number | null;
  productionLeadTimeInfo?: string | null;
  // SKUs
  activeSkus?: string[];
  // Dates
  dateOutreached?: string | null;
  dateQualified?: string | null;
  lastContactedAt?: string | null;
  // Identity & legacy
  supplierCode?: string | null;
  legacyId?: number | null;
  // Sourcing
  acquisitionSource?: string | null;
  currency?: string | null;
  // Region & market
  region?: string | null;
  marketExperience?: string[];
  // Code of Conduct
  cocAcknowledged?: boolean;
  cocLink?: string | null;
  cocDateAccepted?: string | null;
  // Other
  websiteUrl?: string | null;
  ipOwnership?: string | null;
  fillCapabilities?: string[];
  fillPackagingNotes?: string | null;
  atelierBrands?: string[];
  atelierNote?: string | null;
  factoryNotes?: string | null;
  paymentTerms?: string | null;
  // Relations
  certifications: CertInfo[];
  agreements: AgreementInfo[];
  audits?: FactoryAuditInfo[];
  cobaltSupplier: { id: string; matchedProductsCount: number } | null;
  briefCount: number;
};

export type CobaltSupplier = {
  id: string;
  companyName: string;
  country: string;
  categories: string[];
  matchedProductsCount: number;
  matchedProducts: MatchedProduct[];
  keyBrands: string[];
  linked: boolean;
  aosId: string | null;
  aosSupplier: {
    id: string;
    qualificationStage: string;
    cautionFlag: boolean;
    certifications: CertInfo[];
    agreements: AgreementInfo[];
  } | null;
};

export type UnifiedSupplier = {
  key: string;
  companyName: string;
  source: 'aos' | 'cobalt' | 'both';
  // AoS fields
  aosId: string | null;
  qualificationStage: string | null;
  categories: string[];
  moq: number | null;
  cautionFlag: boolean;
  certifications: CertInfo[];
  agreements: AgreementInfo[];
  briefCount: number;
  capabilityType: CapabilityType;
  // Cobalt fields
  cobaltId: string | null;
  country: string | null;
  matchedProductsCount: number;
  matchedProducts: MatchedProduct[];
  keyBrands: string[];
  linked: boolean;
};

export type ViewMode = 'all' | 'aos' | 'discovery';
export type SourceFilter = '' | 'aos' | 'cobalt' | 'both';

// ─── Compliance types ────────────────────────────────────

export type BriefRequirementInfo = {
  id: string;
  layer: 'manufacturer' | 'product' | 'market';
  category: string;
  requirement: string;
  ruleKey: string | null;
  priority: 'must_have' | 'nice_to_have';
  extractedBy: string;
};

export type ComplianceResult = {
  tier: 'compliant' | 'gap' | 'blocker';
  statusLabel: string;
  evidenceText: string;
};

export type ComplianceBreakdown = Record<string, ComplianceResult>;

export type ComplianceScore = {
  overall: number | null;
  mustHave: number | null;
  niceToHave: number | null;
  blockers: Array<{ layer: string; requirement: string; statusLabel: string }>;
};

export type ComplianceAssessmentRow = {
  section: string;
  requirement: string;
  ruleKey: string | null;
  priority: 'must_have' | 'nice_to_have';
  tier: 'compliant' | 'gap' | 'blocker' | 'not_assessed';
  statusLabel: string;
  evidenceText: string;
};
