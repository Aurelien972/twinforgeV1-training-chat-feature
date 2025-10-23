/**
 * ProgressBarAnimated Component
 * Animated progress bar with gradient and glow
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarAnimatedProps {
  progress: number;
  color: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const ProgressBarAnimated: React.FC<ProgressBarAnimatedProps> = ({
  progress,
  color,
  height = 8,
  showLabel = false,
  label,
  animated = true,
  className = ''
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70">{label}</span>
          <span className="font-semibold text-white">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div
        className="rounded-full overflow-hidden"
        style={{
          height: `${height}px`,
          background: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <motion.div
          initial={animated ? { width: 0 } : { width: `${clampedProgress}%` }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: animated ? 1 : 0,
            ease: 'easeOut',
            delay: animated ? 0.2 : 0
          }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))`,
            boxShadow: `0 0 ${height * 1.5}px color-mix(in srgb, ${color} 60%, transparent)`
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBarAnimated;
