import { describe, it, expect } from 'vitest';
import { computeMatchScorePure } from '@/lib/match-scoring';

function makeCert(
  certType: string,
  verificationStatus = 'verified',
  expiryDate: Date | null = null,
) {
  return { certType, verificationStatus, expiryDate };
}

const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

describe('Match Scoring', () => {
  // ── Full match ───────────────────────────────────────────

  it('full match (all certs verified) returns 100', () => {
    const certs = [
      makeCert('ISO 22716'),
      makeCert('GMP'),
      makeCert('Halal'),
    ];
    const required = ['ISO 22716', 'GMP', 'Halal'];

    const { score, breakdown } = computeMatchScorePure(certs, required);

    expect(score).toBe(100);
    expect(breakdown).toEqual({ 'ISO 22716': true, GMP: true, Halal: true });
  });

  // ── Partial match ────────────────────────────────────────

  it('partial match returns correct percentage (2/3 = 67%)', () => {
    const certs = [makeCert('ISO 22716'), makeCert('GMP')];
    const required = ['ISO 22716', 'GMP', 'Halal'];

    const { score, breakdown } = computeMatchScorePure(certs, required);

    expect(score).toBe(67);
    expect(breakdown['ISO 22716']).toBe(true);
    expect(breakdown['GMP']).toBe(true);
    expect(breakdown['Halal']).toBe(false);
  });

  // ── Zero match ───────────────────────────────────────────

  it('zero match (no certs) returns 0', () => {
    const { score, breakdown } = computeMatchScorePure([], ['ISO 22716', 'GMP']);

    expect(score).toBe(0);
    expect(breakdown['ISO 22716']).toBe(false);
    expect(breakdown['GMP']).toBe(false);
  });

  // ── Brief with 0 requirements ────────────────────────────

  it('brief with 0 requirements returns null (N/A)', () => {
    const certs = [makeCert('ISO 22716')];
    const { score, breakdown } = computeMatchScorePure(certs, []);

    expect(score).toBeNull();
    expect(breakdown).toEqual({});
  });

  // ── Expired cert counts as missing ───────────────────────

  it('expired cert counts as missing', () => {
    const certs = [makeCert('ISO 22716', 'verified', past)];
    const required = ['ISO 22716'];

    const { score, breakdown } = computeMatchScorePure(certs, required);

    expect(score).toBe(0);
    expect(breakdown['ISO 22716']).toBe(false);
  });

  // ── Unverified cert counts as missing ────────────────────

  it('unverified cert counts as missing', () => {
    const certs = [makeCert('ISO 22716', 'unverified')];
    const required = ['ISO 22716'];

    const { score, breakdown } = computeMatchScorePure(certs, required);

    expect(score).toBe(0);
    expect(breakdown['ISO 22716']).toBe(false);
  });

  // ── Extra certs are ignored ──────────────────────────────

  it('extra certs not in brief are ignored (still 100%)', () => {
    const certs = [
      makeCert('ISO 22716'),
      makeCert('GMP'),
      makeCert('Vegan'),   // extra
      makeCert('Organic'), // extra
    ];
    const required = ['ISO 22716', 'GMP'];

    const { score, breakdown } = computeMatchScorePure(certs, required);

    expect(score).toBe(100);
    expect(Object.keys(breakdown)).toEqual(['ISO 22716', 'GMP']);
  });

  // ── Verified but expired → false in breakdown ────────────

  it('cert verified but expired shows false in breakdown', () => {
    const certs = [
      makeCert('ISO 22716', 'verified', future), // valid
      makeCert('GMP', 'verified', past),          // expired
    ];
    const required = ['ISO 22716', 'GMP'];

    const { score, breakdown } = computeMatchScorePure(certs, required);

    expect(score).toBe(50);
    expect(breakdown['ISO 22716']).toBe(true);
    expect(breakdown['GMP']).toBe(false);
  });

  // ── Cert with no expiry date is valid ────────────────────

  it('cert with null expiry date counts as valid', () => {
    const certs = [makeCert('ISO 22716', 'verified', null)];
    const required = ['ISO 22716'];

    const { score } = computeMatchScorePure(certs, required);
    expect(score).toBe(100);
  });

  // ── Single requirement ───────────────────────────────────

  it('single requirement met returns 100', () => {
    const { score } = computeMatchScorePure(
      [makeCert('GMP')],
      ['GMP'],
    );
    expect(score).toBe(100);
  });

  it('single requirement not met returns 0', () => {
    const { score } = computeMatchScorePure(
      [makeCert('ISO 22716')],
      ['GMP'],
    );
    expect(score).toBe(0);
  });
});
