/**
 * TrendIndicator Component
 * Visual indicator for trend direction with color coding
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  suffix = '%',
  size = 'medium',
  showIcon = true,
  className = ''
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const color = isNeutral ? '#94A3B8' : isPositive ? '#22C55E' : '#EF4444';
  const icon = isNeutral ? ICONS.Minus : isPositive ? ICONS.TrendingUp : ICONS.TrendingDown;

  const sizeConfig = {
    small: { text: 'text-xs', icon: 14 },
    medium: { text: 'text-sm', icon: 16 },
    large: { text: 'text-base', icon: 18 }
  };

  const config = sizeConfig[size];
  const displayValue = Math.abs(value).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {showIcon && (
        <SpatialIcon
          Icon={icon}
          size={config.icon}
          style={{ color }}
        />
      )}
      <span
        className={`font-semibold ${config.text}`}
        style={{ color }}
      >
        {isPositive ? '+' : ''}{displayValue}{suffix}
      </span>
    </motion.div>
  );
};

export default TrendIndicator;
