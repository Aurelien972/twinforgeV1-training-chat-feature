/**
 * ExerciseSessionCard Optimized
 * Pure CSS animations, 60fps guaranteed on mobile
 * Simplified visual effects, maximum performance
 */

import React, { useState, useCallback, memo } from 'react';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';
import { useDeviceCapability } from '../../../../lib/device/deviceCapabilityManager';
import { getLoadForSet, formatLoadDisplay, isRampingSet, getInitialLoad } from '../../../../utils/loadUtils';

type ExerciseState = 'active' | 'rest' | 'feedback';

interface ExerciseSessionCardProps {
  exercise: Exercise;
  stepColor: string;
  currentSet: number;
  onSetComplete: () => void;
  onExerciseComplete: (rpe: number) => void;
  onAdjustLoad: (newLoad: number) => void;
  onSkipRest: () => void;
  restTimeRemaining: number;
  isResting: boolean;
  onFeedbackStateEntered?: () => void;
}

const ExerciseSessionCardOptimized: React.FC<ExerciseSessionCardProps> = memo(({
  exercise,
  stepColor,
  currentSet,
  onSetComplete,
  onExerciseComplete,
  onAdjustLoad,
  onSkipRest,
  restTimeRemaining,
  isResting,
  onFeedbackStateEntered,
}) => {
  const [exerciseState, setExerciseState] = useState<ExerciseState>('active');
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [tempLoad, setTempLoad] = useState(getInitialLoad(exercise.load));
  const [showCoachDetails, setShowCoachDetails] = useState(false);

  const { config, canUseEffect } = useDeviceCapability();
  const isLastSet = currentSet >= exercise.sets;
  const currentLoad = getLoadForSet(exercise.load, currentSet);
  const hasLoad = currentLoad !== null;

  const handleSetComplete = useCallback(() => {
    if (isLastSet) {
      setExerciseState('feedback');
      if (onFeedbackStateEntered) {
        setTimeout(onFeedbackStateEntered, 100);
      }
    } else {
      onSetComplete();
    }
  }, [isLastSet, onSetComplete, onFeedbackStateEntered]);

  const handleRpeSubmit = useCallback(() => {
    if (selectedRpe !== null) {
      onExerciseComplete(selectedRpe);
    }
  }, [selectedRpe, onExerciseComplete]);

  const handleLoadAdjust = useCallback((delta: number) => {
    const currentLoadValue = getLoadForSet(exercise.load, currentSet) || tempLoad;
    const newLoad = Math.max(0, currentLoadValue + delta);
    setTempLoad(newLoad);
  }, [exercise.load, currentSet, tempLoad]);

  const handleLoadConfirm = useCallback(() => {
    onAdjustLoad(tempLoad);
  }, [tempLoad, onAdjustLoad]);

  const formatRestTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  }, []);

  // Active State - During Set Execution
  if (exerciseState === 'active' && !isResting) {
    return (
      <div className="exercise-card-active animate-scaleIn">
        <GlassCard
          className="p-4 sm:p-5 text-center relative"
          style={{
            marginBottom: '16px',
            background: `
              radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
              var(--liquid-glass-bg-elevated)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 50%, rgba(255, 255, 255, 0.2))`,
            boxShadow: `
              0 12px 48px rgba(0, 0, 0, 0.4),
              0 0 40px color-mix(in srgb, ${stepColor} 35%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            color: stepColor,
          }}
        >
          <div className="space-y-4 py-4">
            {/* Exercise Icon & Name */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, color-mix(in srgb, ${stepColor} 30%, transparent) 0%, transparent 70%)`,
                  border: `2px solid color-mix(in srgb, ${stepColor} 50%, rgba(255, 255, 255, 0.3))`,
                }}
              >
                <SpatialIcon
                  Icon={ICONS.Dumbbell}
                  size={40}
                  style={{
                    color: stepColor,
                    filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 60%, transparent))`,
                  }}
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{exercise.name}</h3>
                {exercise.variant && (
                  <p className="text-white/60 text-sm">{exercise.variant}</p>
                )}
              </div>
            </div>

            {/* Set Counter */}
            <div className="flex items-center justify-center gap-2 py-3">
              <span className="text-white/60 text-lg">Série</span>
              <span className="text-5xl font-bold text-white" style={{ textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 50%, transparent)` }}>
                {currentSet}
              </span>
              <span className="text-white/60 text-lg">/ {exercise.sets}</span>
            </div>

            {/* Reps & Load */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-white/60 text-sm mb-1">Répétitions</div>
                <div className="text-3xl font-bold text-white">{exercise.reps}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-white/60 text-sm mb-1">Charge</div>
                <div className="text-3xl font-bold text-white">{formatLoadDisplay(exercise.load, currentSet)}</div>
                {isRampingSet(exercise.load) && (
                  <div className="text-[9px] text-white/50 mt-1">Série progressive</div>
                )}
              </div>
            </div>

            {/* Complete Set Button */}
            <button
              onClick={handleSetComplete}
              className="w-full mt-6 py-4 rounded-xl font-bold text-lg button-press"
              style={{
                background: `linear-gradient(135deg, ${stepColor}, color-mix(in srgb, ${stepColor} 80%, #000))`,
                color: '#fff',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: `0 8px 24px color-mix(in srgb, ${stepColor} 40%, transparent)`,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <SpatialIcon Icon={ICONS.Check} size={24} />
                <span>{isLastSet ? 'Terminer l\'exercice' : 'Série terminée'}</span>
              </div>
            </button>

            {/* Adjust Load */}
            <button
              onClick={() => setShowCoachDetails(!showCoachDetails)}
              className="text-white/70 text-sm hover:text-white transition-colors"
            >
              Ajuster la charge
            </button>

            {showCoachDetails && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-slideInUp">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleLoadAdjust(-2.5)}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center button-press"
                  >
                    <SpatialIcon Icon={ICONS.Minus} size={20} />
                  </button>
                  <div className="text-2xl font-bold text-white">{tempLoad}kg</div>
                  <button
                    onClick={() => handleLoadAdjust(2.5)}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center button-press"
                  >
                    <SpatialIcon Icon={ICONS.Plus} size={20} />
                  </button>
                </div>
                <button
                  onClick={handleLoadConfirm}
                  className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium button-press"
                >
                  Confirmer
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  // Rest State
  if (isResting) {
    return (
      <div className="animate-scaleIn">
        <GlassCard
          className="p-6 text-center relative"
          style={{
            marginBottom: '16px',
            background: 'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.2) 0%, transparent 70%), var(--liquid-glass-bg)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <SpatialIcon Icon={ICONS.Timer} size={64} style={{ color: '#3B82F6', marginBottom: '16px' }} />
              <h3 className="text-xl font-semibold text-white mb-2">Repos</h3>
              <div className="text-6xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
                {formatRestTime(restTimeRemaining)}
              </div>
            </div>

            <button
              onClick={onSkipRest}
              className="w-full py-3 rounded-xl font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 button-press"
            >
              Passer le repos
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Feedback State - RPE Collection
  return (
    <div className="animate-scaleIn">
      <GlassCard
        className="p-6 text-center"
        style={{
          marginBottom: '16px',
          background: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 70%), var(--liquid-glass-bg)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <div className="space-y-6">
          <div>
            <SpatialIcon Icon={ICONS.Heart} size={56} style={{ color: '#10B981', margin: '0 auto 16px' }} />
            <h3 className="text-2xl font-bold text-white mb-2">Difficulté ressentie ?</h3>
            <p className="text-white/60">De 1 (facile) à 10 (maximum)</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
              <button
                key={rpe}
                onClick={() => setSelectedRpe(rpe)}
                className="aspect-square rounded-lg font-bold text-lg button-press"
                style={{
                  background: selectedRpe === rpe ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedRpe === rpe ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  border: '2px solid',
                  borderColor: selectedRpe === rpe ? '#10B981' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                {rpe}
              </button>
            ))}
          </div>

          <button
            onClick={handleRpeSubmit}
            disabled={selectedRpe === null}
            className="w-full py-4 rounded-xl font-bold text-lg button-press"
            style={{
              background: selectedRpe !== null ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              opacity: selectedRpe !== null ? 1 : 0.5,
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            Valider
          </button>
        </div>
      </GlassCard>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.exercise.id === nextProps.exercise.id &&
    prevProps.currentSet === nextProps.currentSet &&
    prevProps.isResting === nextProps.isResting &&
    prevProps.restTimeRemaining === nextProps.restTimeRemaining
  );
});

ExerciseSessionCardOptimized.displayName = 'ExerciseSessionCardOptimized';

export default ExerciseSessionCardOptimized;
