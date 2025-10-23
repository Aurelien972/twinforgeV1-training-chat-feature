/**
 * SessionGuard Component
 * Protects pipeline steps from unauthorized access and prevents unwanted regenerations
 * Guards against navigation to steps without proper session state
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingPipeline } from '../../../../../system/store/trainingPipeline';
import logger from '../../../../../lib/utils/logger';
import GlassCard from '../../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import TrainingButton from './TrainingButton';

interface SessionGuardProps {
  children: React.ReactNode;
  step: 'preparer' | 'activer' | 'seance' | 'adapter' | 'avancer';
  requiresPrescription?: boolean;
  requiresSessionStarted?: boolean;
  requiresFeedback?: boolean;
}

const SessionGuard: React.FC<SessionGuardProps> = ({
  children,
  step,
  requiresPrescription = false,
  requiresSessionStarted = false,
  requiresFeedback = false
}) => {
  const navigate = useNavigate();
  const {
    sessionPrescription,
    sessionFeedback,
    currentSessionId,
    userId,
    preparerData,
    currentStep
  } = useTrainingPipeline();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    const checkAuthorization = () => {
      logger.info('SESSION_GUARD', 'Checking authorization', {
        step,
        currentStep,
        requiresPrescription,
        requiresSessionStarted,
        requiresFeedback,
        hasPrescription: !!sessionPrescription,
        hasFeedback: !!sessionFeedback,
        hasUserId: !!userId,
        hasSessionId: !!currentSessionId
      });

      // Check 1: User must be authenticated
      if (!userId) {
        setBlockReason('Utilisateur non authentifié');
        setIsAuthorized(false);
        logger.warn('SESSION_GUARD', 'Access blocked - no user', { step });
        return;
      }

      // Check 2: Session ID must exist
      if (!currentSessionId) {
        setBlockReason('Aucune session active');
        setIsAuthorized(false);
        logger.warn('SESSION_GUARD', 'Access blocked - no session ID', { step });
        return;
      }

      // Check 3: For activer, preparer data is required
      if (step === 'activer' && !preparerData) {
        setBlockReason('Configuration de séance manquante');
        setIsAuthorized(false);
        logger.warn('SESSION_GUARD', 'Access blocked - no preparer data', { step });
        return;
      }

      // Check 4: For seance/adapter/avancer, prescription is required
      if (requiresPrescription && !sessionPrescription) {
        setBlockReason('Aucun training généré');
        setIsAuthorized(false);
        logger.warn('SESSION_GUARD', 'Access blocked - no prescription', { step });
        return;
      }

      // Check 5: For adapter/avancer, session feedback is required
      if (requiresFeedback && !sessionFeedback) {
        setBlockReason('Séance non complétée');
        setIsAuthorized(false);
        logger.warn('SESSION_GUARD', 'Access blocked - no feedback', { step });
        return;
      }

      // All checks passed
      logger.info('SESSION_GUARD', 'Authorization granted', { step });
      setIsAuthorized(true);
    };

    checkAuthorization();
  }, [
    step,
    currentStep,
    sessionPrescription,
    sessionFeedback,
    userId,
    currentSessionId,
    preparerData,
    requiresPrescription,
    requiresSessionStarted,
    requiresFeedback
  ]);

  // While checking authorization, show nothing
  if (isAuthorized === null) {
    return null;
  }

  // If not authorized, show blocking screen
  if (!isAuthorized) {
    const getRedirectStep = () => {
      if (!userId) return '/';
      if (!currentSessionId || !preparerData) return '/training';
      if (!sessionPrescription) return '/training/preparer';
      if (!sessionFeedback) return '/training/seance';
      return '/training';
    };

    const getRedirectLabel = () => {
      if (!userId) return 'Se connecter';
      if (!currentSessionId || !preparerData) return 'Retour à l\'accueil';
      if (!sessionPrescription) return 'Générer un training';
      if (!sessionFeedback) return 'Commencer la séance';
      return 'Retour à l\'accueil';
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
        <GlassCard
          className="max-w-md w-full p-8 text-center"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, color-mix(in srgb, #EF4444 10%, transparent) 0%, transparent 60%),
              rgba(255, 255, 255, 0.08)
            `,
            border: '2px solid color-mix(in srgb, #EF4444 25%, transparent)'
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, #EF4444 40%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.15)
              `,
              border: '2px solid color-mix(in srgb, #EF4444 50%, transparent)',
              boxShadow: '0 4px 16px color-mix(in srgb, #EF4444 30%, transparent)'
            }}
          >
            <SpatialIcon
              Icon={ICONS.Lock}
              size={32}
              style={{ color: '#EF4444' }}
            />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Accès non autorisé
          </h2>

          <p className="text-white/70 mb-2">
            {blockReason}
          </p>

          <p className="text-white/60 text-sm mb-8">
            Tu dois compléter les étapes précédentes avant d'accéder à cette section.
          </p>

          <TrainingButton
            variant="primary"
            size="lg"
            icon="ArrowRight"
            iconPosition="right"
            onClick={() => {
              logger.info('SESSION_GUARD', 'User redirected', {
                from: step,
                to: getRedirectStep()
              });
              navigate(getRedirectStep());
            }}
            fullWidth
            stepColor="#EF4444"
          >
            {getRedirectLabel()}
          </TrainingButton>
        </GlassCard>
      </div>
    );
  }

  // Authorization granted, render children
  return <>{children}</>;
};

export default SessionGuard;
