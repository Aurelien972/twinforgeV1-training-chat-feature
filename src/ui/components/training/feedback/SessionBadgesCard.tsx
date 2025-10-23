/**
 * SessionBadgesCard Component
 * Displays earned badges based on session performance
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import type { SessionFeedback, SessionPrescription } from '../../../../system/store/trainingPipeline/types';
import type { SessionAnalysisResult } from '../../../../system/services/sessionAnalysisService';
import type { IconName } from '../../../icons/registry';
import { calculateSessionVolume } from '../../../../utils/loadUtils';
import logger from '../../../../lib/utils/logger';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  emoji: string;
  earned: boolean;
}

interface SessionBadgesCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

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
  // Calculate total volume
  const calculateTotalVolume = () => {
    return calculateSessionVolume(sessionFeedback.exercises);
  };

  // Calculate work/rest ratio
  const calculateWorkRestRatio = () => {
    const totalRestTime = sessionPrescription.exercises.reduce((total, ex) => {
      return total + (ex.rest * (ex.sets - 1));
    }, 0);
    const workTime = sessionFeedback.durationActual - totalRestTime;
    return workTime / totalRestTime;
  };

  // Estimate calories (simplified)
  const calculateCaloriesBurned = () => {
    const totalVolume = calculateTotalVolume();
    const durationMinutes = sessionFeedback.durationActual / 60;
    const avgRpe = sessionFeedback.overallRpe || 7;

    if (isNaN(totalVolume) || isNaN(durationMinutes) || isNaN(avgRpe)) {
      return 0;
    }

    const baseCalories = (totalVolume / 100) + (durationMinutes * 5);
    const rpeMultiplier = 0.8 + (avgRpe / 10) * 0.4;
    const result = Math.round(baseCalories * rpeMultiplier);
    return isNaN(result) ? 0 : result;
  };

  const totalVolume = calculateTotalVolume();
  const workRestRatio = calculateWorkRestRatio();
  const caloriesBurned = calculateCaloriesBurned();
  const completionRate = sessionFeedback.exercises.filter(ex => ex.completed).length / sessionFeedback.exercises.length;
  const avgTechnique = sessionFeedback.exercises.reduce((sum, ex) => sum + (ex.technique || 0), 0) / sessionFeedback.exercises.length;

  // Define available badges
  const allBadges: Badge[] = [
    {
      id: 'volume-king',
      name: 'Volume King',
      description: 'Plus de 5000kg de volume total',
      icon: 'Weight',
      color: '#8B5CF6',
      emoji: '👑',
      earned: totalVolume >= 5000,
    },
    {
      id: 'endurance-beast',
      name: 'Endurance Beast',
      description: 'Ratio travail/repos supérieur à 2:1',
      icon: 'Zap',
      color: '#F59E0B',
      emoji: '⚡',
      earned: workRestRatio >= 2,
    },
    {
      id: 'perfect-form',
      name: 'Perfect Form',
      description: 'Technique moyenne de 8+/10',
      icon: 'Award',
      color: '#22C55E',
      emoji: '🎯',
      earned: avgTechnique >= 8,
    },
    {
      id: 'calorie-crusher',
      name: 'Calorie Crusher',
      description: 'Plus de 400 calories brûlées',
      icon: 'Flame',
      color: '#EF4444',
      emoji: '🔥',
      earned: caloriesBurned >= 400,
    },
    {
      id: 'consistency-master',
      name: 'Consistency Master',
      description: 'Tous les exercices complétés',
      icon: 'CheckCircle',
      color: '#3B82F6',
      emoji: '✅',
      earned: completionRate === 1,
    },
  ];

  // Use AI achievements if available, otherwise use local badges
  const earnedBadges = aiAnalysis?.achievements?.filter(a => a.earned).length
    ? aiAnalysis.achievements.filter(a => a.earned).map(achievement => ({
        id: achievement.type,
        name: achievement.title,
        description: achievement.description,
        icon: achievement.type === 'consistency' ? 'CheckCircle' as IconName :
              achievement.type === 'volume' ? 'Weight' as IconName :
              achievement.type === 'technique' ? 'Award' as IconName :
              achievement.type === 'strength' ? 'Zap' as IconName :
              achievement.type === 'endurance' ? 'Activity' as IconName :
              'Trophy' as IconName,
        color: achievement.type === 'consistency' ? '#3B82F6' :
               achievement.type === 'volume' ? '#8B5CF6' :
               achievement.type === 'technique' ? '#22C55E' :
               achievement.type === 'strength' ? '#F59E0B' :
               achievement.type === 'endurance' ? '#EF4444' :
               '#EC4899',
        emoji: achievement.type === 'consistency' ? '✅' :
               achievement.type === 'volume' ? '👑' :
               achievement.type === 'technique' ? '🎯' :
               achievement.type === 'strength' ? '⚡' :
               achievement.type === 'endurance' ? '🔥' :
               '🏆',
        earned: true,
      })).slice(0, 3)
    : allBadges.filter(badge => badge.earned).slice(0, 3);

  const hasAIAchievements = aiAnalysis?.achievements?.some(a => a.earned);

  // Don't render if no badges earned
  if (earnedBadges.length === 0) {
    return null;
  }

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
                background: 'rgba(24, 227, 255, 0.1)',
                border: '1px solid rgba(24, 227, 255, 0.3)',
              }}
            >
              <span className="text-[9px] font-semibold text-[#18E3FF] uppercase tracking-wider">IA</span>
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
      {earnedBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: earnedBadges.length * 0.2 + 0.3 }}
          className="text-center pt-2"
        >
          <p className="text-white/70 text-sm">
            {earnedBadges.length === 1 && "Premier badge ! Continue comme ça 💪"}
            {earnedBadges.length === 2 && "Deux badges ! Tu es en feu 🔥"}
            {earnedBadges.length >= 3 && "Trio de badges ! Performance exceptionnelle 🌟"}
          </p>
        </motion.div>
      )}
    </GlassCard>
  );
};

export default SessionBadgesCard;
