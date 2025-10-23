import React from 'react';
import { motion } from 'framer-motion';
import SkeletonBase from '../SkeletonBase';

interface PhotoGallerySkeletonProps {
  count?: number;
  stepColor?: string;
}

const PhotoGallerySkeleton: React.FC<PhotoGallerySkeletonProps> = ({
  count = 3,
  stepColor = '#06B6D4'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-2 overflow-x-auto"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <SkeletonBase
            width="80px"
            height="80px"
            borderRadius="12px"
            style={{
              background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%), rgba(255, 255, 255, 0.08)`,
              border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PhotoGallerySkeleton;
