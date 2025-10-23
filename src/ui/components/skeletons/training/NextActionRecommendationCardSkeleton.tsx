import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle, SkeletonButton } from '../SkeletonUtilities';

interface NextActionRecommendationCardSkeletonProps {
  stepColor?: string;
}

const NextActionRecommendationCardSkeleton: React.FC<NextActionRecommendationCardSkeletonProps> = ({
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <SkeletonCard stepColor={stepColor} padding="28px">
        <div className="flex items-center gap-4 mb-6">
          <SkeletonCircle size={56} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="50%" height="24px" className="mb-2" />
            <SkeletonBar width="70%" height="16px" />
          </div>
        </div>

        <div className="mb-6">
          <SkeletonBar width="100%" height="14px" className="mb-2" />
          <SkeletonBar width="95%" height="14px" className="mb-2" />
          <SkeletonBar width="80%" height="14px" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2].map((i) => (
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
              <SkeletonBar width="70%" height="28px" className="mb-2 mx-auto" />
              <SkeletonBar width="50%" height="14px" className="mx-auto" />
            </div>
          ))}
        </div>

        <SkeletonButton height="56px" />
      </SkeletonCard>
    </motion.div>
  );
};

export default NextActionRecommendationCardSkeleton;
