import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface RecoveryStatusCardSkeletonProps {
  stepColor?: string;
}

const RecoveryStatusCardSkeleton: React.FC<RecoveryStatusCardSkeletonProps> = ({
  stepColor = '#10B981'
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
            <SkeletonBar width="50%" height="20px" className="mb-2" />
            <SkeletonBar width="65%" height="14px" />
          </div>
        </div>

        <div className="mb-6">
          <SkeletonCircle size={120} className="mx-auto mb-4" />
          <SkeletonBar width="40%" height="24px" className="mx-auto mb-2" />
          <SkeletonBar width="50%" height="14px" className="mx-auto" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <SkeletonBar width="60%" height="20px" className="mb-2 mx-auto" />
              <SkeletonBar width="50%" height="12px" className="mx-auto" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default RecoveryStatusCardSkeleton;
