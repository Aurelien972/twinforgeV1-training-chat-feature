/**
 * QuickActionButton Component
 * Clickable action button for Step 5 quick actions grid
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlowIcon from '../GlowIcon';
import type { IconName } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';

export type QuickActionType =
  | 'schedule'
  | 'stats'
  | 'share'
  | 'adjust'
  | 'notes'
  | 'coach';

interface QuickActionButtonProps {
  type: QuickActionType;
  icon: IconName;
  label: string;
  color: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  color,
  onClick
}) => {
  const handleClick = () => {
    Haptics.tap();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className="quick-action-button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px',
        height: '110px',
        width: '100%',
        borderRadius: '16px',
        background: `
          radial-gradient(circle at 30% 30%, ${color}12 0%, transparent 60%),
          rgba(255, 255, 255, 0.06)
        `,
        border: `1.5px solid ${color}30`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: `
          0 2px 8px rgba(0, 0, 0, 0.15),
          0 0 16px ${color}15
        `,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glow */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }}
      />

      {/* Icon */}
      <motion.div
        whileHover={{ rotate: 2 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{
          position: 'relative',
          zIndex: 1
        }}
      >
        <GlowIcon
          icon={icon}
          color={color}
          size="small"
          glowIntensity={50}
        />
      </motion.div>

      {/* Label */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {label}
      </div>
    </motion.button>
  );
};

export default QuickActionButton;
