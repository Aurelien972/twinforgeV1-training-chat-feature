/**
 * AIPrimaryAdviceCard Component
 * Displays the most important AI-generated coaching advice
 * Priority high recommendations with actionable CTA
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { AdviceRecommendation } from '../../../../system/services/trainingAdviceService';
import { getDisciplineConfig } from '../../../../hooks/useDisciplineAdaptiveContent';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface AIPrimaryAdviceCardProps {
  recommendation: AdviceRecommendation;
  onMarkHelpful?: (recommendationId: string, helpful: boolean) => void;
}

const DEFAULT_COLOR = TRAINING_COLORS.insights;

const AIPrimaryAdviceCard: React.FC<AIPrimaryAdviceCardProps> = ({
  recommendation,
  onMarkHelpful
}) => {
  const navigate = useNavigate();

  const disciplineColor = recommendation.disciplineSpecific
    ? getDisciplineConfig(recommendation.disciplineSpecific).color
    : DEFAULT_COLOR;

  const getCategoryConfig = (category: string) => {
    const configs: Record<string, { color: string; icon: keyof typeof ICONS; label: string }> = {
      volume: { color: disciplineColor, icon: 'TrendingUp', label: 'Volume' },
      intensity: { color: '#EF4444', icon: 'Zap', label: 'Intensité' },
      recovery: { color: '#22C55E', icon: 'Heart', label: 'Récupération' },
      technique: { color: disciplineColor, icon: 'Target', label: 'Technique' },
      equipment: { color: '#F59E0B', icon: 'Dumbbell', label: 'Équipement' },
      strategy: { color: disciplineColor, icon: 'Brain', label: 'Stratégie' }
    };
    return configs[category] || { color: disciplineColor, icon: 'Brain', label: 'Stratégie' };
  };

  const config = getCategoryConfig(recommendation.category);
  const IconComponent = ICONS[config.icon];

  const handleAction = () => {
    if (recommendation.actionRoute) {
      navigate(recommendation.actionRoute);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard
        className="p-8 space-y-6 relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, color-mix(in srgb, ${config.color} 12%, transparent) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, color-mix(in srgb, ${config.color} 8%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${config.color} 30%, transparent)`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 48px color-mix(in srgb, ${config.color} 15%, transparent)`
        }}
      >
        <div className="absolute top-4 right-4 flex gap-2">
          {recommendation.disciplineSpecific && (
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `color-mix(in srgb, ${disciplineColor} 18%, transparent)`,
                border: `1px solid color-mix(in srgb, ${disciplineColor} 35%, transparent)`,
                color: disciplineColor
              }}
            >
              {getDisciplineConfig(recommendation.disciplineSpecific).label}
            </div>
          )}
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: `color-mix(in srgb, ${config.color} 20%, transparent)`,
              border: `1px solid color-mix(in srgb, ${config.color} 40%, transparent)`,
              color: config.color
            }}
          >
            PRIORITAIRE
          </div>
        </div>

        <div className="flex items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${config.color} 35%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.15)
              `,
              border: `2px solid color-mix(in srgb, ${config.color} 50%, transparent)`,
              boxShadow: `0 8px 24px color-mix(in srgb, ${config.color} 30%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={IconComponent}
              size={32}
              style={{
                color: config.color,
                filter: `drop-shadow(0 0 12px ${config.color})`
              }}
            />
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`,
                  color: config.color
                }}
              >
                {config.label}
              </div>
              <SpatialIcon Icon={ICONS.Sparkles} size={16} style={{ color: config.color }} />
            </div>

            <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
              {recommendation.title}
            </h3>

            <p className="text-base text-white/80 leading-relaxed mb-4">
              {recommendation.description}
            </p>

            {recommendation.reason && (
              <div
                className="p-4 rounded-lg mb-4"
                style={{
                  background: `color-mix(in srgb, ${config.color} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${config.color} 20%, transparent)`
                }}
              >
                <div className="flex items-start gap-2">
                  <SpatialIcon
                    Icon={ICONS.Lightbulb}
                    size={18}
                    style={{ color: config.color, marginTop: '2px' }}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold mb-1" style={{ color: config.color }}>
                      Pourquoi ce conseil ?
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {recommendation.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {recommendation.actionable && recommendation.actionLabel && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAction}
              className="w-full sm:flex-1 px-6 py-3 rounded-xl font-semibold text-white text-center transition-all"
              style={{
                background: `linear-gradient(135deg, ${config.color} 0%, color-mix(in srgb, ${config.color} 80%, #000) 100%)`,
                boxShadow: `0 4px 16px color-mix(in srgb, ${config.color} 40%, transparent)`
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{recommendation.actionLabel}</span>
                <SpatialIcon Icon={ICONS.ArrowRight} size={18} />
              </div>
            </motion.button>

            {onMarkHelpful && (
              <div className="flex items-center justify-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onMarkHelpful(recommendation.id, true)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  title="Utile"
                >
                  <SpatialIcon Icon={ICONS.ThumbsUp} size={18} style={{ color: '#22C55E' }} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onMarkHelpful(recommendation.id, false)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  title="Pas utile"
                >
                  <SpatialIcon Icon={ICONS.ThumbsDown} size={18} style={{ color: '#EF4444' }} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default AIPrimaryAdviceCard;
