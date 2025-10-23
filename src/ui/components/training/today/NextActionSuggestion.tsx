/**
 * NextActionSuggestion Component
 * AI-powered light suggestion based on patterns
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { NextActionSuggestionData } from '../../../../domain/trainingToday';

const TRAINING_COLOR = '#18E3FF';

const NextActionSuggestion: React.FC = () => {
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState<NextActionSuggestionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        const suggestionData = await trainingTodayService.getNextActionSuggestion();
        setSuggestion(suggestionData);
      } catch (error) {
        console.error('Error loading suggestion:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestion();
  }, []);

  const getIntensityColor = (intensity: string): string => {
    if (intensity === 'intense') return '#22C55E';
    if (intensity === 'moderate') return '#F59E0B';
    return TRAINING_COLOR;
  };

  const getIntensityLabel = (intensity: string): string => {
    if (intensity === 'intense') return 'Intense';
    if (intensity === 'moderate') return 'Modérée';
    return 'Légère';
  };

  const formatSuggestedTime = (date: Date | null): string => {
    if (!date) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`;
  };

  if (loading || !suggestion) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <GlassCard
        className="p-5 space-y-3"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
          border: `1px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`,
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 16px color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent)`
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <GlowIcon icon="Sparkles" color={TRAINING_COLOR} size="small" />

          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm mb-3">
              Suggestion du Jour
            </h4>
            <p className="text-white text-base leading-snug mb-2">
              {suggestion.suggestion}
            </p>

            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs">
              {suggestion.suggestedTime && (
                <div className="flex items-center gap-1 text-white/60">
                  <SpatialIcon Icon={ICONS.Clock} size={12} />
                  <span>{formatSuggestedTime(suggestion.suggestedTime)}</span>
                </div>
              )}

              <div
                className="px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `color-mix(in srgb, ${getIntensityColor(suggestion.intensity)} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${getIntensityColor(suggestion.intensity)} 25%, transparent)`,
                  color: getIntensityColor(suggestion.intensity)
                }}
              >
                {getIntensityLabel(suggestion.intensity)}
              </div>

              <div className="flex items-center gap-1 text-white/50">
                <SpatialIcon Icon={ICONS.Target} size={12} />
                <span>{Math.round(suggestion.confidence * 100)}% confiance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason (subtle) */}
        <div
          className="p-2 rounded text-xs text-white/60"
          style={{
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          {suggestion.reason}
        </div>

        {/* CTA (discreet) */}
        <button
          onClick={() => navigate('/training?tab=conseils')}
          className="text-xs font-medium hover:underline transition-all"
          style={{ color: TRAINING_COLOR }}
        >
          Voir détails dans Conseils →
        </button>
      </GlassCard>
    </motion.div>
  );
};

export default NextActionSuggestion;
