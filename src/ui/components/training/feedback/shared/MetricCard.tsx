/**
 * MetricCard Component
 * Reusable card for displaying individual metrics
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlowIcon from '../../GlowIcon';
import type { IconName } from '../../../../icons/registry';

interface MetricCardProps {
  icon: IconName;
  color: string;
  value: string;
  label: string;
  delay?: number;
  glowIntensity?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  color,
  value,
  label,
  delay = 0,
  glowIntensity = 35,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className="p-4 rounded-xl"
        style={{
          background: `
            radial-gradient(circle at 50% 30%, color-mix(in srgb, ${color} 10%, transparent) 0%, transparent 70%),
            rgba(255, 255, 255, 0.05)
          `,
          border: `1.5px solid color-mix(in srgb, ${color} 20%, transparent)`,
          boxShadow: `0 2px 12px rgba(0, 0, 0, 0.15)`,
        }}
      >
        <div className="flex justify-center mb-2">
          <GlowIcon icon={icon} color={color} size="small" glowIntensity={glowIntensity} />
        </div>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.1, type: 'spring', stiffness: 300 }}
          className="text-2xl font-bold text-white mb-1 text-center"
          style={{
            textShadow: `0 0 20px color-mix(in srgb, ${color} 40%, transparent)`,
          }}
        >
          {value}
        </motion.div>
        <div className="text-xs text-white/60 font-medium text-center">{label}</div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
