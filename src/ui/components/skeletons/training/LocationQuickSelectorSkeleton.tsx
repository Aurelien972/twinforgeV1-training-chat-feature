import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle, SkeletonButton } from '../SkeletonUtilities';

interface LocationQuickSelectorSkeletonProps {
  stepColor?: string;
}

const LocationQuickSelectorSkeleton: React.FC<LocationQuickSelectorSkeletonProps> = ({
  stepColor = '#06B6D4'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="20px">
        <div className="flex items-center gap-3 mb-6">
          <SkeletonCircle size={48} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="50%" height="20px" />
            <div className="mt-2">
              <SkeletonBar width="35%" height="14px" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <SkeletonCircle size={32} />
              <SkeletonBar width="80%" height="14px" />
            </div>
          ))}
        </div>

        <SkeletonButton height="44px" />
      </SkeletonCard>
    </motion.div>
  );
};

export default LocationQuickSelectorSkeleton;
