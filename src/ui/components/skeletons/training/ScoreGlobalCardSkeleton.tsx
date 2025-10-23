/**
 * Score Global Card Skeleton
 * Loading skeleton for global score card
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import '../../../../styles/components/training/exercise-card-skeleton.css';

interface ScoreGlobalCardSkeletonProps {
  stepColor: string;
}

const ScoreGlobalCardSkeleton: React.FC<ScoreGlobalCardSkeletonProps> = ({ stepColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard
        className="exercise-card-skeleton"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 60%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          overflow: 'hidden',
          position: 'relative',
          padding: '32px 24px',
          textAlign: 'center'
        }}
      >
        <div className="skeleton-shimmer" />

        <div className="flex flex-col items-center gap-4">
          <div
            className="skeleton-bar"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
          />

          <div className="flex flex-col items-center gap-2 w-full">
            <div
              className="skeleton-bar h-8"
              style={{
                width: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '8px'
              }}
            />
            <div
              className="skeleton-bar h-5"
              style={{
                width: '35%',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '6px'
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2 w-full mt-4">
            <div
              className="skeleton-bar h-4"
              style={{
                width: '80%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px'
              }}
            />
            <div
              className="skeleton-bar h-4"
              style={{
                width: '70%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px'
              }}
            />
            <div
              className="skeleton-bar h-4"
              style={{
                width: '75%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ScoreGlobalCardSkeleton;
