/**
 * Functional Prescription Card
 * Displays WOD details with format-specific information
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';
import ExerciseAlternativesModal from './ExerciseAlternativesModal';
import { RepDisplay } from '../shared/RepDisplay';
import { ExerciseIllustration, ExerciseIllustrationModal } from '../illustrations';
import { MuscleGroupsBadges, HelpCoachButton } from '../shared';

interface FunctionalPrescriptionCardProps {
  exercise: Exercise;
  stepColor: string;
  wodFormat?: string;
  wodName?: string;
  timeCapMinutes?: number;
  targetRounds?: string;
  className?: string;
  onExerciseUpdate?: (exerciseId: string, updates: Partial<Exercise>) => void;
  onRequestAlternatives?: (exercise: Exercise) => void;
  onRequestHelp?: (exerciseName: string, exerciseContext: any) => void;
  onExerciseRegenerate?: (exerciseId: string) => void;
  isRegenerating?: boolean;
}

const FunctionalPrescriptionCard: React.FC<FunctionalPrescriptionCardProps> = ({
  exercise,
  stepColor,
  wodFormat = 'forTime',
  wodName,
  timeCapMinutes,
  targetRounds,
  className = '',
  onExerciseUpdate,
  onRequestAlternatives,
  onRequestHelp,
  onExerciseRegenerate,
  isRegenerating = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [currentScaling, setCurrentScaling] = useState<'rx' | 'scaled' | 'foundations'>('rx');
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);
  const [illustrationModalOpen, setIllustrationModalOpen] = useState(false);

  const getWodFormatLabel = () => {
    switch (wodFormat.toLowerCase()) {
      case 'amrap': return 'AMRAP';
      case 'fortime': return 'For Time';
      case 'emom': return 'EMOM';
      case 'tabata': return 'Tabata';
      case 'chipper': return 'Chipper';
      case 'ladder': return 'Ladder';
      default: return wodFormat.toUpperCase();
    }
  };

  const getWodFormatColor = () => {
    switch (wodFormat.toLowerCase()) {
      case 'amrap': return '#10B981';
      case 'fortime': return '#F59E0B';
      case 'emom': return '#3B82F6';
      case 'tabata': return '#EF4444';
      case 'chipper': return '#8B5CF6';
      case 'ladder': return '#EC4899';
      default: return stepColor;
    }
  };

  const formatColor = getWodFormatColor();

  const handleRepsAdjustment = (delta: number) => {
    if (!onExerciseUpdate) return;

    // Parse current reps - handle both number and string formats
    let currentReps = 10; // default
    if (typeof exercise.reps === 'number') {
      currentReps = exercise.reps;
    } else if (typeof exercise.reps === 'string') {
      // For formats like "21-15-9", take the first number
      const match = exercise.reps.match(/\d+/);
      if (match) {
        currentReps = parseInt(match[0], 10);
      }
    }

    const newReps = Math.max(1, currentReps + delta);

    // Call onExerciseUpdate with exercise ID and updates object
    onExerciseUpdate(exercise.id, { reps: newReps });
  };

  const handleScalingChange = (level: 'rx' | 'scaled' | 'foundations') => {
    setCurrentScaling(level);
    if (onExerciseUpdate) {
      onExerciseUpdate(exercise.id, { currentScaling: level });
    }
  };

  const handleRequestAlternatives = () => {
    setShowAlternativesModal(true);
  };

  const handleSelectAlternative = (alternativeName: string) => {
    if (onRequestAlternatives) {
      onRequestAlternatives({ ...exercise, name: alternativeName });
    }
    setShowAlternativesModal(false);
  };

  const handleRequestHelp = () => {
    if (onRequestHelp) {
      onRequestHelp(exercise.name, {
        wodFormat,
        reps: exercise.reps,
        load: exercise.load,
        muscleGroups: exercise.muscleGroups,
        scalingOptions: exercise.scalingOptions
      });
    }
  };

  const handleRegenerateClick = () => {
    if (onExerciseRegenerate) {
      onExerciseRegenerate(exercise.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="functional-card-base"
    >
      <GlassCard
        className={`functional-prescription-card training-prescription-card space-y-5 ${className}`}
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, color-mix(in srgb, ${formatColor} 12%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `1.5px solid color-mix(in srgb, ${formatColor} 22%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.24),
            0 2px 8px rgba(0, 0, 0, 0.12),
            0 0 24px color-mix(in srgb, ${formatColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header with Illustration and WOD Format Badge */}
        <div className="space-y-4 mb-3">
          {/* Mobile: Vertical Stack | Desktop: Horizontal Layout */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Exercise Illustration - Centered on mobile, left on desktop */}
            <div className="flex justify-center md:justify-start">
              <ExerciseIllustration
                exerciseName={exercise.name}
                discipline="functional"
                muscleGroups={exercise.muscleGroups}
                equipment={exercise.equipment ? [exercise.equipment] : []}
                size="thumb"
                fallbackIcon="Zap"
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
                }}>
                  {exercise.name}
                </h3>
                {exercise.variant && (
                  <p className="text-sm text-white/70 font-medium break-words">{exercise.variant}</p>
                )}
                {wodName && (
                  <div className="mt-1 flex items-center justify-center md:justify-start gap-2">
                    <SpatialIcon
                      Icon={ICONS.Award}
                      size={14}
                      style={{ color: '#F59E0B' }}
                    />
                    <span className="text-xs text-amber-400 font-semibold">
                      Benchmark: {wodName}
                    </span>
                  </div>
                )}
              </div>

              {/* WOD Format Badge - Centered on mobile, right on desktop */}
              <div className="flex justify-center md:justify-end">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="functional-format-badge px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, ${formatColor} 25%, transparent) 0%, transparent 70%),
                      color-mix(in srgb, ${formatColor} 18%, rgba(255, 255, 255, 0.08))
                    `,
                    border: `1.5px solid color-mix(in srgb, ${formatColor} 35%, transparent)`,
                    color: formatColor,
                    textShadow: `0 0 12px color-mix(in srgb, ${formatColor} 50%, transparent)`,
                    boxShadow: `0 2px 8px color-mix(in srgb, ${formatColor} 20%, transparent)`
                  }}
                >
                  {getWodFormatLabel()}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Muscle Groups Section */}
        <MuscleGroupsBadges
          muscleGroups={exercise.muscleGroups}
          disciplineColor={formatColor}
          className="mb-4"
        />

        {/* WOD Name/Format Summary - Full Width Centered */}
        {wodFormat && (
          <div
            className="w-full p-5 rounded-2xl mb-4"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${formatColor} 18%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.09)
              `,
              border: `2px solid color-mix(in srgb, ${formatColor} 35%, rgba(255, 255, 255, 0.2))`,
              backdropFilter: 'blur(16px) saturate(160%)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.25),
                0 8px 24px color-mix(in srgb, ${formatColor} 25%, transparent)
              `
            }}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${formatColor} 30%, rgba(255, 255, 255, 0.12))`,
                    border: `2px solid color-mix(in srgb, ${formatColor} 50%, transparent)`,
                    boxShadow: `0 6px 20px color-mix(in srgb, ${formatColor} 35%, transparent)`
                  }}
                >
                  <SpatialIcon Icon={ICONS.Zap} size={28} style={{ color: formatColor }} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-0.5">
                    Format WOD
                  </div>
                  <div className="text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                    {getWodFormatLabel()}
                  </div>
                </div>
              </div>
              {timeCapMinutes && (
                <div className="w-full pt-3 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2">
                    <SpatialIcon Icon={ICONS.Clock} size={20} style={{ color: formatColor }} />
                    <div className="text-3xl font-bold" style={{ color: formatColor, letterSpacing: '-0.03em' }}>
                      {timeCapMinutes}
                    </div>
                    <div className="text-sm text-white/70 font-semibold">minutes</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WOD Parameters Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Reps with integrated adjusters */}
          {onExerciseUpdate ? (
            <div
              className="relative p-3 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 4px 12px rgba(0, 0, 0, 0.15)
                `,
                minHeight: '100px',
              }}
            >
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => handleRepsAdjustment(-1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <SpatialIcon Icon={ICONS.Minus} size={16} style={{ color: formatColor }} />
                </motion.button>

                <div className="flex-1">
                  <RepDisplay
                    reps={exercise.reps}
                    color={formatColor}
                    showBadge={true}
                    compact={true}
                  />
                </div>

                <motion.button
                  onClick={() => handleRepsAdjustment(1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <SpatialIcon Icon={ICONS.Plus} size={16} style={{ color: formatColor }} />
                </motion.button>
              </div>
            </div>
          ) : (
            <div
              className="relative p-3 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 4px 12px rgba(0, 0, 0, 0.15)
                `,
                minHeight: '100px',
              }}
            >
              <RepDisplay
                reps={exercise.reps}
                color={formatColor}
                showBadge={true}
                compact={false}
              />
            </div>
          )}

          {/* Load/Weight */}
          {exercise.load !== undefined && exercise.load !== null && (
            <div
              className="relative p-4 rounded-2xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 10%, color-mix(in srgb, ${formatColor} 18%, transparent) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${formatColor} 20%, rgba(255, 255, 255, 0.18))`,
                backdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 4px 12px rgba(0, 0, 0, 0.15)
                `
              }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                  {typeof exercise.load === 'number' ? exercise.load : 'PDC'}
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">
                  {typeof exercise.load === 'number' ? 'kg' : 'Poids de corps'}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* WOD Description */}
        {(wodFormat === 'amrap' || wodFormat === 'forTime') && (
          <div
            className="p-4 rounded-xl mt-4"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, ${formatColor} 8%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.05)
              `,
              border: `1px solid color-mix(in srgb, ${formatColor} 15%, rgba(255, 255, 255, 0.1))`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <SpatialIcon
                Icon={ICONS.Info}
                size={14}
                style={{ color: formatColor }}
              />
              <span className="text-xs text-white/60 font-bold uppercase tracking-wider">
                Description
              </span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {wodFormat === 'amrap' &&
                `Complétez autant de rounds que possible en ${timeCapMinutes} minutes. Comptez vos rounds pour suivre votre progression.`
              }
              {wodFormat === 'forTime' &&
                `Terminez tous les mouvements le plus rapidement possible. Time cap: ${timeCapMinutes} minutes.`
              }
            </p>
            {targetRounds && (
              <div className="mt-3 text-xs text-white/60">
                <span className="font-semibold">Objectif suggéré:</span> {targetRounds}
              </div>
            )}
          </div>
        )}

        {/* Alternatives Display - Full Width */}
        {exercise.substitutions && exercise.substitutions.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Alternatives
              </label>
              <SpatialIcon Icon={ICONS.RefreshCw} size={14} style={{ color: formatColor }} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {exercise.substitutions.slice(0, 3).map((alt: any, idx: number) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSelectAlternative(alt.name || alt)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full p-3 rounded-xl text-left"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 20%, color-mix(in srgb, ${formatColor} 8%, transparent) 0%, transparent 70%),
                      rgba(255, 255, 255, 0.06)
                    `,
                    border: `1px solid color-mix(in srgb, ${formatColor} 15%, rgba(255, 255, 255, 0.1))`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `color-mix(in srgb, ${formatColor} 15%, rgba(255, 255, 255, 0.08))`,
                          border: `1px solid color-mix(in srgb, ${formatColor} 25%, transparent)`,
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: formatColor }}>
                          {idx + 1}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {typeof alt === 'string' ? alt : alt.name}
                      </span>
                    </div>
                    <SpatialIcon
                      Icon={ICONS.ArrowRight}
                      size={14}
                      style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    />
                  </div>
                  {typeof alt === 'object' && alt.description && (
                    <p className="text-xs text-white/60 mt-1.5 ml-10">
                      {alt.description}
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Scaling and Adjustments Section */}
        {(onExerciseUpdate || onRequestAlternatives || onRequestHelp) && (
          <div className="space-y-3 mt-5">
            {/* Scaling Level Selector */}
            {exercise.scalingOptions && exercise.scalingOptions.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                  Niveau de Scaling
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['rx', 'scaled', 'foundations'].map((level) => {
                    const option = exercise.scalingOptions?.find((opt: any) => opt.level === level);
                    if (!option) return null;

                    const isActive = currentScaling === level;
                    return (
                      <motion.button
                        key={level}
                        onClick={() => handleScalingChange(level as any)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-center"
                        style={{
                          background: isActive
                            ? `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${formatColor} 25%, transparent) 0%, transparent 70%), rgba(255, 255, 255, 0.12)`
                            : 'rgba(255, 255, 255, 0.06)',
                          border: isActive
                            ? `2px solid ${formatColor}`
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          color: isActive ? formatColor : 'rgba(255, 255, 255, 0.7)',
                          boxShadow: isActive
                            ? `0 0 20px color-mix(in srgb, ${formatColor} 30%, transparent)`
                            : 'none',
                        }}
                      >
                        {level.toUpperCase()}
                      </motion.button>
                    );
                  })}
                </div>
                {currentScaling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-2 rounded-lg text-xs text-white/70"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {exercise.scalingOptions?.find((opt: any) => opt.level === currentScaling)?.description}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Coach Tips Section - Collapsible */}
        {(exercise.coachTips || exercise.coachNotes || exercise.executionCues) && (
          <div className="relative mt-5">
            <motion.button
              onClick={() => setExpanded(!expanded)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full rounded-xl flex items-center justify-between p-3"
              style={{
                background: expanded
                  ? `color-mix(in srgb, ${formatColor} 12%, rgba(255, 255, 255, 0.06))`
                  : 'rgba(255, 255, 255, 0.06)',
                border: expanded
                  ? `1.5px solid color-mix(in srgb, ${formatColor} 25%, transparent)`
                  : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center gap-2">
                <SpatialIcon
                  Icon={ICONS.MessageSquare}
                  size={16}
                  style={{ color: formatColor }}
                />
                <span className="text-xs font-semibold text-white/80">
                  Conseils du Coach
                </span>
              </div>
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <SpatialIcon
                  Icon={ICONS.ChevronDown}
                  size={16}
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {exercise.coachNotes && (
                      <div>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {exercise.coachNotes}
                        </p>
                      </div>
                    )}
                    {exercise.coachTips && exercise.coachTips.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                          Tips
                        </h5>
                        <ul className="space-y-1.5">
                          {exercise.coachTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                              <span style={{ color: formatColor }}>•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exercise.executionCues && exercise.executionCues.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                          Exécution
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {exercise.executionCues.map((cue, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-white/85"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                              }}
                            >
                              {cue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Help Coach Button */}
        {onRequestHelp && (
          <div className="mt-4">
            <HelpCoachButton
              onClick={handleRequestHelp}
              disciplineColor={formatColor}
            />
          </div>
        )}
      </GlassCard>

      {/* Alternatives Modal */}
      <ExerciseAlternativesModal
        isOpen={showAlternativesModal}
        onClose={() => setShowAlternativesModal(false)}
        exercise={exercise}
        alternatives={exercise.substitutions || []}
        onSelectAlternative={handleSelectAlternative}
        stepColor={formatColor}
      />

      {/* Illustration Modal */}
      <ExerciseIllustrationModal
        isOpen={illustrationModalOpen}
        onClose={() => setIllustrationModalOpen(false)}
        exerciseName={exercise.name}
        discipline="functional"
        muscleGroups={exercise.muscleGroups}
        equipment={exercise.equipment ? [exercise.equipment] : []}
      />
    </motion.div>
  );
};

export default FunctionalPrescriptionCard;
