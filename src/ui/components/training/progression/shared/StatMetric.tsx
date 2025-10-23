/**
 * StatMetric Component
 * Displays a single metric with icon and label
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { StatMetricProps } from '../types';
import { ICON_SIZES } from '../config/constants';

const StatMetric: React.FC<StatMetricProps> = ({
  icon,
  value,
  label,
  color,
  size = 'md',
  animated = true,
}) => {
  const iconSize = size === 'sm' ? ICON_SIZES.SM : size === 'lg' ? ICON_SIZES.LG : ICON_SIZES.MD;
  const valueSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const labelSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  const content = (
    <div className="text-center">
      <SpatialIcon
        Icon={ICONS[icon]}
        size={iconSize}
        style={{ color, margin: '0 auto 8px' }}
      />
      <div
        className={`${valueSize} font-bold text-white mb-1`}
        style={{ textShadow: `0 0 12px ${color}40` }}
      >
        {value}
      </div>
      <div className={`${labelSize} text-white/60`}>{label}</div>
    </div>
  );
  
  if (!animated) return content;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
};

export default React.memo(StatMetric);
