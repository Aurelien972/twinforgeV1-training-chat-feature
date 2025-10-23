/**
 * TrainingRegenerateModal Component
 * Modal for confirming training regeneration with intelligent variation
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import GlassCard from '../../cards/GlassCard';

interface TrainingRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentTrainingType: string;
  isRegenerating?: boolean;
}

const TrainingRegenerateModal: React.FC<TrainingRegenerateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentTrainingType,
  isRegenerating = false
}) => {
  const stepColor = '#F59E0B';

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
                  <motion.div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    animate={isRegenerating ? { rotate: 360 } : {}}
                    transition={isRegenerating ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
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
                      Icon={ICONS.RefreshCw}
                      size={24}
                      style={{
                        color: stepColor,
                        filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                      }}
                    />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-white font-semibold text-xl mb-2"
                      style={{
                        textShadow: `0 0 20px color-mix(in srgb, ${stepColor} 40%, transparent)`
                      }}
                    >
                      Générer un nouveau training
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Je vais créer une séance différente adaptée à ton profil et ton équipement.
                    </p>
                  </div>
                </div>

                <div className="mb-6 space-y-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <SpatialIcon Icon={ICONS.Sparkles} size={16} style={{ color: stepColor }} />
                      <span className="text-white/80 text-sm font-medium">Training actuel</span>
                    </div>
                    <p className="text-white text-sm">{currentTrainingType}</p>
                  </div>

                  <div
                    className="p-3 rounded-lg flex items-start gap-2"
                    style={{
                      background: `color-mix(in srgb, ${stepColor} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${stepColor} 25%, transparent)`
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Lightbulb}
                      size={16}
                      style={{ color: stepColor, marginTop: '2px' }}
                    />
                    <div className="flex-1">
                      <p
                        className="text-sm leading-relaxed mb-2"
                        style={{ color: `color-mix(in srgb, ${stepColor} 90%, white)` }}
                      >
                        <strong>Nouvelle génération intelligente:</strong>
                      </p>
                      <ul className="text-xs space-y-1" style={{ color: `color-mix(in srgb, ${stepColor} 80%, white)` }}>
                        <li>• Exercices différents et variés</li>
                        <li>• Même niveau d'énergie et équipement</li>
                        <li>• Adaptation à ton profil</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div
                  className="mb-6 p-3 rounded-lg flex items-center gap-2"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)'
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS.AlertTriangle}
                    size={16}
                    style={{ color: '#EF4444' }}
                  />
                  <p className="text-white/80 text-xs leading-relaxed">
                    Le training actuel sera remplacé. Pense à le sauvegarder avant si tu veux le garder.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isRegenerating}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isRegenerating}
                    className="flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${stepColor} 0%, color-mix(in srgb, ${stepColor} 85%, black) 100%)`,
                      boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent)`
                    }}
                  >
                    {isRegenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <SpatialIcon Icon={ICONS.Loader} size={16} />
                        </motion.div>
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <SpatialIcon Icon={ICONS.Sparkles} size={16} />
                        <span>Générer</span>
                      </>
                    )}
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

export default TrainingRegenerateModal;
