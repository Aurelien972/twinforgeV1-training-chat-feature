/**
 * Phase Helpers
 * Utility functions for analysis phase management
 */

import { ICONS } from '../../../../icons/registry';
import { PHASE_COLORS } from '../config/constants';
import type { AnalysisPhase } from '../types';

/**
 * Get icon for analysis phase
 */
export function getPhaseIcon(phase: AnalysisPhase) {
  switch (phase) {
    case 'preparing':
      return ICONS.FileImage;
    case 'uploading':
      return ICONS.Upload;
    case 'analyzing':
      return ICONS.Sparkles;
    case 'validating':
      return ICONS.CheckCircle2;
    case 'saving':
      return ICONS.Database;
    case 'completed':
      return ICONS.Check;
    case 'error':
      return ICONS.AlertCircle;
    default:
      return ICONS.Loader2;
  }
}

/**
 * Get color for analysis phase
 */
export function getPhaseColor(phase: AnalysisPhase): string {
  switch (phase) {
    case 'completed':
      return PHASE_COLORS.completed;
    case 'error':
      return PHASE_COLORS.error;
    case 'analyzing':
      return PHASE_COLORS.analyzing;
    default:
      return PHASE_COLORS.default;
  }
}

/**
 * Check if phase is terminal (completed or error)
 */
export function isTerminalPhase(phase: AnalysisPhase): boolean {
  return phase === 'completed' || phase === 'error';
}

/**
 * Check if phase is active (not idle, not terminal)
 */
export function isActivePhase(phase: AnalysisPhase): boolean {
  return phase !== 'idle' && !isTerminalPhase(phase);
}
