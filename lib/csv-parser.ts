// Pure CSV parsing and validation logic, extracted from lib/actions/csv-import.ts
// so it can be unit-tested without database or auth dependencies.

export type CsvRow = Record<string, string>;

export type ParsedSupplier = {
  row: number;
  companyName: string;
  companyLegalName: string | null;
  country: string;
  categories: string[];
  subcategories: string[];
  capabilityType: string;
  moq: number | null;
  moqInfo: string | null;
  keyBrands: string[];
  companyCity: string | null;
  factoryCity: string | null;
  factoryCountry: string | null;
  certTypes: string[];
  certCategory: string | null;
  regulatoryCerts: string[];
  agreementTypes: string[];
  contactName: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  // New fields for production CSV
  qualificationStage: string | null;
  activeSkus: string[];
  region: string | null;
  marketExperience: string[];
  acquisitionSource: string | null;
  currency: string | null;
  supplierCode: string | null;
  legacyId: number | null;
  cautionFlag: boolean;
  cautionNote: string | null;
  dateOutreached: Date | null;
  dateQualified: Date | null;
  productionLeadTimeDayMin: number | null;
  productionLeadTimeDayMax: number | null;
  productionLeadTimeInfo: string | null;
  fillCapabilities: string[];
  fillPackagingNotes: string | null;
  // NDA / Agreement data
  ndaLink: string | null;
  ndaStart: Date | null;
  ndaExpiry: Date | null;
  ndaStatus: string | null;
  nonCircumventMonths: number | null;
  agreementLink: string | null;
  agreementNotes: string | null;
  // Code of Conduct
  cocAcknowledged: boolean;
  cocLink: string | null;
  cocDateAccepted: Date | null;
  // Other
  certificationLink: string | null;
  ipOwnership: string | null;
  atelierBrands: string[];
  atelierNote: string | null;
  factoryNotes: string | null;
  paymentTerms: string | null;
  // Factory audit data (parsed from JSON)
  factoryAuditData: {
    score?: number | null;
    auditedOn?: Date | null;
    auditor?: string | null;
    location?: string | null;
    visitType?: string | null;
    actionItems?: string | null;
    followUp?: string | null;
  } | null;
  raw: CsvRow;
};

