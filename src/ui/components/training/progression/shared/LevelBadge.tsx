/**
 * LevelBadge Component
 * Displays user level with visual styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LevelBadgeProps } from '../types';
import { BADGE_SIZES, PROGRESSION_COLORS } from '../config/constants';
import { formatLevel } from '../utils/formatters';

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  title,
  color = PROGRESSION_COLORS.LEVEL,
  size = 'md',
  animated = true,
}) => {
  const sizeConfig = BADGE_SIZES[size];
  
  const badge = (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: sizeConfig.width,
        height: sizeConfig.height,
        background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 30%, transparent) 0%, color-mix(in srgb, ${color} 10%, transparent) 70%, transparent 100%), rgba(255, 255, 255, 0.05)`,
        border: `3px solid ${color}`,
        boxShadow: `0 0 24px ${color}66, 0 8px 32px rgba(0, 0, 0, 0.3)`,
      }}
    >
      <div className="text-center">
        <div
          className="leading-none"
          style={{
            fontSize: sizeConfig.iconSize,
            color: color,
            textShadow: `0 0 16px ${color}80`,
          }}
        >
          {level}
        </div>
        {title && size !== 'sm' && (
          <div
            className="mt-1 text-xs text-white/70"
            style={{ fontSize: size === 'xl' ? 14 : 10 }}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  );
  
  if (!animated) return badge;
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
    >
      {badge}
    </motion.div>
  );
};

export default React.memo(LevelBadge);
