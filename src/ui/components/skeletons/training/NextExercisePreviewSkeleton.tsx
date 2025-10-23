import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface NextExercisePreviewSkeletonProps {
  stepColor?: string;
}

const NextExercisePreviewSkeleton: React.FC<NextExercisePreviewSkeletonProps> = ({
  stepColor = '#10B981'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="16px">
        <div className="flex items-center gap-3">
          <SkeletonCircle size={40} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="35%" height="14px" className="mb-2" />
            <SkeletonBar width="60%" height="18px" />
          </div>
          <SkeletonBar width="50px" height="24px" style={{ borderRadius: '12px' }} />
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default NextExercisePreviewSkeleton;
