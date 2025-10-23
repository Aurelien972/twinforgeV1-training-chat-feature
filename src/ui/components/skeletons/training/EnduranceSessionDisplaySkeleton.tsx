import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface EnduranceSessionDisplaySkeletonProps {
  stepColor?: string;
}

const EnduranceSessionDisplaySkeleton: React.FC<EnduranceSessionDisplaySkeletonProps> = ({
  stepColor = '#10B981'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <SkeletonCard stepColor={stepColor} padding="24px">
        <div className="flex items-center justify-between mb-6">
          <div style={{ flex: 1 }}>
            <SkeletonBar width="50%" height="24px" className="mb-2" />
            <SkeletonBar width="70%" height="16px" />
          </div>
          <SkeletonCircle size={60} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
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
              <SkeletonBar width="60%" height="20px" className="mb-2 mx-auto" />
              <SkeletonBar width="40%" height="14px" className="mx-auto" />
            </div>
          ))}
        </div>

        <SkeletonBar width="100%" height="8px" style={{ borderRadius: '4px' }} />
      </SkeletonCard>

      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} stepColor={stepColor} padding="20px">
          <div className="flex items-center justify-between">
            <div style={{ flex: 1 }}>
              <SkeletonBar width="40%" height="18px" className="mb-2" />
              <SkeletonBar width="60%" height="14px" />
            </div>
            <SkeletonCircle size={40} />
          </div>
        </SkeletonCard>
      ))}
    </motion.div>
  );
};

export default EnduranceSessionDisplaySkeleton;
