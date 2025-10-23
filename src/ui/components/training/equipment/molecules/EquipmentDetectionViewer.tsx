/**
 * EquipmentDetectionViewer Component - Refactored
 * Display photo with detected equipment markers
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import DetectionMarker from './DetectionMarker';
import DetectionsList from './DetectionsList';
import FullscreenViewer from './FullscreenViewer';
import { useDetectionInteraction } from '../hooks';
import { getMarkerColor } from '../utils';
import type { EquipmentDetectionViewerProps } from '../types';

const EquipmentDetectionViewer: React.FC<EquipmentDetectionViewerProps> = ({
  photoUrl,
  detections,
  showAnnotations = true,
  className = '',
  enableFullscreen = true
}) => {
  const {
    hoveredMarker,
    selectedMarker,
    isFullscreen,
    handleMarkerClick,
    handleMarkerHover,
    openFullscreen,
    closeFullscreen
  } = useDetectionInteraction();

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="relative w-full h-auto group">
          {enableFullscreen && (
            <button
              onClick={openFullscreen}
              className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white transition-all opacity-0 group-hover:opacity-100"
              title="Ouvrir en plein écran"
            >
              <SpatialIcon Icon={ICONS.Maximize2} size={20} />
            </button>
          )}
          <img
            src={photoUrl}
            alt="Lieu d'entraînement"
            className="w-full h-auto rounded-lg object-cover"
          />

          {showAnnotations && detections.length > 0 && (
            <div className="absolute inset-0">
              {detections.map((detection) => (
                <DetectionMarker
                  key={detection.id || detection.marker_number}
                  detection={detection}
                  isHovered={hoveredMarker === detection.marker_number}
                  isSelected={selectedMarker === detection.marker_number}
                  color={getMarkerColor(detection.confidence_score)}
                  onMouseEnter={() => handleMarkerHover(detection.marker_number)}
                  onMouseLeave={() => handleMarkerHover(null)}
                  onClick={() => handleMarkerClick(detection.marker_number)}
                />
              ))}
            </div>
          )}
        </div>

        <DetectionsList
          detections={detections}
          selectedMarker={selectedMarker}
          onMarkerClick={handleMarkerClick}
          onMarkerHover={handleMarkerHover}
        />
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <FullscreenViewer
            photoUrl={photoUrl}
            detections={detections}
            showAnnotations={showAnnotations}
            onClose={closeFullscreen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EquipmentDetectionViewer;
