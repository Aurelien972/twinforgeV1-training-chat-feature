/**
 * ProgressionPathCard Component
 * Displays the user's training progression path with milestones
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import TimelineItem from '../history/TimelineItem';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { ProgressionMilestone } from '../../../../system/services/step5RecommendationService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface ProgressionPathCardProps {
  milestones: ProgressionMilestone[];
  stepColor?: string;
}

const ProgressionPathCard: React.FC<ProgressionPathCardProps> = ({ milestones, stepColor = TRAINING_COLORS.progress }) => {
  return (
    <GlassCard
      style={{
        background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
        border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent)`,
        padding: '24px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        <GlowIcon icon="TrendingUp" color={stepColor} size="small" />
        <div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '4px'
            }}
          >
            Votre Parcours
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}
          >
            Étapes de progression personnalisées
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {milestones.map((milestone, index) => {
          const iconMap: Record<string, any> = {
            session: ICONS.Dumbbell,
            test: ICONS.Star,
            upgrade: ICONS.TrendingUp
          };

          const statusMap: Record<string, 'completed' | 'active' | 'upcoming'> = {
            completed: 'completed',
            current: 'active',
            upcoming: 'upcoming'
          };

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <TimelineItem
                icon={milestone.type === 'session' ? 'Dumbbell' : milestone.type === 'test' ? 'Star' : 'TrendingUp'}
                iconColor={stepColor}
                title={milestone.title}
                description={milestone.description}
                status={statusMap[milestone.status]}
                isLast={index === milestones.length - 1}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: milestones.length * 0.1 + 0.2 }}
        style={{
          marginTop: '24px',
          padding: '16px',
          borderRadius: '12px',
          background: `${stepColor}08`,
          border: `1px solid ${stepColor}20`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <SpatialIcon
          Icon={ICONS.Info}
          size={18}
          style={{ color: stepColor, flexShrink: 0 }}
        />
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.75)',
            margin: 0,
            lineHeight: 1.5
          }}
        >
          Votre progression est dynamique et s'adapte à vos performances et votre récupération.
        </p>
      </motion.div>
    </GlassCard>
  );
};

export default ProgressionPathCard;
