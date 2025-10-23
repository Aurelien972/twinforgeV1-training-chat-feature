/**
 * TodayEnergyLevelIndicator
 * Indicateur visuel du niveau d'énergie avec possibilité d'ajustement rapide
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { ReadinessScore } from '../../../../system/services/trainingTodayDynamicService';

const TRAINING_COLOR = '#18E3FF';

interface TodayEnergyLevelIndicatorProps {
  readinessScore: ReadinessScore;
  onEnergyChange?: (level: number) => void;
}

const TodayEnergyLevelIndicator: React.FC<TodayEnergyLevelIndicatorProps> = ({
  readinessScore,
  onEnergyChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return TRAINING_COLOR;
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  };

  const getRecommendationIcon = (rec: string): 'Zap' | 'Activity' | 'Droplet' | 'Moon' => {
    switch (rec) {
      case 'intense':
        return 'Zap';
      case 'moderate':
        return 'Activity';
      case 'light':
        return 'Droplet';
      case 'rest':
        return 'Moon';
      default:
        return 'Activity';
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'intense':
        return 'Session intense recommandée';
      case 'moderate':
        return 'Session modérée recommandée';
      case 'light':
        return 'Session légère recommandée';
      case 'rest':
        return 'Repos recommandé';
      default:
        return 'Session normale';
    }
  };

  const scoreColor = getScoreColor(readinessScore.overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard
        className="p-6 cursor-pointer"
        onClick={() => setShowPicker(!showPicker)}
        style={{
          background: `radial-gradient(circle at 30% 20%, ${TRAINING_COLOR}12 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `1px solid ${TRAINING_COLOR}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GlowIcon
              icon={getRecommendationIcon(readinessScore.recommendation)}
              color={scoreColor}
              size="small"
            />
            <div>
              <h3 className="text-lg font-bold text-white">Préparation</h3>
              <p className="text-white/60 text-sm">
                Score: {getScoreLabel(readinessScore.overall)}
              </p>
            </div>
          </div>

          {/* Score Badge */}
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              background: `${scoreColor}20`,
              border: `1.5px solid ${scoreColor}`,
            }}
          >
            <p className="text-white font-bold text-2xl">
              {readinessScore.overall}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${scoreColor} 0%, ${scoreColor}CC 100%)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${readinessScore.overall}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Recommendation */}
        <div
          className="px-4 py-3 rounded-lg mb-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-white/90 text-sm font-medium text-center">
            {getRecommendationLabel(readinessScore.recommendation)}
          </p>
        </div>

        {/* Factors Summary */}
        <div className="space-y-2">
          {readinessScore.factors.slice(0, 3).map((factor, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    factor.impact === 'positive'
                      ? '#22C55E'
                      : factor.impact === 'negative'
                      ? '#EF4444'
                      : '#F59E0B',
                }}
              />
              <span className="text-white/70">{factor.message}</span>
            </div>
          ))}
        </div>

        {/* Score Details */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/50 text-xs mb-1">Récupération</p>
            <p className="text-white font-semibold">{readinessScore.recovery}</p>
          </div>
          <div className="text-center">
            <p className="text-white/50 text-xs mb-1">Énergie</p>
            <p className="text-white font-semibold">{readinessScore.energy}</p>
          </div>
          <div className="text-center">
            <p className="text-white/50 text-xs mb-1">Consistance</p>
            <p className="text-white font-semibold">{readinessScore.consistency}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default TodayEnergyLevelIndicator;
