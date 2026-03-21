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
  // ── Forward transitions ──────────────────────────────────

  describe('valid forward transitions', () => {
    const forwardCases: [string, string][] = [
      ['Identified', 'Outreached'],
      ['Outreached', 'Capability Confirmed'],
      ['Capability Confirmed', 'Conditionally Qualified'],
      ['Conditionally Qualified', 'Fully Qualified'],
    ];

    it.each(forwardCases)('%s → %s is valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  });

  // ── Backward transitions ─────────────────────────────────

  describe('valid backward transitions', () => {
    const backwardCases: [string, string][] = [
      ['Capability Confirmed', 'Outreached'],
      ['Conditionally Qualified', 'Capability Confirmed'],
      ['Fully Qualified', 'Conditionally Qualified'],
    ];

    it.each(backwardCases)('%s → %s is valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  });

  // ── Invalid transitions ──────────────────────────────────

  describe('invalid transitions are rejected', () => {
    const invalidCases: [string, string][] = [
      ['Identified', 'Fully Qualified'],
      ['Identified', 'Capability Confirmed'],
      ['Identified', 'Conditionally Qualified'],
      ['Outreached', 'Fully Qualified'],
      ['Outreached', 'Identified'],
      ['Fully Qualified', 'Identified'],
      ['Fully Qualified', 'Outreached'],
    ];

    it.each(invalidCases)('%s → %s is invalid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(false);
    });
  });

  // ── Paused re-entry ──────────────────────────────────────

  describe('Paused re-entry', () => {
    it('Paused → Identified is valid', () => {
      expect(isValidTransition('Paused', 'Identified')).toBe(true);
    });

    it('Paused → Outreached is valid', () => {
      expect(isValidTransition('Paused', 'Outreached')).toBe(true);
    });

    it('Paused → Fully Qualified is invalid (must re-enter early)', () => {
      expect(isValidTransition('Paused', 'Fully Qualified')).toBe(false);
    });

    it('Paused → Blacklisted is invalid', () => {
      expect(isValidTransition('Paused', 'Blacklisted')).toBe(false);
    });
  });

  // ── Blacklisted is terminal ──────────────────────────────

  describe('Blacklisted is terminal', () => {
    it('has zero valid transitions out', () => {
      expect(TRANSITION_MAP['Blacklisted']).toEqual([]);
    });

    it.each(QUALIFICATION_STAGES.filter(s => s !== 'Blacklisted'))(
      'Blacklisted → %s is invalid',
      (to) => {
        expect(isValidTransition('Blacklisted', to)).toBe(false);
      },
    );
  });

  // ── Any stage can reach Paused/Blacklisted ───────────────

  describe('any active stage can transition to Paused and Blacklisted', () => {
    const activeStages = QUALIFICATION_STAGES.filter(
      s => s !== 'Paused' && s !== 'Blacklisted',
    );

    it.each(activeStages)('%s → Paused is valid', (from) => {
      expect(isValidTransition(from, 'Paused')).toBe(true);
    });

    it.each(activeStages)('%s → Blacklisted is valid', (from) => {
      expect(isValidTransition(from, 'Blacklisted')).toBe(true);
    });
  });

  // ── Reason requirements ──────────────────────────────────

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

  // ── getValidTransitions ────────────────────────────────────

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

  // ── Every stage has at least one transition (except Blacklisted) ──

  describe('every stage has at least one valid transition (except Blacklisted)', () => {
    const nonTerminal = QUALIFICATION_STAGES.filter(s => s !== 'Blacklisted');

    it.each(nonTerminal)('%s has at least one transition', (stage) => {
      expect(TRANSITION_MAP[stage].length).toBeGreaterThan(0);
    });
  });

  // ── Constants integrity ──────────────────────────────────

  describe('constants integrity', () => {
    it('QUALIFICATION_STAGES has 7 entries', () => {
      expect(QUALIFICATION_STAGES).toHaveLength(7);
    });

    it('TRANSITION_MAP covers every stage', () => {
      for (const stage of QUALIFICATION_STAGES) {
        expect(TRANSITION_MAP).toHaveProperty(stage);
      }
    });

    it('DROPOUT_REASONS is non-empty', () => {
      expect(DROPOUT_REASONS.length).toBeGreaterThan(0);
    });

    it('unknown stage returns false for isValidTransition', () => {
      expect(isValidTransition('NonExistent', 'Identified')).toBe(false);
    });
  });
});
