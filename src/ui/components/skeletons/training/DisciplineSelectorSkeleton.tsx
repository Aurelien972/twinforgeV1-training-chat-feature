import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonCard, SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface DisciplineSelectorSkeletonProps {
  stepColor?: string;
}

const DisciplineSelectorSkeleton: React.FC<DisciplineSelectorSkeletonProps> = ({
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SkeletonCard stepColor={stepColor} padding="20px">
        <div className="mb-4">
          <SkeletonBar width="40%" height="20px" />
          <div className="mt-2">
            <SkeletonBar width="60%" height="14px" />
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px'
              }}
            >
              <SkeletonCircle size={40} />
              <div style={{ flex: 1 }}>
                <SkeletonBar width="50%" height="18px" />
                <div className="mt-2">
                  <SkeletonBar width="70%" height="12px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </motion.div>
  );
};

export default DisciplineSelectorSkeleton;
