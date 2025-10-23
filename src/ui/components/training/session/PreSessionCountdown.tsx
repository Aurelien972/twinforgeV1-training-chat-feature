/**
 * PreSessionCountdown Component
 * Full-screen black countdown (10, 9, 8... GO) before starting session
 * Specifically designed for endurance session transitions
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics } from '../../../../utils/haptics';
import { countdownTick, countdownGo } from '../../../../audio';

interface PreSessionCountdownProps {
  duration?: number;
  onComplete: () => void;
  sessionName?: string;
}

const PreSessionCountdown: React.FC<PreSessionCountdownProps> = ({
  duration = 10,
  onComplete,
  sessionName,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (countdown === 0) {
      setIsComplete(true);
      Haptics.success();
      countdownGo();
      setTimeout(() => {
        onComplete();
      }, 800);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
      countdownTick(countdown - 1, duration);

      if (countdown <= 3) {
        Haptics.impact();
      } else if (countdown <= 5) {
        Haptics.press();
      } else {
        Haptics.tap();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete, duration]);

  const progress = ((duration - countdown) / duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: '#000000',
      }}
    >
      {/* Session Name at Top */}
      {sessionName && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-16 left-0 right-0 text-center px-6"
        >
          <p className="text-white/60 text-sm uppercase tracking-widest mb-2 font-semibold">
            Préparez-vous
          </p>
          <h2 className="text-white text-2xl font-bold">
            {sessionName}
          </h2>
        </motion.div>
      )}

      {/* Countdown Display */}
      <div className="flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={countdown}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 blur-3xl"
                style={{
                  background: countdown <= 3
                    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)'
                    : countdown <= 5
                    ? 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Number */}
              <div
                className="relative text-[180px] font-black leading-none"
                style={{
                  color: countdown <= 3 ? '#EF4444' : countdown <= 5 ? '#FBBF24' : '#3B82F6',
                  textShadow: countdown <= 3
                    ? '0 0 80px rgba(239, 68, 68, 1), 0 0 120px rgba(239, 68, 68, 0.6)'
                    : countdown <= 5
                    ? '0 0 80px rgba(251, 191, 36, 1), 0 0 120px rgba(251, 191, 36, 0.6)'
                    : '0 0 80px rgba(59, 130, 246, 1), 0 0 120px rgba(59, 130, 246, 0.6)',
                  letterSpacing: '-0.05em',
                }}
              >
                {countdown}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="go"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="relative"
            >
              {/* Glow effect for GO */}
              <motion.div
                className="absolute inset-0 blur-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.5, 1.8],
                  opacity: [0.8, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                }}
              />

              {/* GO Text */}
              <div
                className="relative text-[180px] font-black leading-none"
                style={{
                  color: '#22C55E',
                  textShadow: '0 0 80px rgba(34, 197, 94, 1), 0 0 120px rgba(34, 197, 94, 0.6)',
                  letterSpacing: '-0.02em',
                }}
              >
                GO!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar at Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 left-0 right-0 px-8"
      >
        <div className="max-w-md mx-auto">
          {/* Label */}
          <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-3 font-semibold">
            {isComplete ? 'C\'est parti !' : 'Préparation en cours...'}
          </p>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full absolute left-0 top-0"
              style={{
                background: isComplete
                  ? 'linear-gradient(90deg, #22C55E, #10B981)'
                  : countdown <= 3
                  ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                  : countdown <= 5
                  ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                  : 'linear-gradient(90deg, #3B82F6, #2563EB)',
                boxShadow: isComplete
                  ? '0 0 20px rgba(34, 197, 94, 0.8)'
                  : countdown <= 3
                  ? '0 0 20px rgba(239, 68, 68, 0.8)'
                  : countdown <= 5
                  ? '0 0 20px rgba(251, 191, 36, 0.8)'
                  : '0 0 20px rgba(59, 130, 246, 0.8)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Pulsing dots for visual interest */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/20"
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default PreSessionCountdown;
