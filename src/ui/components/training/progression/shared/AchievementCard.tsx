/**
 * AchievementCard Component
 * Displays achievement badge with unlock status and progress
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import ProgressCircle from './ProgressCircle';
import type { AchievementCardProps } from '../types';
import { getRarityCardStyles, getRarityTextStyle, getRarityLabel } from '../utils/rarityHelpers';
import { formatAchievementProgress } from '../utils/formatters';

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  compact = false,
  showProgress = true,
  onUnlock,
}) => {
  const rarityStyles = getRarityCardStyles(achievement.rarity);
  const titleStyle = getRarityTextStyle(achievement.rarity);
  const isLocked = !achievement.isUnlocked;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <GlassCard
        className={`${compact ? 'p-3' : 'p-4'} relative overflow-hidden`}
        style={{
          ...rarityStyles,
          opacity: isLocked ? 0.6 : 1,
          filter: isLocked ? 'grayscale(50%)' : 'none',
        }}
      >
        {isLocked && (
          <div className="absolute top-2 right-2">
            <SpatialIcon Icon={ICONS.Lock} size={16} style={{ color: '#fff' }} />
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: `color-mix(in srgb, ${achievement.color} 20%, transparent)`,
              border: `1px solid color-mix(in srgb, ${achievement.color} 40%, transparent)`,
            }}
          >
            <SpatialIcon
              Icon={ICONS[achievement.icon as keyof typeof ICONS] || ICONS.Trophy}
              size={24}
              style={{ color: achievement.color }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`${compact ? 'text-sm' : 'text-base'} font-bold truncate`}
                style={titleStyle}
              >
                {achievement.title}
              </h4>
              {!compact && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: rarityStyles.background,
                    color: titleStyle.color,
                  }}
                >
                  {getRarityLabel(achievement.rarity)}
                </span>
              )}
            </div>
            
            <p className="text-xs text-white/60 mb-2">{achievement.description}</p>
            
            {showProgress && !achievement.isUnlocked && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                    <span>Progrès</span>
                    <span>{formatAchievementProgress(achievement.progress, achievement.target)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: achievement.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                {!compact && (
                  <ProgressCircle
                    progress={(achievement.progress / achievement.target) * 100}
                    color={achievement.color}
                    size={40}
                    strokeWidth={4}
                    showPercentage={false}
                  />
                )}
              </div>
            )}
            
            {achievement.isUnlocked && achievement.unlockedAt && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <SpatialIcon Icon={ICONS.Check} size={14} style={{ color: '#22C55E' }} />
                <span>Débloqué</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(AchievementCard);
