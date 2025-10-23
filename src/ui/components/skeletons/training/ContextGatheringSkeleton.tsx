import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonGrid } from '../SkeletonUtilities';
import LocationQuickSelectorSkeleton from './LocationQuickSelectorSkeleton';
import DisciplineSelectorSkeleton from './DisciplineSelectorSkeleton';

interface ContextGatheringSkeletonProps {
  stepColor?: string;
}

const ContextGatheringSkeleton: React.FC<ContextGatheringSkeletonProps> = ({
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <DisciplineSelectorSkeleton stepColor={stepColor} />

      <LocationQuickSelectorSkeleton stepColor={stepColor} />

      <SkeletonCard stepColor={stepColor} padding="20px">
        <SkeletonBar width="40%" height="18px" className="mb-4" />
        <SkeletonBar width="100%" height="80px" style={{ borderRadius: '12px' }} />
      </SkeletonCard>

      <SkeletonCard stepColor={stepColor} padding="20px">
        <SkeletonBar width="35%" height="18px" className="mb-4" />
        <SkeletonGrid columns={3} rows={1} gap={12} itemHeight="60px" />
      </SkeletonCard>
    </motion.div>
  );
};

export default ContextGatheringSkeleton;
