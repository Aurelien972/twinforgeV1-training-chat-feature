import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface CompetitionStationDisplaySkeletonProps {
  stepColor?: string;
}

const CompetitionStationDisplaySkeleton: React.FC<CompetitionStationDisplaySkeletonProps> = ({
  stepColor = '#EF4444'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="24px">
        <div className="flex items-center justify-between mb-6">
          <div style={{ flex: 1 }}>
            <SkeletonBar width="40%" height="24px" className="mb-2" />
            <SkeletonBar width="60%" height="16px" />
          </div>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px'
            }}
          >
            <SkeletonBar width="60px" height="20px" />
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%'
                  }}
                >
                  <SkeletonBar width="16px" height="20px" />
                </div>
                <SkeletonBar width="45%" height="18px" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((j) => (
                  <div
                    key={j}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <SkeletonBar width="50%" height="24px" className="mb-1 mx-auto" />
                    <SkeletonBar width="60%" height="12px" className="mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default CompetitionStationDisplaySkeleton;
