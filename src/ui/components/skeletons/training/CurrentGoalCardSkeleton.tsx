import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface CurrentGoalCardSkeletonProps {
  stepColor?: string;
}

const CurrentGoalCardSkeleton: React.FC<CurrentGoalCardSkeletonProps> = ({
  stepColor = '#F59E0B'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="24px">
        <div className="flex items-center gap-3 mb-6">
          <SkeletonCircle size={48} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="40%" height="20px" className="mb-2" />
            <SkeletonBar width="55%" height="14px" />
          </div>
        </div>

        <div className="mb-6">
          <SkeletonBar width="100%" height="14px" className="mb-2" />
          <SkeletonBar width="90%" height="14px" />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <SkeletonBar width="30%" height="12px" />
            <SkeletonBar width="40px" height="16px" />
          </div>
          <SkeletonBar width="100%" height="12px" style={{ borderRadius: '6px' }} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <SkeletonBar width="60%" height="20px" className="mb-1 mx-auto" />
              <SkeletonBar width="80%" height="12px" className="mx-auto" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default CurrentGoalCardSkeleton;
