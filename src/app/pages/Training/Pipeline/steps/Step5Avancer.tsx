/**
 * Step 5 - Avancer
 * Next action recommendation and progression path
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StepContainer from '../components/StepContainer';
import TrainingButton from '../components/TrainingButton';
import SessionGuard from '../components/SessionGuard';
import {
  NextActionRecommendationCard,
  MotivationalInsightCard,
  NextSessionRecommendationsCard
} from '../../../../../ui/components/training/insights';
import { RecoveryStatusCard } from '../../../../../ui/components/training';
import { ProgressionPathCard } from '../../../../../ui/components/training/progression';
import {
  NextActionRecommendationCardSkeleton,
  MotivationalInsightCardSkeleton,
  NextSessionRecommendationsCardSkeleton,
  RecoveryStatusCardSkeleton,
  ProgressionPathCardSkeleton
} from '../../../../../ui/components/skeletons';
import { useTrainingPipeline } from '../../../../../system/store/trainingPipeline';
import { Haptics } from '../../../../../utils/haptics';
import logger from '../../../../../lib/utils/logger';
import { step5RecommendationService } from '../../../../../system/services/step5RecommendationService';
import { step5NotificationService } from '../../../../../system/services/step5NotificationService';
import type {
  Recommendation,
  RecoveryData,
  ProgressionMilestone
} from '../../../../../system/services/step5RecommendationService';

const STEP_COLORS = {
  primary: '#18E3FF',
  secondary: '#8B5CF6',
  accent: '#FF6B35',
  success: '#10B981'
};

const STEP_COLOR = STEP_COLORS.primary;

const Step5AvancerContent: React.FC = () => {
  const navigate = useNavigate();
  const { goToPreviousStep, resetPipeline, sessionAnalysisResult, currentSessionId } = useTrainingPipeline();

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [milestones, setMilestones] = useState<ProgressionMilestone[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState<{
    message: string;
    category: 'strength' | 'endurance' | 'consistency' | 'recovery';
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeStep = async () => {
      step5NotificationService.initialize();
      step5NotificationService.onArrival();

      logger.info('STEP_5_AVANCER', 'Initializing Step 5', {
        hasSessionAnalysis: !!sessionAnalysisResult,
        sessionId: currentSessionId,
        analysisKeys: sessionAnalysisResult ? Object.keys(sessionAnalysisResult) : []
      });

      try {
        // If sessionAnalysisResult is not available from store, try to refetch
        if (!sessionAnalysisResult) {
          logger.warn('STEP_5_AVANCER', 'No sessionAnalysisResult in store - data may be missing from Step 4');
        }

        const [recData, rec, miles, motiv] = await Promise.all([
          step5RecommendationService.getRecoveryStatus(),
          step5RecommendationService.generateRecommendation(),
          step5RecommendationService.getProgressionPath(),
          step5RecommendationService.getMotivationalMessage()
        ]);

        setRecoveryData(recData);
        setRecommendation(rec);
        setMilestones(miles);
        setMotivationalMessage(motiv);

        logger.info('STEP_5_AVANCER', 'Step 5 data loaded', {
          hasRecoveryData: !!recData,
          hasRecommendation: !!rec,
          milestonesCount: miles.length,
          hasMotivationalMessage: !!motiv,
          sessionAnalysisAvailable: !!sessionAnalysisResult,
          hasWearableData: !!recData?.wearableData?.hasWearableData,
          wearableRecoveryScore: recData?.wearableData?.recoveryScore,
          wearableDataSource: recData?.wearableData?.hasWearableData ? 'wearable' : 'manual'
        });

        setIsLoading(false);
      } catch (error) {
        logger.error('STEP_5_AVANCER', 'Error initializing Step 5', {
          error: error instanceof Error ? error.message : String(error)
        });
        setIsLoading(false);
      }
    };

    initializeStep();

    return () => {
      step5NotificationService.cleanup();
    };
  }, [sessionAnalysisResult, currentSessionId]);

  const handleAcceptRecommendation = async () => {
    if (!recommendation) return;

    step5NotificationService.onActionAccepted();

    await step5RecommendationService.saveRecommendationAcceptance(recommendation.id);

    setTimeout(() => {
      resetPipeline();
      navigate('/training');
    }, 2000);
  };

  const handleComplete = () => {
    resetPipeline();
    navigate('/training?tab=today');
  };

  if (isLoading) {
    return (
      <StepContainer
        icon="ArrowRight"
        title="Prochaine Étape"
        subtitle="Chargement de vos recommandations..."
        iconColor={STEP_COLOR}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <NextActionRecommendationCardSkeleton stepColor={STEP_COLORS.primary} />
          {sessionAnalysisResult && (
            <NextSessionRecommendationsCardSkeleton stepColor={STEP_COLORS.primary} />
          )}
          <RecoveryStatusCardSkeleton stepColor={STEP_COLORS.success} />
          <ProgressionPathCardSkeleton stepColor={STEP_COLORS.accent} />
          <MotivationalInsightCardSkeleton stepColor={STEP_COLORS.secondary} />
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      icon="ArrowRight"
      title="Prochaine Étape"
      subtitle="Continuez sur votre lancée"
      iconColor={STEP_COLOR}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* CTA Principal - FIRST POSITION */}
        {recommendation && (
          <NextActionRecommendationCard
            recommendation={recommendation}
            onAccept={handleAcceptRecommendation}
            stepColor={STEP_COLORS.primary}
            wearableRecoveryData={recoveryData?.wearableData}
          />
        )}

        {/* AI Next Session Recommendations - SECOND POSITION */}
        {sessionAnalysisResult && (
          <NextSessionRecommendationsCard
            aiAnalysis={sessionAnalysisResult}
            stepColor={STEP_COLORS.primary}
          />
        )}

        {recoveryData && (
          <RecoveryStatusCard
            recoveryData={recoveryData}
            stepColor={STEP_COLORS.success}
          />
        )}

        {milestones.length > 0 && (
          <ProgressionPathCard
            milestones={milestones}
            stepColor={STEP_COLORS.accent}
          />
        )}

        {motivationalMessage && (
          <MotivationalInsightCard
            message={motivationalMessage.message}
            category={motivationalMessage.category}
            stepColor={STEP_COLORS.secondary}
          />
        )}

        {/* CTA Buttons - Navigation to Training Today Tab */}
        <motion.div
          style={{ marginTop: '32px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <TrainingButton
              variant="primary"
              size="lg"
              icon="LayoutDashboard"
              iconPosition="right"
              onClick={handleComplete}
              fullWidth
              stepColor={STEP_COLORS.primary}
            >
              Retour à l'Atelier Training
            </TrainingButton>
          </motion.div>
        </motion.div>
      </div>
    </StepContainer>
  );
};

const Step5Avancer: React.FC = () => {
  return (
    <SessionGuard
      step="avancer"
      requiresPrescription={true}
      requiresSessionStarted={false}
      requiresFeedback={true}
    >
      <Step5AvancerContent />
    </SessionGuard>
  );
};

export default Step5Avancer;
