import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface FunctionalPrescriptionCardSkeletonProps {
  stepColor?: string;
}

const FunctionalPrescriptionCardSkeleton: React.FC<FunctionalPrescriptionCardSkeletonProps> = ({
  stepColor = '#8B5CF6'
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
          <SkeletonCircle size={48} />
          <div style={{ flex: 1 }}>
            <SkeletonBar width="60%" height="22px" className="mb-2" />
            <SkeletonBar width="40%" height="16px" />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <SkeletonCircle size={32} />
                <SkeletonBar width="50%" height="18px" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <SkeletonBar width="60%" height="20px" className="mb-1 mx-auto" />
                    <SkeletonBar width="40%" height="12px" className="mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {[1, 2].map((i) => (
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

export default FunctionalPrescriptionCardSkeleton;
