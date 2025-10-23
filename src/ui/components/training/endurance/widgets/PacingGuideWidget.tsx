/**
 * Pacing Guide Widget
 * Real-time pacing feedback and guidance
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { PacingStatus } from '../../../../../system/services/endurancePacingGuide';

interface PacingGuideWidgetProps {
  status: PacingStatus;
  message: string;
  icon: string;
  estimation?: string;
}

const PacingGuideWidget: React.FC<PacingGuideWidgetProps> = ({
  status,
  message,
  icon,
  estimation,
}) => {
  const colorMap: Record<PacingStatus, string> = {
    too_fast: '#F97316',
    perfect: '#22C55E',
    too_slow: '#3B82F6',
  };

  const color = colorMap[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl"
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}40`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="font-bold text-white mb-1">{message}</div>
          {estimation && (
            <div className="text-sm text-white/70">{estimation}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PacingGuideWidget;
