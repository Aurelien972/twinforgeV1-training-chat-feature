import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';

interface ZoneData {
  zone: string;
  duration: number;
  percentage: number;
}

interface EnduranceBlock {
  id: string;
  name: string;
  duration: number;
  targetZone: string;
  type: string;
  description?: string;
  intervals?: {
    repeats: number;
    work: { duration: number };
    rest?: { duration: number };
  };
}

interface EnduranceZonesData {
  chartType: 'zones';
  mainWorkout: EnduranceBlock[];
  warmup?: { duration: number; targetZone: string };
  cooldown?: { duration: number; targetZone: string };
  totalDuration: number;
  discipline: string;
  sessionName?: string;
  focusZones?: string[];
}

interface EnduranceZonesChartProps {
  data: EnduranceZonesData;
  className?: string;
}

const ZONE_COLORS: Record<string, string> = {
  'Z1': '#10b981',
  'Z2': '#3b82f6',
  'Z3': '#f59e0b',
  'Z4': '#ef4444',
  'Z5': '#dc2626'
};

const ZONE_LABELS: Record<string, string> = {
  'Z1': 'Récupération active',
  'Z2': 'Endurance de base',
  'Z3': 'Tempo / Seuil',
  'Z4': 'Lactate Threshold',
  'Z5': 'VO2 Max'
};

const getZoneColor = (zone: string): string => {
  const zoneKey = zone.toUpperCase().match(/Z[1-5]/)?.[0] || 'Z2';
  return ZONE_COLORS[zoneKey] || '#3b82f6';
};

const getZoneLabel = (zone: string): string => {
  const zoneKey = zone.toUpperCase().match(/Z[1-5]/)?.[0] || 'Z2';
  return ZONE_LABELS[zoneKey] || zone;
};

export function EnduranceZonesChart({
  data,
  className = ''
}: EnduranceZonesChartProps) {
  const ENDURANCE_COLOR = '#10B981';
  const totalBlocks = data.mainWorkout.length + (data.warmup ? 1 : 0) + (data.cooldown ? 1 : 0);
  const allBlocks = [
    ...(data.warmup ? [{ ...data.warmup, name: 'Échauffement', type: 'warmup' }] : []),
    ...data.mainWorkout,
    ...(data.cooldown ? [{ ...data.cooldown, name: 'Retour au calme', type: 'cooldown' }] : [])
  ];

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
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${ENDURANCE_COLOR} 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `2px solid color-mix(in srgb, ${ENDURANCE_COLOR} 25%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '24px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.3),
            0 0 30px color-mix(in srgb, ${ENDURANCE_COLOR} 15%, transparent),
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
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${ENDURANCE_COLOR} 40%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${ENDURANCE_COLOR} 50%, transparent)`,
              boxShadow: `0 6px 24px color-mix(in srgb, ${ENDURANCE_COLOR} 35%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.Heart}
              size={24}
              variant="pure"
              style={{
                color: ENDURANCE_COLOR,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${ENDURANCE_COLOR} 60%, transparent))`
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
              Vue d'ensemble des blocs
            </h3>
            <p className="text-xs md:text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {data.sessionName || data.discipline.charAt(0).toUpperCase() + data.discipline.slice(1)} • {totalBlocks} bloc{totalBlocks > 1 ? 's' : ''}
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
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${ENDURANCE_COLOR} 25%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `2px solid color-mix(in srgb, ${ENDURANCE_COLOR} 35%, transparent)`,
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 8px 24px color-mix(in srgb, ${ENDURANCE_COLOR} 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Clock} size={18} style={{ color: ENDURANCE_COLOR }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Durée Totale
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              {data.totalDuration}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: ENDURANCE_COLOR }}>
              minutes
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
              <SpatialIcon Icon={ICONS.Activity} size={18} style={{ color: '#F59E0B' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Zones Focus
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              {data.focusZones?.join(', ') || 'Z2-Z3'}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: '#F59E0B' }}>
              zones cardio
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
              Légende des Zones Cardio
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(ZONE_COLORS).map(([zone, color]) => (
              <div key={zone} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 8px ${color}40`
                  }}
                />
                <span className="text-xs text-white/80">{zone}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Blocks Timeline */}
        <div className="space-y-4">
          {allBlocks.map((block, idx) => {
            const color = getZoneColor(block.targetZone);
            const isWarmupOrCooldown = block.type === 'warmup' || block.type === 'cooldown';

            return (
              <motion.div
                key={`${block.type}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isWarmupOrCooldown
                          ? `color-mix(in srgb, ${color} 20%, transparent)`
                          : `linear-gradient(135deg, color-mix(in srgb, ${ENDURANCE_COLOR} 30%, transparent), color-mix(in srgb, ${ENDURANCE_COLOR} 20%, transparent))`,
                        border: `1.5px solid color-mix(in srgb, ${isWarmupOrCooldown ? color : ENDURANCE_COLOR} 40%, transparent)`
                      }}
                    >
                      {isWarmupOrCooldown ? (
                        <SpatialIcon
                          Icon={block.type === 'warmup' ? ICONS.Flame : ICONS.Wind}
                          size={16}
                          style={{ color }}
                        />
                      ) : (
                        <span
                          className="text-sm md:text-base font-bold"
                          style={{ color: ENDURANCE_COLOR }}
                        >
                          {idx - (data.warmup ? 1 : 0) + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-white truncate">
                        {block.name}
                      </h4>
                      {block.description && (
                        <p className="text-xs text-white/60 truncate">{block.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Zone Badge */}
                  <div
                    className="px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                      color
                    }}
                  >
                    {block.targetZone}
                  </div>
                </div>

                {/* Visual Duration Bar */}
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
                    {/* Block Details Overlay */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 md:px-4">
                      <div className="flex items-center gap-2 md:gap-4">
                        {/* Duration */}
                        <div className="flex items-center gap-1.5">
                          <SpatialIcon Icon={ICONS.Clock} size={14} variant="pure" style={{ color: 'white' }} />
                          <span className="text-xs md:text-sm font-bold text-white">
                            {block.duration} min
                          </span>
                        </div>

                        {/* Intervals if present */}
                        {block.intervals && (
                          <div className="flex items-center gap-1.5">
                            <SpatialIcon Icon={ICONS.Repeat} size={14} variant="pure" style={{ color: 'white' }} />
                            <span className="text-xs md:text-sm font-bold text-white">
                              {block.intervals.repeats} × {block.intervals.work.duration}min
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Zone Label */}
                      <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-lg">
                        <span className="text-xs font-semibold text-white">
                          {getZoneLabel(block.targetZone)}
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

                {/* Block Type Badge */}
                {block.type && !isWarmupOrCooldown && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="px-2 py-1 rounded-md text-xs font-medium"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      {block.type === 'interval' ? '⚡ Intervalles' : block.type === 'steady' ? '📊 Continu' : block.type}
                    </div>
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
          <p className="text-xs text-white/50 font-medium">
            <SpatialIcon Icon={ICONS.Info} size={12} variant="pure" style={{ display: 'inline', marginRight: '4px' }} />
            Les zones cardio s'adaptent automatiquement à votre FC max
          </p>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
