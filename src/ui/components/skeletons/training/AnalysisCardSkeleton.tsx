/**
 * Generic Analysis Card Skeleton
 * Reusable skeleton for various analysis cards
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import '../../../../styles/components/exercise-card-skeleton.css';

interface AnalysisCardSkeletonProps {
  stepColor: string;
  itemCount?: number;
}

const AnalysisCardSkeleton: React.FC<AnalysisCardSkeletonProps> = ({
  stepColor,
  itemCount = 3
}) => {
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
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="skeleton-bar h-6"
              style={{
                width: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '8px'
              }}
            />
            <div
              className="skeleton-bar h-4"
              style={{
                width: '35%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <div className="space-y-3">
                <div
                  className="skeleton-bar h-5"
                  style={{
                    width: '60%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px'
                  }}
                />
                <div
                  className="skeleton-bar h-4"
                  style={{
                    width: '85%',
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
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AnalysisCardSkeleton;
