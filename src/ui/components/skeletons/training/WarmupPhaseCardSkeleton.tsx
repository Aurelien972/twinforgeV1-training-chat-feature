import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonText } from '../SkeletonUtilities';

interface WarmupPhaseCardSkeletonProps {
  stepColor?: string;
}

const WarmupPhaseCardSkeleton: React.FC<WarmupPhaseCardSkeletonProps> = ({
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
        <div className="text-center mb-6">
          <SkeletonBar width="50%" height="24px" className="mb-3 mx-auto" />
          <SkeletonBar width="70%" height="16px" className="mx-auto" />
        </div>

        <div className="space-y-4 mb-6">
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
              <SkeletonBar width="60%" height="16px" className="mb-2" />
              <SkeletonText lines={2} widths={['85%', '65%']} />
            </div>
          ))}
        </div>

        <SkeletonBar width="100%" height="52px" style={{ borderRadius: '16px' }} />
      </SkeletonCard>
    </motion.div>
  );
};

export default WarmupPhaseCardSkeleton;
