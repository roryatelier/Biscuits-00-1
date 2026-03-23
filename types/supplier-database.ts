// Shared type definitions for the supplier database views.
// Used by DatabaseClient, SupplierTable, SupplierSidePanel, DatabaseFilters,
// and the buildUnifiedList utility.

import type { CapabilityType } from '@/lib/constants/suppliers';

export type CertInfo = {
  id?: string;
  certType: string;
  verificationStatus: string;
  expiryDate?: string | null;
};

export type AgreementInfo = {
  id?: string;
  agreementType: string;
  status: string;
};

export type MatchedProduct = {
  name?: string;
  brand?: string;
  rrp?: string;
  markets?: string[];
  url?: string;
};

export type AosSupplier = {
  id: string;
  companyName: string;
  qualificationStage: string;
  categories: string[];
  moq: number | null;
  cautionFlag: boolean;
  cobaltEnabled: boolean;
  capabilityType: string;
  certifications: CertInfo[];
  agreements: AgreementInfo[];
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
