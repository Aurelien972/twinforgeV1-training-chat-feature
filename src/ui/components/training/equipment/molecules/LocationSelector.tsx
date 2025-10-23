/**
 * LocationSelector Component
 * VisionOS-style location selection cards
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { getLocationMetadata } from '../utils';
import type { TrainingLocationWithDetails } from '../../../../../domain/trainingLocation';

interface LocationSelectorProps {
  locations: TrainingLocationWithDetails[];
  selectedLocation: TrainingLocationWithDetails | null;
  onSelect: (location: TrainingLocationWithDetails) => void;
  disabled?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocation,
  onSelect,
  disabled = false
}) => {
  if (locations.length === 0) return null;

  return (
    <div className="space-y-3 mb-5">
      <h4 className="text-white/80 text-sm font-medium">Lieu actif</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {locations.map((location) => {
            const { icon: Icon, color, label } = getLocationMetadata(location.type);
            const isSelected = selectedLocation?.id === location.id;

            return (
              <motion.button
                key={location.id}
                type="button"
                onClick={() => onSelect(location)}
                disabled={disabled}
                className="p-4 rounded-xl text-left transition-all"
                style={{
                  background: isSelected
                    ? `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 15%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected
                    ? `2px solid color-mix(in srgb, ${color} 60%, transparent)`
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isSelected
                    ? `0 0 20px color-mix(in srgb, ${color} 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                    : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isSelected
                        ? `color-mix(in srgb, ${color} 25%, transparent)`
                        : `color-mix(in srgb, ${color} 15%, transparent)`,
                      border: `2px solid color-mix(in srgb, ${color} 40%, transparent)`
                    }}
                  >
                    <SpatialIcon Icon={Icon} size={20} style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5
                        className={`font-semibold truncate ${
                          isSelected ? 'text-white' : 'text-white/80'
                        }`}
                      >
                        {location.name || label}
                      </h5>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: color,
                            boxShadow: `0 0 12px ${color}`
                          }}
                        >
                          <SpatialIcon Icon={ICONS.Check} size={12} className="text-white" />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/60 text-xs">{label}</span>
                      <span className="text-white/40 text-xs">•</span>
                      <span className="text-white/60 text-xs">
                        {location.equipment.length} équipement
                        {location.equipment.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LocationSelector;
