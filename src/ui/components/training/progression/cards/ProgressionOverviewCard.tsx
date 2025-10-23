/**
 * ProgressionOverviewCard Component (Refactored)
 * Hero card showing user level, XP and next milestone
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import ProgressBarAnimated from '../../ProgressBarAnimated';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import StatMetric from '../shared/StatMetric';
import type { ProgressionOverviewCardProps } from '../types';
import { PROGRESSION_COLORS, ANIMATION_DURATIONS, ANIMATION_DELAYS } from '../config/constants';
import { formatXP, formatLevel, formatPercentage } from '../utils/formatters';
import { getXPProgressPercentage, getRemainingXP } from '../utils/levelCalculations';

const ProgressionOverviewCard: React.FC<ProgressionOverviewCardProps> = ({
  userLevel,
  totalSessions,
  currentStreak,
  stepColor,
  animated = true,
}) => {
  const levelColor = stepColor || PROGRESSION_COLORS.LEVEL;
  const remainingXP = getRemainingXP(userLevel);
  
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${levelColor} 12%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${levelColor} 25%, transparent)`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.25), 0 0 32px color-mix(in srgb, ${levelColor} 15%, transparent)`
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4">
            <GlowIcon icon="Crown" color={levelColor} size="xl" animate={animated} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-white">
                  {formatLevel(userLevel.currentLevel)}
                </h2>
                <div
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${levelColor} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${levelColor} 40%, transparent)`
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: levelColor }}>
                    {userLevel.levelTitle}
                  </span>
                </div>
              </div>
              <p className="text-white/60">
                {formatXP(userLevel.currentXP)} / {formatXP(userLevel.xpForNextLevel)} XP
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-white/60 mb-1">XP Total</div>
            <div
              className="text-2xl font-bold"
              style={{
                color: levelColor,
                textShadow: `0 0 20px ${levelColor}50`
              }}
            >
              {formatXP(userLevel.totalXP)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Progression vers {formatLevel(userLevel.currentLevel + 1)}</span>
            <span className="font-semibold" style={{ color: levelColor }}>
              {formatPercentage(userLevel.xpProgress)}
            </span>
          </div>
          <ProgressBarAnimated
            progress={userLevel.xpProgress}
            color={levelColor}
            height={12}
          />
          <div className="text-xs text-white/50 text-center">
            {formatXP(remainingXP)} XP restant
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <motion.div
            initial={animated ? { opacity: 0, x: -10 } : undefined}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ANIMATION_DELAYS.INITIAL + ANIMATION_DELAYS.STAGGER_MEDIUM }}
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <StatMetric
              icon="Dumbbell"
              value={totalSessions}
              label="Séances Totales"
              color="#18E3FF"
              size="md"
              animated={animated}
            />
          </motion.div>

          <motion.div
            initial={animated ? { opacity: 0, x: 10 } : undefined}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: ANIMATION_DELAYS.INITIAL + ANIMATION_DELAYS.STAGGER_LARGE }}
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <StatMetric
              icon="Flame"
              value={currentStreak}
              label="Jours de Suite"
              color="#22C55E"
              size="md"
              animated={animated}
            />
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(ProgressionOverviewCard);
