/**
 * FullscreenViewer Component
 * Fullscreen view of detection photo with enlarged markers
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import GlowIcon from '../../GlowIcon';
import { formatEquipmentName, getMarkerColor } from '../utils';

interface FullscreenViewerProps {
  photoUrl: string;
  detections: any[];
  showAnnotations: boolean;
  onClose: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  photoUrl,
  detections,
  showAnnotations,
  onClose
}) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9998]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <GlowIcon icon="Image" color="#06B6D4" size="small" />
              <h3 className="text-white font-semibold text-xl">Détections - Plein Écran</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <SpatialIcon Icon={ICONS.X} size={24} />
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden rounded-xl">
            <img
              src={photoUrl}
              alt="Lieu d'entraînement en plein écran"
              className="w-full h-full object-contain"
            />
            {showAnnotations && detections.length > 0 && (
              <div className="absolute inset-0">
                {detections.map((detection) => {
                  const color = getMarkerColor(detection.confidence_score);
                  return (
                    <motion.div
                      key={detection.id || detection.marker_number}
                      className="absolute"
                      style={{
                        left: `${detection.position_x}%`,
                        top: `${detection.position_y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: detection.marker_number * 0.05 }}
                    >
                      <div
                        className="relative flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm shadow-lg"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 30px ${color}80, 0 4px 16px rgba(0, 0, 0, 0.4)`,
                          border: '3px solid rgba(255, 255, 255, 0.6)'
                        }}
                      >
                        {detection.marker_number}
                      </div>
                      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
                        <div
                          className="px-3 py-2 rounded-lg text-white text-sm font-medium shadow-xl"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            border: `1px solid ${color}`
                          }}
                        >
                          {formatEquipmentName(detection.equipment_name)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default FullscreenViewer;
