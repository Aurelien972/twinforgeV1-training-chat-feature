import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle, SkeletonButton } from '../SkeletonUtilities';

interface HeroTrainingCTASkeletonProps {
  stepColor?: string;
}

const HeroTrainingCTASkeleton: React.FC<HeroTrainingCTASkeletonProps> = ({
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      <SkeletonCard stepColor={stepColor} padding="32px">
        <div className="text-center mb-6">
          <SkeletonCircle size={80} className="mx-auto mb-4" />
          <SkeletonBar width="60%" height="32px" className="mb-3 mx-auto" />
          <SkeletonBar width="80%" height="18px" className="mb-2 mx-auto" />
          <SkeletonBar width="70%" height="18px" className="mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                textAlign: 'center'
              }}
            >
              <SkeletonBar width="70%" height="28px" className="mb-2 mx-auto" />
              <SkeletonBar width="60%" height="14px" className="mx-auto" />
            </div>
          ))}
        </div>

        <SkeletonButton height="64px" />
      </SkeletonCard>
    </motion.div>
  );
};

export default HeroTrainingCTASkeleton;
