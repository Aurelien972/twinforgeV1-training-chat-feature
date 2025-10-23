import React from 'react';
import { motion } from 'framer-motion';
import SkeletonBase from '../SkeletonBase';

interface EquipmentChipSkeletonProps {
  count?: number;
  stepColor?: string;
}

const EquipmentChipSkeleton: React.FC<EquipmentChipSkeletonProps> = ({
  count = 5,
  stepColor = '#18E3FF'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap gap-2"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase
          key={i}
          width={`${60 + Math.random() * 40}px`}
          height="32px"
          borderRadius="16px"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        />
      ))}
    </motion.div>
  );
};

export default EquipmentChipSkeleton;
