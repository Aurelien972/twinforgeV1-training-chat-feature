/**
 * ModeToggle Component
 * Toggle pour basculer entre mode Photo et mode Manuel
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import type { LocationMode } from '../../../domain/trainingLocation';

interface ModeToggleProps {
  mode: LocationMode;
  onChange: (mode: LocationMode) => void;
  disabled?: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange, disabled = false }) => {
  return (
    <div className="relative inline-flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
      <motion.div
        className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/50"
        initial={false}
        animate={{
          left: mode === 'photo' ? '4px' : 'calc(50% + 4px)',
          width: 'calc(50% - 8px)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      <button
        type="button"
        onClick={() => !disabled && onChange('photo')}
        disabled={disabled}
        className={`relative z-10 flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
          mode === 'photo' ? 'text-white' : 'text-white/60'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <SpatialIcon Icon={ICONS.Camera} size={18} />
        <span className="font-medium">Photos du lieu</span>
      </button>

      <button
        type="button"
        onClick={() => !disabled && onChange('manual')}
        disabled={disabled}
        className={`relative z-10 flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
          mode === 'manual' ? 'text-white' : 'text-white/60'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <SpatialIcon Icon={ICONS.List} size={18} />
        <span className="font-medium">Liste Manuelle</span>
      </button>
    </div>
  );
};

export default ModeToggle;
