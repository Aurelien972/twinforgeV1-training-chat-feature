/**
 * AnalysisProgressOverlay Component
 * Affiche une overlay avec barre de progression pendant l'analyse GPT-5-mini
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import GlassCard from '../../../cards/GlassCard';
import type { AnalysisProgress } from '../../../../hooks/useAnalysisProgress';

interface AnalysisProgressOverlayProps {
  isOpen: boolean;
  progress: AnalysisProgress;
  onCancel?: () => void;
}

const getPhaseIcon = (phase: string) => {
  switch (phase) {
    case 'preparing':
      return ICONS.FileImage;
    case 'uploading':
      return ICONS.Upload;
    case 'analyzing':
      return ICONS.Sparkles;
    case 'validating':
      return ICONS.CheckCircle2;
    case 'saving':
      return ICONS.Database;
    case 'completed':
      return ICONS.Check;
    case 'error':
      return ICONS.AlertCircle;
    default:
      return ICONS.Loader2;
  }
};

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'completed':
      return '#10B981';
    case 'error':
      return '#EF4444';
    case 'analyzing':
      return '#3B82F6';
    default:
      return '#06B6D4';
  }
};

const AnalysisProgressOverlay: React.FC<AnalysisProgressOverlayProps> = ({
  isOpen,
  progress,
  onCancel
}) => {
  const Icon = getPhaseIcon(progress.phase);
  const color = getPhaseColor(progress.phase);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={progress.phase === 'error' ? onCancel : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md px-4"
          >
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color}40 0%, transparent 70%), rgba(255, 255, 255, 0.08)`,
                      border: `2px solid ${color}60`,
                      boxShadow: `0 4px 16px ${color}30`
                    }}
                  >
                    <SpatialIcon
                      Icon={Icon}
                      size={24}
                      className={progress.phase === 'analyzing' || progress.phase === 'preparing' ? 'animate-spin' : ''}
                      style={{
                        color,
                        filter: `drop-shadow(0 0 8px ${color}80)`
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">
                      Analyse GPT-5-mini
                    </h3>
                    <p className="text-white/60 text-xs mt-0.5">
                      {progress.message}
                    </p>
                  </div>
                </div>
                {progress.phase !== 'completed' && progress.phase !== 'error' && onCancel && (
                  <button
                    onClick={onCancel}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    title="Annuler"
                  >
                    <SpatialIcon Icon={ICONS.X} size={16} className="text-white/80" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80 font-medium">
                    Photo {progress.currentPhotoIndex + 1} / {progress.totalPhotos}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">
                      {progress.elapsedTime}s
                    </span>
                    {progress.estimatedTimeRemaining > 0 && (
                      <span className="text-white/50 text-xs">
                        ~{progress.estimatedTimeRemaining}s restant
                      </span>
                    )}
                    <span
                      className="font-bold tabular-nums"
                      style={{ color }}
                    >
                      {Math.round(progress.progress)}%
                    </span>
                  </div>
                </div>

                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}CC 0%, ${color} 100%)`,
                      boxShadow: `0 0 12px ${color}60, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                    }}
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${progress.progress}%`
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />

                  {progress.phase === 'analyzing' && progress.progress < 75 && (
                    <motion.div
                      className="absolute inset-y-0 w-20 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
                        left: `${progress.progress - 10}%`
                      }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </div>
              </div>

              {progress.phase === 'analyzing' && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <SpatialIcon Icon={ICONS.Info} size={14} />
                  <span>
                    Détection avec catalogue de 200+ équipements
                  </span>
                </div>
              )}

              {progress.phase === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 py-2"
                >
                  <SpatialIcon
                    Icon={ICONS.CheckCircle2}
                    size={20}
                    style={{ color: '#10B981' }}
                  />
                  <span className="text-green-300 font-medium">
                    Analyse terminée avec succès
                  </span>
                </motion.div>
              )}

              {progress.phase === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-red-300 text-sm">
                    <SpatialIcon Icon={ICONS.AlertCircle} size={16} />
                    <span>Une erreur est survenue lors de l'analyse</span>
                  </div>
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                    >
                      Fermer
                    </button>
                  )}
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnalysisProgressOverlay;
