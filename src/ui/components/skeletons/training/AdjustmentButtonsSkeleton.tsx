import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonButton } from '../SkeletonUtilities';

interface AdjustmentButtonsSkeletonProps {
  stepColor?: string;
  count?: number;
}

const AdjustmentButtonsSkeleton: React.FC<AdjustmentButtonsSkeletonProps> = ({
  stepColor = '#18E3FF',
  count = 3
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
      style={{ paddingTop: '16px', marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1 }}>
          <SkeletonButton height="48px" />
        </div>
      ))}
    </motion.div>
  );
};

export default AdjustmentButtonsSkeleton;
