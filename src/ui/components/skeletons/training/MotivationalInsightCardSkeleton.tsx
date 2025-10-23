import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface MotivationalInsightCardSkeletonProps {
  stepColor?: string;
}

const MotivationalInsightCardSkeleton: React.FC<MotivationalInsightCardSkeletonProps> = ({
  stepColor = '#8B5CF6'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="24px">
        <div className="flex items-start gap-4 mb-4">
          <SkeletonCircle size={48} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="60%" height="20px" className="mb-3" />
            <SkeletonBar width="100%" height="14px" className="mb-2" />
            <SkeletonBar width="95%" height="14px" className="mb-2" />
            <SkeletonBar width="70%" height="14px" />
          </div>
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default MotivationalInsightCardSkeleton;
