/**
 * TrainingSaveModal Component
 * Modal for saving training prescription as draft with custom name
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';
import GlassCard from '../../cards/GlassCard';

interface TrainingSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customName?: string) => void;
  trainingType: string;
  isSaving?: boolean;
}

const TrainingSaveModal: React.FC<TrainingSaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trainingType,
  isSaving = false
}) => {
  const [customName, setCustomName] = useState('');
  const stepColor = '#10B981';

  const handleConfirm = () => {
    onConfirm(customName.trim() || undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleConfirm();
    }
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
                      Icon={ICONS.Bookmark}
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
                      Sauvegarder pour plus tard
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Enregistre ce training pour le reprendre plus tard. Ton training sera disponible pendant 48h.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Type de séance
                  </label>
                  <div
                    className="px-4 py-2.5 rounded-lg text-white text-sm"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    {trainingType}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Nom personnalisé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ex: Session Force Jambes"
                    maxLength={50}
                    disabled={isSaving}
                    className="w-full px-4 py-2.5 rounded-lg text-white text-sm placeholder-white/40 transition-all outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  />
                  {customName.length > 0 && (
                    <p className="text-white/50 text-xs mt-1">
                      {customName.length}/50 caractères
                    </p>
                  )}
                </div>

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
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: `color-mix(in srgb, ${stepColor} 90%, white)` }}
                  >
                    Tu pourras retrouver ce training dans tes brouillons et le modifier avant de le lancer.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${stepColor} 0%, color-mix(in srgb, ${stepColor} 85%, black) 100%)`,
                      boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent)`
                    }}
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <SpatialIcon Icon={ICONS.Loader} size={16} />
                        </motion.div>
                        <span>Sauvegarde...</span>
                      </>
                    ) : (
                      <>
                        <SpatialIcon Icon={ICONS.Save} size={16} />
                        <span>Sauvegarder</span>
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

export default TrainingSaveModal;
