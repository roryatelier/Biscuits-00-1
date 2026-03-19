import { describe, it, expect } from 'vitest';
import { parseCsvText, parseRow, mapColumns, parseList, parseCsvForPreview } from '@/lib/csv-parser';

describe('CSV Import', () => {
  // ─── parseCsvText ────────────────────────────────────────
  describe('parseCsvText', () => {
    it('parses valid CSV correctly', () => {
      const csv = `Company Name,Country,Categories
Acme Corp,Australia,Skincare;Haircare
Beta Inc,New Zealand,Fragrance`;
      const rows = parseCsvText(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0]['Company Name']).toBe('Acme Corp');
      expect(rows[0]['Country']).toBe('Australia');
      expect(rows[1]['Company Name']).toBe('Beta Inc');
    });

    it('empty CSV returns no rows', () => {
      expect(parseCsvText('')).toEqual([]);
    });

    it('single header row (no data) returns no rows', () => {
      expect(parseCsvText('Company Name,Country')).toEqual([]);
    });

    it('strips quotes from values', () => {
      const csv = `"Company Name","Country"
"Acme Corp","Australia"`;
      const rows = parseCsvText(csv);
      expect(rows[0]['Company Name']).toBe('Acme Corp');
    });
  });

  // ─── parseRow ────────────────────────────────────────────
  describe('parseRow', () => {
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

    it('missing company name is rejected', () => {
      const row = { 'Country': 'Australia' };
      const result = parseRow(row, 2);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('company name');
      }
    });

    it('missing country is rejected', () => {
      const row = { 'Company Name': 'Acme' };
      const result = parseRow(row, 2);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('country');
      }
    });

    it('invalid MOQ string is rejected', () => {
      const row = { 'Company Name': 'Acme', 'Country': 'AU', 'MOQ': 'lots' };
      const result = parseRow(row, 2);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('MOQ');
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

  // ─── Column name mapping ─────────────────────────────────
  describe('mapColumns', () => {
    it('"Company Name" maps to companyName', () => {
      const mapped = mapColumns({ 'Company Name': 'Acme' });
      expect(mapped.companyName).toBe('Acme');
    });

    it('"Supplier Name" maps to companyName', () => {
      const mapped = mapColumns({ 'Supplier Name': 'Beta' });
      expect(mapped.companyName).toBe('Beta');
    });

    it('"Country of Origin" maps to country', () => {
      const mapped = mapColumns({ 'Country of Origin': 'AU' });
      expect(mapped.country).toBe('AU');
    });

    it('unknown column name is preserved as-is', () => {
      const mapped = mapColumns({ 'Custom Field': 'value' });
      expect(mapped['Custom Field']).toBe('value');
    });

    it('mapping is case-insensitive', () => {
      const mapped = mapColumns({ 'COMPANY NAME': 'Acme' });
      expect(mapped.companyName).toBe('Acme');
    });
  });

  // ─── List parsing ────────────────────────────────────────
  describe('parseList', () => {
    it('comma-separated values are split', () => {
      expect(parseList('Skincare, Haircare, Fragrance')).toEqual(['Skincare', 'Haircare', 'Fragrance']);
    });

    it('semicolon-separated values are split', () => {
      expect(parseList('GMP;ISO;HALAL')).toEqual(['GMP', 'ISO', 'HALAL']);
    });

    it('pipe-separated values are split', () => {
      expect(parseList('A|B|C')).toEqual(['A', 'B', 'C']);
    });

    it('empty string returns empty array', () => {
      expect(parseList('')).toEqual([]);
    });

    it('undefined returns empty array', () => {
      expect(parseList(undefined)).toEqual([]);
    });

    it('trims whitespace from items', () => {
      expect(parseList('  A ,  B  ')).toEqual(['A', 'B']);
    });
  });

  // ─── Duplicate detection ─────────────────────────────────
  describe('duplicate detection (via parseCsvForPreview)', () => {
    it('detects in-batch duplicates (same name + country, case insensitive)', () => {
      const csv = `Company Name,Country
Acme Corp,Australia
acme corp,australia
Beta Inc,New Zealand`;
      const result = parseCsvForPreview(csv);
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.parsed).toHaveLength(2);
        expect(result.duplicates).toHaveLength(1);
        expect(result.duplicates[0].companyName).toBe('acme corp');
      }
    });
  });
});
