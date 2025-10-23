/**
 * useProfileValidation Hook
 * Real-time profile validation for training generation
 * Automatically detects missing fields and provides navigation guidance
 */

import { useState, useEffect } from 'react';
import { useUserStore } from '../system/store/userStore';
import { validateProfileForTraining, ValidationResult } from '../system/services/profileValidationService';
import logger from '../lib/utils/logger';

export interface ProfileValidationState {
  isValidating: boolean;
  validation: ValidationResult | null;
  isValid: boolean;
  primaryMissingTab: 'identity' | 'training' | 'health' | null;
  missingFieldsByTab: {
    identity: Array<{ field: string; label: string; section: string }>;
    training: Array<{ field: string; label: string; section: string }>;
    health: Array<{ field: string; label: string; section: string }>;
  };
}

/**
 * Hook to validate profile for training generation
 * Provides real-time validation status and missing fields organized by tab
 */
export function useProfileValidation(): ProfileValidationState {
  const { profile } = useUserStore();
  const [state, setState] = useState<ProfileValidationState>({
    isValidating: true,
    validation: null,
    isValid: false,
    primaryMissingTab: null,
    missingFieldsByTab: {
      identity: [],
      training: [],
      health: []
    }
  });

  useEffect(() => {
    let isMounted = true;

    const validateProfile = async () => {
      // Extract userId from profile (check both userId and id properties)
      const userId = (profile as any)?.userId || (profile as any)?.id;

      logger.info('PROFILE_VALIDATION_HOOK', 'Starting validation', {
        hasUserId: !!userId,
        hasProfile: !!profile,
        userId,
        profileKeys: profile ? Object.keys(profile).slice(0, 10) : []
      });

      if (!userId || !profile) {
        logger.warn('PROFILE_VALIDATION_HOOK', 'Missing userId or profile', {
          hasUserId: !!userId,
          hasProfile: !!profile
        });
        if (isMounted) {
          setState({
            isValidating: false,
            validation: null,
            isValid: false,
            primaryMissingTab: null,
            missingFieldsByTab: {
              identity: [],
              training: [],
              health: []
            }
          });
        }
        return;
      }

      try {
        logger.info('PROFILE_VALIDATION_HOOK', 'Validating profile', { userId });
        const validation = await validateProfileForTraining(userId, profile);

        if (!isMounted) return;

        // Organize missing fields by tab
        const missingFieldsByTab = {
          identity: validation.missingFields
            .filter(f => f.required && f.tab === 'identity')
            .map(f => ({ field: f.field, label: f.label, section: f.section })),
          training: validation.missingFields
            .filter(f => f.required && f.tab === 'training')
            .map(f => ({ field: f.field, label: f.label, section: f.section })),
          health: validation.missingFields
            .filter(f => f.required && f.tab === 'health')
            .map(f => ({ field: f.field, label: f.label, section: f.section }))
        };

        // Determine primary missing tab (priority: identity > training > health)
        let primaryMissingTab: 'identity' | 'training' | 'health' | null = null;
        if (missingFieldsByTab.identity.length > 0) {
          primaryMissingTab = 'identity';
        } else if (missingFieldsByTab.training.length > 0) {
          primaryMissingTab = 'training';
        } else if (missingFieldsByTab.health.length > 0) {
          primaryMissingTab = 'health';
        }

        setState({
          isValidating: false,
          validation,
          isValid: validation.valid,
          primaryMissingTab,
          missingFieldsByTab
        });

        logger.info('PROFILE_VALIDATION_HOOK', 'Validation complete', {
          userId,
          isValid: validation.valid,
          primaryMissingTab,
          missingCounts: {
            identity: missingFieldsByTab.identity.length,
            training: missingFieldsByTab.training.length,
            health: missingFieldsByTab.health.length
          }
        });
      } catch (error) {
        logger.error('PROFILE_VALIDATION_HOOK', 'Validation error', {
          error: error instanceof Error ? error.message : 'Unknown'
        });
        if (isMounted) {
          setState({
            isValidating: false,
            validation: null,
            isValid: false,
            primaryMissingTab: null,
            missingFieldsByTab: {
              identity: [],
              training: [],
              health: []
            }
          });
        }
      }
    };

    validateProfile();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  return state;
}

/**
 * Get navigation URL for a specific tab
 */
export function getProfileTabUrl(tab: 'identity' | 'training' | 'health'): string {
  const tabMap = {
    identity: '/profile?tab=identity',
    training: '/profile?tab=preferences',
    health: '/profile?tab=health'
  };
  return tabMap[tab];
}

/**
 * Get display name for a tab
 */
export function getProfileTabDisplayName(tab: 'identity' | 'training' | 'health'): string {
  const displayNames = {
    identity: 'Identité',
    training: 'Training',
    health: 'Santé'
  };
  return displayNames[tab];
}
