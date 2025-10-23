import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle, SkeletonGrid } from '../SkeletonUtilities';

interface WearableInsightsCardSkeletonProps {
  stepColor?: string;
}

const WearableInsightsCardSkeleton: React.FC<WearableInsightsCardSkeletonProps> = ({
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
        <div className="flex items-center gap-3 mb-6">
          <SkeletonCircle size={48} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="55%" height="20px" className="mb-2" />
            <SkeletonBar width="70%" height="14px" />
          </div>
        </div>

        <SkeletonGrid columns={2} rows={2} gap={16} itemHeight="90px" className="mb-6" />

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}
            >
              <SkeletonBar width="60%" height="16px" className="mb-3" />
              <SkeletonBar width="100%" height="12px" className="mb-2" />
              <SkeletonBar width="85%" height="12px" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default WearableInsightsCardSkeleton;
