/**
 * EquipmentChip Component - Atomic
 * Chip for displaying/selecting equipment
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { EquipmentChipProps } from '../types';
import { DEFAULT_EQUIPMENT_COLOR } from '../constants';

const EquipmentChip: React.FC<EquipmentChipProps> = ({
  label,
  icon,
  isSelected = false,
  isCustom = false,
  onClick,
  onRemove,
  color = DEFAULT_EQUIPMENT_COLOR,
  disabled = false,
  size = 'md'
}) => {
  const Icon = icon ? ICONS[icon as keyof typeof ICONS] : null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };

  return (
    <motion.div
      className={`inline-flex items-center rounded-lg transition-all ${sizeClasses[size]} ${
        disabled ? 'cursor-not-allowed opacity-50' : onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        background: isSelected
          ? `color-mix(in srgb, ${color} 15%, transparent)`
          : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
          ? `1px solid color-mix(in srgb, ${color} 50%, transparent)`
          : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isSelected ? `0 0 12px color-mix(in srgb, ${color} 20%, transparent)` : 'none'
      }}
      onClick={() => !disabled && onClick?.()}
      whileHover={!disabled && onClick ? { scale: 1.02 } : {}}
      whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
    >
      {Icon && (
        <SpatialIcon
          Icon={Icon}
          size={iconSizes[size]}
          style={
            isSelected
              ? {
                  color: color,
                  filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 50%, transparent))`
                }
              : { color: 'rgba(255, 255, 255, 0.6)' }
          }
        />
      )}

      <span className={isSelected ? 'text-white font-medium' : 'text-white/70'}>{label}</span>

      {isCustom && (
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Équipement personnalisé" />
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 w-4 h-4 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors"
        >
          <SpatialIcon Icon={ICONS.X} size={10} className="text-white/80" />
        </button>
      )}
    </motion.div>
  );
};

export default EquipmentChip;