// Known column name mappings (case-insensitive, flexible)
export const COLUMN_MAP: Record<string, string> = {
  // Identity
  'company name': 'companyName',
  'company trade name': 'companyName',
  'supplier name': 'companyName',
  'manufacturer': 'companyName',
  'name': 'companyName',
  'trade name': 'companyName',
  'legal name': 'companyLegalName',
  'id': 'legacyId',
  'code': 'supplierCode',
  // Status
  'status': 'qualificationStage',
  // Location
  'country': 'country',
  'country of origin': 'country',
  'cor': 'country',
  'location': 'country',
  'factory locations': 'factoryCountry',
  'factory country': 'factoryCountry',
  'factory location': 'factoryCountry',
  'city': 'companyCity',
  'company city': 'companyCity',
  'factory city': 'factoryCity',
  'region': 'region',
  'market experience': 'marketExperience',
  // Categories & capabilities
  'categories': 'categories',
  'category': 'categories',
  'product categories': 'categories',
  'subcategories': 'subcategories',
  'subcategory': 'subcategories',
  'product sub categories': 'subcategories',
  'product subcategory': 'subcategories',
  'capability type': 'capabilityType',
  'capability': 'capabilityType',
  'turnkey': 'capabilityType',
  'supplier type': 'supplierType',
  'supplier subtype': 'supplierSubtype',
  'sub type': 'supplierSubtype',
  'fill capabilities': 'fillCapabilities',
  'fill packaging notes': 'fillPackagingNotes',
  // Commercial
  'moq': 'moq',
  'minimum order quantity': 'moq',
  'min order': 'moq',
  'moq info': 'moqInfo',
  'currency': 'currency',
  'payment terms': 'paymentTerms',
  'sample dev fees': 'sampleDevFees',
  'term notes': 'termNotes',
  // Brands
  'brands': 'keyBrands',
  'key brands': 'keyBrands',
  'brands worked with': 'keyBrands',
  'brands worked': 'keyBrands',
  'atelier brands': 'atelierBrands',
  // SKUs
  'skus active': 'activeSkus',
  // Certifications & compliance
  'certifications': 'certTypes',
  'certs': 'certTypes',
  'certs & audits': 'certTypes',
  'regulatory compliance': 'regulatoryCerts',
  'certification link': 'certificationLink',
  'certs audits ids': 'certAuditIds',
  'expiry cert': 'expiryCert',
  // Flags
  'flags': 'flags',
  // NDA / Agreements
  'agreements': 'agreementTypes',
  'nda expiry': 'ndaExpiry',
  'nda link': 'ndaLink',
  'nda start': 'ndaStart',
  'nda_data': 'ndaData',
  'non circumvent period months': 'nonCircumventMonths',
  'agreement link': 'agreementLink',
  'agreement notes': 'agreementNotes',
  'expiry nda': 'expiryNda',
  'msa data': 'msaData',
  'payment data': 'paymentData',
  // Contact
  'contact name': 'contactName',
  'contact': 'contactName',
  'primary contact': 'contactName',
  'contact email': 'contactEmail',
  'email': 'contactEmail',
  'contact mobile': 'contactMobile',
  'mobile': 'contactMobile',
  'phone': 'contactMobile',
  // Dates
  'date outreached': 'dateOutreached',
  'date qualified': 'dateQualified',
  'date created': 'dateCreated',
  // Sourcing
  'acquisition source': 'acquisitionSource',
  // Lead times
  'production leadtime day min': 'productionLeadTimeDayMin',
  'production leadtime day max': 'productionLeadTimeDayMax',
  'production leadtime info': 'productionLeadTimeInfo',
  // Code of Conduct
  'coc acknowledged': 'cocAcknowledged',
  'coc link': 'cocLink',
  'coc date accepted': 'cocDateAccepted',
  // Factory audit
  'factory audit data': 'factoryAuditData',
  'factory notes': 'factoryNotes',
  // Addresses (JSON columns)
  'business_address': 'businessAddress',
  'delivery_address': 'deliveryAddress',
  // Other
  'bank_data': 'bankData',
  'xero id': 'xeroId',
  'supplier type data': 'supplierTypeData',
  'type id': 'typeId',
  'sub type ids': 'subTypeIds',
  'ip ownership': 'ipOwnership',
  'atelier note': 'atelierNote',
  'pk': 'pk',
};

/**
 * RFC 4180 compliant CSV parser.
 * Handles quoted fields containing commas, newlines, and escaped quotes (doubled "").
 */
