/**
 * Exercise Card Skeleton
 * VisionOS-style animated skeleton loader for exercise cards
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../cards/GlassCard';
import '../../../styles/components/training/exercise-card-skeleton.css';

interface ExerciseCardSkeletonProps {
  stepColor: string;
  className?: string;
}

const ExerciseCardSkeleton: React.FC<ExerciseCardSkeletonProps> = ({
  stepColor,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard
        className={`exercise-card-skeleton ${className}`}
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, color-mix(in srgb, ${stepColor} 8%, transparent) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `1.5px solid color-mix(in srgb, ${stepColor} 18%, rgba(255, 255, 255, 0.12))`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          overflow: 'hidden',
          position: 'relative',
          padding: '24px'
        }}
      >
        {/* Shimmer wave effect */}
        <div className="skeleton-shimmer" />

        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 space-y-2">
            <div
              className="skeleton-bar h-6"
              style={{
                width: '65%',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px'
              }}
            />
            <div
              className="skeleton-bar h-4"
              style={{
                width: '45%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px'
              }}
            />
          </div>
          <div
            className="skeleton-bar"
            style={{
              width: '80px',
              height: '28px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '14px'
            }}
          />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-stat-box"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div
                className="skeleton-bar h-8"
                style={{
                  width: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px'
                }}
              />
              <div
                className="skeleton-bar h-3"
                style={{
                  width: '70%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '4px'
                }}
              />
            </div>
          ))}
        </div>

        {/* Secondary details skeleton */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-bar"
              style={{
                width: `${60 + i * 10}px`,
                height: '24px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '12px'
              }}
            />
          ))}
        </div>

        {/* Feedback buttons skeleton */}
        <div className="flex items-center gap-3 pt-6 mt-2 border-t border-white/8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-button flex-1"
              style={{
                height: '48px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}
            />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ExerciseCardSkeleton;
