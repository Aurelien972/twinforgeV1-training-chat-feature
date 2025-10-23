/**
 * BackgroundAnalysisIndicator Component
 * Indicateur discret de progression d'analyse en arrière-plan
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import GlassCard from '../../../cards/GlassCard';
import type { BatchJobProgress } from '../../../../system/services/backgroundAnalysisService';

interface BackgroundAnalysisIndicatorProps {
  progress: BatchJobProgress;
  onExpand?: () => void;
  onDismiss?: () => void;
}

const BackgroundAnalysisIndicator: React.FC<BackgroundAnalysisIndicatorProps> = ({
  progress,
  onExpand,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcul du pourcentage global en tenant compte de toutes les phases
  const completionPercentage = progress.totalPhotos > 0
    ? Math.round(
        ((progress.completedPhotos + (progress.processingPhotos * 0.5)) / progress.totalPhotos) * 100
      )
    : 0;

  const isComplete = progress.completedPhotos === progress.totalPhotos;
  const hasFailed = progress.failedPhotos > 0;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && onExpand) {
      onExpand();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 right-4 z-[100] w-80 max-w-[calc(100vw-2rem)]"
    >
      <GlassCard
        className="overflow-hidden"
        style={{
          background: isComplete
            ? 'radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.15) 0%, transparent 60%), var(--glass-opacity)'
            : 'radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%), var(--glass-opacity)',
          borderColor: isComplete ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'
        }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <motion.button
              onClick={handleToggleExpand}
              className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isComplete
                    ? 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.3) 0%, transparent 60%), rgba(16, 185, 129, 0.2)'
                    : 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.3) 0%, transparent 60%), rgba(6, 182, 212, 0.2)',
                  border: isComplete ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid rgba(6, 182, 212, 0.4)'
                }}
              >
                {isComplete ? (
                  <SpatialIcon Icon={ICONS.Check} size={16} className="text-green-400" />
                ) : (
                  <SpatialIcon
                    Icon={ICONS.Sparkles}
                    size={16}
                    className="text-cyan-400 animate-pulse"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm">
                  {isComplete ? 'Analyse terminée' : 'Analyse en cours'}
                </h4>
                <p className="text-white/60 text-xs truncate">
                  {progress.completedPhotos}/{progress.totalPhotos} photos
                </p>
              </div>
            </motion.button>

            {isComplete && onDismiss && (
              <motion.button
                onClick={onDismiss}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                whileTap={{ scale: 0.95 }}
                title="Fermer"
              >
                <SpatialIcon Icon={ICONS.X} size={14} className="text-white/80" />
              </motion.button>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: isComplete
                    ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #06B6D4 0%, #0891B2 100%)',
                  boxShadow: isComplete
                    ? '0 0 8px rgba(16, 185, 129, 0.6)'
                    : '0 0 8px rgba(6, 182, 212, 0.6)'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/70">Terminées</span>
                      <span className="text-green-400 font-semibold">
                        {progress.completedPhotos}
                      </span>
                    </div>
                    {progress.processingPhotos > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">En cours</span>
                        <span className="text-cyan-400 font-semibold">
                          {progress.processingPhotos}
                        </span>
                      </div>
                    )}
                    {progress.pendingPhotos > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">En attente</span>
                        <span className="text-white/60 font-semibold">
                          {progress.pendingPhotos}
                        </span>
                      </div>
                    )}
                    {hasFailed && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/70">Échouées</span>
                        <span className="text-red-400 font-semibold">
                          {progress.failedPhotos}
                        </span>
                      </div>
                    )}
                    {progress.totalEquipmentDetected > 0 && (
                      <div className="pt-2 mt-2 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs">
                          <SpatialIcon Icon={ICONS.Package} size={14} className="text-cyan-400" />
                          <span className="text-white/70">
                            {progress.totalEquipmentDetected} équipement{progress.totalEquipmentDetected > 1 ? 's' : ''} détecté{progress.totalEquipmentDetected > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default BackgroundAnalysisIndicator;
