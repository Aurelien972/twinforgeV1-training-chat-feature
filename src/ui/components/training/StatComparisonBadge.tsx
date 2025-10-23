/**
 * StatComparisonBadge Component
 * Badge showing comparison with previous period
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';

interface StatComparisonBadgeProps {
  current: number;
  previous: number;
  unit?: string;
  label: string;
  color: string;
  inverse?: boolean;
  className?: string;
}

const StatComparisonBadge: React.FC<StatComparisonBadgeProps> = ({
  current,
  previous,
  unit = '',
  label,
  color,
  inverse = false,
  className = ''
}) => {
  const diff = current - previous;
  const percentChange = previous !== 0 ? (diff / previous) * 100 : 0;
  const isPositive = inverse ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;

  const trendColor = isNeutral ? '#94A3B8' : isPositive ? '#22C55E' : '#EF4444';
  const trendIcon = isNeutral ? ICONS.Minus : isPositive ? ICONS.ArrowUp : ICONS.ArrowDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/60 font-medium">{label}</span>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{
            background: `color-mix(in srgb, ${trendColor} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${trendColor} 30%, transparent)`
          }}
        >
          <SpatialIcon Icon={trendIcon} size={10} style={{ color: trendColor }} />
          <span className="text-xs font-bold" style={{ color: trendColor }}>
            {Math.abs(percentChange).toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold"
          style={{
            color: color,
            textShadow: `0 0 16px ${color}40`
          }}
        >
          {current.toLocaleString()}{unit}
        </span>
        <span className="text-sm text-white/40">
          vs {previous.toLocaleString()}{unit}
        </span>
      </div>
    </motion.div>
  );
};

export default StatComparisonBadge;
