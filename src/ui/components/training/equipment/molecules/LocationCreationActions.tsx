/**
 * LocationCreationActions Component
 * CTA buttons for creating new locations
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';

interface LocationCreationActionsProps {
  onScanLocation: () => void;
  onCreateLocation: () => void;
  disabled?: boolean;
}

const LocationCreationActions: React.FC<LocationCreationActionsProps> = ({
  onScanLocation,
  onCreateLocation,
  disabled = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/10">
      <motion.button
        onClick={onScanLocation}
        disabled={disabled}
        className="py-4 rounded-xl transition-all flex flex-col items-center gap-3"
        style={{
          background:
            'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.25)), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(236, 72, 153, 0.4)',
          boxShadow:
            '0 4px 20px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.98, y: 0 } : {}}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(236, 72, 153, 0.3)',
            border: '2px solid rgba(236, 72, 153, 0.5)',
            boxShadow: '0 0 16px rgba(236, 72, 153, 0.4)'
          }}
        >
          <SpatialIcon Icon={ICONS.Camera} size={24} style={{ color: '#EC4899' }} />
        </div>
        <div className="text-center">
          <h4 className="text-white font-semibold">Scanner un lieu</h4>
          <p className="text-white/60 text-xs mt-1">Détection IA par photos</p>
        </div>
      </motion.button>

      <motion.button
        onClick={onCreateLocation}
        disabled={disabled}
        className="py-4 rounded-xl transition-all flex flex-col items-center gap-3"
        style={{
          background:
            'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(22, 163, 74, 0.25)), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(34, 197, 94, 0.4)',
          boxShadow:
            '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.98, y: 0 } : {}}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(34, 197, 94, 0.3)',
            border: '2px solid rgba(34, 197, 94, 0.5)',
            boxShadow: '0 0 16px rgba(34, 197, 94, 0.4)'
          }}
        >
          <SpatialIcon Icon={ICONS.Plus} size={24} style={{ color: '#22C55E' }} />
        </div>
        <div className="text-center">
          <h4 className="text-white font-semibold">Créer un lieu</h4>
          <p className="text-white/60 text-xs mt-1">Configuration manuelle</p>
        </div>
      </motion.button>
    </div>
  );
};

export default LocationCreationActions;
