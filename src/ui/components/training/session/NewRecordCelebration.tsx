/**
 * NewRecordCelebration Component
 * Celebration animation when a new personal record is achieved
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import { playSound } from '../../../../audio';

interface NewRecordCelebrationProps {
  recordType: 'max_weight' | 'max_volume' | 'max_distance' | 'max_duration';
  newValue: number;
  unit: string;
  exerciseName: string;
  improvement?: number | null;
  onClose: () => void;
}

const NewRecordCelebration: React.FC<NewRecordCelebrationProps> = ({
  recordType,
  newValue,
  unit,
  exerciseName,
  improvement,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    playSound('success');

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getRecordTypeLabel = (type: string): string => {
    switch (type) {
      case 'max_weight': return 'Poids Maximum';
      case 'max_volume': return 'Volume Maximum';
      case 'max_distance': return 'Distance Maximum';
      case 'max_duration': return 'Durée Maximum';
      default: return 'Record';
    }
  };

  const confettiColors = ['#F59E0B', '#EF4444', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto"
            onClick={() => setIsVisible(false)}
          />

          {/* Confetti */}
          {Array.from({ length: 30 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                rotate: 0
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 0.8],
                rotate: Math.random() * 720
              }}
              transition={{
                duration: 2 + Math.random(),
                ease: 'easeOut',
                delay: Math.random() * 0.3
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                background: confettiColors[Math.floor(Math.random() * confettiColors.length)]
              }}
            />
          ))}

          {/* Main Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{
              scale: [0, 1.1, 1],
              rotate: [−10, 5, 0]
            }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 300
            }}
            className="relative z-10 w-full max-w-md pointer-events-auto"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.2) 0%, transparent 60%),
                radial-gradient(circle at 70% 80%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
                rgba(20, 20, 30, 0.98)
              `,
              border: '2px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '24px',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.5),
                0 0 60px rgba(245, 158, 11, 0.4),
                inset 0 2px 0 rgba(255, 255, 255, 0.2)
              `,
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="p-8 text-center">
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: [0, 1.2, 1],
                  rotate: [-180, 180, 0]
                }}
                transition={{
                  type: 'spring',
                  damping: 10,
                  stiffness: 200,
                  delay: 0.2
                }}
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                    linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.3))
                  `,
                  border: '3px solid rgba(245, 158, 11, 0.6)',
                  boxShadow: '0 0 40px rgba(245, 158, 11, 0.5)'
                }}
              >
                <SpatialIcon Icon={ICONS.Trophy} size={48} style={{ color: '#F59E0B' }} />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2"
                style={{
                  textShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
                }}
              >
                🎉 Nouveau Record !
              </motion.h2>

              {/* Record Type */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-orange-300 text-sm font-medium mb-6"
              >
                {getRecordTypeLabel(recordType)}
              </motion.p>

              {/* Exercise Name */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white/70 text-lg mb-4"
              >
                {exerciseName}
              </motion.p>

              {/* Value */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  damping: 10,
                  stiffness: 200,
                  delay: 0.6
                }}
                className="mb-6"
              >
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    className="text-6xl font-bold"
                    style={{
                      color: '#F59E0B',
                      textShadow: '0 0 30px rgba(245, 158, 11, 0.6)'
                    }}
                  >
                    {newValue}
                  </span>
                  <span className="text-3xl text-white/70">{unit}</span>
                </div>

                {improvement && improvement > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-2 mt-3"
                  >
                    <SpatialIcon Icon={ICONS.TrendingUp} size={20} style={{ color: '#22C55E' }} />
                    <span className="text-green-400 text-lg font-medium">
                      +{improvement}%
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/60 text-sm mb-6"
              >
                Continuez comme ça ! Vous dépassez vos limites 💪
              </motion.p>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={() => setIsVisible(false)}
                className="px-8 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
                style={{
                  background: 'rgba(245, 158, 11, 0.3)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                }}
              >
                Continuer
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewRecordCelebration;
