import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonBar, SkeletonCircle } from '../SkeletonUtilities';

interface TrainingProgressHeaderSkeletonProps {
  stepColor?: string;
  className?: string;
}

const TrainingProgressHeaderSkeleton: React.FC<TrainingProgressHeaderSkeletonProps> = ({
  stepColor = '#18E3FF',
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={className}
      style={{
        padding: '20px',
        background: `
          radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
          var(--liquid-glass-bg-elevated)
        `,
        border: `1.5px solid color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.12))`,
        borderRadius: '20px',
        backdropFilter: 'blur(20px) saturate(180%)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonBar width="30%" height="20px" />
        <SkeletonBar width="60px" height="18px" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: 1 }}>
            <SkeletonCircle size={12} className="mx-auto mb-2" />
            <SkeletonBar width="100%" height="8px" />
          </div>
        ))}
      </div>

      <SkeletonBar width="100%" height="8px" style={{ borderRadius: '4px' }} />
    </motion.div>
  );
};

export default TrainingProgressHeaderSkeleton;
