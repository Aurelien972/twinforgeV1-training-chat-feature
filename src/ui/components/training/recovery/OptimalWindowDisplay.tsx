/**
 * OptimalWindowDisplay Component
 * Displays optimal training windows (morning and evening) for Step5
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';

interface TimeWindow {
  start: Date;
  end: Date;
}

interface OptimalWindowDisplayProps {
  morningWindow: TimeWindow;
  eveningWindow: TimeWindow;
  stepColor: string;
}

const OptimalWindowDisplay: React.FC<OptimalWindowDisplayProps> = ({
  morningWindow,
  eveningWindow,
  stepColor
}) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  };

  const renderWindow = (window: TimeWindow, icon: any, label: string, delay: number) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: `rgba(${parseInt(stepColor.slice(1, 3), 16)}, ${parseInt(stepColor.slice(3, 5), 16)}, ${parseInt(stepColor.slice(5, 7), 16)}, 0.1)`,
        border: `1px solid ${stepColor}30`,
        flex: 1
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: `${stepColor}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <SpatialIcon
          Icon={icon}
          size={18}
          style={{
            color: stepColor,
            filter: `drop-shadow(0 0 6px ${stepColor}60)`
          }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2px'
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {formatTime(window.start)} - {formatTime(window.end)}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <GlowIcon icon="Calendar" color={stepColor} size="small" />
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          Prochaine fenêtre optimale
        </div>
      </div>

      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: stepColor,
          textShadow: `0 0 12px ${stepColor}40`,
          marginBottom: '8px'
        }}
      >
        {formatDate(morningWindow.start)}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {renderWindow(morningWindow, ICONS.Sunrise, 'Matin', 0.1)}
        {renderWindow(eveningWindow, ICONS.Sunset, 'Soir', 0.2)}
      </div>
    </div>
  );
};

export default OptimalWindowDisplay;
