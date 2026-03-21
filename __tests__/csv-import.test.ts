import { describe, it, expect } from 'vitest';
import {
  parseCsvText,
  mapColumns,
  parseRow,
  parseList,
  parseCsvForPreview,
} from '@/lib/csv-parser';

// Helper: build a single-row CSV string
function csv(headers: string, ...rows: string[]): string {
  return [headers, ...rows].join('\n');
}

describe('CSV Import', () => {
  // ── Valid CSV with all columns ───────────────────────────

  it('valid CSV with all columns parses correctly', () => {
    const text = csv(
      'Company Name,Country,Categories,Capability Type,MOQ,Key Brands,Certifications',
      'Acme Corp,Australia,Skincare;Haircare,Turnkey,5000,Brand A;Brand B,ISO 22716;GMP',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.parsed).toHaveLength(1);
    const s = result.parsed[0];
    expect(s.companyName).toBe('Acme Corp');
    expect(s.country).toBe('Australia');
    expect(s.categories).toEqual(['Skincare', 'Haircare']);
    expect(s.capabilityType).toBe('turnkey');
    expect(s.moq).toBe(5000);
    expect(s.keyBrands).toEqual(['Brand A', 'Brand B']);
    expect(s.certTypes).toEqual(['ISO 22716', 'GMP']);
  });

  // ── Missing company name → rejected ──────────────────────

  it('missing company name is rejected', () => {
    const text = csv(
      'Company Name,Country',
      ',Australia',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('company name');
  });

  // ── Missing country → rejected ───────────────────────────

  it('missing country is rejected', () => {
    const text = csv(
      'Company Name,Country',
      'Acme Corp,',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('country');
  });

  // ── Duplicate rows in same file ──────────────────────────

  it('duplicate rows in same file — second one flagged as duplicate', () => {
    const text = csv(
      'Company Name,Country',
      'Acme Corp,Australia',
      'Acme Corp,Australia',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.parsed).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].companyName).toBe('Acme Corp');
  });

  // ── Duplicate detection is case-insensitive ──────────────

  it('duplicate detection is case-insensitive', () => {
    const text = csv(
      'Company Name,Country',
      'Acme Corp,Australia',
      'acme corp,australia',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.parsed).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
  });

  // ── Empty CSV → error ────────────────────────────────────

  it('empty CSV returns error', () => {
    const result = parseCsvForPreview('');
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('No data rows');
    }
  });

  it('CSV with only headers returns error', () => {
    const result = parseCsvForPreview('Company Name,Country');
    expect('error' in result).toBe(true);
  });

  // ── Invalid MOQ (non-numeric) → rejected ─────────────────

  it('invalid MOQ (non-numeric) is rejected', () => {
    const text = csv(
      'Company Name,Country,MOQ',
      'Acme Corp,Australia,not-a-number',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain('MOQ');
  });

  // ── Capability type normalisation ────────────────────────

  describe('capability type normalisation', () => {
    const cases: [string, string][] = [
      ['Turnkey', 'turnkey'],
      ['turnkey', 'turnkey'],
      ['B&F', 'blend_fill'],
      ['b&f', 'blend_fill'],
      ['Blend & Fill', 'blend_fill'],
      ['blend_fill', 'blend_fill'],
      ['bf', 'blend_fill'],
      ['Both', 'both'],
      ['garbage', 'unknown'],
      ['', 'unknown'],
    ];

    it.each(cases)('"%s" normalises to "%s"', (input, expected) => {
      const row = { 'Company Name': 'Test', 'Country': 'AU', 'Capability Type': input };
      const result = parseRow(row, 1);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.capabilityType).toBe(expected);
      }
    });
  });

  // ── Column name mapping (case-insensitive) ───────────────

  describe('column name mapping is case-insensitive', () => {
    it('"Company Name" maps correctly', () => {
      const mapped = mapColumns({ 'Company Name': 'Acme' });
      expect(mapped.companyName).toBe('Acme');
    });

    it('"company name" maps correctly', () => {
      const mapped = mapColumns({ 'company name': 'Acme' });
      expect(mapped.companyName).toBe('Acme');
    });

    it('"COMPANY NAME" maps correctly', () => {
      const mapped = mapColumns({ 'COMPANY NAME': 'Acme' });
      expect(mapped.companyName).toBe('Acme');
    });

    it('"Supplier Name" maps to companyName', () => {
      const mapped = mapColumns({ 'Supplier Name': 'Acme' });
      expect(mapped.companyName).toBe('Acme');
    });

    it('"Country of Origin" maps to country', () => {
      const mapped = mapColumns({ 'Country of Origin': 'AU' });
      expect(mapped.country).toBe('AU');
    });
  });

  // ── Comma-separated list parsing ─────────────────────────

  describe('parseList handles various delimiters', () => {
    it('comma-separated', () => {
      expect(parseList('Skincare, Haircare, Fragrance')).toEqual([
        'Skincare',
        'Haircare',
        'Fragrance',
      ]);
    });

    it('semicolon-separated', () => {
      expect(parseList('ISO 22716;GMP;Halal')).toEqual([
        'ISO 22716',
        'GMP',
        'Halal',
      ]);
    });

    it('pipe-separated', () => {
      expect(parseList('Brand A|Brand B')).toEqual(['Brand A', 'Brand B']);
    });

    it('empty string returns empty array', () => {
      expect(parseList('')).toEqual([]);
    });

    it('undefined returns empty array', () => {
      expect(parseList(undefined)).toEqual([]);
    });
  });

  // ── parseRow direct tests ───────────────────────────────

  describe('parseRow direct tests', () => {
    it('valid row parses correctly', () => {
      const row = { 'Company Name': 'Acme', 'Country': 'Australia', 'Categories': 'Skincare;Haircare', 'MOQ': '1000' };
      const result = parseRow(row, 2);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.companyName).toBe('Acme');
        expect(result.country).toBe('Australia');
        expect(result.categories).toEqual(['Skincare', 'Haircare']);
        expect(result.moq).toBe(1000);
        expect(result.row).toBe(2);
      }
    });

    it('valid numeric MOQ is parsed', () => {
      const row = { 'Company Name': 'Acme', 'Country': 'AU', 'MOQ': '500' };
      const result = parseRow(row, 2);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.moq).toBe(500);
      }
    });

    it('missing MOQ results in null', () => {
      const row = { 'Company Name': 'Acme', 'Country': 'AU' };
      const result = parseRow(row, 2);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.moq).toBeNull();
      }
    });
  });

  // ── Column mapping extras ──────────────────────────────────

  describe('mapColumns extras', () => {
    it('unknown column name is preserved as-is', () => {
      const mapped = mapColumns({ 'Custom Field': 'value' });
      expect(mapped['Custom Field']).toBe('value');
    });
  });

  // ── parseList extras ───────────────────────────────────────

  describe('parseList extras', () => {
    it('trims whitespace from items', () => {
      expect(parseList('  A ,  B  ')).toEqual(['A', 'B']);
    });
  });

  // ── parseCsvText low-level tests ─────────────────────────

  describe('parseCsvText', () => {
    it('parses header + rows correctly', () => {
      const rows = parseCsvText('A,B\n1,2\n3,4');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ A: '1', B: '2' });
      expect(rows[1]).toEqual({ A: '3', B: '4' });
    });

    it('strips surrounding quotes', () => {
      const rows = parseCsvText('"Name","Country"\n"Acme","AU"');
      expect(rows[0]).toEqual({ Name: 'Acme', Country: 'AU' });
    });

    it('returns empty for single-line (header only)', () => {
      expect(parseCsvText('A,B')).toEqual([]);
    });

    it('returns empty for empty string', () => {
      expect(parseCsvText('')).toEqual([]);
    });
  });

  // ── RFC 4180: quoted fields with commas ─────────────────

  describe('RFC 4180 quoted field handling', () => {
    it('handles commas inside quoted fields', () => {
      const text = csv(
        'Company Name,Country,Categories',
        '"Acme Corp","Australia","Skincare, Haircare"',
      );

      const rows = parseCsvText(text);
      expect(rows).toHaveLength(1);
      expect(rows[0]['Company Name']).toBe('Acme Corp');
      expect(rows[0]['Categories']).toBe('Skincare, Haircare');
    });

    it('handles newlines inside quoted fields', () => {
      const text = 'Company Name,Country,Notes\n"Acme Corp","Australia","Line one\nLine two"';

      const rows = parseCsvText(text);
      expect(rows).toHaveLength(1);
      expect(rows[0]['Notes']).toBe('Line one\nLine two');
    });

    it('handles escaped quotes (doubled "")', () => {
      const text = csv(
        'Company Name,Country,Notes',
        '"Acme Corp","Australia","They said ""hello"""',
      );

      const rows = parseCsvText(text);
      expect(rows).toHaveLength(1);
      expect(rows[0]['Notes']).toBe('They said "hello"');
    });

    it('full pipeline: quoted commas do not corrupt supplier categories', () => {
      const text = 'Company Name,Country,Categories\n"Acme Corp","Australia","Skincare, Haircare, Fragrance"';

      const result = parseCsvForPreview(text);
      expect('error' in result).toBe(false);
      if ('error' in result) return;

      expect(result.parsed).toHaveLength(1);
      const s = result.parsed[0];
      expect(s.companyName).toBe('Acme Corp');
      // parseList splits on commas inside the field value
      expect(s.categories).toEqual(['Skincare', 'Haircare', 'Fragrance']);
    });

    it('handles CRLF line endings', () => {
      const text = 'Company Name,Country\r\nAcme Corp,Australia\r\nBeta Inc,NZ';

      const rows = parseCsvText(text);
      expect(rows).toHaveLength(2);
      expect(rows[0]['Company Name']).toBe('Acme Corp');
      expect(rows[1]['Company Name']).toBe('Beta Inc');
    });

    it('mixed quoted and unquoted fields', () => {
      const text = csv(
        'Company Name,Country,Categories',
        '"Acme, Inc.",Australia,Skincare',
      );

      const rows = parseCsvText(text);
      expect(rows).toHaveLength(1);
      expect(rows[0]['Company Name']).toBe('Acme, Inc.');
      expect(rows[0]['Country']).toBe('Australia');
      expect(rows[0]['Categories']).toBe('Skincare');
    });
  });

  // ── Row numbering ────────────────────────────────────────

  it('row numbers account for header (1-indexed + header offset)', () => {
    const text = csv(
      'Company Name,Country',
      'Acme,AU',
      ',AU',
      'Beta,NZ',
    );

    const result = parseCsvForPreview(text);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    // Row 2 = first data row, Row 3 = missing name, Row 4 = third data row
    expect(result.parsed[0].row).toBe(2);
    expect(result.rejected[0].row).toBe(3);
    expect(result.parsed[1].row).toBe(4);
  });
});
