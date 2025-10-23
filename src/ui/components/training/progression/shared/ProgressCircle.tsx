/**
 * ProgressCircle Component
 * Circular progress indicator
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressCircleProps {
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  animated?: boolean;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  color,
  size = 80,
  strokeWidth = 8,
  showPercentage = true,
  animated = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }}
        />
      </svg>
      
      {showPercentage && (
        <div
          className="absolute inset-0 flex items-center justify-center text-white font-bold"
          style={{ fontSize: size / 4 }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

export default React.memo(ProgressCircle);
