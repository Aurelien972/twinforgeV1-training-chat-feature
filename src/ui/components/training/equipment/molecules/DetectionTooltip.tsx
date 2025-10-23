/**
 * DetectionTooltip Component
 * Tooltip for displaying equipment name on hover
 */

import React from 'react';

interface DetectionTooltipProps {
  equipmentName: string;
  color: string;
}

const DetectionTooltip: React.FC<DetectionTooltipProps> = ({ equipmentName, color }) => {
  return (
    <div
      className="px-3 py-2 rounded-lg text-white text-xs font-medium shadow-xl"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: `1px solid ${color}`
      }}
    >
      {equipmentName}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgba(0, 0, 0, 0.9)'
        }}
      />
    </div>
  );
};

export default DetectionTooltip;
