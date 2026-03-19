import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeMatchScorePure } from '@/lib/match-scoring';

describe('Match Scoring', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const futureDate = new Date('2099-01-01');
  const pastDate = new Date('2020-01-01');

  // ─── Full match ──────────────────────────────────────────
  it('full match (all certs verified) returns 100%', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: futureDate },
      { certType: 'ISO', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, ['GMP', 'ISO']);
    expect(result.score).toBe(100);
    expect(result.breakdown).toEqual({ GMP: true, ISO: true });
  });

  // ─── Partial match ───────────────────────────────────────
  it('partial match returns correct percentage', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, ['GMP', 'ISO']);
    expect(result.score).toBe(50);
    expect(result.breakdown).toEqual({ GMP: true, ISO: false });
  });

  // ─── Zero match ──────────────────────────────────────────
  it('zero match returns 0%', () => {
    const certs = [
      { certType: 'HALAL', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, ['GMP', 'ISO']);
    expect(result.score).toBe(0);
    expect(result.breakdown).toEqual({ GMP: false, ISO: false });
  });

  // ─── Brief with 0 requirements ───────────────────────────
  it('brief with 0 requirements returns null (N/A)', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, []);
    expect(result.score).toBeNull();
    expect(result.breakdown).toEqual({});
  });

  // ─── Supplier with 0 certs ───────────────────────────────
  it('supplier with 0 certs against brief with requirements returns 0%', () => {
    const result = computeMatchScorePure([], ['GMP', 'ISO']);
    expect(result.score).toBe(0);
    expect(result.breakdown).toEqual({ GMP: false, ISO: false });
  });

  // ─── Expired cert counts as missing ──────────────────────
  it('expired cert counts as missing', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: pastDate },
      { certType: 'ISO', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, ['GMP', 'ISO']);
    expect(result.score).toBe(50);
    expect(result.breakdown).toEqual({ GMP: false, ISO: true });
  });

  // ─── Unverified cert counts as missing ───────────────────
  it('unverified cert counts as missing', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'unverified', expiryDate: futureDate },
      { certType: 'ISO', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, ['GMP', 'ISO']);
    expect(result.score).toBe(50);
    expect(result.breakdown).toEqual({ GMP: false, ISO: true });
  });

  // ─── Only verified + non-expired count ───────────────────
  it('only verified and non-expired certs count as matched', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: null },     // no expiry = valid
      { certType: 'ISO', verificationStatus: 'pending', expiryDate: futureDate }, // pending = not matched
      { certType: 'HALAL', verificationStatus: 'verified', expiryDate: pastDate }, // expired = not matched
    ];
    const result = computeMatchScorePure(certs, ['GMP', 'ISO', 'HALAL']);
    expect(result.score).toBe(33); // 1/3 rounded
    expect(result.breakdown).toEqual({ GMP: true, ISO: false, HALAL: false });
  });

  // ─── Cert with null expiry is valid ──────────────────────
  it('cert with null expiryDate (no expiry) counts as matched', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: null },
    ];
    const result = computeMatchScorePure(certs, ['GMP']);
    expect(result.score).toBe(100);
    expect(result.breakdown).toEqual({ GMP: true });
  });

  // ─── Extra supplier certs are ignored ────────────────────
  it('extra supplier certs not in requirements are ignored', () => {
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified', expiryDate: futureDate },
      { certType: 'ISO', verificationStatus: 'verified', expiryDate: futureDate },
      { certType: 'HALAL', verificationStatus: 'verified', expiryDate: futureDate },
    ];
    const result = computeMatchScorePure(certs, ['GMP']);
    expect(result.score).toBe(100);
    expect(result.breakdown).toEqual({ GMP: true });
  });
});
