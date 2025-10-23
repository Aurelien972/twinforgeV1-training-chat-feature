/**
 * DetectionsList Component
 * List of detected equipment with details
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import { formatEquipmentName, getMarkerColor } from '../utils';

interface DetectionsListProps {
  detections: any[];
  selectedMarker: number | null;
  onMarkerClick: (markerNumber: number) => void;
  onMarkerHover: (markerNumber: number | null) => void;
}

const DetectionsList: React.FC<DetectionsListProps> = ({
  detections,
  selectedMarker,
  onMarkerClick,
  onMarkerHover
}) => {
  if (detections.length === 0) {
    return (
      <div className="mt-4 p-6 rounded-xl bg-white/5 border border-white/10 text-center">
        <SpatialIcon Icon={ICONS.AlertCircle} size={40} className="text-white/40 mx-auto mb-3" />
        <p className="text-white/60 text-sm">Aucun équipement détecté sur cette photo</p>
        <p className="text-white/40 text-xs mt-2">
          Essayez de prendre une photo plus claire ou avec plus d'équipement visible
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <GlowIcon icon="List" color="#06B6D4" size="small" />
          <h4 className="text-white font-semibold text-lg">
            Équipements détectés ({detections.length})
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60 pl-11 md:pl-0">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Haute</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Bonne</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Moyenne</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {detections.map((detection) => {
          const color = getMarkerColor(detection.confidence_score);
          const isSelected = selectedMarker === detection.marker_number;

          return (
            <motion.div
              key={detection.id || detection.marker_number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: detection.marker_number * 0.05 }}
            >
              <GlassCard
                className={`p-3 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-cyan-400' : ''
                }`}
                style={{
                  background: isSelected
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)'
                }}
                onClick={() => onMarkerClick(detection.marker_number)}
                onMouseEnter={() => onMarkerHover(detection.marker_number)}
                onMouseLeave={() => onMarkerHover(null)}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-white shadow-md"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}50`,
                      fontSize: '9px'
                    }}
                  >
                    {detection.marker_number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="text-white font-medium text-sm truncate">
                      {formatEquipmentName(detection.equipment_name)}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/60 text-xs capitalize">
                        {detection.equipment_category}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60 text-xs">
                        {Math.round(detection.confidence_score * 100)}% confiance
                      </span>
                    </div>
                  </div>

                  <SpatialIcon
                    Icon={isSelected ? ICONS.ChevronUp : ICONS.ChevronDown}
                    size={14}
                    className="text-white/40"
                  />
                </div>

                <AnimatePresence>
                  {isSelected && detection.analysis_metadata?.description && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-white/70 text-xs leading-relaxed">
                          {detection.analysis_metadata.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DetectionsList;
