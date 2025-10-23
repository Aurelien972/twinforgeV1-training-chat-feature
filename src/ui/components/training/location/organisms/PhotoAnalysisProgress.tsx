/**
 * PhotoAnalysisProgress Component
 * Interface moderne de scan animée pendant l'analyse IA des photos
 * Version refactorisée avec affichage temps réel des détections
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import GlowIcon from '../../GlowIcon';
import type { PhotoAnalysisProgressProps } from '../types';
import { formatTime } from '../utils';
import {
  MAX_PROGRESS_TIME_SECONDS,
  ANALYSIS_PROGRESS_CONFIG,
  ESTIMATED_ANALYSIS_TIME_PER_PHOTO
} from '../constants';

const PhotoAnalysisProgress: React.FC<PhotoAnalysisProgressProps> = ({
  photos,
  analysisStatus,
  onRetry
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [liveEquipmentCount, setLiveEquipmentCount] = useState(0);
  const [estimatedProgress, setEstimatedProgress] = useState<{ [photoId: string]: number }>({});
  const [headerProgress, setHeaderProgress] = useState(0);

  // Calculs dérivés - DOIVENT être avant les useEffect qui les utilisent
  const totalPhotos = photos.length;
  const analyzingCount = Object.values(analysisStatus).filter((s) => s.status === 'analyzing').length;
  const completedCount = Object.values(analysisStatus).filter((s) => s.status === 'completed').length;
  const errorCount = Object.values(analysisStatus).filter((s) => s.status === 'error').length;
  const overallProgress = totalPhotos > 0 ? (completedCount / totalPhotos) * 100 : 0;
  const allComplete = completedCount + errorCount === totalPhotos;

  // Timer pour temps écoulé et progression du header
  useEffect(() => {
    const hasAnalyzing = Object.values(analysisStatus).some((s) => s.status === 'analyzing');
    if (!hasAnalyzing && completedCount + errorCount < totalPhotos) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);

      // Calculer la progression du header basée sur MAX_PROGRESS_TIME_SECONDS
      setHeaderProgress((prev) => {
        const newProgress = ((elapsedTime + 1) / MAX_PROGRESS_TIME_SECONDS) * 100;
        return Math.min(92, newProgress); // Cap at 92% until actual completion
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [analysisStatus, elapsedTime, completedCount, errorCount, totalPhotos]);

  // When all analysis complete, set header progress to 100%
  useEffect(() => {
    if (completedCount + errorCount === totalPhotos && totalPhotos > 0) {
      setHeaderProgress(100);
    }
  }, [completedCount, errorCount, totalPhotos]);

  // Progression estimée avec courbe smooth et réaliste
  useEffect(() => {
    const interval = setInterval(() => {
      setEstimatedProgress((prev) => {
        const newProgress = { ...prev };
        let hasChanges = false;

        Object.keys(analysisStatus).forEach((photoId) => {
          const status = analysisStatus[photoId];
          if (status.status === 'analyzing') {
            const currentProgress = prev[photoId] || 0;

            // Courbe de progression smooth: rapide au début, ralentit vers la fin
            // 0-30% : 2% par seconde (15 secondes) - Phase initiale rapide
            // 30-60% : 1% par seconde (30 secondes) - Phase d'analyse
            // 60-85% : 0.5% par seconde (50 secondes) - Phase de détection fine
            // 85-92% : 0.25% par seconde (28 secondes) - Phase de finalisation
            // Total: ~2 minutes pour atteindre 92%, puis bloque jusqu'à completion réelle

            let increment = 0;
            if (currentProgress < 30) {
              increment = 2; // Rapide au début
            } else if (currentProgress < 60) {
              increment = 1; // Normal
            } else if (currentProgress < 85) {
              increment = 0.5; // Ralentit
            } else if (currentProgress < 92) {
              increment = 0.25; // Très lent à la fin
            }

            if (currentProgress < 92) {
              newProgress[photoId] = Math.min(92, currentProgress + increment);
              hasChanges = true;
            }
          } else if (status.status === 'completed') {
            newProgress[photoId] = 100;
            hasChanges = true;
          } else if (status.status === 'error') {
            newProgress[photoId] = 0;
            hasChanges = true;
          }
        });

        return hasChanges ? newProgress : prev;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [analysisStatus]);

  // Calculer le total d'équipements détectés en temps réel
  useEffect(() => {
    const totalEquipment = Object.values(analysisStatus).reduce((sum, status) => {
      return sum + (status.equipmentCount || 0);
    }, 0);
    setLiveEquipmentCount(totalEquipment);
  }, [analysisStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header moderne avec statistiques */}
      <div className="relative rounded-2xl p-4 md:p-6 overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
            rgba(255, 255, 255, 0.05)
          `,
          border: '2px solid rgba(6, 182, 212, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
            <motion.div
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))',
                border: '2px solid rgba(6, 182, 212, 0.4)'
              }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(6, 182, 212, 0.4)',
                  '0 0 40px rgba(6, 182, 212, 0.7)',
                  '0 0 20px rgba(6, 182, 212, 0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SpatialIcon Icon={ICONS.Sparkles} size={24} className="md:w-7 md:h-7" style={{ color: '#06B6D4', filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.8))' }} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-bold text-lg md:text-2xl truncate">
                  Analyse IA en cours
                </h3>
                <span className="px-2 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-medium whitespace-nowrap">
                  45-50s
                </span>
              </div>
              <p className="text-white/70 text-xs md:text-sm truncate">
                {analyzingCount > 0
                  ? `${analyzingCount} photo${analyzingCount > 1 ? 's' : ''} en cours d'analyse...`
                  : allComplete
                  ? '✓ Analyse terminée avec succès'
                  : 'Préparation de l\'analyse...'}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right flex md:flex-col items-center md:items-end gap-2 md:gap-0">
            <motion.div
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
              key={Math.round(headerProgress)}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              {Math.round(headerProgress)}%
            </motion.div>
          </div>
        </div>

        {/* Barre de progression moderne */}
        <div className="mt-4 md:mt-6 relative h-2 md:h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${headerProgress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #06B6D4, #3B82F6, #06B6D4)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)'
            }}
          />
          {/* Shimmer effect pendant l'analyse */}
          {analyzingCount > 0 && (
            <motion.div
              className="absolute inset-y-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '400%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{ width: '25%' }}
            />
          )}
        </div>

        {/* Compteur d'équipements en temps réel */}
        {liveEquipmentCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 md:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 p-3 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))',
              border: '2px solid rgba(34, 197, 94, 0.3)'
            }}
          >
            <SpatialIcon Icon={ICONS.Dumbbell} size={20} className="md:w-6 md:h-6" style={{ color: '#22C55E', filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))' }} />
            <div className="text-center sm:text-left">
              <div className="text-green-400 font-bold text-xl md:text-2xl">
                {liveEquipmentCount} équipement{liveEquipmentCount > 1 ? 's' : ''}
              </div>
              <div className="text-green-300/70 text-xs">détecté{liveEquipmentCount > 1 ? 's' : ''} jusqu'à présent</div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="sm:ml-auto"
            >
              <SpatialIcon Icon={ICONS.TrendingUp} size={18} className="text-green-400" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Grille de photos avec animations modernes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {photos.map((photo) => {
            const status = analysisStatus[photo.id] || { status: 'pending', progress: 0 };
            const isAnalyzing = status.status === 'analyzing';
            const isCompleted = status.status === 'completed';
            const isError = status.status === 'error';

            return (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden"
                  style={{
                    border: `2px solid ${
                      isCompleted ? 'rgba(34, 197, 94, 0.4)' :
                      isAnalyzing ? 'rgba(6, 182, 212, 0.4)' :
                      isError ? 'rgba(239, 68, 68, 0.4)' :
                      'rgba(255, 255, 255, 0.15)'
                    }`,
                    boxShadow: isAnalyzing ? '0 0 30px rgba(6, 182, 212, 0.3)' : undefined
                  }}
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${photo.order + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay moderne pendant l'analyse */}
                  {isAnalyzing && (
                    <>
                      {/* Fond semi-transparent */}
                      <div className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                          backdropFilter: 'blur(2px)'
                        }}
                      />

                      {/* Ligne de scan élégante */}
                      <motion.div
                        className="absolute inset-x-0 h-0.5"
                        animate={{ y: ['0%', '100%'] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                        style={{
                          background: 'linear-gradient(90deg, transparent, #06B6D4, #3B82F6, #06B6D4, transparent)',
                          boxShadow: '0 0 20px rgba(6, 182, 212, 0.8), 0 0 40px rgba(6, 182, 212, 0.5)'
                        }}
                      />

                      {/* Particules subtiles */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.8), transparent)',
                            left: `${10 + i * 15}%`,
                          }}
                          animate={{
                            y: ['0%', '100%'],
                            opacity: [0, 0.8, 0]
                          }}
                          transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: 'easeInOut'
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* Overlay succès */}
                  {isCompleted && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))'
                      }}
                    />
                  )}

                  {/* Overlay erreur */}
                  {isError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))'
                      }}
                    />
                  )}

                  {/* Badge de statut moderne */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <motion.div
                      className="px-3 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 shadow-lg"
                      style={{
                        background: isAnalyzing
                          ? 'rgba(6, 182, 212, 0.9)'
                          : isCompleted
                          ? 'rgba(34, 197, 94, 0.9)'
                          : isError
                          ? 'rgba(239, 68, 68, 0.9)'
                          : 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                      initial={{ scale: 0, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                    >
                      {isAnalyzing && (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          >
                            <SpatialIcon Icon={ICONS.Loader2} size={16} className="text-white" />
                          </motion.div>
                          <span className="text-white text-sm font-semibold">Scan IA...</span>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                          >
                            <SpatialIcon Icon={ICONS.CheckCircle2} size={16} className="text-white" />
                          </motion.div>
                          <span className="text-white text-sm font-semibold">
                            {status.equipmentCount || 0} trouvé{(status.equipmentCount || 0) > 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                      {isError && (
                        <>
                          <SpatialIcon Icon={ICONS.AlertCircle} size={16} className="text-white" />
                          <span className="text-white text-sm font-semibold">Échec</span>
                        </>
                      )}
                      {status.status === 'pending' && (
                        <>
                          <SpatialIcon Icon={ICONS.Clock} size={16} className="text-white" />
                          <span className="text-white text-sm font-semibold">En attente</span>
                        </>
                      )}
                    </motion.div>

                    <motion.div
                      className="px-3 py-1.5 rounded-full backdrop-blur-md text-white text-xs font-bold"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                      initial={{ scale: 0, x: 20 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ type: 'spring', delay: 0.15 }}
                    >
                      #{photo.order + 1}
                    </motion.div>
                  </div>

                  {/* Barre de progression par photo */}
                  {isAnalyzing && (
                    <div className="absolute bottom-0 inset-x-0 h-1.5"
                      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
                    >
                      <motion.div
                        className="h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${estimatedProgress[photo.id] || 0}%` }}
                        transition={{ duration: 0.3 }}
                        style={{
                          background: 'linear-gradient(90deg, #06B6D4, #3B82F6)',
                          boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Message d'erreur avec retry */}
                {isError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 rounded-xl"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '2px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <p className="text-red-300 text-sm mb-2">{status.error || 'Erreur inconnue'}</p>
                    {onRetry && (
                      <motion.button
                        onClick={() => onRetry(photo.id)}
                        className="w-full py-2 px-4 rounded-lg text-red-300 text-sm font-medium transition-all"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                        whileHover={{
                          background: 'rgba(239, 68, 68, 0.3)',
                          scale: 1.02
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <SpatialIcon Icon={ICONS.RotateCw} size={16} />
                          Réessayer l'analyse
                        </div>
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Résumé final moderne */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="p-4 md:p-6 rounded-2xl"
          style={{
            background: errorCount === 0
              ? `
                radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 60%),
                rgba(255, 255, 255, 0.05)
              `
              : `
                radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 60%),
                rgba(255, 255, 255, 0.05)
              `,
            border: `2px solid ${errorCount === 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
            <motion.div
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: errorCount === 0
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))',
                border: `2px solid ${errorCount === 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`
              }}
              animate={{
                boxShadow: [
                  `0 0 20px ${errorCount === 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  `0 0 40px ${errorCount === 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                  `0 0 20px ${errorCount === 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SpatialIcon
                Icon={errorCount === 0 ? ICONS.CheckCircle2 : ICONS.AlertCircle}
                size={24}
                className="md:w-8 md:h-8"
                style={{
                  color: errorCount === 0 ? '#22C55E' : '#F59E0B',
                  filter: `drop-shadow(0 0 16px ${errorCount === 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(245, 158, 11, 0.8)'})`
                }}
              />
            </motion.div>

            <div className="flex-1 w-full">
              <h4 className="text-white font-bold text-lg md:text-xl mb-3">
                {errorCount === 0 ? '✨ Analyse terminée avec succès' : '⚠️ Analyse terminée avec avertissements'}
              </h4>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <div className="text-white/60 text-xs mb-1 truncate">Photos analysées</div>
                  <div className="text-green-400 font-bold text-xl md:text-2xl flex items-center gap-1 md:gap-2">
                    {completedCount}
                    <div className="flex-shrink-0" style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}>
                      <GlowIcon icon="Image" color="#22C55E" size="small" glowIntensity={50} />
                    </div>
                  </div>
                </div>

                {errorCount > 0 && (
                  <div className="p-3 rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <div className="text-white/60 text-xs mb-1 truncate">Échecs</div>
                    <div className="text-red-400 font-bold text-xl md:text-2xl flex items-center gap-1 md:gap-2">
                      {errorCount}
                      <div className="flex-shrink-0" style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}>
                        <GlowIcon icon="AlertCircle" color="#EF4444" size="small" glowIntensity={50} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)'
                  }}
                >
                  <div className="text-white/60 text-xs mb-1 truncate">Équipements trouvés</div>
                  <div className="text-cyan-400 font-bold text-xl md:text-2xl flex items-center gap-1 md:gap-2">
                    {liveEquipmentCount}
                    <div className="flex-shrink-0" style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}>
                      <GlowIcon icon="Dumbbell" color="#06B6D4" size="small" glowIntensity={50} />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <div className="text-white/60 text-xs mb-1 truncate">Temps total</div>
                  <div className="text-purple-400 font-bold text-xl md:text-2xl flex items-center gap-1 md:gap-2">
                    <span className="truncate">{formatTime(elapsedTime)}</span>
                    <div className="flex-shrink-0" style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}>
                      <GlowIcon icon="Clock" color="#8B5CF6" size="small" glowIntensity={50} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PhotoAnalysisProgress;
