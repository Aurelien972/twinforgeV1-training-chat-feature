/**
 * ProgressBar Component
 * Reusable animated progress bar
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  color: string;
  height?: number;
  showShimmer?: boolean;
  duration?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 2,
  showShimmer = false,
  duration = 0.3,
}) => {
  return (
    <div
      className="relative rounded-full bg-white/10 overflow-hidden"
      style={{ height: `${height * 4}px` }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}CC 0%, ${color} 100%)`,
          boxShadow: `0 0 12px ${color}60, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration, ease: 'easeOut' }}
      />

      {showShimmer && progress < 100 && (
        <motion.div
          className="absolute inset-y-0 w-20 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
            left: `${progress - 10}%`,
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
};

export default ProgressBar;
