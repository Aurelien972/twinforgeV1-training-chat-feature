/**
 * TrainingQuitModal Component
 * Modal for confirming exit from training generation with save option
 * Provides 3 clear options: Stay, Save & Quit, Quit Without Saving
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import GlassCard from '../../cards/GlassCard';

interface TrainingQuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuitWithoutSaving: () => void;
  onSaveAndQuit: () => void;
  trainingType?: string;
  isSaving?: boolean;
  isDraftAlreadySaved?: boolean;
}

const TrainingQuitModal: React.FC<TrainingQuitModalProps> = ({
  isOpen,
  onClose,
  onQuitWithoutSaving,
  onSaveAndQuit,
  trainingType,
  isSaving = false,
  isDraftAlreadySaved = false
}) => {
  const dangerColor = '#EF4444';
  const successColor = '#10B981';
  const neutralColor = '#6B7280';

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
                  radial-gradient(circle at 30% 20%, color-mix(in srgb, ${dangerColor} 10%, transparent) 0%, transparent 60%),
                  var(--glass-opacity)
                `,
                borderColor: `color-mix(in srgb, ${dangerColor} 30%, transparent)`,
                boxShadow: `
                  0 12px 40px rgba(0, 0, 0, 0.3),
                  0 0 30px color-mix(in srgb, ${dangerColor} 20%, transparent),
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
                        radial-gradient(circle at 30% 30%, color-mix(in srgb, ${dangerColor} 50%, transparent) 0%, transparent 70%),
                        rgba(255, 255, 255, 0.15)
                      `,
                      border: `2px solid color-mix(in srgb, ${dangerColor} 60%, transparent)`,
                      boxShadow: `
                        0 4px 16px color-mix(in srgb, ${dangerColor} 40%, transparent),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS.AlertTriangle}
                      size={24}
                      style={{
                        color: dangerColor,
                        filter: `drop-shadow(0 0 12px color-mix(in srgb, ${dangerColor} 70%, transparent))`
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-white font-semibold text-xl mb-2"
                      style={{
                        textShadow: `0 0 20px color-mix(in srgb, ${dangerColor} 40%, transparent)`
                      }}
                    >
                      {isDraftAlreadySaved ? 'Quitter ton training ?' : 'Que veux-tu faire ?'}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {isDraftAlreadySaved
                        ? 'Ton training est déjà sauvegardé. Tu pourras le retrouver dans tes brouillons.'
                        : 'Tu es sur le point de quitter la génération de training.'}
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
                        <SpatialIcon Icon={ICONS.Dumbbell} size={16} style={{ color: dangerColor }} />
                        <span className="text-white/80 text-sm font-medium">Training généré</span>
                      </div>
                      <p className="text-white text-sm">{trainingType}</p>
                    </div>
                  </div>
                )}

                {!isDraftAlreadySaved && (
                  <div
                    className="mb-6 p-3 rounded-lg flex items-start gap-2"
                    style={{
                      background: `color-mix(in srgb, ${successColor} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${successColor} 25%, transparent)`
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Info}
                      size={16}
                      style={{ color: successColor, marginTop: '2px' }}
                    />
                    <div className="flex-1">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: `color-mix(in srgb, ${successColor} 90%, white)` }}
                      >
                        <strong>Conseil:</strong> Sauvegarde ton training pour le retrouver plus tard et ne rien perdre (disponible 48h).
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Responsive Layout */}
                <div className="space-y-3">
                  {/* Primary Action: Stay */}
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${successColor} 0%, color-mix(in srgb, ${successColor} 85%, black) 100%)`,
                      boxShadow: `0 4px 16px color-mix(in srgb, ${successColor} 40%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${successColor} 50%, transparent)`
                    }}
                  >
                    <SpatialIcon Icon={ICONS.CheckCircle} size={18} />
                    <span>Rester et continuer</span>
                  </button>

                  {/* Secondary Action: Save & Quit - Only show if not already saved */}
                  {!isDraftAlreadySaved && (
                    <button
                      onClick={onSaveAndQuit}
                      disabled={isSaving}
                      className="w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {isSaving ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <SpatialIcon Icon={ICONS.Loader} size={18} />
                          </motion.div>
                          <span>Sauvegarde en cours...</span>
                        </>
                      ) : (
                        <>
                          <SpatialIcon Icon={ICONS.Save} size={18} />
                          <span>Sauvegarder et quitter</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Tertiary Action: Quit Without Saving / Quit Training */}
                  <button
                    onClick={onQuitWithoutSaving}
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 rounded-lg text-white/70 text-sm font-medium transition-all hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <SpatialIcon Icon={ICONS.X} size={16} />
                    <span>{isDraftAlreadySaved ? 'Quitter le training' : 'Quitter sans sauvegarder'}</span>
                  </button>
                </div>

                {/* Mobile responsive alternative: Grid layout for tablets */}
                <style>{`
                  @media (min-width: 640px) and (max-width: 768px) {
                    .space-y-3 {
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 0.75rem;
                    }
                    .space-y-3 > button:first-child {
                      grid-column: 1 / -1;
                    }
                  }
                `}</style>
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

export default TrainingQuitModal;
