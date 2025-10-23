/**
 * LocationTypeCard Component
 * Carte visuelle pour sélectionner le type de lieu (Home, Gym, Outdoor)
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { getLocationIcon, getLocationColor } from '../utils';
import type { LocationTypeCardProps } from '../types';

const LocationTypeCard: React.FC<LocationTypeCardProps> = ({
  type,
  label,
  description,
  isSelected,
  onClick,
  color
}) => {
  const Icon = getLocationIcon(type);
  const cardColor = color || getLocationColor(type);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative p-6 rounded-xl transition-all text-left w-full"
      style={{
        background: isSelected
          ? `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${cardColor} 15%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`
          : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
          ? `2px solid color-mix(in srgb, ${cardColor} 60%, transparent)`
          : '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isSelected
          ? `0 0 20px color-mix(in srgb, ${cardColor} 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: isSelected
              ? `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${cardColor} 35%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.12)`
              : 'rgba(255, 255, 255, 0.08)',
            border: isSelected
              ? `2px solid color-mix(in srgb, ${cardColor} 70%, transparent)`
              : '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isSelected
              ? `0 4px 16px color-mix(in srgb, ${cardColor} 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <SpatialIcon
            Icon={Icon}
            size={32}
            style={
              isSelected
                ? {
                    color: cardColor,
                    filter: `drop-shadow(0 0 12px color-mix(in srgb, ${cardColor} 70%, transparent))`
                  }
                : { color: 'rgba(255, 255, 255, 0.6)' }
            }
          />
        </div>

        <div className="text-center">
          <h3
            className={`text-lg font-semibold mb-1 ${
              isSelected ? 'text-white' : 'text-white/80'
            }`}
          >
            {label}
          </h3>
          <p className="text-white/60 text-sm">{description}</p>
        </div>

        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: cardColor,
              boxShadow: `0 0 12px ${cardColor}`
            }}
          >
            <SpatialIcon Icon={ICONS.Check} size={14} className="text-white" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default LocationTypeCard;
