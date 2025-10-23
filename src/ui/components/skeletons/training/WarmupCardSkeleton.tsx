import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle, SkeletonText } from '../SkeletonUtilities';

interface WarmupCardSkeletonProps {
  stepColor?: string;
}

const WarmupCardSkeleton: React.FC<WarmupCardSkeletonProps> = ({
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
          <SkeletonCircle size={40} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="45%" height="20px" />
            <div className="mt-2">
              <SkeletonBar width="60%" height="14px" />
            </div>
          </div>
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
              <SkeletonBar width="70%" height="16px" className="mb-2" />
              <SkeletonText lines={2} widths={['90%', '60%']} />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default WarmupCardSkeleton;