export function parseCsvText(text: string): CsvRow[] {
  const grid = parseCsvGrid(text);
  if (grid.length < 2) return [];

  const headers = grid[0].map(h => h.trim());
  // Deduplicate headers: "Supplier Type", "Supplier Type" → "Supplier Type", "Supplier Type_2"
  const headerCounts: Record<string, number> = {};
  const deduped = headers.map(h => {
    const count = (headerCounts[h] || 0) + 1;
    headerCounts[h] = count;
    return count > 1 ? `${h}_${count}` : h;
  });
  const rows: CsvRow[] = [];

  for (let i = 1; i < grid.length; i++) {
    const values = grid[i];
    // Skip entirely empty rows
    if (values.every(v => v.trim() === '')) continue;
    const row: CsvRow = {};
    deduped.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return rows;
}

/** Low-level RFC 4180 parser — returns a grid of string[][] */
function parseCsvGrid(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        // Skip \r (handle \r\n and bare \r)
        i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush last row if there's remaining content
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function mapColumns(row: CsvRow): CsvRow {
  const mapped: CsvRow = {};
  for (const [key, value] of Object.entries(row)) {
    const normalised = key.toLowerCase().trim();
    const mappedKey = COLUMN_MAP[normalised] || key;
    mapped[mappedKey] = value;
  }
  return mapped;
}

export function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
}

/** Map human-readable cert names to machine keys */
const CERT_TYPE_MAP: Record<string, string> = {
  'iso 9001': 'ISO_9001',
  'iso 9001 - quality': 'ISO_9001',
  'iso_9001': 'ISO_9001',
  'iso 14001': 'ISO_14001',
  'iso 14001 - environment': 'ISO_14001',
  'iso_14001': 'ISO_14001',
  'iso 22716': 'ISO_22716',
  'iso 22716 - cosmetic gmp': 'ISO_22716',
  'iso_22716': 'ISO_22716',
  'iso 45001': 'ISO_45001',
  'iso_45001': 'ISO_45001',
  'gmp': 'GMP',
  'gmpc': 'GMP',
  'cosmetic gmp': 'GMP',
  'fda': 'FDA',
  'fda otc': 'FDA_OTC',
  'fda_otc': 'FDA_OTC',
  'tga': 'TGA',
  'smeta': 'SMETA',
  'smeta - social audit': 'SMETA',
  'bsci': 'BSCI',
  'fsc': 'FSC',
  'organic': 'organic',
  'vegan': 'vegan',
  'cruelty free': 'cruelty_free',
  'cruelty_free': 'cruelty_free',
  'sedex member': 'SMETA',  // Sedex membership implies SMETA
  'halal': 'other',
  'other': 'other',
};

export function normaliseCertType(raw: string): string {
  const key = raw.trim().toLowerCase();
  return CERT_TYPE_MAP[key] || 'other';
}

/** Map production CSV status values to platform qualification stages */
const STATUS_MAP: Record<string, string> = {
  'qualified': 'Fully Qualified',
  'fully qualified': 'Fully Qualified',
  'unqualified': 'Identified',
  'identified': 'Identified',
  'historical': 'Historical',
  'outreached': 'Outreached',
  'capability confirmed': 'Capability Confirmed',
  'conditionally qualified': 'Conditionally Qualified',
  'paused': 'Paused',
  'blacklisted': 'Blacklisted',
};

/** Safely parse a date string, returning null on failure */
function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'undefined') return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d;
}

/** Safely parse an integer, returning null on failure */
function parseIntSafe(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const n = parseInt(value.trim(), 10);
  return isNaN(n) ? null : n;
}

/** Parse a JSON string column, returning null on failure */
function parseJsonSafe(value: string | undefined): unknown | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'undefined') return null;
  try {
    return JSON.parse(value.trim());
  } catch {
    return null;
  }
}

const FLAG_LABELS: Record<string, string> = {
  'CERT_EXPIRED': 'Certificate expired',
  'CERT_EXPIRING': 'Certificate expiring soon',
  'NDA_EXPIRED': 'NDA expired',
  'NDA_EXPIRING': 'NDA expiring soon',
  'CERT_VALID': 'Certificate valid',
  'NDA_VALID': 'NDA valid',
};

/** Parse caution flags from the Flags column (e.g., ["CERT_NA","NDA_NA"]) */
function parseCautionFlags(value: string | undefined): { cautionFlag: boolean; cautionNote: string | null } {
  if (!value || value.trim() === '' || value.trim() === '[]') {
    return { cautionFlag: false, cautionNote: null };
  }
  // Try parsing as JSON array first
  const parsed = parseJsonSafe(value);
  if (Array.isArray(parsed) && parsed.length > 0) {
    // Filter out non-actionable flags
    const meaningful = parsed.filter((f: string) => !f.endsWith('_NA') && f !== 'CERT_NA' && f !== 'NDA_NA');
    if (meaningful.length > 0) {
      return { cautionFlag: true, cautionNote: meaningful.map((f: string) => FLAG_LABELS[f] || f).join(', ') };
    }
    // Even _NA flags indicate something — store as note but don't flag
    return { cautionFlag: false, cautionNote: parsed.join(', ') };
  }
  // Fallback: treat as comma-separated string
  const flags = parseList(value);
  if (flags.length > 0) {
    return { cautionFlag: true, cautionNote: flags.join(', ') };
  }
  return { cautionFlag: false, cautionNote: null };
}

