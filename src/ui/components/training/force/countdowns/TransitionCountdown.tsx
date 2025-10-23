/**
 * TransitionCountdown - Compte à rebours de transition entre repos et nouvel exercice
 * Affiche 3, 2, 1, GO! dans une interface dédiée
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { Haptics } from '../../../../../utils/haptics';
import { countdownTick, countdownGo } from '../../../../../audio';

interface TransitionCountdownProps {
  onComplete: () => void;
  duration?: number;
}

const TransitionCountdown: React.FC<TransitionCountdownProps> = ({
  onComplete,
  duration = 3,
}) => {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
        // Play countdown tick sound
        if (count - 1 > 0) {
          countdownTick(count - 1, duration);
        } else {
          // Play GO sound
          countdownGo();
        }
        Haptics.tap();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      Haptics.success();
      // Call onComplete immediately when countdown reaches 0
      onComplete();
    }
  }, [count, onComplete, duration]);

  const getDisplayText = () => {
    if (count === 0) return 'GO!';
    return count.toString();
  };

  const getColor = () => {
    if (count === 0) return '#10b981'; // green
    if (count === 1) return '#f59e0b'; // amber
    return '#3b82f6'; // blue
  };

  return (
    <GlassCard variant="premium" className="overflow-hidden">
      <div className="relative px-8 py-16 flex flex-col items-center justify-center min-h-[300px]">
        {/* Background Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `radial-gradient(circle at center, color-mix(in srgb, ${getColor()} 15%, transparent), transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Icon at top */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${getColor()} 35%, transparent), color-mix(in srgb, ${getColor()} 25%, transparent))`,
              border: `2px solid color-mix(in srgb, ${getColor()} 50%, transparent)`,
              boxShadow: `0 0 30px color-mix(in srgb, ${getColor()} 40%, transparent)`,
            }}
          >
            <SpatialIcon
              Icon={ICONS.timer}
              size={32}
              style={{
                color: getColor(),
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${getColor()} 60%, transparent))`,
              }}
              variant="pure"
            />
          </div>
        </motion.div>

        {/* Main Text - "Prochain exercice" */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <p className="text-lg font-medium text-white/70">
            {count === 0 ? 'C\'est parti !' : 'Prochain exercice'}
          </p>
        </motion.div>

        {/* Countdown Number/Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative"
          >
            <div
              className="text-[120px] font-black leading-none tracking-tight"
              style={{
                color: getColor(),
                textShadow: `
                  0 0 40px color-mix(in srgb, ${getColor()} 60%, transparent),
                  0 0 80px color-mix(in srgb, ${getColor()} 40%, transparent),
                  0 4px 20px rgba(0, 0, 0, 0.5)
                `,
                WebkitTextStroke: count === 0 ? '2px rgba(255,255,255,0.3)' : 'none',
              }}
            >
              {getDisplayText()}
            </div>

            {/* Ring around number */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `3px solid ${getColor()}`,
                opacity: 0.3,
              }}
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.3, 0.2, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-white/50 font-medium">
            {count === 0 ? 'Préparez-vous...' : 'Préparez-vous'}
          </p>
        </motion.div>
      </div>
    </GlassCard>
  );
};

export default TransitionCountdown;
