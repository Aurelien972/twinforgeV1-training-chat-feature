/**
 * SetCountdown Component
 * Quick countdown timer (3, 2, 1, Go) between sets
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics } from '../../../../utils/haptics';
import { countdownTick, countdownGo } from '../../../../audio';

interface SetCountdownProps {
  duration?: number;
  onComplete: () => void;
  stepColor: string;
}

const SetCountdown: React.FC<SetCountdownProps> = ({
  duration = 3,
  onComplete,
  stepColor,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (countdown === 0) {
      setIsComplete(true);
      // Strong haptic for GO
      Haptics.success();
      // Play energetic GO sound
      countdownGo();
      setTimeout(() => {
        onComplete();
      }, 300);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
      // Play countdown tick sound (3, 2, 1 = high urgency)
      countdownTick(countdown - 1, duration);
      // Stronger haptic as countdown gets lower
      if (countdown <= 3) {
        Haptics.impact();
      } else {
        Haptics.tap();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete, duration]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative"
          >
            {/* Animated Background Pulse */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%)`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Number */}
            <div
              className="relative text-9xl font-bold"
              style={{
                color: stepColor,
                letterSpacing: '-0.05em',
                lineHeight: '1',
                textShadow: `0 0 60px color-mix(in srgb, ${stepColor} 80%, transparent)`,
              }}
            >
              {countdown}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            {/* Animated Background Pulse */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
              }}
              animate={{
                opacity: [0.5, 0.9, 0],
                scale: [1, 1.5, 1.2],
              }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
            />

            {/* GO text */}
            <div
              className="relative text-9xl font-bold"
              style={{
                color: '#22C55E',
                letterSpacing: '-0.05em',
                lineHeight: '1',
                textShadow: '0 0 60px rgba(34, 197, 94, 0.8)',
              }}
            >
              GO!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SetCountdown;
