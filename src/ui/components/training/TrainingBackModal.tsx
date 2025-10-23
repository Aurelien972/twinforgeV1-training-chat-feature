/**
 * TrainingBackModal Component
 * Modal for confirming exit from training generation with loss warning
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import GlassCard from '../../cards/GlassCard';

interface TrainingBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trainingType?: string;
}

const TrainingBackModal: React.FC<TrainingBackModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trainingType
}) => {
  const stepColor = '#EF4444';

  const handleConfirm = () => {
    onConfirm();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200000]"
            onClick={onClose}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[200001] flex items-center justify-center p-4 pointer-events-none"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <GlassCard
              className="w-full max-w-md pointer-events-auto"
              style={{
                background: `
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
                  var(--glass-opacity)
                `,
                borderColor: `color-mix(in srgb, ${stepColor} 30%, transparent)`,
                boxShadow: `
                  0 12px 40px rgba(0, 0, 0, 0.3),
                  0 0 30px color-mix(in srgb, ${stepColor} 20%, transparent),
                  inset 0 2px 0 rgba(255, 255, 255, 0.15)
                `
              }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `
                        radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 50%, transparent) 0%, transparent 70%),
                        rgba(255, 255, 255, 0.15)
                      `,
                      border: `2px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                      boxShadow: `
                        0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS.AlertTriangle}
                      size={24}
                      style={{
                        color: stepColor,
                        filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-white font-semibold text-xl mb-2"
                      style={{
                        textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 40%, transparent)`
                      }}
                    >
                      Quitter sans sauvegarder ?
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Si tu reviens en arrière maintenant, ton training sera perdu.
                    </p>
                  </div>
                </div>

                {trainingType && (
                  <div className="mb-6">
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <SpatialIcon Icon={ICONS.Dumbbell} size={16} style={{ color: stepColor }} />
                        <span className="text-white/80 text-sm font-medium">Training généré</span>
                      </div>
                      <p className="text-white text-sm">{trainingType}</p>
                    </div>
                  </div>
                )}

                <div
                  className="mb-6 p-3 rounded-lg flex items-start gap-2"
                  style={{
                    background: `color-mix(in srgb, ${stepColor} 10%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${stepColor} 25%, transparent)`
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS.Info}
                    size={16}
                    style={{ color: stepColor, marginTop: '2px' }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm leading-relaxed mb-2"
                      style={{ color: `color-mix(in srgb, ${stepColor} 90%, white)` }}
                    >
                      <strong>Avant de partir:</strong>
                    </p>
                    <ul className="text-xs space-y-1" style={{ color: `color-mix(in srgb, ${stepColor} 80%, white)` }}>
                      <li>• Sauvegarde ton training pour le retrouver plus tard</li>
                      <li>• Ou continue avec la séance pour ne rien perdre</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    Rester
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${stepColor} 0%, color-mix(in srgb, ${stepColor} 85%, black) 100%)`,
                      boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent)`
                    }}
                  >
                    <SpatialIcon Icon={ICONS.ArrowLeft} size={16} />
                    <span>Quitter quand même</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default TrainingBackModal;
