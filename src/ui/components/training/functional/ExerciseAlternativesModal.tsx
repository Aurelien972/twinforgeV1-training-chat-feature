/**
 * Exercise Alternatives Modal
 * Modal to display and select alternative exercises
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { Exercise } from '../../../../system/store/trainingPipeline/types';
import { Haptics } from '../../../../utils/haptics';

interface ExerciseAlternativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise;
  alternatives: string[];
  onSelectAlternative: (alternativeName: string) => void;
  stepColor: string;
}

const ExerciseAlternativesModal: React.FC<ExerciseAlternativesModalProps> = ({
  isOpen,
  onClose,
  exercise,
  alternatives,
  onSelectAlternative,
  stepColor,
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);

  const handleSelectAlternative = (alternativeName: string) => {
    setSelectedAlternative(alternativeName);
    Haptics.tap();
  };

  const handleConfirm = () => {
    if (selectedAlternative) {
      onSelectAlternative(selectedAlternative);
      Haptics.success();
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedAlternative(null);
    onClose();
    Haptics.tap();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          <GlassCard
            className="p-6"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 60%),
                rgba(20, 20, 20, 0.95)
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 30%, rgba(255, 255, 255, 0.15))`,
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.5),
                0 0 40px color-mix(in srgb, ${stepColor} 20%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Alternatives pour
                </h2>
                <p className="text-lg text-white/80 font-semibold">
                  {exercise.name}
                </p>
              </div>
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <SpatialIcon Icon={ICONS.X} size={20} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
              </motion.button>
            </div>

            {/* Info Banner */}
            <div
              className="p-3 rounded-xl mb-6"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div className="flex items-start gap-2">
                <SpatialIcon Icon={ICONS.Info} size={16} style={{ color: '#3B82F6', marginTop: '2px' }} />
                <p className="text-xs text-white/80 leading-relaxed">
                  Sélectionnez une alternative adaptée à votre équipement et niveau. Les charges seront automatiquement ajustées.
                </p>
              </div>
            </div>

            {/* Alternatives List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${stepColor}40 transparent`
            }}>
              {alternatives.length === 0 ? (
                <div className="text-center py-8">
                  <SpatialIcon
                    Icon={ICONS.AlertCircle}
                    size={48}
                    style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '0 auto 16px' }}
                  />
                  <p className="text-white/60">Aucune alternative disponible pour cet exercice</p>
                </div>
              ) : (
                alternatives.map((alt, index) => {
                  const isSelected = selectedAlternative === alt;
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectAlternative(alt)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left p-4 rounded-2xl transition-all duration-200"
                      style={{
                        background: isSelected
                          ? `
                            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 70%),
                            rgba(255, 255, 255, 0.12)
                          `
                          : 'rgba(255, 255, 255, 0.06)',
                        border: isSelected
                          ? `2px solid ${stepColor}`
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isSelected
                          ? `0 0 30px color-mix(in srgb, ${stepColor} 30%, transparent)`
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: isSelected
                                  ? `color-mix(in srgb, ${stepColor} 30%, rgba(255, 255, 255, 0.1))`
                                  : 'rgba(255, 255, 255, 0.08)',
                                border: isSelected
                                  ? `2px solid ${stepColor}`
                                  : '1px solid rgba(255, 255, 255, 0.12)',
                              }}
                            >
                              <SpatialIcon
                                Icon={ICONS.Zap}
                                size={20}
                                style={{ color: isSelected ? stepColor : 'rgba(255, 255, 255, 0.6)' }}
                              />
                            </div>
                            <div>
                              <div className="text-base font-semibold text-white mb-1" style={{ letterSpacing: '-0.01em' }}>
                                {alt}
                              </div>
                              <div className="text-xs text-white/60">
                                Alternative {index + 1} sur {alternatives.length}
                              </div>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <SpatialIcon
                              Icon={ICONS.CheckCircle}
                              size={24}
                              style={{ color: stepColor }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={handleClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                Annuler
              </motion.button>
              <motion.button
                onClick={handleConfirm}
                disabled={!selectedAlternative}
                whileHover={selectedAlternative ? { scale: 1.02 } : {}}
                whileTap={selectedAlternative ? { scale: 0.98 } : {}}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{
                  background: selectedAlternative
                    ? `
                      radial-gradient(circle at 50% 20%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 70%),
                      color-mix(in srgb, ${stepColor} 22%, rgba(255, 255, 255, 0.12))
                    `
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedAlternative
                    ? `2px solid ${stepColor}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: selectedAlternative ? 'white' : 'rgba(255, 255, 255, 0.3)',
                  opacity: selectedAlternative ? 1 : 0.5,
                  cursor: selectedAlternative ? 'pointer' : 'not-allowed',
                  boxShadow: selectedAlternative
                    ? `0 8px 32px color-mix(in srgb, ${stepColor} 30%, transparent)`
                    : 'none',
                }}
              >
                Confirmer
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExerciseAlternativesModal;
