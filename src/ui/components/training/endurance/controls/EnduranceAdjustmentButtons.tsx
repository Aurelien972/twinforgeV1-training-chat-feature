/**
 * Endurance Adjustment Buttons
 * Quick adjustment interface for endurance sessions in Step 2
 * VisionOS26 design with 3D button effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlowIcon from '../../GlowIcon';
import { Haptics } from '../../../../../utils/haptics';
import { useGlobalChatStore } from '../../../../../system/store/globalChatStore';

interface EnduranceAdjustmentButtonsProps {
  stepColor: string;
  onAdjustEasier: () => void;
  onAdjustHarder: () => void;
}

const EnduranceAdjustmentButtons: React.FC<EnduranceAdjustmentButtonsProps> = ({
  stepColor,
  onAdjustEasier,
  onAdjustHarder,
}) => {
  const { open: openChat, setMode, addMessage, isOpen } = useGlobalChatStore();

  const handleNeedHelp = () => {
    try {
      Haptics.press();

      // Set training mode before opening
      setMode('training');

      // Add context message about endurance adjustment
      if (!isOpen) {
        addMessage({
          role: 'system',
          type: 'system',
          content: 'Utilisateur demande de l\'aide sur l\'ajustement d\'intensité de la séance d\'endurance'
        });

        addMessage({
          role: 'assistant',
          type: 'text',
          content: 'Je suis là pour t\'aider à ajuster l\'intensité de ta séance ! 💪\n\nQue souhaites-tu savoir sur les ajustements ?'
        });
      }

      // Open the chat
      openChat('training');
    } catch (error) {
      console.error('Error opening chat:', error);
      // Fallback: just try to open without context
      try {
        openChat();
      } catch (fallbackError) {
        console.error('Failed to open chat even with fallback:', fallbackError);
      }
    }
  };

  const handleEasier = () => {
    Haptics.success();
    onAdjustEasier();
  };

  const handleHarder = () => {
    Haptics.success();
    onAdjustHarder();
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <GlowIcon icon="Sliders" color={stepColor} size="tiny" glowIntensity={35} />
          <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">
            Ajuster la difficulté
          </h3>
        </div>
        <p className="text-xs text-white/60">
          La séance ne correspond pas à ton niveau actuel ?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Too Easy Button */}
        <motion.button
          onClick={handleEasier}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
          style={{
            padding: '16px 12px',
            background: `
              radial-gradient(circle at 50% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 70%),
              rgba(255, 255, 255, 0.08)
            `,
            border: '2px solid rgba(34, 197, 94, 0.3)',
            boxShadow: `
              0 4px 16px rgba(0, 0, 0, 0.2),
              0 0 24px rgba(34, 197, 94, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -2px 8px rgba(0, 0, 0, 0.2)
            `,
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.3) 0%, transparent 70%),
                  rgba(34, 197, 94, 0.15)
                `,
                border: '1.5px solid rgba(34, 197, 94, 0.4)',
                boxShadow: '0 2px 12px rgba(34, 197, 94, 0.25)',
              }}
            >
              <GlowIcon icon="TrendingDown" color="#22C55E" size="small" glowIntensity={40} />
            </div>
            <span className="text-sm font-bold text-white">Trop facile</span>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wide">
              Augmenter l'intensité
            </span>
          </div>
        </motion.button>

        {/* Too Hard Button */}
        <motion.button
          onClick={handleHarder}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
          style={{
            padding: '16px 12px',
            background: `
              radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 70%),
              rgba(255, 255, 255, 0.08)
            `,
            border: '2px solid rgba(239, 68, 68, 0.3)',
            boxShadow: `
              0 4px 16px rgba(0, 0, 0, 0.2),
              0 0 24px rgba(239, 68, 68, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -2px 8px rgba(0, 0, 0, 0.2)
            `,
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 70%),
                  rgba(239, 68, 68, 0.15)
                `,
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 2px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              <GlowIcon icon="TrendingUp" color="#EF4444" size="small" glowIntensity={40} />
            </div>
            <span className="text-sm font-bold text-white">Trop difficile</span>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wide">
              Réduire l'intensité
            </span>
          </div>
        </motion.button>
      </div>

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

export default EnduranceAdjustmentButtons;
