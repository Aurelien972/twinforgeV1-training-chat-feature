import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCircle, SkeletonBar } from '../SkeletonUtilities';

interface RestCountdownSkeletonProps {
  stepColor?: string;
}

const RestCountdownSkeleton: React.FC<RestCountdownSkeletonProps> = ({
  stepColor = '#10B981'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
        width: '90%',
        maxWidth: '400px'
      }}
    >
      <div
        style={{
          padding: '40px',
          background: `
            radial-gradient(circle at 50% 30%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%),
            rgba(0, 0, 0, 0.9)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
          borderRadius: '24px',
          backdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.4),
            0 0 100px color-mix(in srgb, ${stepColor} 30%, transparent)
          `,
          textAlign: 'center'
        }}
      >
        <SkeletonBar width="40%" height="20px" className="mb-6 mx-auto" />

        <SkeletonCircle size={160} className="mx-auto mb-6" />

        <SkeletonBar width="50%" height="24px" className="mb-4 mx-auto" />

        <div className="flex gap-3 justify-center">
          <SkeletonBar width="120px" height="48px" style={{ borderRadius: '12px' }} />
          <SkeletonBar width="120px" height="48px" style={{ borderRadius: '12px' }} />
        </div>
      </div>
    </motion.div>
  );
};

export default RestCountdownSkeleton;
