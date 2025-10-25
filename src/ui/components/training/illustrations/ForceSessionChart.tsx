import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';

interface ForceSessionChartData {
  exercises: Exercise[];
  sessionName?: string;
  category?: string;
  totalDuration: number;
}

interface ForceSessionChartProps {
  data: ForceSessionChartData;
  onExerciseClick?: (exerciseId: string) => void;
  className?: string;
}

const FORCE_COLOR = '#3B82F6';

const RPE_COLORS = {
  high: '#EF4444',
  moderate: '#F59E0B',
  low: '#22C55E',
  none: '#64748B'
};

const getRpeIntensity = (rpe?: number): keyof typeof RPE_COLORS => {
  if (!rpe) return 'none';
  if (rpe >= 9) return 'high';
  if (rpe >= 7) return 'moderate';
  return 'low';
};

const getLoadDisplay = (load?: number | number[]): string => {
  if (!load) return 'PDC';
  if (Array.isArray(load)) {
    return `${Math.min(...load)}-${Math.max(...load)}kg`;
  }
  return `${load}kg`;
};

const getExerciseVolume = (exercise: Exercise): number => {
  return exercise.sets * exercise.reps;
};

export function ForceSessionChart({
  data,
  onExerciseClick,
  className = ''
}: ForceSessionChartProps) {
  const maxVolume = Math.max(...data.exercises.map(getExerciseVolume));
  const totalExercises = data.exercises.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full max-w-full ${className}`}
    >
      <GlassCard
        className="p-6 md:p-8 space-y-6 w-full"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${FORCE_COLOR} 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `2px solid color-mix(in srgb, ${FORCE_COLOR} 25%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '24px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.3),
            0 0 30px color-mix(in srgb, ${FORCE_COLOR} 15%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${FORCE_COLOR} 40%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${FORCE_COLOR} 50%, transparent)`,
              boxShadow: `0 6px 24px color-mix(in srgb, ${FORCE_COLOR} 35%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.Dumbbell}
              size={24}
              variant="pure"
              style={{
                color: FORCE_COLOR,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${FORCE_COLOR} 60%, transparent))`
              }}
            />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg md:text-xl font-bold mb-1"
              style={{
                color: 'white',
                letterSpacing: '-0.02em'
              }}
            >
              Vue d'ensemble des exercices
            </h3>
            <div className="text-xs md:text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {data.category || 'Force & Powerbuilding'} • {totalExercises} exercice{totalExercises > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Summary Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <div
            className="p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${FORCE_COLOR} 25%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `2px solid color-mix(in srgb, ${FORCE_COLOR} 35%, transparent)`,
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 8px 24px color-mix(in srgb, ${FORCE_COLOR} 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.TrendingUp} size={18} style={{ color: FORCE_COLOR }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Volume Total
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              {data.exercises.reduce((sum, ex) => sum + getExerciseVolume(ex), 0)}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: FORCE_COLOR }}>
              reps totales
            </div>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, #10B981 25%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `2px solid color-mix(in srgb, #10B981 35%, transparent)`,
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 8px 24px color-mix(in srgb, #10B981 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Clock} size={18} style={{ color: '#10B981' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Durée
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              ~{data.totalDuration}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: '#10B981' }}>
              minutes
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="p-4 rounded-xl mb-4"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <SpatialIcon Icon={ICONS.Info} size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Légende
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Layers} size={14} style={{ color: FORCE_COLOR }} />
              <span className="text-xs text-white/80">Séries × Reps</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Weight} size={14} style={{ color: FORCE_COLOR }} />
              <span className="text-xs text-white/80">Charge (kg)</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Clock} size={14} style={{ color: FORCE_COLOR }} />
              <span className="text-xs text-white/80">Repos (secondes)</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Zap} size={14} style={{ color: '#F59E0B' }} />
              <span className="text-xs text-white/80">Intensité RPE</span>
            </div>
          </div>
        </motion.div>

        {/* Exercise List with Visual Bars */}
        <div className="space-y-4">
          {data.exercises.map((exercise, idx) => {
            const volume = getExerciseVolume(exercise);
            const volumePercent = (volume / maxVolume) * 100;
            const intensity = getRpeIntensity(exercise.rpeTarget);
            const intensityColor = RPE_COLORS[intensity];
            const loadDisplay = getLoadDisplay(exercise.load);

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                onClick={() => onExerciseClick?.(exercise.id)}
                className="cursor-pointer group"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${FORCE_COLOR} 20%, transparent)`,
                        border: `1.5px solid color-mix(in srgb, ${FORCE_COLOR} 40%, transparent)`
                      }}
                    >
                      <span
                        className="text-sm md:text-base font-bold"
                        style={{ color: FORCE_COLOR }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                        {exercise.name}
                      </h4>
                      {exercise.variant && (
                        <p className="text-xs text-white/60 truncate">{exercise.variant}</p>
                      )}
                    </div>
                  </div>

                  {/* RPE Badge */}
                  {exercise.rpeTarget && (
                    <div
                      className="px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${intensityColor} 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${intensityColor} 40%, transparent)`,
                        color: intensityColor
                      }}
                    >
                      RPE {exercise.rpeTarget}
                    </div>
                  )}
                </div>

                {/* Visual Volume Bar */}
                <div
                  className="h-16 md:h-20 rounded-xl overflow-hidden relative"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${volumePercent}%` }}
                    transition={{ delay: idx * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
                    className="h-full relative group-hover:brightness-110 transition-all"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 30%, ${intensityColor} 0%, color-mix(in srgb, ${intensityColor} 70%, #000) 100%)
                      `,
                      border: `1.5px solid color-mix(in srgb, ${intensityColor} 60%, transparent)`,
                      boxShadow: `
                        0 4px 16px color-mix(in srgb, ${intensityColor} 40%, transparent),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `
                    }}
                  >
                    {/* Exercise Details Overlay */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 md:px-4">
                      <div className="flex items-center gap-2 md:gap-4">
                        {/* Sets x Reps */}
                        <div className="flex items-center gap-1.5">
                          <SpatialIcon Icon={ICONS.Layers} size={14} variant="pure" style={{ color: 'white' }} />
                          <span className="text-xs md:text-sm font-bold text-white">
                            {exercise.sets} × {exercise.reps}
                          </span>
                        </div>

                        {/* Load */}
                        <div className="flex items-center gap-1.5">
                          <SpatialIcon Icon={ICONS.Weight} size={14} variant="pure" style={{ color: 'white' }} />
                          <span className="text-xs md:text-sm font-bold text-white">
                            {loadDisplay}
                          </span>
                        </div>
                      </div>

                      {/* Rest Time */}
                      <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                        <SpatialIcon Icon={ICONS.Clock} size={12} variant="pure" style={{ color: 'white' }} />
                        <span className="text-xs font-semibold text-white">
                          {exercise.rest}s
                        </span>
                      </div>
                    </div>

                    {/* Shimmer Effect */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)`
                      }}
                    />
                  </motion.div>
                </div>

                {/* Additional Info Row */}
                {(exercise.tempo || exercise.intensificationTechnique) && (
                  <div className="flex items-center gap-2 mt-2">
                    {exercise.tempo && (
                      <div
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        <SpatialIcon Icon={ICONS.Timer} size={10} variant="pure" style={{ display: 'inline', marginRight: '4px' }} />
                        Tempo {exercise.tempo}
                      </div>
                    )}
                    {exercise.intensificationTechnique && exercise.intensificationTechnique !== 'none' && (
                      <div
                        className="px-2 py-1 rounded-md text-xs font-bold"
                        style={{
                          background: `color-mix(in srgb, ${FORCE_COLOR} 15%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${FORCE_COLOR} 30%, transparent)`,
                          color: FORCE_COLOR
                        }}
                      >
                        <SpatialIcon Icon={ICONS.Zap} size={10} variant="pure" style={{ display: 'inline', marginRight: '4px' }} />
                        {exercise.intensificationTechnique.replace(/-/g, ' ').toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>


        {/* Interaction Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="text-xs text-white/50 font-medium flex items-center justify-center gap-1">
            <SpatialIcon Icon={ICONS.Info} size={12} variant="pure" />
            <span>Cliquez sur un exercice pour accéder aux détails</span>
          </div>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
