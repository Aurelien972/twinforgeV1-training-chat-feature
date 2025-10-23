/**
 * Endurance Pre-Session Briefing
 * Modern briefing card for endurance sessions with VisionOS26 design
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import TrainingButton from '../../../../../app/pages/Training/Pipeline/components/TrainingButton';
import type { EnduranceSessionPrescription, EnduranceBlock } from '../../../../../domain/enduranceSession';
import { DISCIPLINE_CONFIGS } from '../../../../../domain/enduranceSession';

interface EndurancePreSessionBriefingProps {
  prescription: EnduranceSessionPrescription;
  allBlocks: EnduranceBlock[];
  onStart: () => void;
}

const EndurancePreSessionBriefing: React.FC<EndurancePreSessionBriefingProps> = ({
  prescription,
  allBlocks,
  onStart,
}) => {
  const effectiveDiscipline = prescription.discipline || 'cardio';
  const disciplineConfig = DISCIPLINE_CONFIGS[effectiveDiscipline];
  const stepColor = disciplineConfig.color;

  const totalDuration = allBlocks.reduce((sum, block) => sum + block.duration, 0);
  const hasWarmup = allBlocks.some(b => b.type === 'warmup');
  const hasCooldown = allBlocks.some(b => b.type === 'cooldown');
  const mainWorkoutBlocks = allBlocks.filter(b => b.type !== 'warmup' && b.type !== 'cooldown');

  const getZoneColor = (zone: string) => {
    const zoneColors: Record<string, string> = {
      'Z1': '#10b981',
      'Z2': '#3b82f6',
      'Z3': '#f59e0b',
      'Z4': '#ef4444',
      'Z5': '#dc2626',
    };
    return zoneColors[zone] || '#8b5cf6';
  };

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard
          className="p-8 text-center relative overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
              rgba(255, 255, 255, 0.06)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.15))`,
            borderRadius: '24px',
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.2),
              0 0 40px color-mix(in srgb, ${stepColor} 12%, transparent),
              inset 0 2px 0 rgba(255, 255, 255, 0.15)
            `
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent))
                `,
                border: `2px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                boxShadow: `0 0 40px color-mix(in srgb, ${stepColor} 50%, transparent)`
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <SpatialIcon
                  name={disciplineConfig.icon as any}
                  className="w-12 h-12 text-white"
                  style={{
                    filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 60%, transparent))`
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
            style={{
              letterSpacing: '-0.02em',
              textShadow: `0 0 24px color-mix(in srgb, ${stepColor} 40%, transparent)`
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {prescription.sessionName}
          </motion.h2>

          <motion.div
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <SpatialIcon
              name={disciplineConfig.icon as any}
              className="w-4 h-4 text-white/60"
            />
            <span className="text-white/60 text-sm font-medium uppercase tracking-wider">
              {disciplineConfig.label}
            </span>
          </motion.div>

          {prescription.sessionSummary && (
            <motion.p
              className="text-white/80 text-base max-w-2xl mx-auto leading-relaxed mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {prescription.sessionSummary}
            </motion.p>
          )}

          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: `
                  linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent)),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 30%, transparent)`
              }}
            >
              {totalDuration} min
            </div>

            <div
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: `
                  linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent)),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `1.5px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 30%, transparent)`
              }}
            >
              {allBlocks.length} blocs
            </div>

            {mainWorkoutBlocks.length > 0 && (
              <div
                className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{
                  background: `
                    linear-gradient(135deg, color-mix(in srgb, ${stepColor} 40%, transparent), color-mix(in srgb, ${stepColor} 30%, transparent)),
                    rgba(255, 255, 255, 0.08)
                  `,
                  border: `1.5px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                  boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 30%, transparent)`
                }}
              >
                {mainWorkoutBlocks.length} intervalles
              </div>
            )}
          </motion.div>

          <motion.div
            className="space-y-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider px-3">
                Structure
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {allBlocks.map((block, index) => (
              <motion.div
                key={block.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + index * 0.05 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${stepColor} 30%, transparent), color-mix(in srgb, ${stepColor} 20%, transparent))`,
                    border: `1px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                    boxShadow: `0 0 20px color-mix(in srgb, ${stepColor} 20%, transparent)`
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold text-sm">{block.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/60 text-xs">{block.duration} min</span>
                    <span className="text-white/40">•</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: getZoneColor(block.targetZone),
                        background: `${getZoneColor(block.targetZone)}20`,
                        border: `1px solid ${getZoneColor(block.targetZone)}40`
                      }}
                    >
                      {block.targetZone}
                    </span>
                  </div>
                </div>
                {block.type === 'warmup' && (
                  <SpatialIcon name="Flame" className="w-4 h-4 text-orange-400" />
                )}
                {block.type === 'cooldown' && (
                  <SpatialIcon name="Snowflake" className="w-4 h-4 text-cyan-400" />
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-3"
          >
            {/* Primary CTA - Lancer la séance */}
            <TrainingButton
              label="Lancer la séance"
              onClick={onStart}
              variant="primary"
              icon="Play"
              fullWidth
            />
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default EndurancePreSessionBriefing;
