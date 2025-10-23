/**
 * Force Adjustment Buttons
 * Quick adjustment interface for force exercises in Step 2
 * VisionOS26 design with 3D button effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlowIcon from '../GlowIcon';
import { Haptics } from '../../../../utils/haptics';
import { useGlobalChatStore } from '../../../../system/store/globalChatStore';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';

interface ForceAdjustmentButtonsProps {
  exercise: Exercise;
  stepColor: string;
  onAdjustLoad: (newLoad: number | number[]) => void;
  onAdjustReps: (newReps: number) => void;
}

const ForceAdjustmentButtons: React.FC<ForceAdjustmentButtonsProps> = ({
  exercise,
  stepColor,
  onAdjustLoad,
  onAdjustReps,
}) => {
  const { open: openChat } = useGlobalChatStore();

  const handleNeedHelp = () => {
    Haptics.press();
    openChat();
  };

  const handleTooEasy = () => {
    Haptics.success();

    const currentLoad = Array.isArray(exercise.load)
      ? exercise.load[exercise.load.length - 1]
      : exercise.load;

    if (currentLoad) {
      const increase = Math.ceil(currentLoad * 0.08);
      const newLoad = Array.isArray(exercise.load)
        ? exercise.load.map(l => l + increase)
        : currentLoad + increase;
      onAdjustLoad(newLoad);
    }

    if (exercise.reps < 15) {
      onAdjustReps(exercise.reps + 1);
    }
  };

  const handleTooHard = () => {
    Haptics.success();

    const currentLoad = Array.isArray(exercise.load)
      ? exercise.load[exercise.load.length - 1]
      : exercise.load;

    if (currentLoad) {
      const decrease = Math.ceil(currentLoad * 0.08);
      const newLoad = Array.isArray(exercise.load)
        ? exercise.load.map(l => Math.max(0, l - decrease))
        : Math.max(0, currentLoad - decrease);
      onAdjustLoad(newLoad);
    }

    if (exercise.reps > 3) {
      onAdjustReps(exercise.reps - 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider mb-1">
          Ajuster l'exercice
        </h3>
        <p className="text-xs text-white/60">
          Les charges ou répétitions ne te conviennent pas ?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Too Easy Button */}
        <motion.button
          onClick={handleTooEasy}
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
              <GlowIcon icon="ArrowUp" color="#22C55E" size="small" glowIntensity={40} />
            </div>
            <span className="text-sm font-bold text-white">Trop facile</span>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wide">
              +8% charge • +1 rep
            </span>
          </div>
        </motion.button>

        {/* Too Hard Button */}
        <motion.button
          onClick={handleTooHard}
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
              <GlowIcon icon="ArrowDown" color="#EF4444" size="small" glowIntensity={40} />
            </div>
            <span className="text-sm font-bold text-white">Trop difficile</span>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wide">
              -8% charge • -1 rep
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

export default ForceAdjustmentButtons;
