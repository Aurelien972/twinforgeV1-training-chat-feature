import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface SessionTimerSkeletonProps {
  stepColor?: string;
}

const SessionTimerSkeleton: React.FC<SessionTimerSkeletonProps> = ({
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '100px',
        right: '24px',
        zIndex: 50
      }}
    >
      <div
        style={{
          padding: '20px',
          background: `
            radial-gradient(circle at 50% 30%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.1)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 30%, transparent)`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `0 8px 32px color-mix(in srgb, ${stepColor} 20%, transparent)`
        }}
      >
        <div className="text-center">
          <SkeletonBar width="80px" height="40px" className="mb-2 mx-auto" />
          <SkeletonBar width="60px" height="14px" className="mx-auto" />
        </div>
      </div>
    </motion.div>
  );
};

export default SessionTimerSkeleton;
