import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface QuickHistoryCardSkeletonProps {
  stepColor?: string;
}

const QuickHistoryCardSkeleton: React.FC<QuickHistoryCardSkeletonProps> = ({
  stepColor = '#6366F1'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="24px">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SkeletonCircle size={40} />
            <SkeletonBar width="150px" height="20px" />
          </div>
          <SkeletonBar width="60px" height="32px" style={{ borderRadius: '16px' }} />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <SkeletonBar width="50%" height="16px" />
                <SkeletonBar width="60px" height="14px" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonCircle size={20} />
                <SkeletonBar width="70%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default QuickHistoryCardSkeleton;
