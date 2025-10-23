/**
 * AnalysisProgressOverlay Component
 * Affiche une overlay avec barre de progression pendant l'analyse GPT-5-mini
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import GlassCard from '../../../../cards/GlassCard';
import { ProgressBar } from '../shared';
import type { AnalysisProgressOverlayProps } from '../types';
import { getPhaseIcon, getPhaseColor, isActivePhase } from '../utils/phaseHelpers';
import { Z_INDEX } from '../config/constants';

const AnalysisProgressOverlay: React.FC<AnalysisProgressOverlayProps> = ({
  isOpen,
  progress,
  onCancel
}) => {
  const Icon = getPhaseIcon(progress.phase);
  const color = getPhaseColor(progress.phase);
  const isActive = isActivePhase(progress.phase);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: Z_INDEX.OVERLAY_BACKDROP }}
            onClick={progress.phase === 'error' ? onCancel : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
            style={{ zIndex: Z_INDEX.OVERLAY_CONTENT }}
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
                {isActive && onCancel && (
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

                <ProgressBar
                  progress={progress.progress}
                  color={color}
                  showShimmer={progress.phase === 'analyzing' && progress.progress < 75}
                  duration={0.3}
                />
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
