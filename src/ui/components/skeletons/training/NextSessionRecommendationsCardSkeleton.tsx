import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface NextSessionRecommendationsCardSkeletonProps {
  stepColor?: string;
}

const NextSessionRecommendationsCardSkeleton: React.FC<NextSessionRecommendationsCardSkeletonProps> = ({
  stepColor = '#18E3FF'
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
          <SkeletonCircle size={40} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="55%" height="20px" className="mb-2" />
            <SkeletonBar width="40%" height="14px" />
          </div>
        </div>

        <div className="space-y-4">
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
              <div className="flex items-center gap-3 mb-3">
                <SkeletonCircle size={28} />
                <SkeletonBar width="60%" height="16px" />
              </div>
              <SkeletonBar width="100%" height="12px" className="mb-2" />
              <SkeletonBar width="85%" height="12px" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default NextSessionRecommendationsCardSkeleton;
