// Shared supplier qualification constants and validation logic.
// Extracted from lib/actions/suppliers.ts so it can be used in tests
// without the 'use server' directive.

export const QUALIFICATION_STAGES = [
  'Identified',
  'Outreached',
  'Capability Confirmed',
  'Conditionally Qualified',
  'Fully Qualified',
  'Paused',
  'Blacklisted',
  'Historical',
] as const;

export const TRANSITION_MAP: Record<string, string[]> = {
  'Identified':              ['Outreached', 'Paused', 'Blacklisted'],
  'Outreached':              ['Capability Confirmed', 'Paused', 'Blacklisted'],
  'Capability Confirmed':    ['Conditionally Qualified', 'Outreached', 'Paused', 'Blacklisted'],
  'Conditionally Qualified': ['Fully Qualified', 'Capability Confirmed', 'Paused', 'Blacklisted'],
  'Fully Qualified':         ['Conditionally Qualified', 'Paused', 'Blacklisted'],
  'Paused':                  ['Identified', 'Outreached'],
  'Blacklisted':             [],
  'Historical':              [],
};

export const DROPOUT_REASONS = [
  'Failed capability match',
  'Failed certification requirements',
  'Legal hold',
  'Supplier declined',
  'Commercial terms not agreed',
  'Volume mismatch',
  'Quality concerns',
  'Other',
] as const;

/** Check whether a transition from one stage to another is valid. */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = TRANSITION_MAP[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/** Return the list of valid target stages from a given stage. */
export function getValidTransitions(stage: string): string[] {
  return TRANSITION_MAP[stage] || [];
}

/** Check whether transitioning to a given stage requires a reason. */
export function requiresReason(toStage: string): boolean {
  return toStage === 'Paused' || toStage === 'Blacklisted';
}