/** Parse factory_audit_data JSON column */
function parseFactoryAuditData(value: string | undefined): ParsedSupplier['factoryAuditData'] {
  const parsed = parseJsonSafe(value);
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  return {
    score: typeof obj.score === 'number' ? obj.score : null,
    auditedOn: typeof obj.audited_on === 'string' ? parseDate(obj.audited_on) : null,
    auditor: typeof obj.auditor === 'string' ? obj.auditor : null,
    location: typeof obj.location === 'string' ? obj.location : null,
    visitType: typeof obj.visit === 'string' ? obj.visit : null,
    actionItems: typeof obj.action === 'string' ? obj.action : null,
    followUp: typeof obj.follow_up === 'string' ? obj.follow_up : null,
  };
}

/** Parse nda_data JSON column to extract NDA status and link */
function parseNdaData(value: string | undefined): { ndaLink: string | null; ndaStatus: string | null } {
  const parsed = parseJsonSafe(value);
  if (!parsed || typeof parsed !== 'object') return { ndaLink: null, ndaStatus: null };
  const obj = parsed as Record<string, unknown>;
  return {
    ndaLink: typeof obj.link === 'string' ? obj.link : null,
    ndaStatus: typeof obj.status === 'string' ? obj.status : null,
  };
}

export function parseRow(row: CsvRow, rowNum: number): ParsedSupplier | { error: string } {
  const mapped = mapColumns(row);

  const companyName = mapped.companyName?.trim();
  if (!companyName) return { error: 'Missing company name' };

  const country = mapped.country?.trim();
  if (!country) return { error: 'Missing country' };

  const moqStr = mapped.moq?.trim();
  const moq = moqStr ? parseInt(moqStr, 10) : null;
  if (moqStr && isNaN(moq!)) return { error: `Invalid MOQ: "${moqStr}"` };

  let capabilityType = mapped.capabilityType?.trim().toLowerCase() || 'unknown';
  if (['turnkey', 'blend_fill', 'blend & fill', 'b&f', 'bf'].includes(capabilityType)) {
    capabilityType = capabilityType === 'turnkey' ? 'turnkey' : 'blend_fill';
  } else if (['both', 'turnkey & blend fill', 'turnkey/blend fill'].includes(capabilityType)) {
    capabilityType = 'both';
  } else if (capabilityType !== 'turnkey' && capabilityType !== 'blend_fill' && capabilityType !== 'both') {
    capabilityType = 'unknown';
  }

  // Map qualification stage from CSV status
  const statusRaw = mapped.qualificationStage?.trim().toLowerCase() || '';
  const qualificationStage = STATUS_MAP[statusRaw] || null;

  // Parse caution flags (S-09)
  const { cautionFlag, cautionNote } = parseCautionFlags(mapped.flags);

  // Parse NDA data from JSON column
  const ndaData = parseNdaData(mapped.ndaData);

  // Parse factory audit data from JSON column
  const factoryAuditData = parseFactoryAuditData(mapped.factoryAuditData);

  // Parse legacy ID
  const legacyId = parseIntSafe(mapped.legacyId);

  // Parse CoC acknowledged (boolean)
  const cocRaw = mapped.cocAcknowledged?.trim().toLowerCase() || '';
  const cocAcknowledged = cocRaw === 'true' || cocRaw === '1' || cocRaw === 'yes';

  return {
    row: rowNum,
    companyName,
    companyLegalName: mapped.companyLegalName?.trim() || null,
    country,
    categories: parseList(mapped.categories),
    subcategories: parseList(mapped.subcategories),
    capabilityType,
    moq,
    moqInfo: mapped.moqInfo?.trim() || null,
    keyBrands: parseList(mapped.keyBrands),
    companyCity: mapped.companyCity?.trim() || null,
    factoryCity: mapped.factoryCity?.trim() || null,
    factoryCountry: mapped.factoryCountry?.trim() || null,
    certTypes: parseList(mapped.certTypes).map(normaliseCertType),
    certCategory: null, // determined per-cert, not per-row
    regulatoryCerts: parseList(mapped.regulatoryCerts).map(normaliseCertType),
    agreementTypes: parseList(mapped.agreementTypes),
    contactName: mapped.contactName?.trim() || null,
    contactEmail: mapped.contactEmail?.trim() || null,
    contactMobile: mapped.contactMobile?.trim() || null,
    // New fields
    qualificationStage,
    activeSkus: parseList(mapped.activeSkus),
    region: mapped.region?.trim() || null,
    marketExperience: parseList(mapped.marketExperience),
    acquisitionSource: mapped.acquisitionSource?.trim() || null,
    currency: mapped.currency?.trim() || null,
    supplierCode: mapped.supplierCode?.trim() || null,
    legacyId,
    cautionFlag,
    cautionNote,
    dateOutreached: parseDate(mapped.dateOutreached),
    dateQualified: parseDate(mapped.dateQualified),
    productionLeadTimeDayMin: parseIntSafe(mapped.productionLeadTimeDayMin),
    productionLeadTimeDayMax: parseIntSafe(mapped.productionLeadTimeDayMax),
    productionLeadTimeInfo: mapped.productionLeadTimeInfo?.trim() || null,
    fillCapabilities: parseList(mapped.fillCapabilities),
    fillPackagingNotes: mapped.fillPackagingNotes?.trim() || null,
    // NDA / Agreement data
    ndaLink: ndaData.ndaLink || mapped.ndaLink?.trim() || null,
    ndaStart: parseDate(mapped.ndaStart),
    ndaExpiry: parseDate(mapped.ndaExpiry || mapped.expiryNda),
    ndaStatus: ndaData.ndaStatus,
    nonCircumventMonths: parseIntSafe(mapped.nonCircumventMonths),
    agreementLink: mapped.agreementLink?.trim() || null,
    agreementNotes: mapped.agreementNotes?.trim() || null,
    // Code of Conduct
    cocAcknowledged,
    cocLink: mapped.cocLink?.trim() || null,
    cocDateAccepted: parseDate(mapped.cocDateAccepted),
    // Other
    certificationLink: mapped.certificationLink?.trim() || null,
    ipOwnership: mapped.ipOwnership?.trim() || null,
    atelierBrands: parseList(mapped.atelierBrands),
    atelierNote: mapped.atelierNote?.trim() || null,
    factoryNotes: mapped.factoryNotes?.trim() || null,
    paymentTerms: mapped.paymentTerms?.trim() || null,
    factoryAuditData,
    raw: row,
  };
}

/**
 * Validate and parse a full CSV text, detecting duplicates within the batch.
 * Does NOT check against existing database records (that's the server action's job).
 */
export function parseCsvForPreview(csvText: string): {
  parsed: ParsedSupplier[];
  duplicates: ParsedSupplier[];
  rejected: { row: number; reason: string; data: CsvRow }[];
  totalRows: number;
} | { error: string } {
  const rows = parseCsvText(csvText);
  if (rows.length === 0) return { error: 'No data rows found in CSV' };

  const parsed: ParsedSupplier[] = [];
  const duplicates: ParsedSupplier[] = [];
  const rejected: { row: number; reason: string; data: CsvRow }[] = [];
  const seenInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const result = parseRow(rows[i], i + 2); // +2 for 1-indexed + header row

    if ('error' in result) {
      rejected.push({ row: i + 2, reason: result.error, data: rows[i] });
      continue;
    }

    const key = `${result.companyName.toLowerCase()}|${result.country.toLowerCase()}`;

    if (seenInBatch.has(key)) {
      duplicates.push(result);
    } else {
      parsed.push(result);
      seenInBatch.add(key);
    }
  }

  return { parsed, duplicates, rejected, totalRows: rows.length };
}
