/**
 * AchievementsBadgesGrid Component
 * Grid displaying achievement badges with unlock status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS, type IconName } from '../../../icons/registry';
import ProgressBarAnimated from '../ProgressBarAnimated';
import type { Achievement } from '../../../../domain/trainingProgression';

interface AchievementsBadgesGridProps {
  achievements: Achievement[];
}

const ACHIEVEMENT_COLOR = '#F59E0B';

const getRarityBorder = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '2px solid #FBB024';
    case 'epic': return '2px solid #A855F7';
    case 'rare': return '2px solid #3B82F6';
    case 'common': return '1px solid rgba(255, 255, 255, 0.2)';
    default: return '1px solid rgba(255, 255, 255, 0.1)';
  }
};

const getRarityGlow = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '0 0 24px rgba(251, 176, 36, 0.5)';
    case 'epic': return '0 0 20px rgba(168, 85, 247, 0.4)';
    case 'rare': return '0 0 16px rgba(59, 130, 246, 0.3)';
    default: return 'none';
  }
};

const AchievementsBadgesGrid: React.FC<AchievementsBadgesGridProps> = ({ achievements }) => {
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${ACHIEVEMENT_COLOR} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${ACHIEVEMENT_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${ACHIEVEMENT_COLOR} 12%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Award" color={ACHIEVEMENT_COLOR} size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Achievements</h3>
              <p className="text-white/60 text-sm">
                {unlockedCount} / {totalCount} débloqués
              </p>
            </div>
          </div>
          <div
            className="text-3xl font-bold"
            style={{
              color: ACHIEVEMENT_COLOR,
              textShadow: `0 0 20px ${ACHIEVEMENT_COLOR}50`
            }}
          >
            {Math.round((unlockedCount / totalCount) * 100)}%
          </div>
        </div>

        <ProgressBarAnimated
          progress={(unlockedCount / totalCount) * 100}
          color={ACHIEVEMENT_COLOR}
          height={10}
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 rounded-lg relative"
              style={{
                background: achievement.isUnlocked
                  ? `radial-gradient(circle at 20% 20%, color-mix(in srgb, ${achievement.color} 12%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.06)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: achievement.isUnlocked ? getRarityBorder(achievement.rarity) : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: achievement.isUnlocked ? getRarityGlow(achievement.rarity) : 'none',
                opacity: achievement.isUnlocked ? 1 : 0.5
              }}
            >
              {achievement.isUnlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05, type: 'spring', stiffness: 200 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)'
                  }}
                >
                  <SpatialIcon Icon={ICONS.Check} size={14} style={{ color: 'white' }} />
                </motion.div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: achievement.isUnlocked
                      ? `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${achievement.color} 30%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.1)`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: achievement.isUnlocked
                      ? `2px solid color-mix(in srgb, ${achievement.color} 40%, transparent)`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: achievement.isUnlocked
                      ? `0 0 16px color-mix(in srgb, ${achievement.color} 30%, transparent)`
                      : 'none'
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS[achievement.icon as IconName] || ICONS.Award}
                    size={24}
                    style={{
                      color: achievement.isUnlocked ? achievement.color : 'rgba(255, 255, 255, 0.3)',
                      filter: achievement.isUnlocked ? `drop-shadow(0 0 6px ${achievement.color}60)` : 'none'
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white mb-0.5 truncate">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-white/60 mb-2 line-clamp-2">
                    {achievement.description}
                  </p>

                  {achievement.isUnlocked ? (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className="px-2 py-0.5 rounded-full font-bold"
                          style={{
                            background: `color-mix(in srgb, ${achievement.color} 20%, transparent)`,
                            color: achievement.color
                          }}
                        >
                          +{achievement.xpReward} XP
                        </div>
                        {achievement.unlockedAt && (
                          <span className="text-white/50">
                            {formatDistanceToNow(achievement.unlockedAt, { addSuffix: true, locale: fr })}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <ProgressBarAnimated
                        progress={(achievement.progress / achievement.target) * 100}
                        color={achievement.color}
                        height={4}
                        animated={false}
                      />
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>
                          {achievement.progress} / {achievement.target}
                        </span>
                        <span>{Math.round((achievement.progress / achievement.target) * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AchievementsBadgesGrid;
