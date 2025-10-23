/**
 * CircularProgress Component
 * Reusable circular progress indicator
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CIRCLE_PROGRESS } from '../config/constants';

interface CircularProgressProps {
  score: number;
  color: string;
  size?: 'mobile' | 'desktop';
  strokeWidth?: number;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  color,
  size = 'desktop',
  strokeWidth,
  children,
}) => {
  const reduceMotion = useReducedMotion();

  const circleSize = size === 'mobile' ? CIRCLE_PROGRESS.MOBILE_SIZE : CIRCLE_PROGRESS.DESKTOP_SIZE;
  const circleRadius = size === 'mobile' ? CIRCLE_PROGRESS.MOBILE_RADIUS : CIRCLE_PROGRESS.DESKTOP_RADIUS;
  const defaultStrokeWidth = size === 'mobile' ? CIRCLE_PROGRESS.STROKE_WIDTH_MOBILE : CIRCLE_PROGRESS.STROKE_WIDTH_DESKTOP;
  const actualStrokeWidth = strokeWidth || defaultStrokeWidth;

  const circleCenterX = circleSize / 2;
  const circleCenterY = circleSize / 2;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleStrokeDashoffset = circleCircumference - (score / 100) * circleCircumference;

  return (
    <div className="relative flex-shrink-0">
      <svg
        width={circleSize}
        height={circleSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={circleCenterX}
          cy={circleCenterY}
          r={circleRadius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={actualStrokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={circleCenterX}
          cy={circleCenterY}
          r={circleRadius}
          stroke={color}
          strokeWidth={actualStrokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circleCircumference }}
          animate={{ strokeDashoffset: circleStrokeDashoffset }}
          transition={{
            duration: reduceMotion ? 0 : 1.5,
            ease: 'easeInOut',
            delay: 0.3,
          }}
          style={{
            strokeDasharray: circleCircumference,
            filter: `drop-shadow(0 0 ${size === 'mobile' ? 8 : 12}px ${color})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
