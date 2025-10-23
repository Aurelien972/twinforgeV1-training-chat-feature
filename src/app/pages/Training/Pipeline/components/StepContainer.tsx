/**
 * Step Container Component
 * Simplified wrapper for each pipeline step without redundant header
 */

import React from 'react';
import { motion } from 'framer-motion';

interface StepContainerProps {
  children: React.ReactNode;
  className?: string;
}

const StepContainer: React.FC<StepContainerProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
        opacity: { duration: 0.25 }
      }}
      className={`training-step-container space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default StepContainer;
