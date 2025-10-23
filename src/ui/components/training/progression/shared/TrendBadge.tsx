/**
 * TrendBadge Component
 * Displays trend indicator with arrow and percentage
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { formatImprovement } from '../utils/formatters';
import { getImprovementColor } from '../utils/recordComparisons';

interface TrendBadgeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
}

const TrendBadge: React.FC<TrendBadgeProps> = ({
  value,
  size = 'md',
  showIcon = true,
  animated = true,
}) => {
  const color = getImprovementColor(value);
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  
  const badge = (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        color: color,
      }}
    >
      {showIcon && !isNeutral && (
        <SpatialIcon
          Icon={isPositive ? ICONS.TrendingUp : ICONS.TrendingDown}
          size={iconSize}
          style={{ color }}
        />
      )}
      <span>{formatImprovement(value)}</span>
    </div>
  );
  
  if (!animated) return badge;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {badge}
    </motion.div>
  );
};

export default React.memo(TrendBadge);
