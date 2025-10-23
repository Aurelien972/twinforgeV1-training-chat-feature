/**
 * Personalized Metrics Card Skeleton
 * Loading skeleton for performance metrics card
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import '../../../../styles/components/training/exercise-card-skeleton.css';

interface PersonalizedMetricsCardSkeletonProps {
  stepColor: string;
}

const PersonalizedMetricsCardSkeleton: React.FC<PersonalizedMetricsCardSkeletonProps> = ({ stepColor }) => {
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
            radial-gradient(ellipse at 20% 10%, color-mix(in srgb, ${stepColor} 8%, transparent) 0%, transparent 50%),
            var(--liquid-glass-bg-elevated)
          `,
          border: `1.5px solid color-mix(in srgb, ${stepColor} 18%, rgba(255, 255, 255, 0.12))`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          overflow: 'hidden',
          position: 'relative',
          padding: '24px'
        }}
      >
        <div className="skeleton-shimmer" />

        <div className="flex items-center gap-3 mb-6">
          <div
            className="skeleton-bar"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="skeleton-bar h-6"
              style={{
                width: '60%',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px'
              }}
            />
            <div
              className="skeleton-bar h-4"
              style={{
                width: '40%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton-stat-box"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div
                className="skeleton-bar h-8"
                style={{
                  width: '60%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px'
                }}
              />
              <div
                className="skeleton-bar h-3"
                style={{
                  width: '80%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '4px'
                }}
              />
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default PersonalizedMetricsCardSkeleton;
