/**
 * PersonalizedMetricsCard Component
 * Displays ultra-personalized metrics with calories burned as hero metric
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionFeedback, SessionPrescription } from '../../../../system/store/trainingPipeline/types';
import type { SessionAnalysisResult } from '../../../../system/services/sessionAnalysisService';
import { calculateExerciseVolume, calculateSessionVolume } from '../../../../utils/loadUtils';
import logger from '../../../../lib/utils/logger';

interface PersonalizedMetricsCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

const PersonalizedMetricsCard: React.FC<PersonalizedMetricsCardProps> = ({
  sessionFeedback,
  sessionPrescription,
  stepColor,
  aiAnalysis,
}) => {
  // Detect session type
  const isEnduranceSession = !!(sessionPrescription as any).mainWorkout || !!(sessionPrescription as any).discipline;
  const isFunctionalSession = !!(sessionFeedback as any).functionalMetrics;

  useEffect(() => {
    logger.info('PERSONALIZED_METRICS_CARD', 'Component rendered', {
      hasAiAnalysis: !!aiAnalysis,
      hasSessionAnalysis: !!aiAnalysis?.sessionAnalysis,
      hasVolumeAnalysis: !!aiAnalysis?.sessionAnalysis?.volumeAnalysis,
      exercisesCount: sessionFeedback.exercises?.length || 0,
      isEnduranceSession,
      isFunctionalSession,
      functionalMetrics: (sessionFeedback as any).functionalMetrics
    });
  }, [aiAnalysis, sessionFeedback, isEnduranceSession, isFunctionalSession]);
  // Calculate total volume (weight x reps x sets)
  const calculateTotalVolume = () => {
    // CRITICAL GUARD: Check if exercises array exists and is valid
    if (!sessionFeedback.exercises || !Array.isArray(sessionFeedback.exercises) || sessionFeedback.exercises.length === 0) {
      logger.warn('PERSONALIZED_METRICS_CALC', 'No exercises array for volume calculation', {
        hasExercises: !!sessionFeedback.exercises,
        isArray: Array.isArray(sessionFeedback.exercises),
        length: sessionFeedback.exercises?.length
      });
      return 0;
    }
    return calculateSessionVolume(sessionFeedback.exercises);
  };

  // Calculate total reps
  const calculateTotalReps = () => {
    // CRITICAL GUARD: Check if exercises array exists and is valid
    if (!sessionFeedback.exercises || !Array.isArray(sessionFeedback.exercises) || sessionFeedback.exercises.length === 0) {
      logger.warn('PERSONALIZED_METRICS_CALC', 'No exercises array for reps calculation');
      return 0;
    }
    return sessionFeedback.exercises.reduce((total, exercise) => {
      if (!exercise || !exercise.repsActual || !Array.isArray(exercise.repsActual)) {
        return total;
      }
      return total + exercise.repsActual.reduce((sum, reps) => sum + reps, 0);
    }, 0);
  };

  // Calculate work/rest ratio
  const calculateWorkRestRatio = () => {
    // CRITICAL GUARD: Check if exercises exist for work/rest calculation
    if (!sessionPrescription.exercises || !Array.isArray(sessionPrescription.exercises) || sessionPrescription.exercises.length === 0) {
      logger.warn('PERSONALIZED_METRICS_CALC', 'No exercises for work/rest ratio');
      return '1.0';
    }

    // GUARD: Check if durationActual exists
    if (!sessionFeedback.durationActual || typeof sessionFeedback.durationActual !== 'number') {
      logger.warn('PERSONALIZED_METRICS_CALC', 'No valid durationActual for work/rest ratio');
      return '1.0';
    }

    try {
      const totalRestTime = sessionPrescription.exercises.reduce((total, ex) => {
        if (!ex || typeof ex.rest !== 'number' || typeof ex.sets !== 'number') {
          return total;
        }
        return total + (ex.rest * (ex.sets - 1));
      }, 0);
      const workTime = sessionFeedback.durationActual - totalRestTime;
      if (totalRestTime === 0 || workTime <= 0) {
        return '1.0';
      }
      const ratio = workTime / totalRestTime;
      return isNaN(ratio) ? '1.0' : ratio.toFixed(1);
    } catch (error) {
      logger.error('PERSONALIZED_METRICS_CALC', 'Error calculating work/rest ratio', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return '1.0';
    }
  };

  // Estimate calories burned (simplified formula)
  const calculateCaloriesBurned = () => {
    const totalVolume = calculateTotalVolume();
    const durationMinutes = sessionFeedback.durationActual / 60;
    const avgRpe = sessionFeedback.overallRpe || 7;

    // Safety check for valid values
    if (isNaN(totalVolume) || isNaN(durationMinutes) || isNaN(avgRpe)) {
      logger.warn('PERSONALIZED_METRICS', 'Invalid values for calorie calculation', {
        totalVolume,
        durationMinutes,
        avgRpe
      });
      return 0;
    }

    // Simplified formula: (volume/100 + duration * 5) * RPE multiplier
    const baseCalories = (totalVolume / 100) + (durationMinutes * 5);
    const rpeMultiplier = 0.8 + (avgRpe / 10) * 0.4; // 0.8 to 1.2 based on RPE

    const result = Math.round(baseCalories * rpeMultiplier);
    return isNaN(result) ? 0 : result;
  };

  // Calculate average intensity (simplified - would need 1RM data in production)
  const calculateAverageIntensity = () => {
    // GUARD: Check if overallRpe exists
    const avgRpe = sessionFeedback.overallRpe || 7; // Default to 7 if not provided
    if (typeof avgRpe !== 'number' || isNaN(avgRpe)) {
      logger.warn('PERSONALIZED_METRICS_CALC', 'Invalid overallRpe for intensity calculation');
      return 75; // Default reasonable intensity
    }
    const intensity = Math.round(50 + (avgRpe * 3.5)); // Rough estimate: RPE 7 ≈ 75% intensity
    return isNaN(intensity) ? 75 : intensity;
  };

  // Calculate time under tension (simplified)
  const calculateTimeUnderTension = () => {
    const totalReps = calculateTotalReps();
    const avgTempoPerRep = 3; // Assume 3 seconds per rep average
    return totalReps * avgTempoPerRep;
  };

  // Get functional metrics
  const getFunctionalMetrics = () => {
    if (!isFunctionalSession) return null;
    const functionalMetrics = (sessionFeedback as any).functionalMetrics;

    // GUARD: Check if functionalMetrics exists and has valid data
    if (!functionalMetrics || typeof functionalMetrics !== 'object') {
      logger.warn('PERSONALIZED_METRICS_CALC', 'No valid functionalMetrics');
      return null;
    }

    return {
      wodFormat: functionalMetrics?.wodFormat || 'AMRAP',
      roundsCompleted: typeof functionalMetrics.roundsCompleted === 'number' ? functionalMetrics.roundsCompleted : 0,
      totalReps: typeof functionalMetrics.totalReps === 'number' ? functionalMetrics.totalReps : 0,
      timeCapReached: !!functionalMetrics.timeCapReached,
      wodName: functionalMetrics?.wodName
    };
  };

  const functionalMetrics = getFunctionalMetrics();

  const caloriesBurned = calculateCaloriesBurned();
  const totalVolume = calculateTotalVolume();
  const totalReps = calculateTotalReps();
  const workRestRatio = calculateWorkRestRatio();
  const avgIntensity = calculateAverageIntensity();
  const timeUnderTension = calculateTimeUnderTension();

  const formatTime = (seconds: number) => {
    // GUARD: Check if seconds is valid
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      logger.warn('PERSONALIZED_METRICS_CALC', 'Invalid seconds for formatTime', { seconds });
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const warmupStatus = sessionFeedback.warmupCompleted
    ? `Échauffement: ${sessionFeedback.warmupDuration || 0}min`
    : 'Échauffement: Non effectué';

  // Endurance-specific metrics
  const formatDuration = (seconds: number) => {
    // GUARD: Check if seconds is valid
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      logger.warn('PERSONALIZED_METRICS_CALC', 'Invalid seconds for formatDuration', { seconds });
      return '0:00';
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFunctionalSession && functionalMetrics) {
    // Functional WOD session view
    const avgRPE = sessionFeedback.overallRpe || 8;
    const durationMinutes = (sessionFeedback.durationActual || 0) / 60;
    const estimatedCalories = Math.round(durationMinutes * 10 * (1 + avgRPE / 10));

    return (
      <GlassCard
        className="space-y-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Hero Metric - Rounds/Time */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center py-6 mb-6"
          style={{
            background: `
              radial-gradient(circle at 50% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
              rgba(255, 255, 255, 0.05)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
            borderRadius: '16px',
            boxShadow: `0 4px 20px color-mix(in srgb, ${stepColor} 20%, transparent)`,
          }}
        >
          <div className="flex justify-center mb-3">
            <GlowIcon
              icon="Zap"
              color={stepColor}
              size="xl"
              glowIntensity={60}
              animate={true}
              iconSizeOverride={105}
            />
          </div>
          <motion.div className="text-6xl font-bold text-white mb-2" style={{ letterSpacing: '-0.04em' }}>
            {functionalMetrics.roundsCompleted}
          </motion.div>
          <div className="text-lg font-semibold uppercase tracking-wider" style={{ color: stepColor }}>
            Rounds Complétés {functionalMetrics.wodFormat === 'amrap' ? '🔥' : '⚡'}
          </div>
          {functionalMetrics.wodName && (
            <div className="text-sm text-white/60 mt-2">
              WOD: {functionalMetrics.wodName}
            </div>
          )}
        </motion.div>

        {/* RPE moyen - Hero Metric Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div
            className="p-6 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, #EAB308 20%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `2px solid color-mix(in srgb, #EAB308 30%, transparent)`,
              boxShadow: `0 4px 20px color-mix(in srgb, #EAB308 25%, transparent)`,
            }}
          >
            <div className="flex justify-center mb-4">
              <GlowIcon
                icon="Activity"
                color="#EAB308"
                size="xl"
                glowIntensity={60}
                animate={true}
                iconSizeOverride={48}
              />
            </div>
            <div
              className="text-6xl font-bold text-white text-center mb-2"
              style={{
                letterSpacing: '-0.03em',
                textShadow: '0 0 32px rgba(234, 179, 8, 0.6)'
              }}
            >
              {avgRPE.toFixed(1)}/10
            </div>
            <div className="text-lg font-semibold text-center uppercase tracking-wider" style={{ color: '#EAB308' }}>
              RPE Moyen
            </div>
          </div>
        </motion.div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="p-5 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 30%, color-mix(in srgb, #3B82F6 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, #3B82F6 25%, transparent)`,
                boxShadow: `0 4px 20px color-mix(in srgb, #3B82F6 20%, transparent)`,
              }}
            >
              <div className="flex justify-center mb-3">
                <GlowIcon
                  icon="Clock"
                  color="#3B82F6"
                  size="medium"
                  glowIntensity={50}
                  animate={true}
                  iconSizeOverride={32}
                />
              </div>
              <div
                className="text-4xl font-bold text-white text-center mb-2"
                style={{
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 32px rgba(59, 130, 246, 0.6)'
                }}
              >
                {formatDuration(sessionFeedback.durationActual)}
              </div>
              <div className="text-sm text-white/70 font-semibold text-center uppercase tracking-wider">Durée</div>
            </div>
          </motion.div>

          {/* Calories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div
              className="p-5 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 30%, color-mix(in srgb, #EF4444 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, #EF4444 25%, transparent)`,
                boxShadow: `0 4px 20px color-mix(in srgb, #EF4444 20%, transparent)`,
              }}
            >
              <div className="flex justify-center mb-3">
                <GlowIcon
                  icon="Flame"
                  color="#EF4444"
                  size="medium"
                  glowIntensity={50}
                  animate={true}
                  iconSizeOverride={32}
                />
              </div>
              <div
                className="text-4xl font-bold text-white text-center mb-2"
                style={{
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 32px rgba(239, 68, 68, 0.6)'
                }}
              >
                {estimatedCalories}
              </div>
              <div className="text-sm text-white/70 font-semibold text-center uppercase tracking-wider">Calories</div>
            </div>
          </motion.div>
        </div>

        {/* WOD Format Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <GlassCard
            className="p-5"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
              boxShadow: `
                0 4px 20px rgba(0, 0, 0, 0.2),
                0 0 32px color-mix(in srgb, ${stepColor} 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <SpatialIcon Icon={ICONS.Info} size={16} style={{ color: stepColor }} />
                Format WOD
              </h4>
            </div>
            <div className="text-white/90 text-sm leading-relaxed">
              Format: <span className="font-bold">{functionalMetrics.wodFormat.toUpperCase()}</span>
              {functionalMetrics.timeCapReached && (
                <div className="mt-2 text-amber-400 text-xs">
                  ⏱️ Time cap atteint
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </GlassCard>
    );
  }

  if (isEnduranceSession) {
    // Endurance session view
    const totalDuration = aiAnalysis?.sessionAnalysis?.volumeAnalysis?.totalVolume || sessionFeedback.durationActual || 0;
    const avgRPE = aiAnalysis?.sessionAnalysis?.intensityAnalysis?.avgRPE || sessionFeedback.overallRpe || 7;
    const durationMinutes = totalDuration / 60;
    const estimatedCalories = Math.round(durationMinutes * 8 * (1 + avgRPE / 10)); // ~8 cal/min base

    return (
      <GlassCard
        className="space-y-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Hero Metric - Duration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center py-6 mb-6"
          style={{
            background: `
              radial-gradient(circle at 50% 30%, color-mix(in srgb, #3B82F6 15%, transparent) 0%, transparent 70%),
              rgba(255, 255, 255, 0.05)
            `,
            border: `2px solid color-mix(in srgb, #3B82F6 25%, transparent)`,
            borderRadius: '16px',
            boxShadow: `0 4px 20px color-mix(in srgb, #3B82F6 20%, transparent)`,
          }}
        >
          <div className="flex justify-center mb-3">
            <GlowIcon
              icon="Timer"
              color="#3B82F6"
              size="xl"
              glowIntensity={60}
              animate={true}
              iconSizeOverride={105}
            />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          >
            <div
              className="text-6xl font-bold text-white mb-2"
              style={{
                letterSpacing: '-0.02em',
                textShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
              }}
            >
              {formatDuration(totalDuration)}
            </div>
            <div className="text-lg font-semibold uppercase tracking-wider" style={{ color: '#3B82F6' }}>
              Durée Totale ⏱️
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Calories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className="p-5 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 30%, color-mix(in srgb, #EF4444 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, #EF4444 25%, transparent)`,
                boxShadow: `0 4px 20px color-mix(in srgb, #EF4444 20%, transparent)`,
              }}
            >
              <div className="flex justify-center mb-3">
                <GlowIcon
                  icon="Flame"
                  color="#EF4444"
                  size="medium"
                  glowIntensity={50}
                  animate={true}
                  iconSizeOverride={32}
                />
              </div>
              <div
                className="text-5xl font-bold text-white text-center mb-2"
                style={{
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 32px rgba(239, 68, 68, 0.6)'
                }}
              >
                {estimatedCalories}
              </div>
              <div className="text-sm text-white/70 font-semibold text-center uppercase tracking-wider">Calories</div>
            </div>
          </motion.div>

          {/* RPE moyen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="p-5 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 30%, color-mix(in srgb, #EAB308 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, #EAB308 25%, transparent)`,
                boxShadow: `0 4px 20px color-mix(in srgb, #EAB308 20%, transparent)`,
              }}
            >
              <div className="flex justify-center mb-3">
                <GlowIcon
                  icon="Activity"
                  color="#EAB308"
                  size="medium"
                  glowIntensity={50}
                  animate={true}
                  iconSizeOverride={32}
                />
              </div>
              <div
                className="text-5xl font-bold text-white text-center mb-2"
                style={{
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 32px rgba(234, 179, 8, 0.6)'
                }}
              >
                {avgRPE.toFixed(1)}/10
              </div>
              <div className="text-sm text-white/70 font-semibold text-center uppercase tracking-wider">RPE Moyen</div>
            </div>
          </motion.div>

        </div>

        {/* Zones cardiaques - Full width with rich visual design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <GlassCard
            className="p-5"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 60%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '2px solid rgba(168, 85, 247, 0.3)',
              boxShadow: `
                0 4px 20px rgba(0, 0, 0, 0.2),
                0 0 32px rgba(168, 85, 247, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1.5px solid rgba(168, 85, 247, 0.4)',
                }}
              >
                <SpatialIcon Icon={ICONS.Heart} size={22} style={{ color: '#A855F7', filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' }} />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-base">Distribution des Zones Cardiaques</h4>
                <p className="text-white/60 text-xs">Intensité et endurance</p>
              </div>
            </div>

            <div className="space-y-3">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-medium">Zone Principale</span>
                  <span className="text-[#A855F7] text-xl font-bold">
                    {aiAnalysis?.sessionAnalysis?.intensityAnalysis?.intensityZones || 'Zone 2-3'}
                  </span>
                </div>
                <div className="text-white/60 text-xs leading-relaxed">
                  {aiAnalysis?.sessionAnalysis?.intensityAnalysis?.intensityZones?.includes('Z2')
                    ? 'Endurance aérobie - Développement de la base cardio et amélioration de l\'efficacité métabolique.'
                    : aiAnalysis?.sessionAnalysis?.intensityAnalysis?.intensityZones?.includes('Z3')
                    ? 'Tempo soutenu - Amélioration du seuil lactique et de la puissance aérobie.'
                    : aiAnalysis?.sessionAnalysis?.intensityAnalysis?.intensityZones?.includes('Z4')
                    ? 'Haute intensité - Développement de la VO2max et capacité anaérobie.'
                    : 'Zones mixtes - Travail varié combinant endurance et intensité pour un développement complet.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="text-xs text-white/50 mb-1">Temps Actif</div>
                  <div className="text-white font-bold text-sm">
                    {Math.floor((totalDuration * 0.85) / 60)}min
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="text-xs text-white/50 mb-1">Récupération</div>
                  <div className="text-white font-bold text-sm">
                    {Math.floor((totalDuration * 0.15) / 60)}min
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </GlassCard>
    );
  }

  // Force session view (original)
  return (
    <GlassCard
      className="space-y-6"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.2),
          0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      {/* Hero Metric - Calories Burned */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center py-6 mb-6"
        style={{
          background: `
            radial-gradient(circle at 50% 30%, color-mix(in srgb, #EF4444 15%, transparent) 0%, transparent 70%),
            rgba(255, 255, 255, 0.05)
          `,
          border: `2px solid color-mix(in srgb, #EF4444 25%, transparent)`,
          borderRadius: '16px',
          boxShadow: `0 4px 20px color-mix(in srgb, #EF4444 20%, transparent)`,
        }}
      >
        <div className="flex justify-center mb-3">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <GlowIcon
              icon="Flame"
              color="#EF4444"
              size="xl"
              glowIntensity={60}
              animate={true}
              iconSizeOverride={105}
            />
          </motion.div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        >
          <div
            className="text-6xl font-bold text-white mb-2"
            style={{
              letterSpacing: '-0.02em',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
            }}
          >
            {caloriesBurned}
          </div>
          <div className="text-lg font-semibold uppercase tracking-wider" style={{ color: '#EF4444' }}>
            Calories Brûlées 🔥
          </div>
        </motion.div>
      </motion.div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, #8B5CF6 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1.5px solid color-mix(in srgb, #8B5CF6 20%, transparent)`,
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <div className="flex justify-center mb-2">
              <GlowIcon icon="Weight" color="#8B5CF6" size="small" glowIntensity={35} />
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="text-2xl font-bold text-white mb-1 text-center"
              style={{
                textShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
            </motion.div>
            <div className="text-xs text-white/60 font-medium text-center">Volume Total</div>
          </div>
        </motion.div>

        {/* Total Reps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, #10B981 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1.5px solid color-mix(in srgb, #10B981 20%, transparent)`,
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <div className="flex justify-center mb-2">
              <GlowIcon icon="Hash" color="#10B981" size="small" glowIntensity={35} />
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
              className="text-2xl font-bold text-white mb-1 text-center"
              style={{
                textShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              }}
            >
              {totalReps}
            </motion.div>
            <div className="text-xs text-white/60 font-medium text-center">Reps Totales</div>
          </div>
        </motion.div>

        {/* Time Under Tension */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, #F59E0B 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1.5px solid color-mix(in srgb, #F59E0B 20%, transparent)`,
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <div className="flex justify-center mb-2">
              <GlowIcon icon="Timer" color="#F59E0B" size="small" glowIntensity={35} />
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="text-2xl font-bold text-white mb-1 text-center"
              style={{
                textShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              }}
            >
              {formatTime(timeUnderTension)}
            </motion.div>
            <div className="text-xs text-white/60 font-medium text-center">TUT Total</div>
          </div>
        </motion.div>

        {/* Average Intensity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, #3B82F6 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1.5px solid color-mix(in srgb, #3B82F6 20%, transparent)`,
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <div className="flex justify-center mb-2">
              <GlowIcon icon="Zap" color="#3B82F6" size="small" glowIntensity={35} />
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
              className="text-2xl font-bold text-white mb-1 text-center"
              style={{
                textShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
              }}
            >
              {avgIntensity}%
            </motion.div>
            <div className="text-xs text-white/60 font-medium text-center">Intensité Moy.</div>
          </div>
        </motion.div>

        {/* Work/Rest Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <div className="flex justify-center mb-2">
              <GlowIcon icon="Activity" color={stepColor} size="small" glowIntensity={35} />
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              className="text-2xl font-bold text-white mb-1 text-center"
              style={{
                textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 40%, transparent)`,
              }}
            >
              {workRestRatio}:1
            </motion.div>
            <div className="text-xs text-white/60 font-medium text-center">Ratio Travail/Repos</div>
          </div>
        </motion.div>

        {/* RPE Average */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 50% 30%, color-mix(in srgb, #EC4899 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1.5px solid color-mix(in srgb, #EC4899 20%, transparent)`,
              boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <div className="flex justify-center mb-2">
              <GlowIcon icon="Target" color="#EC4899" size="small" glowIntensity={35} />
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
              className="text-2xl font-bold text-white mb-1 text-center"
              style={{
                textShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
              }}
            >
              {sessionFeedback.overallRpe}/10
            </motion.div>
            <div className="text-xs text-white/60 font-medium text-center">RPE Moyen</div>
          </div>
        </motion.div>
      </div>

      {/* Warmup Status Badge */}
      {sessionFeedback.warmupCompleted !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg"
          style={{
            background: sessionFeedback.warmupCompleted
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${sessionFeedback.warmupCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          }}
        >
          <SpatialIcon
            Icon={sessionFeedback.warmupCompleted ? ICONS.CheckCircle : ICONS.AlertCircle}
            size={16}
            style={{
              color: sessionFeedback.warmupCompleted ? '#10B981' : '#F59E0B'
            }}
          />
          <span
            className="text-sm font-medium"
            style={{
              color: sessionFeedback.warmupCompleted ? '#10B981' : '#F59E0B'
            }}
          >
            {warmupStatus}
          </span>
        </motion.div>
      )}
    </GlassCard>
  );
};

export default PersonalizedMetricsCard;
