/**
 * ScoreGlobalCard Component
 * Premium glass card displaying the overall session performance score
 * with circular progress indicator, glow effects, and smooth animations
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';

interface ScoreGlobalCardProps {
  score: number;
  rating: 'excellent' | 'good' | 'average' | 'needs-improvement';
  summary: string;
  coachRationale: string;
  stepColor: string;
}

const ScoreGlobalCard: React.FC<ScoreGlobalCardProps> = ({
  score,
  rating,
  summary,
  coachRationale,
  stepColor,
}) => {
  const reduceMotion = useReducedMotion();

  // Color mapping based on rating
  const ratingColors = {
    excellent: '#10B981', // Green
    good: '#3B82F6', // Blue
    average: '#F59E0B', // Amber
    'needs-improvement': '#EF4444', // Red
  };

  const ratingLabels = {
    excellent: 'Excellent',
    good: 'Bien',
    average: 'Correct',
    'needs-improvement': 'À Améliorer',
  };

  const ratingIcons = {
    excellent: 'Trophy',
    good: 'Star',
    average: 'TrendingUp',
    'needs-improvement': 'Target',
  };

  const scoreColor = ratingColors[rating];
  const scoreLabel = ratingLabels[rating];
  const scoreIcon = ratingIcons[rating];

  // Circular progress calculation
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Responsive adjustments
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const circleSize = isMobile ? 140 : 160;
  const circleRadius = isMobile ? 55 : 60;
  const circleCenterX = circleSize / 2;
  const circleCenterY = circleSize / 2;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleStrokeDashoffset = circleCircumference - (score / 100) * circleCircumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.4,
        ease: 'easeOut',
      }}
    >
      <GlassCard
        className="relative overflow-visible"
        size={isMobile ? 'base' : 'lg'}
        elevation="lg"
        interactive={false}
        style={{
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${scoreColor} 12%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.095)
          `,
          border: `2px solid color-mix(in srgb, ${scoreColor} 28%, transparent)`,
          borderRadius: isMobile ? '20px' : '24px',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 48px color-mix(in srgb, ${scoreColor} 22%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `,
        }}
      >

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {/* Left: Circular Score Display */}
          <div className="relative flex-shrink-0">
            {/* SVG Circle Progress */}
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
                strokeWidth={isMobile ? 10 : 12}
                fill="none"
              />
              {/* Progress circle */}
              <motion.circle
                cx={circleCenterX}
                cy={circleCenterY}
                r={circleRadius}
                stroke={scoreColor}
                strokeWidth={isMobile ? 10 : 12}
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
                  filter: `drop-shadow(0 0 ${isMobile ? 8 : 12}px ${scoreColor})`,
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.4,
                }}
                className="flex flex-col items-center"
              >
                <div className="mb-1">
                  <GlowIcon
                    icon={scoreIcon as any}
                    color={scoreColor}
                    size={isMobile ? 'small' : 'medium'}
                    glowIntensity={50}
                    animate={true}
                  />
                </div>
                <div
                  className={isMobile ? 'text-4xl font-bold' : 'text-5xl font-bold'}
                  style={{
                    color: scoreColor,
                    textShadow: `0 0 24px ${scoreColor}40`,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {score}
                </div>
                <div className="text-xs text-white/60 font-medium mt-0.5">/ 100</div>
              </motion.div>
            </div>
          </div>

          {/* Right: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex-1 space-y-2 md:space-y-3 text-center md:text-left"
          >
            {/* Rating Label */}
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div
                className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold uppercase tracking-wider`}
                style={{ color: scoreColor }}
              >
                {scoreLabel}
              </div>
            </div>

            {/* Summary */}
            <p className={`text-white/85 ${isMobile ? 'text-sm' : 'text-base'} leading-relaxed max-w-lg`}>
              {summary}
            </p>

            {/* Coach Rationale */}
            {coachRationale && (
              <div className="pt-2 border-t border-white/10">
                <p className={`text-white/60 ${isMobile ? 'text-xs' : 'text-sm'} italic leading-relaxed`}>
                  {coachRationale}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ScoreGlobalCard;
