/**
 * DetectionMarker Component
 * Individual marker for equipment detection
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DetectionTooltip from './DetectionTooltip';
import { formatEquipmentName } from '../utils';

interface DetectionMarkerProps {
  detection: any;
  isHovered: boolean;
  isSelected: boolean;
  color: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

const DetectionMarker: React.FC<DetectionMarkerProps> = ({
  detection,
  isHovered,
  isSelected,
  color,
  onMouseEnter,
  onMouseLeave,
  onClick
}) => {
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${detection.position_x}%`,
        top: `${detection.position_y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isHovered || isSelected ? 1.3 : 1,
        opacity: 1
      }}
      whileHover={{ scale: 1.4 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div
        className="relative flex items-center justify-center w-5 h-5 md:w-4 md:h-4 rounded-full font-bold text-white shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}60, 0 2px 6px rgba(0, 0, 0, 0.3)`,
          border: `2px solid white`,
          zIndex: isHovered || isSelected ? 50 : 10,
          fontSize: '10px',
          padding: '2px'
        }}
      >
        {detection.marker_number}

        {(isHovered || isSelected) && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ boxShadow: `0 0 6px ${color}` }}
          />
        )}
      </div>

      <AnimatePresence>
        {isHovered && !isSelected && (
          <motion.div
            className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 pointer-events-none whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <DetectionTooltip
              equipmentName={formatEquipmentName(detection.equipment_name)}
              color={color}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DetectionMarker;
