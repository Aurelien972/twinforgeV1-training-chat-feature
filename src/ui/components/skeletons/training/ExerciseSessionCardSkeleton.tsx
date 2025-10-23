import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle, SkeletonGrid } from '../SkeletonUtilities';

interface ExerciseSessionCardSkeletonProps {
  stepColor?: string;
}

const ExerciseSessionCardSkeleton: React.FC<ExerciseSessionCardSkeletonProps> = ({
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <SkeletonCard stepColor={stepColor} padding="28px">
        <div className="flex items-center justify-between mb-6">
          <div style={{ flex: 1 }}>
            <SkeletonBar width="70%" height="28px" className="mb-3" />
            <SkeletonBar width="50%" height="18px" />
          </div>
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px'
            }}
          >
            <SkeletonBar width="40px" height="20px" />
          </div>
        </div>

        <div className="mb-6">
          <SkeletonCircle size={120} className="mx-auto mb-4" />
          <SkeletonBar width="30%" height="16px" className="mx-auto" />
        </div>

        <SkeletonGrid columns={3} rows={1} gap={16} itemHeight="90px" className="mb-6" />

        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <SkeletonBar
              key={i}
              width={`${60 + i * 15}px`}
              height="32px"
              style={{ borderRadius: '16px' }}
            />
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
          <SkeletonBar width="100%" height="56px" style={{ borderRadius: '16px' }} />
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default ExerciseSessionCardSkeleton;
