/**
 * Wearable Tracking Badge Component
 * Displays a subtle but visible indicator that wearable data is being tracked during training session
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';

interface WearableTrackingBadgeProps {
  deviceName?: string;
  stepColor: string;
  compact?: boolean;
}

export const WearableTrackingBadge: React.FC<WearableTrackingBadgeProps> = ({
  deviceName = 'Montre connectée',
  stepColor,
  compact = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="wearable-tracking-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '6px' : '8px',
        padding: compact ? '6px 12px' : '8px 14px',
        borderRadius: '12px',
        background: `
          radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 70%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `1px solid color-mix(in srgb, ${stepColor} 25%, transparent)`,
        boxShadow: `
          0 2px 8px rgba(0, 0, 0, 0.15),
          0 0 16px color-mix(in srgb, ${stepColor} 12%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        fontSize: compact ? '12px' : '13px',
        fontWeight: 500
      }}
    >
      {/* Animated watch icon with pulse effect */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [1, 0.8, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <SpatialIcon
          Icon={ICONS.Watch}
          size={compact ? 14 : 16}
          style={{
            color: stepColor,
            filter: `drop-shadow(0 0 8px color-mix(in srgb, ${stepColor} 60%, transparent))`
          }}
        />
      </motion.div>

      {/* Badge text */}
      <span
        style={{
          color: 'rgba(255, 255, 255, 0.92)',
          lineHeight: 1.2
        }}
      >
        {compact ? 'HR trackée' : 'Fréquence cardiaque trackée'}
      </span>

      {/* Optional device name for non-compact mode */}
      {!compact && deviceName && (
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '11px',
            fontWeight: 400,
            marginLeft: '2px'
          }}
        >
          ({deviceName})
        </span>
      )}

      {/* Subtle animated dot indicator */}
      <motion.div
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          width: compact ? '5px' : '6px',
          height: compact ? '5px' : '6px',
          borderRadius: '50%',
          background: stepColor,
          boxShadow: `0 0 8px color-mix(in srgb, ${stepColor} 80%, transparent)`
        }}
      />
    </motion.div>
  );
};

export default WearableTrackingBadge;
