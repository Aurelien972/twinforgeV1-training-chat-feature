/**
 * Weekly Insight Card Skeleton
 * Loading state for the weekly insight card component
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import { SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface WeeklyInsightCardSkeletonProps {
  stepColor: string;
}

const WeeklyInsightCardSkeleton: React.FC<WeeklyInsightCardSkeletonProps> = ({ stepColor }) => {
  return (
    <GlassCard
      className="space-y-4"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.2),
          0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size={48} />
        <div className="flex-1 space-y-2">
          <SkeletonBar width="60%" height={20} />
          <SkeletonBar width="80%" height={14} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <SkeletonCircle size={20} className="mx-auto" />
          <SkeletonBar width="60%" height={12} className="mx-auto" />
          <SkeletonBar width="40%" height={18} className="mx-auto" />
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <SkeletonCircle size={20} className="mx-auto" />
          <SkeletonBar width="60%" height={12} className="mx-auto" />
          <SkeletonBar width="40%" height={18} className="mx-auto" />
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <SkeletonCircle size={20} className="mx-auto" />
          <SkeletonBar width="60%" height={12} className="mx-auto" />
          <SkeletonBar width="40%" height={18} className="mx-auto" />
        </div>
      </div>

      {/* Priority Today */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
        className="p-4 rounded-lg mt-4 mb-4"
        style={{
          background: `linear-gradient(135deg, ${stepColor}10 0%, transparent 100%)`,
          border: `1px solid ${stepColor}30`
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <SkeletonCircle size={20} />
          <div className="flex-1 space-y-2">
            <SkeletonBar width="50%" height={12} />
            <SkeletonBar width="70%" height={18} />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonBar width="100%" height={14} />
          <SkeletonBar width="90%" height={14} />
        </div>
      </motion.div>

      {/* Cycle Phase */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', delay: 0.2 }}
        className="p-4 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${stepColor}10 0%, transparent 100%)`,
          border: `1px solid ${stepColor}30`
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <SkeletonCircle size={20} />
            <div className="flex-1 space-y-2">
              <SkeletonBar width="60%" height={12} />
              <SkeletonBar width="80%" height={18} />
            </div>
          </div>
          <div className="space-y-2">
            <SkeletonBar width={60} height={12} />
            <SkeletonBar width={40} height={24} className="ml-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonBar width="100%" height={14} />
          <SkeletonBar width="85%" height={14} />
        </div>
      </motion.div>

      {/* CTA Button Skeleton */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', delay: 0.4 }}
        className="w-full py-4 px-6 rounded-xl mt-6"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <SkeletonBar width="60%" height={20} className="mx-auto" />
      </motion.div>
    </GlassCard>
  );
};

export default WeeklyInsightCardSkeleton;
