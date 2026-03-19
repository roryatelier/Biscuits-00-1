import { describe, it, expect } from 'vitest';
import { computePermissionLevel } from '@/lib/suppliers/permission-logic';

describe('Permission Levels', () => {
  // ─── none ────────────────────────────────────────────────
  it('no agreements, no certs → none', () => {
    expect(computePermissionLevel([], [])).toBe('none');
  });

  // ─── can_brief ───────────────────────────────────────────
  it('NDA signed only → can_brief', () => {
    const agreements = [{ agreementType: 'NDA', status: 'signed' }];
    expect(computePermissionLevel(agreements, [])).toBe('can_brief');
  });

  // ─── can_sample ──────────────────────────────────────────
  it('NDA signed + GMP verified → can_sample', () => {
    const agreements = [{ agreementType: 'NDA', status: 'signed' }];
    const certs = [{ certType: 'GMP', verificationStatus: 'verified' }];
    expect(computePermissionLevel(agreements, certs)).toBe('can_sample');
  });

  // ─── can_po ──────────────────────────────────────────────
  it('all agreements signed + GMP + ISO verified → can_po', () => {
    const agreements = [
      { agreementType: 'NDA', status: 'signed' },
      { agreementType: 'MSA', status: 'signed' },
      { agreementType: 'IP', status: 'signed' },
      { agreementType: 'Payment', status: 'signed' },
    ];
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified' },
      { certType: 'ISO', verificationStatus: 'verified' },
    ];
    expect(computePermissionLevel(agreements, certs)).toBe('can_po');
  });

  // ─── NDA signed but GMP unverified → can_brief ──────────
  it('NDA signed but GMP unverified → can_brief (not can_sample)', () => {
    const agreements = [{ agreementType: 'NDA', status: 'signed' }];
    const certs = [{ certType: 'GMP', verificationStatus: 'unverified' }];
    expect(computePermissionLevel(agreements, certs)).toBe('can_brief');
  });

  // ─── All agreements but ISO missing → can_sample ─────────
  it('all agreements signed but ISO missing → can_sample (not can_po)', () => {
    const agreements = [
      { agreementType: 'NDA', status: 'signed' },
      { agreementType: 'MSA', status: 'signed' },
      { agreementType: 'IP', status: 'signed' },
      { agreementType: 'Payment', status: 'signed' },
    ];
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified' },
    ];
    expect(computePermissionLevel(agreements, certs)).toBe('can_sample');
  });

  // ─── NDA not signed but others signed → none ─────────────
  it('NDA not signed but other agreements signed → none', () => {
    const agreements = [
      { agreementType: 'NDA', status: 'not_started' },
      { agreementType: 'MSA', status: 'signed' },
      { agreementType: 'IP', status: 'signed' },
      { agreementType: 'Payment', status: 'signed' },
    ];
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified' },
      { certType: 'ISO', verificationStatus: 'verified' },
    ];
    expect(computePermissionLevel(agreements, certs)).toBe('none');
  });

  // ─── Edge: NDA sent (not signed) → none ──────────────────
  it('NDA sent but not signed → none', () => {
    const agreements = [{ agreementType: 'NDA', status: 'sent' }];
    expect(computePermissionLevel(agreements, [])).toBe('none');
  });

  // ─── Edge: extra agreements/certs do not interfere ───────
  it('extra unrelated agreements and certs do not affect result', () => {
    const agreements = [
      { agreementType: 'NDA', status: 'signed' },
      { agreementType: 'Custom', status: 'signed' },
    ];
    const certs = [
      { certType: 'GMP', verificationStatus: 'verified' },
      { certType: 'HALAL', verificationStatus: 'verified' },
    ];
    expect(computePermissionLevel(agreements, certs)).toBe('can_sample');
  });
});
