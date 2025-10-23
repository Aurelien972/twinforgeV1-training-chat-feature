/**
 * Interval Work/Rest Display
 * Specialized display for interval work and rest phases
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';

interface IntervalWorkRestDisplayProps {
  phase: 'work' | 'rest';
  timeRemaining: number;
  currentInterval: number;
  totalIntervals: number;
  zoneTarget: string;
}

const IntervalWorkRestDisplay: React.FC<IntervalWorkRestDisplayProps> = ({
  phase,
  timeRemaining,
  currentInterval,
  totalIntervals,
  zoneTarget,
}) => {
  const isWork = phase === 'work';
  const color = isWork ? '#EF4444' : '#10B981';
  const bgColor = isWork ? 'rgb(239 68 68 / 0.1)' : 'rgb(16 185 129 / 0.1)';
  const borderColor = isWork ? 'rgb(239 68 68 / 0.3)' : 'rgb(16 185 129 / 0.3)';

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center p-8 rounded-2xl"
      style={{
        backgroundColor: bgColor,
        border: `2px solid ${borderColor}`,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-6xl font-bold mb-4"
        style={{ color }}
      >
        {isWork ? 'WORK' : 'REST'}
      </motion.div>

      <div className="text-5xl font-bold text-white mb-4">
        {formatTime(timeRemaining)}
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-white/60 text-sm">
          Intervalle {currentInterval} sur {totalIntervals}
        </div>
        <div
          className="px-3 py-1 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: bgColor,
            color,
            border: `1px solid ${borderColor}`,
          }}
        >
          {zoneTarget}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: totalIntervals }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: i < currentInterval ? color : 'rgba(255, 255, 255, 0.2)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default IntervalWorkRestDisplay;
