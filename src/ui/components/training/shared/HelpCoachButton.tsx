/**
 * Help Coach Button Component
 * Universal CTA button for requesting coach help on any exercise card
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';

interface HelpCoachButtonProps {
  onClick: () => void;
  disciplineColor: string;
  disabled?: boolean;
  className?: string;
}

const HelpCoachButton: React.FC<HelpCoachButtonProps> = ({
  onClick,
  disciplineColor,
  disabled = false,
  className = ''
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl font-semibold text-sm transition-all ${className}`}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{
        background: disabled
          ? 'rgba(255, 255, 255, 0.04)'
          : `
            radial-gradient(circle at 50% 0%, color-mix(in srgb, ${disciplineColor} 18%, transparent) 0%, transparent 70%),
            rgba(255, 255, 255, 0.08)
          `,
        border: `2px solid color-mix(in srgb, ${disciplineColor} 28%, rgba(255, 255, 255, 0.15))`,
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        boxShadow: disabled
          ? 'none'
          : `
            0 4px 16px rgba(0, 0, 0, 0.15),
            0 0 28px color-mix(in srgb, ${disciplineColor} 12%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `,
        color: disabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <SpatialIcon
        Icon={ICONS.MessageCircle}
        size={18}
        variant="pure"
        style={{
          color: disciplineColor,
          filter: `drop-shadow(0 0 10px color-mix(in srgb, ${disciplineColor} 45%, transparent))`
        }}
      />
      <span
        style={{
          textShadow: `0 0 20px color-mix(in srgb, ${disciplineColor} 30%, transparent)`
        }}
      >
        Help Coach
      </span>
    </motion.button>
  );
};

export default HelpCoachButton;
