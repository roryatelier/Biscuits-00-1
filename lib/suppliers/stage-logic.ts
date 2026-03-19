// Re-export stage logic from the canonical location.
export {
  QUALIFICATION_STAGES,
  TRANSITION_MAP,
  DROPOUT_REASONS,
  isValidTransition,
  getValidTransitions,
  requiresReason,
} from '@/lib/supplier-constants';
