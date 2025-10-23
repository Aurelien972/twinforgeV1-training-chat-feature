import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface ProgressionPathCardSkeletonProps {
  stepColor?: string;
}

const ProgressionPathCardSkeleton: React.FC<ProgressionPathCardSkeletonProps> = ({
  stepColor = '#FF6B35'
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
            <SkeletonBar width="45%" height="20px" className="mb-2" />
            <SkeletonBar width="60%" height="14px" />
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                position: 'relative'
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    flexShrink: 0
                  }}
                >
                  <SkeletonBar width="24px" height="24px" />
                </div>

                <div style={{ flex: 1 }}>
                  <SkeletonBar width="70%" height="18px" className="mb-3" />
                  <SkeletonBar width="100%" height="12px" className="mb-2" />
                  <SkeletonBar width="90%" height="12px" className="mb-4" />

                  <div className="flex items-center gap-2">
                    <SkeletonBar width="100%" height="8px" style={{ borderRadius: '4px', flex: 1 }} />
                    <SkeletonBar width="50px" height="16px" />
                  </div>
                </div>
              </div>

              {i < 3 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '24px',
                    bottom: '-16px',
                    width: '2px',
                    height: '16px',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default ProgressionPathCardSkeleton;
