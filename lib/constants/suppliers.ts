// Shared supplier UI constants — colours, labels, badge styles.
// Single source of truth imported by DatabaseClient, PipelineClient, and SupplierProfileClient.

export type PermissionLevel = 'none' | 'can_brief' | 'can_sample' | 'can_po';
export type CapabilityType = 'turnkey' | 'blend_fill' | 'both' | 'unknown';

export const STAGE_COLORS: Record<string, string> = {
  'Identified': '#94a3b8',
  'Outreached': '#3b82f6',
  'Capability Confirmed': '#8b5cf6',
  'Conditionally Qualified': '#f59e0b',
  'Fully Qualified': '#22c55e',
  'Paused': '#94a3b8',
  'Blacklisted': '#ef4444',
};

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  none: 'No Permissions',
  can_brief: 'Can Brief',
  can_sample: 'Can Sample',
  can_po: 'Can PO',
};

export const PERMISSION_COLORS: Record<PermissionLevel, string> = {
  none: '#94a3b8',
  can_brief: '#3b82f6',
  can_sample: '#22c55e',
  can_po: '#8b5cf6',
};

export const CAPABILITY_LABELS: Record<CapabilityType, string> = {
  turnkey: 'Turnkey',
  blend_fill: 'B&F Only',
  both: 'Both',
  unknown: 'Unknown',
};

export const CAPABILITY_COLORS: Record<CapabilityType, string> = {
  turnkey: '#22c55e',
  blend_fill: '#3b82f6',
  both: '#8b5cf6',
  unknown: '#94a3b8',
};

export const CAPABILITY_BADGE_STYLES: Record<CapabilityType, { bg: string; color: string }> = {
  turnkey: { bg: '#dcfce7', color: '#166534' },
  blend_fill: { bg: '#dbeafe', color: '#1e40af' },
  both: { bg: '#f3e8ff', color: '#6b21a8' },
  unknown: { bg: '#f1f5f9', color: '#64748b' },
};

export const CERT_TYPES = [
  'ISO_9001', 'ISO_14001', 'ISO_22716',
  'GMP', 'FDA', 'FDA_OTC', 'TGA',
  'SMETA', 'BSCI', 'FSC',
  'organic', 'vegan', 'cruelty_free', 'other',
] as const;
