import { motion } from 'framer-motion';
import { useRef } from 'react';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { useChartDimensions } from '../../../../hooks/useChartDimensions';

interface StationData {
  id: string;
  name: string;
  order: number;
  exercises: Array<{
    name: string;
    reps?: number | string;
    distance?: string;
  }>;
  type?: string;
}

interface CompetitionsCircuitData {
  chartType: 'circuit';
  stations: StationData[];
  competitionFormat: string;
  sessionName?: string;
  estimatedDuration?: number;
  category?: string;
}

interface CompetitionsCircuitChartProps {
  data: CompetitionsCircuitData;
  className?: string;
}

export function CompetitionsCircuitChart({
  data,
  className = ''
}: CompetitionsCircuitChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stationCount = data.stations.length;

  const dimensions = useChartDimensions(containerRef, {
    minHeight: 450,
    maxHeight: 700,
    aspectRatio: 0.7,
    itemCount: stationCount,
    circuitMode: true,
    stationLabelHeight: 40,
    padding: {
      top: 80,
      bottom: 80,
      left: 40,
      right: 40
    }
  });

  const { width, height, centerX, centerY, radius = 0 } = dimensions;

  const stationPositions = data.stations.map((station, idx) => {
    const angle = (idx / stationCount) * Math.PI * 2 - Math.PI / 2;
    return {
      ...station,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle
    };
  });

  const COMPETITION_COLOR = '#F59E0B';

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full max-w-full ${className}`}
    >
      <GlassCard
        className="relative p-6 md:p-8 space-y-4 w-full"
        style={{
          minHeight: `${height}px`,
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${COMPETITION_COLOR} 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `2px solid color-mix(in srgb, ${COMPETITION_COLOR} 25%, rgba(255, 255, 255, 0.15))`,
          borderRadius: '24px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.3),
            0 0 30px color-mix(in srgb, ${COMPETITION_COLOR} 15%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1)
          `,
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${COMPETITION_COLOR} 40%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${COMPETITION_COLOR} 50%, transparent)`,
              boxShadow: `0 6px 24px color-mix(in srgb, ${COMPETITION_COLOR} 35%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.Trophy}
              size={24}
              variant="pure"
              style={{
                color: COMPETITION_COLOR,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${COMPETITION_COLOR} 60%, transparent))`
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
              Vue d'ensemble du circuit
            </h3>
            <p className="text-xs md:text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {data.sessionName || data.category || data.competitionFormat} • {stationCount} station{stationCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Summary Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-4 relative z-10"
        >
          <div
            className="p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${COMPETITION_COLOR} 25%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.10)
              `,
              border: `2px solid color-mix(in srgb, ${COMPETITION_COLOR} 35%, transparent)`,
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 8px 24px color-mix(in srgb, ${COMPETITION_COLOR} 25%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Target} size={18} style={{ color: COMPETITION_COLOR }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Format
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              {data.competitionFormat}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: COMPETITION_COLOR }}>
              compétition
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
                Durée estimée
              </span>
            </div>
            <div className="text-3xl md:text-4xl font-bold" style={{ color: 'white', letterSpacing: '-0.03em' }}>
              ~{data.estimatedDuration || 45}
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
          className="p-4 rounded-xl mb-4 relative z-10"
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
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  background: COMPETITION_COLOR,
                  boxShadow: `0 0 12px ${COMPETITION_COLOR}60`
                }}
              >
                1
              </div>
              <span className="text-xs text-white/80">Station numéro</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Repeat} size={14} style={{ color: COMPETITION_COLOR }} />
              <span className="text-xs text-white/80">Enchaînement</span>
            </div>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Trophy} size={14} style={{ color: COMPETITION_COLOR }} />
              <span className="text-xs text-white/80">Station compét'</span>
            </div>
          </div>
        </motion.div>

        {/* Circuit Diagram */}
        <div className="relative" style={{ minHeight: Math.max(300, height - 200) }}>
          <svg
            width={Math.max(300, width - 80)}
            height={Math.max(300, height - 200)}
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={COMPETITION_COLOR} stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.15" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={centerX}
              cy={centerY - 20}
              r={radius}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeDasharray="10 5"
              opacity="0.8"
              filter="url(#glow)"
            />

            {stationPositions.map((station, idx) => {
              const nextStation = stationPositions[(idx + 1) % stationCount];
              return (
                <line
                  key={`line-${idx}`}
                  x1={station.x}
                  y1={station.y - 20}
                  x2={nextStation.x}
                  y2={nextStation.y - 20}
                  stroke={COMPETITION_COLOR}
                  strokeWidth="2"
                  strokeOpacity="0.35"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            {stationPositions.map((station) => (
              <motion.div
                key={station.order}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: station.x,
                  top: station.y - 20
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: station.order * 0.08, duration: 0.3 }}
              >
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 30%, ${COMPETITION_COLOR} 0%, color-mix(in srgb, ${COMPETITION_COLOR} 85%, #000) 100%)
                      `,
                      border: `2px solid color-mix(in srgb, ${COMPETITION_COLOR} 70%, white)`,
                      boxShadow: `
                        0 8px 24px color-mix(in srgb, ${COMPETITION_COLOR} 45%, transparent),
                        0 0 20px color-mix(in srgb, ${COMPETITION_COLOR} 30%, transparent)
                      `
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {station.order}
                  </motion.div>
                  <div
                    className="absolute -bottom-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-center px-2 py-1 rounded-lg"
                    style={{
                      width: '140px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      background: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {station.name.length > 18 ? station.name.substring(0, 15) + '...' : station.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interaction Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center relative z-10"
        >
          <p className="text-xs text-white/50 font-medium">
            <SpatialIcon Icon={ICONS.Info} size={12} variant="pure" style={{ display: 'inline', marginRight: '4px' }} />
            Suivez le circuit dans l'ordre des numéros de station
          </p>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
