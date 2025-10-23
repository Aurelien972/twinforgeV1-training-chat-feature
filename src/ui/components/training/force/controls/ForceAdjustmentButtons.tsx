/**
 * Force Adjustment Buttons
 * Quick adjustment interface for force exercises in Step 2
 * VisionOS26 design with 3D button effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlowIcon from '../../GlowIcon';
import { Haptics } from '../../../../../utils/haptics';
import { useGlobalChatStore } from '../../../../../system/store/globalChatStore';

interface ForceAdjustmentButtonsProps {
  stepColor: string;
}

const ForceAdjustmentButtons: React.FC<ForceAdjustmentButtonsProps> = ({
  stepColor,
}) => {
  const { open: openChat } = useGlobalChatStore();

  const handleNeedHelp = () => {
    Haptics.press();
    openChat();
  };

  return (
    <div className="space-y-3">
      {/* Need Help Button */}
      <motion.button
        onClick={handleNeedHelp}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99, y: 0 }}
        className="w-full relative overflow-hidden rounded-2xl"
        style={{
          padding: '14px 16px',
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 70%),
            rgba(255, 255, 255, 0.06)
          `,
          border: `1.5px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.12))`,
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 20px color-mix(in srgb, ${stepColor} 12%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -2px 8px rgba(0, 0, 0, 0.15)
          `,
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 70%),
                color-mix(in srgb, ${stepColor} 12%, rgba(255, 255, 255, 0.08))
              `,
              border: `1.5px solid color-mix(in srgb, ${stepColor} 35%, transparent)`,
              boxShadow: `0 2px 12px color-mix(in srgb, ${stepColor} 20%, transparent)`,
            }}
          >
            <GlowIcon icon="MessageCircle" color={stepColor} size="tiny" glowIntensity={35} />
          </div>
          <span className="text-sm font-bold text-white">Besoin d'aide</span>
        </div>
      </motion.button>
    </div>
  );
};

export default ForceAdjustmentButtons;
