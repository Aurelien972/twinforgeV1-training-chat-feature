/**
 * OptimalTrainingWindow
 * Affiche la fenêtre optimale calculée pour l'entraînement
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { OptimalWindow } from '../../../../system/services/trainingTodayDynamicService';

const TRAINING_COLOR = '#18E3FF';

interface OptimalTrainingWindowProps {
  window?: OptimalWindow;
  hoursUntil?: number;
}

const OptimalTrainingWindow: React.FC<OptimalTrainingWindowProps> = ({
  window,
  hoursUntil,
}) => {
  // Defensive check: ensure window object has required properties
  // If no window data is provided, don't render the component
  if (!window || !window.start || !window.end) {
    return null;
  }
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return '#22C55E';
      case 'medium':
        return TRAINING_COLOR;
      case 'low':
        return '#F59E0B';
      default:
        return TRAINING_COLOR;
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'Haute confiance';
      case 'medium':
        return 'Confiance moyenne';
      case 'low':
        return 'Faible confiance';
      default:
        return 'Calculé';
    }
  };

  const isWindowActive = () => {
    const now = new Date();
    return now >= window.start && now <= window.end;
  };

  const getCountdownText = () => {
    if (!hoursUntil) return null;

    if (hoursUntil < 0) {
      return 'Fenêtre en cours';
    } else if (hoursUntil < 1) {
      const minutes = Math.round(hoursUntil * 60);
      return `Dans ${minutes} minutes`;
    } else {
      return `Dans ${Math.round(hoursUntil)}h`;
    }
  };

  // Safe access to confidence with fallback
  const confidence = window.confidence || 'medium';
  const confidenceColor = getConfidenceColor(confidence);
  const isActive = isWindowActive();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: isActive
            ? `radial-gradient(circle at 30% 20%, ${confidenceColor}15 0%, transparent 60%), rgba(255, 255, 255, 0.08)`
            : 'rgba(255, 255, 255, 0.08)',
          border: isActive
            ? `1px solid ${confidenceColor}40`
            : '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GlowIcon
              icon="Clock"
              color={confidenceColor}
              size="small"
            />
            <div>
              <h3 className="text-lg font-bold text-white">Fenêtre Optimale</h3>
              <p className="text-white/60 text-sm">
                {getConfidenceLabel(confidence)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {isActive && (
            <motion.div
              className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
              style={{
                background: `${confidenceColor}25`,
                color: confidenceColor,
                border: `1px solid ${confidenceColor}50`,
              }}
              animate={{
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: confidenceColor }}
              />
              EN COURS
            </motion.div>
          )}
        </div>

        {/* Time Window */}
        <div
          className="p-4 rounded-xl mb-4"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">Début</p>
              <p className="text-white font-bold text-xl">
                {format(window.start, 'HH:mm')}
              </p>
            </div>

            <SpatialIcon
              Icon={ICONS.ArrowRight}
              size={20}
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            />

            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">Fin</p>
              <p className="text-white font-bold text-xl">
                {format(window.end, 'HH:mm')}
              </p>
            </div>
          </div>
        </div>

        {/* Countdown */}
        {hoursUntil !== undefined && !isActive && hoursUntil >= 0 && (
          <div
            className="px-4 py-3 rounded-lg mb-4 text-center"
            style={{
              background: `${confidenceColor}15`,
              border: `1px solid ${confidenceColor}30`,
            }}
          >
            <p className="text-white font-medium text-sm">
              {getCountdownText()}
            </p>
          </div>
        )}

        {/* Reasoning */}
        <div className="flex items-start gap-2">
          <SpatialIcon
            Icon={ICONS.Info}
            size={16}
            style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}
          />
          <p className="text-white/70 text-xs">
            {window.reasoning || 'Fen\u00eatre calcul\u00e9e en fonction de vos donn\u00e9es'}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default OptimalTrainingWindow;
