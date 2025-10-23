/**
 * Zone Deviation Alert
 * Alerts user when they deviate from target heart rate zone
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HeartRateZone } from '../../../../../domain/enduranceSession';
import { HEART_RATE_ZONES } from '../../../../../domain/enduranceSession';
import SpatialIcon from '../../../../icons/SpatialIcon';

interface ZoneDeviationAlertProps {
  isVisible: boolean;
  currentZone: HeartRateZone;
  targetZone: HeartRateZone;
  message: string;
}

const ZoneDeviationAlert: React.FC<ZoneDeviationAlertProps> = ({
  isVisible,
  currentZone,
  targetZone,
  message,
}) => {
  const currentZoneConfig = HEART_RATE_ZONES[currentZone];
  const targetZoneConfig = HEART_RATE_ZONES[targetZone];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <div
            className="p-4 rounded-xl shadow-lg"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <SpatialIcon name="AlertCircle" className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-white font-bold mb-1">Zone Deviation</div>
                <p className="text-white/80 text-sm">{message}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">Actuelle:</span>
                    <div
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: `${currentZoneConfig.color}20`,
                        color: currentZoneConfig.color,
                      }}
                    >
                      {currentZone}
                    </div>
                  </div>
                  <SpatialIcon name="ArrowRight" className="w-4 h-4 text-white/40" />
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">Cible:</span>
                    <div
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: `${targetZoneConfig.color}20`,
                        color: targetZoneConfig.color,
                      }}
                    >
                      {targetZone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ZoneDeviationAlert;
