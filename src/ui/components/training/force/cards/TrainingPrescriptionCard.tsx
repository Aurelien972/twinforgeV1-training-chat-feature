/**
 * Training Prescription Card
 * Displays individual exercise details with feedback options
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { Exercise } from '../../../../../system/store/trainingPipeline/types';
import { exerciseProgressionService } from '../../../../../system/services/exerciseProgressionService';
import { step2NotificationService } from '../../../../../system/services/step2NotificationService';
import { getInitialLoad, getTopSet, isRampingSet, getLoadProgressionSummary } from '../../../../../utils/loadUtils';
import { Haptics } from '../../../../../utils/haptics';
import { ExerciseIllustration, ExerciseIllustrationModal } from '../../illustrations';
import { MuscleGroupsBadges, HelpCoachButton } from '../../shared';

interface TrainingPrescriptionCardProps {
  exercise: Exercise;
  stepColor: string;
  onExerciseUpdate: (exerciseId: string, updates: Partial<Exercise>) => void;
  onExerciseSubstitution?: (exerciseId: string, substitutionName: string) => void;
  onExerciseRegenerate?: (exerciseId: string) => void;
  onRequestHelp?: (exerciseName: string, exerciseContext: any) => void;
  isRegenerating?: boolean;
  className?: string;
}

const TrainingPrescriptionCard: React.FC<TrainingPrescriptionCardProps> = ({
  exercise,
  stepColor,
  onExerciseUpdate,
  onExerciseSubstitution,
  onExerciseRegenerate,
  onRequestHelp,
  isRegenerating = false,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [illustrationModalOpen, setIllustrationModalOpen] = useState(false);

  const handleSetsIncrease = () => {
    const result = exerciseProgressionService.increaseSets(exercise.sets);
    onExerciseUpdate(exercise.id, { sets: result.newValue as number });
    step2NotificationService.onSetsIncreased(exercise.name, result.newValue as number);
    Haptics.impact('light');
  };

  const handleSetsDecrease = () => {
    const result = exerciseProgressionService.decreaseSets(exercise.sets);
    onExerciseUpdate(exercise.id, { sets: result.newValue as number });
    step2NotificationService.onSetsDecreased(exercise.name, result.newValue as number);
    Haptics.impact('light');
  };

  const handleRepsIncrease = () => {
    const result = exerciseProgressionService.increaseReps(exercise.reps);
    onExerciseUpdate(exercise.id, { reps: result.newValue as number });
    step2NotificationService.onRepsIncreased(exercise.name, result.newValue as number);
    Haptics.impact('light');
  };

  const handleRepsDecrease = () => {
    const result = exerciseProgressionService.decreaseReps(exercise.reps);
    onExerciseUpdate(exercise.id, { reps: result.newValue as number });
    step2NotificationService.onRepsDecreased(exercise.name, result.newValue as number);
    Haptics.impact('light');
  };

  const handleLoadIncrease = () => {
    if (exercise.load === null || exercise.load === undefined) return;
    const result = exerciseProgressionService.increaseLoad(exercise.load);
    const oldLoadValue = typeof exercise.load === 'number' ? exercise.load : getTopSet(exercise.load);
    const newLoadValue = typeof result.newValue === 'number' ? result.newValue : getTopSet(result.newValue);
    onExerciseUpdate(exercise.id, { load: result.newValue });
    step2NotificationService.onLoadIncreased(exercise.name, oldLoadValue, newLoadValue);
    Haptics.impact('medium');
  };

  const handleLoadDecrease = () => {
    if (exercise.load === null || exercise.load === undefined) return;
    const result = exerciseProgressionService.decreaseLoad(exercise.load);
    const oldLoadValue = typeof exercise.load === 'number' ? exercise.load : getTopSet(exercise.load);
    const newLoadValue = typeof result.newValue === 'number' ? result.newValue : getTopSet(result.newValue);
    onExerciseUpdate(exercise.id, { load: result.newValue });
    step2NotificationService.onLoadDecreased(exercise.name, oldLoadValue, newLoadValue);
    Haptics.impact('medium');
  };

  const handleSubstitutionClick = (substitutionName: string) => {
    if (onExerciseSubstitution) {
      onExerciseSubstitution(exercise.id, substitutionName);
    }
    step2NotificationService.onAlternativeSelected(exercise.name, substitutionName);
    Haptics.success();
    setExpanded(false);
  };

  const handleRegenerateClick = () => {
    if (onExerciseRegenerate) {
      onExerciseRegenerate(exercise.id);
      Haptics.impact('medium');
    }
  };

  const getRpeColor = (rpe?: number) => {
    if (!rpe) return '#64748B';
    if (rpe >= 9) return '#EF4444';
    if (rpe >= 7) return '#F59E0B';
    return '#22C55E';
  };

  const getDifficultyBadge = (rpe?: number) => {
    if (!rpe) return { label: 'Modéré', color: '#64748B' };
    if (rpe >= 9) return { label: 'Très Intense', color: '#EF4444' };
    if (rpe >= 7) return { label: 'Intense', color: '#F59E0B' };
    return { label: 'Modéré', color: '#22C55E' };
  };

  const difficulty = getDifficultyBadge(exercise.rpeTarget);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        className={`training-prescription-card space-y-6 ${className}`}
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `1.5px solid color-mix(in srgb, ${stepColor} 22%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.24),
            0 2px 8px rgba(0, 0, 0, 0.12),
            0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header with Illustration */}
        <div className="space-y-4 mb-4">
          {/* Mobile: Vertical Stack | Desktop: Horizontal Layout */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Exercise Illustration - Centered on mobile, left on desktop */}
            <div className="flex justify-center md:justify-start">
              <ExerciseIllustration
                exerciseName={exercise.name}
                discipline="force"
                muscleGroups={exercise.muscleGroups}
                equipment={exercise.equipment ? [exercise.equipment] : []}
                size="thumb"
                onClick={() => setIllustrationModalOpen(true)}
                className="flex-shrink-0"
              />
            </div>

            {/* Title and Badge Container */}
            <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              {/* Title Section */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-2 md:mb-4 break-words" style={{
                  letterSpacing: '-0.02em',
                  lineHeight: '1.3',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>{exercise.name}</h3>
                {exercise.variant && (
                  <div
                    className="inline-block px-3 py-2 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <p className="text-sm text-white/80 font-medium">{exercise.variant}</p>
                  </div>
                )}
              </div>

              {/* RPE Badge - Centered on mobile, right on desktop */}
              <div className="flex justify-center md:justify-end">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  title={`Intensité RPE ${exercise.rpeTarget || 'Non spécifié'}`}
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, ${difficulty.color} 25%, transparent) 0%, transparent 70%),
                      color-mix(in srgb, ${difficulty.color} 18%, rgba(255, 255, 255, 0.08))
                    `,
                    border: `1.5px solid color-mix(in srgb, ${difficulty.color} 35%, transparent)`,
                    color: difficulty.color,
                    textShadow: `0 0 12px color-mix(in srgb, ${difficulty.color} 50%, transparent)`,
                    boxShadow: `0 2px 8px color-mix(in srgb, ${difficulty.color} 20%, transparent)`
                  }}
                >
                  {difficulty.label}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Muscle Groups Section */}
        <MuscleGroupsBadges
          muscleGroups={exercise.muscleGroups}
          disciplineColor={stepColor}
          className="mb-4"
        />

        {/* Main Details with +/- Controls - Responsive Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <motion.div
            className="relative p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 4px 12px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>{exercise.sets}</div>
              <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Séries</div>
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <motion.button
                onClick={handleSetsDecrease}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}
              >
                <SpatialIcon Icon={ICONS.Minus} size={14} />
              </motion.button>
              <motion.button
                onClick={handleSetsIncrease}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#22C55E'
                }}
              >
                <SpatialIcon Icon={ICONS.Plus} size={14} />
              </motion.button>
            </div>
          </motion.div>
          <motion.div
            className="relative p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 10%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 65%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `1.5px solid color-mix(in srgb, ${stepColor} 28%, rgba(255, 255, 255, 0.20))`,
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.22),
                0 0 20px color-mix(in srgb, ${stepColor} 15%, transparent),
                0 4px 12px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>{exercise.reps}</div>
              <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Reps</div>
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <motion.button
                onClick={handleRepsDecrease}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}
              >
                <SpatialIcon Icon={ICONS.Minus} size={14} />
              </motion.button>
              <motion.button
                onClick={handleRepsIncrease}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#22C55E'
                }}
              >
                <SpatialIcon Icon={ICONS.Plus} size={14} />
              </motion.button>
            </div>
          </motion.div>
          {(exercise.load !== undefined && exercise.load !== null) ? (
            <motion.div
              className="relative p-4 rounded-2xl exercise-load-cell"
              style={{
                background: `
                  radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 4px 12px rgba(0, 0, 0, 0.15)
                `
              }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                  {isRampingSet(exercise.load) ? `${getInitialLoad(exercise.load)}-${getTopSet(exercise.load)}kg` : `${exercise.load}kg`}
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">
                  {isRampingSet(exercise.load) ? 'Charge progressive' : 'Charge'}
                </div>
                {isRampingSet(exercise.load) && (
                  <div className="text-[9px] text-white/50 mt-1">{getLoadProgressionSummary(exercise.load)}</div>
                )}
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <motion.button
                  onClick={handleLoadDecrease}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444'
                  }}
                >
                  <SpatialIcon Icon={ICONS.Minus} size={14} />
                </motion.button>
                <motion.button
                  onClick={handleLoadIncrease}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#22C55E'
                  }}
                >
                  <SpatialIcon Icon={ICONS.Plus} size={14} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="text-center p-4 rounded-2xl cursor-pointer exercise-load-cell"
              style={{
                background: `
                  radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.12) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.18),
                  0 4px 12px rgba(0, 0, 0, 0.12)
                `
              }}
            >
              <div className="text-2xl font-bold text-white/85 mb-1">PDC</div>
              <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Poids corps</div>
            </motion.div>
          )}
        </div>

        {/* Subtle separator */}
        <div className="h-px mt-5 mb-4" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.12) 80%, transparent 100%)'
        }} />

        {/* Secondary Details - Improved spacing and readability */}
        <div className="flex items-center gap-2 flex-wrap md:gap-3">
          {exercise.tempo && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: 'rgba(255, 255, 255, 0.85)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <SpatialIcon Icon={ICONS.Timer} size={14} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              <span>Tempo {exercise.tempo}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: 'rgba(255, 255, 255, 0.85)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <SpatialIcon Icon={ICONS.Clock} size={14} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            <span>Repos {exercise.rest}s</span>
          </div>
          {exercise.rpeTarget && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${getRpeColor(exercise.rpeTarget)} 25%, transparent) 0%, transparent 70%),
                  color-mix(in srgb, ${getRpeColor(exercise.rpeTarget)} 15%, rgba(255, 255, 255, 0.10))
                `,
                border: `1.5px solid color-mix(in srgb, ${getRpeColor(exercise.rpeTarget)} 35%, transparent)`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: getRpeColor(exercise.rpeTarget),
                boxShadow: `
                  0 0 16px color-mix(in srgb, ${getRpeColor(exercise.rpeTarget)} 20%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.15)
                `
              }}
            >
              <SpatialIcon Icon={ICONS.Zap} size={14} />
              <span>RPE {exercise.rpeTarget}</span>
            </div>
          )}
        </div>

        {/* Subtle separator */}
        <div className="h-px mt-5 mb-4" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.12) 80%, transparent 100%)'
        }} />

        {/* Action Buttons Section */}
        <div className="mt-4 space-y-2">
          {/* Expandable Alternatives Section */}
          {((exercise.substitutions && exercise.substitutions.length > 0) || onExerciseRegenerate) && (
            <>
              <motion.button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium"
                title="Voir les alternatives et options de changement"
                style={{
                  background: `
                    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08) 0%, transparent 70%),
                    rgba(255, 255, 255, 0.04)
                  `,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
                whileHover={{ scale: 1.01, y: -1, borderColor: 'rgba(255, 255, 255, 0.15)' }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <span className="flex items-center gap-2">
                  <SpatialIcon Icon={ICONS.RefreshCw} size={14} />
                  Alternatives disponibles {exercise.substitutions && `(${exercise.substitutions.length})`}
                </span>
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SpatialIcon Icon={ICONS.ChevronDown} size={16} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-3 pb-2">
                      {/* Substitutions List */}
                      {exercise.substitutions && exercise.substitutions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {exercise.substitutions.map((sub, idx) => (
                            <motion.button
                              key={idx}
                              onClick={() => handleSubstitutionClick(sub)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer"
                              style={{
                                background: `
                                  radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 70%),
                                  rgba(255, 255, 255, 0.06)
                                `,
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                              }}
                            >
                              {sub}
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* Separator if both sections exist */}
                      {exercise.substitutions && exercise.substitutions.length > 0 && onExerciseRegenerate && (
                        <div className="h-px" style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.12) 80%, transparent 100%)'
                        }} />
                      )}

                      {/* Regenerate Button */}
                      {onExerciseRegenerate && (
                        <motion.button
                          onClick={handleRegenerateClick}
                          disabled={isRegenerating}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm"
                          whileHover={!isRegenerating ? { scale: 1.02, y: -1 } : {}}
                          whileTap={!isRegenerating ? { scale: 0.98 } : {}}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          style={{
                            background: isRegenerating
                              ? 'rgba(255, 255, 255, 0.04)'
                              : `
                                radial-gradient(circle at 50% 0%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
                                rgba(255, 255, 255, 0.06)
                              `,
                            border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.15))`,
                            backdropFilter: 'blur(10px)',
                            boxShadow: `
                              0 2px 8px rgba(0, 0, 0, 0.12),
                              0 0 20px color-mix(in srgb, ${stepColor} 10%, transparent),
                              inset 0 1px 0 rgba(255, 255, 255, 0.12)
                            `,
                            color: isRegenerating ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
                            cursor: isRegenerating ? 'not-allowed' : 'pointer',
                            opacity: isRegenerating ? 0.6 : 1
                          }}
                        >
                          <motion.div
                            animate={isRegenerating ? { rotate: 360 } : { rotate: 0 }}
                            transition={isRegenerating ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                          >
                            <SpatialIcon
                              Icon={ICONS.RefreshCw}
                              size={16}
                              style={{
                                color: stepColor,
                                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${stepColor} 40%, transparent))`
                              }}
                            />
                          </motion.div>
                          <span>{isRegenerating ? 'Génération...' : 'Changer d\'exercice'}</span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Help Coach Button */}
        {onRequestHelp && (
          <div className="mt-4">
            <HelpCoachButton
              onClick={() => onRequestHelp(exercise.name, {
                sets: exercise.sets,
                reps: exercise.reps,
                load: exercise.load,
                rpeTarget: exercise.rpeTarget,
                muscleGroups: exercise.muscleGroups
              })}
              disciplineColor={stepColor}
            />
          </div>
        )}
    </GlassCard>

      {/* Fullscreen Illustration Modal */}
      <ExerciseIllustrationModal
        isOpen={illustrationModalOpen}
        onClose={() => setIllustrationModalOpen(false)}
        exerciseName={exercise.name}
        discipline="force"
        muscleGroups={exercise.muscleGroups}
        equipment={exercise.equipment ? [exercise.equipment] : []}
      />
    </motion.div>
  );
};

export default TrainingPrescriptionCard;
