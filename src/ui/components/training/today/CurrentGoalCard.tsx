/**
 * CurrentGoalCard Component
 * Displays current active goal with progress
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { TrainingGoal } from '../../../../domain/trainingToday';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

const TRAINING_COLOR = TRAINING_COLORS.goals;

const GOAL_ICONS: Record<string, any> = {
  strength: 'Dumbbell',
  endurance: 'Activity',
  weight_loss: 'TrendingDown',
  muscle_gain: 'TrendingUp',
  maintenance: 'Target'
};

const CurrentGoalCard: React.FC = () => {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<TrainingGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const goalData = await trainingTodayService.getCurrentGoal();
        setGoal(goalData);
      } catch (error) {
        console.error('Error loading current goal:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoal();
  }, []);

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return '#22C55E';
    if (progress >= 50) return TRAINING_COLOR;
    if (progress >= 25) return '#F59E0B';
    return '#EF4444';
  };

  const getMotivationalMessage = (progress: number, daysLeft: number): string => {
    if (progress >= 100) return 'Objectif atteint! Nouveau challenge?';
    if (progress >= 75) return 'Excellent rythme, continuez!';
    if (daysLeft <= 7 && progress < 75) return `Plus que ${Math.ceil((100 - progress) / 10)} séances`;
    if (progress >= 50) return 'Vous êtes sur la bonne voie';
    return 'Accélérez le rythme pour atteindre votre objectif';
  };

  const getDaysLeft = (deadline: Date): number => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <GlassCard className="p-6" style={{ minHeight: '200px' }}>
        <div className="text-white/60 text-center">Chargement de l'objectif...</div>
      </GlassCard>
    );
  }

  if (!goal) {
    return (
      <GlassCard
        className="p-6 text-center space-y-4"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`
        }}
      >
        <GlowIcon icon="Target" color={TRAINING_COLOR} size="medium" />
        <div>
          <h4 className="text-white font-semibold mb-2">Aucun objectif actif</h4>
          <p className="text-white/60 text-sm mb-4">Définissez un objectif pour suivre votre progression</p>
          <button
            onClick={() => navigate('/training?tab=conseils')}
            className="px-4 py-2 rounded-lg font-medium text-sm"
            style={{
              background: `color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 30%, transparent)`,
              color: TRAINING_COLOR
            }}
          >
            Créer un objectif
          </button>
        </div>
      </GlassCard>
    );
  }

  const daysLeft = getDaysLeft(goal.deadline);
  const progressColor = getProgressColor(goal.progress);
  const motivationalMessage = getMotivationalMessage(goal.progress, daysLeft);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <GlassCard
        className="p-6 space-y-4"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <GlowIcon
            icon={GOAL_ICONS[goal.type] || 'Target'}
            color={TRAINING_COLOR}
            size="small"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{goal.title}</h3>
            <p className="text-white/60 text-sm">{daysLeft} jours restants</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Progression</span>
            <span
              className="text-lg font-bold"
              style={{
                color: progressColor,
                textShadow: `0 0 12px ${progressColor}50`
              }}
            >
              {Math.round(goal.progress)}%
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${progressColor}, ${TRAINING_COLOR})`,
                boxShadow: `0 0 12px ${progressColor}60`
              }}
            />
          </div>
        </div>

        {/* Current vs Target */}
        <div
          className="p-4 rounded-lg mb-4"
          style={{
            background: `color-mix(in srgb, ${TRAINING_COLOR} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`
          }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {goal.currentValue}
              <span className="text-white/40 text-2xl"> / {goal.targetValue}</span>
            </div>
            <div className="text-sm text-white/60">{goal.unit}</div>
          </div>
        </div>

        {/* Motivational Message */}
        <div
          className="p-3 rounded-lg text-center mb-4"
          style={{
            background: `color-mix(in srgb, ${progressColor} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${progressColor} 20%, transparent)`
          }}
        >
          <p className="text-sm font-medium" style={{ color: progressColor }}>
            {motivationalMessage}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/training?tab=conseils')}
          className="w-full px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-102"
          style={{
            background: `color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 30%, transparent)`,
            color: TRAINING_COLOR
          }}
        >
          Ajuster mes objectifs
        </button>
      </GlassCard>
    </motion.div>
  );
};

export default CurrentGoalCard;
