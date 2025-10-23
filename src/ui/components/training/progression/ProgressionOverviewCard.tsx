/**
 * ProgressionOverviewCard Component
 * Hero card showing user level, XP and next milestone
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import ProgressBarAnimated from '../ProgressBarAnimated';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { UserLevel } from '../../../../domain/trainingProgression';

interface ProgressionOverviewCardProps {
  userLevel: UserLevel;
  totalSessions: number;
  currentStreak: number;
}

const LEVEL_COLOR = '#F59E0B';

const ProgressionOverviewCard: React.FC<ProgressionOverviewCardProps> = ({
  userLevel,
  totalSessions,
  currentStreak
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${LEVEL_COLOR} 12%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${LEVEL_COLOR} 25%, transparent)`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.25), 0 0 32px color-mix(in srgb, ${LEVEL_COLOR} 15%, transparent)`
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4">
            <GlowIcon icon="Crown" color={LEVEL_COLOR} size="xl" animate />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-white">
                  Niveau {userLevel.currentLevel}
                </h2>
                <div
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${LEVEL_COLOR} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${LEVEL_COLOR} 40%, transparent)`
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: LEVEL_COLOR }}>
                    {userLevel.levelTitle}
                  </span>
                </div>
              </div>
              <p className="text-white/60">
                {userLevel.currentXP.toLocaleString()} / {userLevel.xpForNextLevel.toLocaleString()} XP
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-white/60 mb-1">XP Total</div>
            <div
              className="text-2xl font-bold"
              style={{
                color: LEVEL_COLOR,
                textShadow: `0 0 20px ${LEVEL_COLOR}50`
              }}
            >
              {userLevel.totalXP.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Progression vers Niveau {userLevel.currentLevel + 1}</span>
            <span className="font-semibold" style={{ color: LEVEL_COLOR }}>
              {Math.round(userLevel.xpProgress)}%
            </span>
          </div>
          <ProgressBarAnimated
            progress={userLevel.xpProgress}
            color={LEVEL_COLOR}
            height={12}
          />
          <div className="text-xs text-white/50 text-center">
            {userLevel.xpForNextLevel - userLevel.currentXP} XP restant
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <SpatialIcon
              Icon={ICONS.Dumbbell}
              size={24}
              style={{ color: '#18E3FF', margin: '0 auto 8px' }}
            />
            <div className="text-2xl font-bold text-white mb-1">
              {totalSessions}
            </div>
            <div className="text-xs text-white/60">Séances Totales</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <SpatialIcon
              Icon={ICONS.Flame}
              size={24}
              style={{ color: '#22C55E', margin: '0 auto 8px' }}
            />
            <div className="text-2xl font-bold text-white mb-1">
              {currentStreak}
            </div>
            <div className="text-xs text-white/60">Jours de Suite</div>
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(ProgressionOverviewCard);
