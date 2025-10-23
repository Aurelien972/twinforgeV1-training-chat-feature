/**
 * Feature Flags for Morphology System
 * Kill-switches for strict DB-first morphology control
 */

interface MorphologyFeatureFlags {
  DISABLE_LIMB_TO_MORPH: boolean;
  FALLBACK_MODE: 'DB_ONLY' | 'PERMISSIVE';
  ENFORCE_CAPS_MUTEX: boolean;
  STRICT_ARCHETYPE_MATCH: boolean;
  AI_REFINE_MODE: 'CLAMP_ONLY' | 'PERMISSIVE';
}

/**
 * Get morphology feature flags from environment
 */
export function getMorphologyFeatureFlags(): MorphologyFeatureFlags {
  return {
    DISABLE_LIMB_TO_MORPH: import.meta.env.VITE_DISABLE_LIMB_TO_MORPH === 'true',
    FALLBACK_MODE: import.meta.env.VITE_FALLBACK_MODE === 'DB_ONLY' ? 'DB_ONLY' : 'PERMISSIVE',
    ENFORCE_CAPS_MUTEX: import.meta.env.VITE_ENFORCE_CAPS_MUTEX === 'true',
    STRICT_ARCHETYPE_MATCH: import.meta.env.VITE_STRICT_ARCHETYPE_MATCH === 'true',
    AI_REFINE_MODE: import.meta.env.VITE_AI_REFINE_MODE === 'CLAMP_ONLY' ? 'CLAMP_ONLY' : 'PERMISSIVE',
  };
}

/**
 * Log current feature flags configuration
 */
export function logMorphologyFeatureFlags(): void {
  const flags = getMorphologyFeatureFlags();
  console.log('🔧 [MORPHOLOGY_FEATURE_FLAGS] Current configuration:', {
    DISABLE_LIMB_TO_MORPH: flags.DISABLE_LIMB_TO_MORPH,
    FALLBACK_MODE: flags.FALLBACK_MODE,
    ENFORCE_CAPS_MUTEX: flags.ENFORCE_CAPS_MUTEX,
    STRICT_ARCHETYPE_MATCH: flags.STRICT_ARCHETYPE_MATCH,
    AI_REFINE_MODE: flags.AI_REFINE_MODE,
    philosophy: 'db_first_strict_morphology_control'
  });
}

/**
 * Get fasting feature flags from environment
 */
export function getFastingFeatureFlags() {
  return {
    MOCK_FASTING_DATA: import.meta.env.VITE_FEATURE_MOCK_FASTING_DATA === 'true',
  };
}

/**
 * Log fasting feature flags configuration
 */
export function logFastingFeatureFlags(): void {
  const flags = getFastingFeatureFlags();
  console.log('🔧 [FASTING_FEATURE_FLAGS] Current configuration:', {
    MOCK_FASTING_DATA: flags.MOCK_FASTING_DATA,
    philosophy: 'fasting_test_pipeline_control'
  });
}

/**
 * Get training feature flags from environment
 */
export function getTrainingFeatureFlags() {
  return {
    DEV_SKIP_TO_CELEBRATION: import.meta.env.VITE_FEATURE_DEV_SKIP_TO_CELEBRATION === 'true',
  };
}

/**
 * Log training feature flags configuration
 */
export function logTrainingFeatureFlags(): void {
  const flags = getTrainingFeatureFlags();
  console.log('🔧 [TRAINING_FEATURE_FLAGS] Current configuration:', {
    DEV_SKIP_TO_CELEBRATION: flags.DEV_SKIP_TO_CELEBRATION,
    philosophy: 'training_dev_shortcuts'
  });
}