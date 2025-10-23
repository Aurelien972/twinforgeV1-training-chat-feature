/**
 * NextExercisePreview Component
 * Compact preview of the next exercise without full details
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';

interface NextExercisePreviewProps {
  exercise: Exercise;
  stepColor: string;
}

const NextExercisePreview: React.FC<NextExercisePreviewProps> = ({
  exercise,
  stepColor,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <GlassCard
        className="p-4"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, color-mix(in srgb, ${stepColor} 8%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.04)
          `,
          border: `1px solid color-mix(in srgb, ${stepColor} 15%, rgba(255, 255, 255, 0.1))`,
          backdropFilter: 'blur(16px) saturate(120%)',
          WebkitBackdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.08)
          `,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.08)
              `,
              border: `1px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
            }}
          >
            <SpatialIcon
              Icon={ICONS.SkipForward}
              size={18}
              style={{
                color: stepColor,
                opacity: 0.8,
              }}
            />
          </div>

          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">
              Prochain exercice
            </p>
            <h4 className="text-sm font-bold text-white truncate" style={{ letterSpacing: '-0.01em' }}>
              {exercise.name}
            </h4>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="px-2 py-1 rounded-lg text-xs font-bold"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {exercise.sets}×{exercise.reps}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default NextExercisePreview;
