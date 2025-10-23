/**
 * SessionBadgesCard Component
 * Displays earned badges based on session performance
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import type { SessionBadgesCardProps, Badge } from '../types';
import type { IconName } from '../../../../icons/registry';
import { calculateSessionMetrics } from '../utils/metricsCalculations';
import { getEarnedBadges, getEncouragementMessage } from '../config/badgeConfigs';
import { AI_COLORS } from '../config/constants';
import logger from '../../../../../lib/utils/logger';

const SessionBadgesCard: React.FC<SessionBadgesCardProps> = ({
  sessionFeedback,
  sessionPrescription,
  stepColor,
  aiAnalysis,
}) => {
  useEffect(() => {
    logger.info('SESSION_BADGES_CARD', 'Component rendered', {
      hasAiAnalysis: !!aiAnalysis,
      hasAchievements: !!aiAnalysis?.achievements,
      achievementsCount: aiAnalysis?.achievements?.length || 0,
      earnedAchievementsCount: aiAnalysis?.achievements?.filter(a => a.earned).length || 0
    });
  }, [aiAnalysis]);

  // Calculate metrics for badge evaluation
  const metrics = calculateSessionMetrics(sessionFeedback, sessionPrescription);

  // Map AI achievement types to icons and colors
  const mapAiAchievementToIcon = (type: string): IconName => {
    const iconMap: Record<string, IconName> = {
      consistency: 'CheckCircle',
      volume: 'Weight',
      technique: 'Award',
      strength: 'Zap',
      endurance: 'Activity',
    };
    return iconMap[type] || 'Trophy';
  };

  const mapAiAchievementToColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      consistency: '#3B82F6',
      volume: '#8B5CF6',
      technique: '#22C55E',
      strength: '#F59E0B',
      endurance: '#EF4444',
    };
    return colorMap[type] || '#EC4899';
  };

  const mapAiAchievementToEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      consistency: '✅',
      volume: '👑',
      technique: '🎯',
      strength: '⚡',
      endurance: '🔥',
    };
    return emojiMap[type] || '🏆';
  };

  // Use AI achievements if available, otherwise use local badges
  const earnedBadges: Badge[] = aiAnalysis?.achievements?.filter(a => a.earned).length
    ? aiAnalysis.achievements.filter(a => a.earned).map(achievement => ({
        id: achievement.type,
        name: achievement.title,
        description: achievement.description,
        icon: mapAiAchievementToIcon(achievement.type),
        color: mapAiAchievementToColor(achievement.type),
        emoji: mapAiAchievementToEmoji(achievement.type),
        earned: true,
      })).slice(0, 3)
    : getEarnedBadges(metrics).slice(0, 3);

  const hasAIAchievements = aiAnalysis?.achievements?.some(a => a.earned);

  // Don't render if no badges earned
  if (earnedBadges.length === 0) {
    return null;
  }

  const encouragementMessage = getEncouragementMessage(earnedBadges.length);

  return (
    <GlassCard
      className="space-y-4"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.2),
          0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block text-4xl mb-2"
        >
          🏆
        </motion.div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h3 className="text-xl font-semibold text-white">Accomplissements</h3>
          {hasAIAchievements && (
            <div
              className="px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                background: AI_COLORS.BACKGROUND,
                border: `1px solid ${AI_COLORS.BORDER}`,
              }}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: AI_COLORS.PRIMARY }}>IA</span>
            </div>
          )}
        </div>
        <p className="text-white/60 text-sm">
          {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''} débloqué{earnedBadges.length > 1 ? 's' : ''} !
        </p>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {earnedBadges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              delay: index * 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
          >
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: `
                  radial-gradient(circle at 50% 30%, color-mix(in srgb, ${badge.color} 15%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.06)
                `,
                border: `2px solid color-mix(in srgb, ${badge.color} 30%, transparent)`,
                boxShadow: `
                  0 4px 20px rgba(0, 0, 0, 0.2),
                  0 0 30px color-mix(in srgb, ${badge.color} 20%, transparent),
                  inset 0 1px 0 rgba(255, 255, 255, 0.12)
                `,
              }}
            >
              {/* Badge Icon */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeInOut',
                }}
                className="flex justify-center mb-3"
              >
                <div className="relative">
                  <GlowIcon icon={badge.icon} color={badge.color} size="large" glowIntensity={60} animate={true} />
                  <motion.div
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-xl sm:text-2xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2 + 0.5, type: 'spring', stiffness: 300 }}
                  >
                    {badge.emoji}
                  </motion.div>
                </div>
              </motion.div>

              {/* Badge Name */}
              <h4
                className="font-bold text-white mb-1"
                style={{
                  textShadow: `0 0 15px ${badge.color}60`,
                }}
              >
                {badge.name}
              </h4>

              {/* Badge Description */}
              <p className="text-white/60 text-xs leading-relaxed">{badge.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Encouragement */}
      {encouragementMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: earnedBadges.length * 0.2 + 0.3 }}
          className="text-center pt-2"
        >
          <p className="text-white/70 text-sm">{encouragementMessage}</p>
        </motion.div>
      )}
    </GlassCard>
  );
};

export default SessionBadgesCard;
