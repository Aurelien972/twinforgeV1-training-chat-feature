import { motion } from 'framer-motion';
import { useRef } from 'react';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { useChartDimensions } from '../../../../hooks/useChartDimensions';

interface TimelineItem {
  name: string;
  duration: number;
  type: string;
}

interface FunctionalExercise {
  id: string;
  name: string;
  reps?: number | string;
  weight?: number;
  category?: string;
}

interface FunctionalTimelineData {
  chartType: 'timeline';
  exercises: FunctionalExercise[];
  wodFormat: string;
  wodName?: string;
  timeCapMinutes?: number;
  targetRounds?: number;
  sessionName?: string;
  category?: string;
}

interface FunctionalTimelineChartProps {
  data: FunctionalTimelineData;
  className?: string;
}

const PHASE_COLORS = {
  warmup: '#F59E0B',
  wod: '#DC2626',
  cooldown: '#10B981'
};

const PHASE_ICONS = {
  warmup: ICONS.Flame,
  wod: ICONS.Zap,
  cooldown: ICONS.Wind
};

export function FunctionalTimelineChart({
  data,
  className = ''
}: FunctionalTimelineChartProps) {
  const FUNCTIONAL_COLOR = '#8B5CF6';
  const totalExercises = data.exercises?.length || 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const dimensions = useChartDimensions(containerRef, {
    minHeight: 400,
    maxHeight: 1000,
    itemCount: totalExercises,
    itemHeight: 140,
    padding: {
      top: 80,
      bottom: 80,
      left: 24,
      right: 24
    }
  });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full max-w-full ${className}`}
    >
      <GlassCard
        className="p-6 md:p-8 space-y-6 w-full"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${FUNCTIONAL_COLOR} 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `2px solid color-mix(in srgb, ${FUNCTIONAL_COLOR} 25%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '24px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.3),
            0 0 30px color-mix(in srgb, ${FUNCTIONAL_COLOR} 15%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          maxWidth: '100%',
          overflowX: 'hidden',
          minHeight: `${dimensions.height}px`
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${FUNCTIONAL_COLOR} 40%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${FUNCTIONAL_COLOR} 50%, transparent)`,
              boxShadow: `0 6px 24px color-mix(in srgb, ${FUNCTIONAL_COLOR} 35%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.Zap}
              size={24}
              variant="pure"
              style={{
                color: FUNCTIONAL_COLOR,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${FUNCTIONAL_COLOR} 60%, transparent))`
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
              Vue d'ensemble du WOD
            </h3>
            <p className="text-xs md:text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {data.sessionName || data.category || 'Functional Training'} • {totalExercises} exercice{totalExercises > 1 ? 's' : ''}
            </p>
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
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${FUNCTIONAL_COLOR} 25%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `2px solid color-mix(in srgb, ${FUNCTIONAL_COLOR} 35%, transparent)`,
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 8px 24px color-mix(in srgb, ${FUNCTIONAL_COLOR} 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Target} size={18} style={{ color: FUNCTIONAL_COLOR }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Format WOD
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              {data.wodFormat}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: FUNCTIONAL_COLOR }}>
              {data.wodName || 'Challenge'}
            </div>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, #F59E0B 25%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `2px solid color-mix(in srgb, #F59E0B 35%, transparent)`,
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 8px 24px color-mix(in srgb, #F59E0B 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Clock} size={18} style={{ color: '#F59E0B' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {data.wodFormat === 'AMRAP' ? 'Time Cap' : data.targetRounds ? 'Rounds' : 'Durée'}
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              {data.timeCapMinutes || data.targetRounds || '~30'}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: '#F59E0B' }}>
              {data.wodFormat === 'AMRAP' ? 'minutes' : data.targetRounds ? 'rounds' : 'min'}
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Repeat} size={14} style={{ color: FUNCTIONAL_COLOR }} />
              <span className="text-xs text-white/80">Répétitions</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Weight} size={14} style={{ color: FUNCTIONAL_COLOR }} />
              <span className="text-xs text-white/80">Charge (kg)</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Zap} size={14} style={{ color: '#F59E0B' }} />
              <span className="text-xs text-white/80">Haute intensité</span>
            </div>
          </div>
        </motion.div>

        {/* Exercises List */}
        <div className="space-y-4">
          {data.exercises?.map((exercise, idx) => {
            const categoryColors: Record<string, string> = {
              'gymnastic': '#10b981',
              'weightlifting': '#3b82f6',
              'monostructural': '#f59e0b',
              'mixed': FUNCTIONAL_COLOR
            };
            const color = categoryColors[exercise.category || 'mixed'] || FUNCTIONAL_COLOR;

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, ${FUNCTIONAL_COLOR} 30%, transparent), color-mix(in srgb, ${FUNCTIONAL_COLOR} 20%, transparent))`,
                        border: `1.5px solid color-mix(in srgb, ${FUNCTIONAL_COLOR} 40%, transparent)`
                      }}
                    >
                      <span
                        className="text-sm md:text-base font-bold"
                        style={{ color: FUNCTIONAL_COLOR }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-white truncate">
                        {exercise.name}
                      </h4>
                      {exercise.category && (
                        <p className="text-xs text-white/60 truncate capitalize">{exercise.category}</p>
                      )}
                    </div>
                  </div>

                  {/* Category Badge */}
                  {exercise.category && (
                    <div
                      className="px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${color} 20%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                        color
                      }}
                    >
                      {exercise.category === 'gymnastic' && '🤸'}
                      {exercise.category === 'weightlifting' && '🏋️'}
                      {exercise.category === 'monostructural' && '🏃'}
                    </div>
                  )}
                </div>

                {/* Visual Exercise Bar */}
                <div
                  className="h-16 md:h-20 rounded-xl overflow-hidden relative"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: idx * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
                    className="h-full relative"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 30%, ${color} 0%, color-mix(in srgb, ${color} 70%, #000) 100%)
                      `,
                      border: `1.5px solid color-mix(in srgb, ${color} 60%, transparent)`,
                      boxShadow: `
                        0 4px 16px color-mix(in srgb, ${color} 40%, transparent),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `
                    }}
                  >
                    {/* Exercise Details Overlay */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 md:px-4">
                      <div className="flex items-center gap-2 md:gap-4">
                        {/* Reps */}
                        {exercise.reps && (
                          <div className="flex items-center gap-1.5">
                            <SpatialIcon Icon={ICONS.Repeat} size={14} variant="pure" style={{ color: 'white' }} />
                            <span className="text-xs md:text-sm font-bold text-white">
                              {exercise.reps}
                            </span>
                          </div>
                        )}

                        {/* Weight */}
                        {exercise.weight && (
                          <div className="flex items-center gap-1.5">
                            <SpatialIcon Icon={ICONS.Weight} size={14} variant="pure" style={{ color: 'white' }} />
                            <span className="text-xs md:text-sm font-bold text-white">
                              {exercise.weight}kg
                            </span>
                          </div>
                        )}
                      </div>

                      {/* WOD Format Badge */}
                      <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                        <SpatialIcon Icon={ICONS.Zap} size={12} variant="pure" style={{ color: 'white' }} />
                        <span className="text-xs font-semibold text-white">
                          {data.wodFormat}
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
          <p className="text-xs text-white/50 font-medium">
            <SpatialIcon Icon={ICONS.Info} size={12} variant="pure" style={{ display: 'inline', marginRight: '4px' }} />
            Enchainez les exercices selon le format {data.wodFormat}
          </p>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
