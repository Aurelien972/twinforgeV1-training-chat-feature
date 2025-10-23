/**
 * EnduranceStopModal
 * Confirmation modal for stopping an endurance session
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import TrainingButton from '../../../../../app/pages/Training/Pipeline/components/TrainingButton';

interface EnduranceStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionTime: number;
  blocksCompleted: number;
  totalBlocks: number;
  discipline: string;
}

const EnduranceStopModal: React.FC<EnduranceStopModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionTime,
  blocksCompleted,
  totalBlocks,
  discipline,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard
              className="p-8 max-w-md"
              style={{
                background: 'rgba(20, 20, 20, 0.95)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <SpatialIcon
                    Icon={ICONS.StopCircle}
                    size={56}
                    style={{
                      color: '#EF4444',
                      filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.5))',
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Arrêter la séance ?</h3>
                  <p className="text-white/70 mb-3">
                    Votre progression ne sera pas sauvegardée si vous quittez maintenant.
                  </p>
                </div>

                <div
                  className="text-sm px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <p className="text-red-400 font-semibold mb-2">⚠️ Attention</p>
                  <div className="space-y-1 text-left">
                    <p className="text-white/60 text-xs">
                      <span className="font-semibold text-white/80">Discipline:</span> {discipline}
                    </p>
                    <p className="text-white/60 text-xs">
                      <span className="font-semibold text-white/80">Blocs réalisés:</span> {blocksCompleted} / {totalBlocks}
                    </p>
                    <p className="text-white/60 text-xs">
                      <span className="font-semibold text-white/80">Temps écoulé:</span> {formatTime(sessionTime)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <TrainingButton
                    variant="secondary"
                    size="lg"
                    onClick={onClose}
                    fullWidth
                  >
                    Continuer
                  </TrainingButton>
                  <TrainingButton
                    variant="primary"
                    size="lg"
                    onClick={onConfirm}
                    fullWidth
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '2px solid rgba(239, 68, 68, 0.4)',
                      color: '#EF4444',
                    }}
                  >
                    Arrêter
                  </TrainingButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnduranceStopModal;
