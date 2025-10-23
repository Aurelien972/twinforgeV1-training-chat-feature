/**
 * ScoreGlobalCard Component
 * Premium glass card displaying the overall session performance score
 * with circular progress indicator, glow effects, and smooth animations
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import { CircularProgress } from '../shared';
import type { ScoreGlobalCardProps } from '../types';
import { RATING_COLORS, RATING_LABELS, RATING_ICONS, BREAKPOINTS } from '../config/constants';

const ScoreGlobalCard: React.FC<ScoreGlobalCardProps> = ({
  score,
  rating,
  summary,
  coachRationale,
  stepColor,
}) => {
  const reduceMotion = useReducedMotion();

  const scoreColor = RATING_COLORS[rating];
  const scoreLabel = RATING_LABELS[rating];
  const scoreIcon = RATING_ICONS[rating];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.MD;

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
          <CircularProgress
            score={score}
            color={scoreColor}
            size={isMobile ? 'mobile' : 'desktop'}
          >
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
          </CircularProgress>

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
