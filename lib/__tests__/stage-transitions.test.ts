import { describe, it, expect } from 'vitest';
import {
  QUALIFICATION_STAGES,
  TRANSITION_MAP,
  DROPOUT_REASONS,
  isValidTransition,
  getValidTransitions,
  requiresReason,
} from '@/lib/supplier-constants';

describe('Stage Transitions', () => {
  // ─── Forward transitions ─────────────────────────────────
  describe('valid forward transitions', () => {
    const forwardPath = [
      ['Identified', 'Outreached'],
      ['Outreached', 'Capability Confirmed'],
      ['Capability Confirmed', 'Conditionally Qualified'],
      ['Conditionally Qualified', 'Fully Qualified'],
    ] as const;

    it.each(forwardPath)('%s → %s is valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  });

  // ─── Backward transitions ────────────────────────────────
  describe('valid backward transitions', () => {
    const backwardPaths = [
      ['Capability Confirmed', 'Outreached'],
      ['Conditionally Qualified', 'Capability Confirmed'],
      ['Fully Qualified', 'Conditionally Qualified'],
    ] as const;

    it.each(backwardPaths)('%s → %s is valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  });

  // ─── Invalid transitions ─────────────────────────────────
  describe('invalid transitions', () => {
    const invalidPaths = [
      ['Identified', 'Fully Qualified'],
      ['Identified', 'Capability Confirmed'],
      ['Identified', 'Conditionally Qualified'],
      ['Outreached', 'Fully Qualified'],
      ['Outreached', 'Conditionally Qualified'],
      ['Outreached', 'Identified'],
    ] as const;

    it.each(invalidPaths)('%s → %s is invalid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(false);
    });
  });

  // ─── Blacklisted (terminal) ──────────────────────────────
  describe('Blacklisted is terminal', () => {
    it('has no valid transitions out', () => {
      expect(getValidTransitions('Blacklisted')).toEqual([]);
    });

    it('every active stage can transition to Blacklisted', () => {
      const activeStages = ['Identified', 'Outreached', 'Capability Confirmed', 'Conditionally Qualified', 'Fully Qualified'];
      for (const stage of activeStages) {
        expect(isValidTransition(stage, 'Blacklisted')).toBe(true);
      }
    });
  });

  // ─── Paused re-entry ─────────────────────────────────────
  describe('Paused allows re-entry', () => {
    it('can go to Identified', () => {
      expect(isValidTransition('Paused', 'Identified')).toBe(true);
    });

    it('can go to Outreached', () => {
      expect(isValidTransition('Paused', 'Outreached')).toBe(true);
    });

    it('cannot go to Fully Qualified', () => {
      expect(isValidTransition('Paused', 'Fully Qualified')).toBe(false);
    });

    it('cannot go to Blacklisted', () => {
      expect(isValidTransition('Paused', 'Blacklisted')).toBe(false);
    });
  });

  // ─── Reason requirements ─────────────────────────────────
  describe('requiresReason', () => {
    it('Paused requires a reason', () => {
      expect(requiresReason('Paused')).toBe(true);
    });

    it('Blacklisted requires a reason', () => {
      expect(requiresReason('Blacklisted')).toBe(true);
    });

    it.each([
      'Identified',
      'Outreached',
      'Capability Confirmed',
      'Conditionally Qualified',
      'Fully Qualified',
    ])('%s does not require a reason', (stage) => {
      expect(requiresReason(stage)).toBe(false);
    });
  });

  // ─── getValidTransitions ─────────────────────────────────
  describe('getValidTransitions', () => {
    it('returns correct options for Identified', () => {
      expect(getValidTransitions('Identified')).toEqual(['Outreached', 'Paused', 'Blacklisted']);
    });

    it('returns correct options for Capability Confirmed', () => {
      expect(getValidTransitions('Capability Confirmed')).toEqual([
        'Conditionally Qualified', 'Outreached', 'Paused', 'Blacklisted',
      ]);
    });

    it('returns empty array for unknown stage', () => {
      expect(getValidTransitions('NonExistent')).toEqual([]);
    });

    it('returns empty array for Blacklisted', () => {
      expect(getValidTransitions('Blacklisted')).toEqual([]);
    });
  });

  // ─── Constants integrity ─────────────────────────────────
  describe('constants', () => {
    it('QUALIFICATION_STAGES has 7 stages', () => {
      expect(QUALIFICATION_STAGES).toHaveLength(7);
    });

    it('every stage in QUALIFICATION_STAGES has an entry in TRANSITION_MAP', () => {
      for (const stage of QUALIFICATION_STAGES) {
        expect(TRANSITION_MAP).toHaveProperty(stage);
      }
    });

    it('DROPOUT_REASONS has 8 entries', () => {
      expect(DROPOUT_REASONS).toHaveLength(8);
    });
  });
});
