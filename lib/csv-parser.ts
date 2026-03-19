// Pure CSV parsing and validation logic, extracted from lib/actions/csv-import.ts
// so it can be unit-tested without database or auth dependencies.

export type CsvRow = Record<string, string>;

export type ParsedSupplier = {
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
  raw: CsvRow;
};

// Known column name mappings (case-insensitive, flexible)
export const COLUMN_MAP: Record<string, string> = {
  'company name': 'companyName',
  'company trade name': 'companyName',
  'supplier name': 'companyName',
  'manufacturer': 'companyName',
  'name': 'companyName',
  'country': 'country',
  'country of origin': 'country',
  'cor': 'country',
  'location': 'country',
  'categories': 'categories',
  'category': 'categories',
  'product categories': 'categories',
  'subcategories': 'subcategories',
  'subcategory': 'subcategories',
  'product subcategory': 'subcategories',
  'capability type': 'capabilityType',
  'capability': 'capabilityType',
  'turnkey': 'capabilityType',
  'moq': 'moq',
  'minimum order quantity': 'moq',
  'min order': 'moq',
  'brands': 'keyBrands',
  'key brands': 'keyBrands',
  'brands worked with': 'keyBrands',
  'city': 'companyCity',
  'company city': 'companyCity',
  'factory city': 'factoryCity',
  'factory country': 'factoryCountry',
  'factory location': 'factoryCountry',
  'certifications': 'certTypes',
  'certs': 'certTypes',
  'agreements': 'agreementTypes',
  'contact name': 'contactName',
  'contact': 'contactName',
  'primary contact': 'contactName',
  'contact email': 'contactEmail',
  'email': 'contactEmail',
  'contact mobile': 'contactMobile',
  'mobile': 'contactMobile',
  'phone': 'contactMobile',
};

export function parseCsvText(text: string): CsvRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
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

  return {
    row: rowNum,
    companyName,
    country,
    categories: parseList(mapped.categories),
    subcategories: parseList(mapped.subcategories),
    capabilityType,
    moq,
    keyBrands: parseList(mapped.keyBrands),
    companyCity: mapped.companyCity?.trim() || null,
    factoryCity: mapped.factoryCity?.trim() || null,
    factoryCountry: mapped.factoryCountry?.trim() || null,
    certTypes: parseList(mapped.certTypes),
    agreementTypes: parseList(mapped.agreementTypes),
    contactName: mapped.contactName?.trim() || null,
    contactEmail: mapped.contactEmail?.trim() || null,
    contactMobile: mapped.contactMobile?.trim() || null,
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
