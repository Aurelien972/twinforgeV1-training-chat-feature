import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonGrid, SkeletonStatBox } from '../SkeletonUtilities';

interface TrainingPrescriptionCardSkeletonProps {
  stepColor?: string;
  className?: string;
}

const TrainingPrescriptionCardSkeleton: React.FC<TrainingPrescriptionCardSkeletonProps> = ({
  stepColor = '#18E3FF',
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="24px" className={className}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div style={{ flex: 1 }}>
            <SkeletonBar width="65%" height="24px" className="mb-2" />
            <SkeletonBar width="45%" height="16px" />
          </div>
          <SkeletonBar
            width="80px"
            height="28px"
            style={{ borderRadius: '14px' }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <SkeletonStatBox key={i} stepColor={stepColor} />
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <SkeletonBar
              key={i}
              width={`${60 + i * 10}px`}
              height="24px"
              style={{ borderRadius: '12px' }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-6 mt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '48px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}
            />
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default TrainingPrescriptionCardSkeleton;
