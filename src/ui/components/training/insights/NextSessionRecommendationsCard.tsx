/**
 * NextSessionRecommendationsCard Component
 * Displays AI-powered recommendations for the next training session
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionAnalysisResult } from '../../../../system/services/sessionAnalysisService';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

interface NextSessionRecommendationsCardProps {
  aiAnalysis: SessionAnalysisResult;
  stepColor?: string;
}

const NextSessionRecommendationsCard: React.FC<NextSessionRecommendationsCardProps> = ({
  aiAnalysis,
  stepColor = TRAINING_COLORS.adaptive,
}) => {
  const recommendations = aiAnalysis.progressionRecommendations;
  const nextSession = recommendations.nextSession;
  const longTerm = recommendations.longTerm;

  // Determine adjustment icons and colors
  const getAdjustmentStyle = (adjustment: string) => {
    const lower = adjustment.toLowerCase();
    if (lower.includes('augment') || lower.includes('increase') || lower.includes('+')) {
      return { icon: ICONS.TrendingUp, color: '#10B981', emoji: '📈' };
    }
    if (lower.includes('diminu') || lower.includes('decrease') || lower.includes('-')) {
      return { icon: ICONS.TrendingDown, color: '#F59E0B', emoji: '📉' };
    }
    return { icon: ICONS.Minus, color: '#3B82F6', emoji: '➡️' };
  };

  const volumeStyle = getAdjustmentStyle(nextSession.volumeAdjustment);
  const intensityStyle = getAdjustmentStyle(nextSession.intensityAdjustment);

  return (
    <GlassCard
      className="space-y-6"
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
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
              rgba(255, 255, 255, 0.12)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
            boxShadow: `
              0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
          }}
        >
          <SpatialIcon
            Icon={ICONS.ArrowRight}
            size={24}
            style={{
              color: stepColor,
              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`,
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">Prochaine Séance</h3>
          <p className="text-white/60 text-sm">Recommandations IA</p>
        </div>
        <div
          className="px-3 py-1 rounded-full flex items-center gap-1.5"
          style={{
            background: 'rgba(24, 227, 255, 0.1)',
            border: '1px solid rgba(24, 227, 255, 0.3)',
          }}
        >
          <SpatialIcon Icon={ICONS.Sparkles} size={12} style={{ color: '#18E3FF' }} />
          <span className="text-[10px] font-semibold text-[#18E3FF] uppercase tracking-wider">IA</span>
        </div>
      </div>

      {/* Adjustments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volume Adjustment */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `color-mix(in srgb, ${volumeStyle.color} 8%, transparent)`,
              border: `2px solid color-mix(in srgb, ${volumeStyle.color} 25%, transparent)`,
              boxShadow: `0 4px 16px color-mix(in srgb, ${volumeStyle.color} 15%, transparent)`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{volumeStyle.emoji}</div>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">Volume</h4>
                <p className="text-white/60 text-xs">Ajustement suggéré</p>
              </div>
              <SpatialIcon
                Icon={volumeStyle.icon}
                size={24}
                style={{
                  color: volumeStyle.color,
                  filter: `drop-shadow(0 0 8px ${volumeStyle.color}60)`,
                }}
              />
            </div>
            <p className="text-white/90 text-sm leading-relaxed">{nextSession.volumeAdjustment}</p>
          </div>
        </motion.div>

        {/* Intensity Adjustment */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `color-mix(in srgb, ${intensityStyle.color} 8%, transparent)`,
              border: `2px solid color-mix(in srgb, ${intensityStyle.color} 25%, transparent)`,
              boxShadow: `0 4px 16px color-mix(in srgb, ${intensityStyle.color} 15%, transparent)`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{intensityStyle.emoji}</div>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">Intensité</h4>
                <p className="text-white/60 text-xs">Ajustement suggéré</p>
              </div>
              <SpatialIcon
                Icon={intensityStyle.icon}
                size={24}
                style={{
                  color: intensityStyle.color,
                  filter: `drop-shadow(0 0 8px ${intensityStyle.color}60)`,
                }}
              />
            </div>
            <p className="text-white/90 text-sm leading-relaxed">{nextSession.intensityAdjustment}</p>
          </div>
        </motion.div>
      </div>

      {/* Focus Points */}
      {nextSession.focusPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <GlowIcon icon="Target" color={stepColor} size="small" glowIntensity={40} />
            <h4 className="text-white font-semibold">Points de Focus</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nextSession.focusPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-3 rounded-lg flex items-center gap-2"
                style={{
                  background: `color-mix(in srgb, ${stepColor} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
                }}
              >
                <SpatialIcon
                  Icon={ICONS.CheckCircle}
                  size={16}
                  style={{
                    color: stepColor,
                    filter: `drop-shadow(0 0 6px color-mix(in srgb, ${stepColor} 40%, transparent))`,
                  }}
                />
                <p className="text-white/80 text-sm flex-1">{point}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Long Term Vision */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + nextSession.focusPoints.length * 0.1 }}
        className="pt-4"
      >
        <div
          className="p-5 rounded-xl"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
              rgba(255, 255, 255, 0.06)
            `,
            border: '2px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <GlowIcon icon="TrendingUp" color="#8B5CF6" size="small" glowIntensity={50} />
            <h4 className="text-white font-semibold">Vision Long Terme</h4>
          </div>

          <div className="space-y-3">
            {/* Goal Alignment */}
            <div className="flex items-start gap-3">
              <SpatialIcon Icon={ICONS.Target} size={18} style={{ color: '#8B5CF6', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">Alignement Objectifs</p>
                <p className="text-white/90 text-sm leading-relaxed">{longTerm.goalAlignment}</p>
              </div>
            </div>

            {/* Milestone Progress */}
            <div className="flex items-start gap-3">
              <SpatialIcon Icon={ICONS.Award} size={18} style={{ color: '#8B5CF6', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">Progression</p>
                <p className="text-white/90 text-sm leading-relaxed">{longTerm.milestoneProgress}</p>
              </div>
            </div>

            {/* Strategic Advice */}
            <div className="flex items-start gap-3">
              <SpatialIcon Icon={ICONS.Lightbulb} size={18} style={{ color: '#8B5CF6', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="text-white/60 text-xs mb-1">Conseil Stratégique</p>
                <p className="text-white/90 text-sm leading-relaxed">{longTerm.strategicAdvice}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  );
};

export default NextSessionRecommendationsCard;
