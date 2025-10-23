/**
 * SavedDraftsCard Component
 * Displays user's saved training drafts with actions to resume or delete
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingDraftsService, type TrainingDraft } from '../../../../system/services/trainingDraftsService';
import { useTrainingPipeline } from '../../../../system/store/trainingPipeline';
import { Haptics } from '../../../../utils/haptics';
import { useToast } from '../../ToastProvider';
import logger from '../../../../lib/utils/logger';
import { TRAINING_COLORS } from '../../../theme/trainingColors';
import { illustrationCacheService } from '../../../../system/services/illustrationCacheService';
import { illustrationMatchingService } from '../../../../system/services/illustrationMatchingService';
import { normalizeDiscipline, getDisciplineFromPrescription } from '../../../../utils/disciplineNormalizer';
import ConfirmationModal from '../../ConfirmationModal';

const TRAINING_COLOR = TRAINING_COLORS.history;

const SavedDraftsCard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setPreparerData, setSessionPrescription, setCurrentStep } = useTrainingPipeline();
  const [drafts, setDrafts] = useState<TrainingDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    draftId: string | null;
    draftName: string | null;
  }>({ isOpen: false, draftId: null, draftName: null });

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const userDrafts = await trainingDraftsService.getUserDrafts();
      setDrafts(userDrafts);
      logger.info('SAVED_DRAFTS_CARD', 'Loaded drafts', { count: userDrafts.length });
    } catch (error) {
      logger.error('SAVED_DRAFTS_CARD', 'Failed to load drafts', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les trainings sauvegardés',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeDraft = async (draft: TrainingDraft) => {
    try {
      logger.info('SAVED_DRAFTS_CARD', 'Resuming draft', { draftId: draft.id });

      // CRITICAL: Preload illustrations BEFORE navigating
      // This ensures illustrations are in cache when Step 2 renders
      if (draft.prescription?.exercises && Array.isArray(draft.prescription.exercises)) {
        const discipline = getDisciplineFromPrescription(draft.prescription);

        logger.info('SAVED_DRAFTS_CARD', 'Preloading illustrations for draft exercises', {
          exerciseCount: draft.prescription.exercises.length,
          discipline
        });

        // Preload all exercise illustrations in parallel
        const preloadPromises = draft.prescription.exercises.map(async (exercise: any) => {
          try {
            // Check if already in cache
            const cached = illustrationCacheService.get(exercise.name, discipline);
            if (cached) {
              logger.debug('SAVED_DRAFTS_CARD', 'Exercise already in cache', {
                exerciseName: exercise.name
              });
              return;
            }

            // Fetch from database and cache
            const match = await illustrationMatchingService.findExerciseIllustration({
              exerciseName: exercise.name,
              discipline,
              muscleGroups: exercise.muscleGroups,
              equipment: exercise.equipment
            });

            if (match) {
              illustrationCacheService.set(
                exercise.name,
                discipline,
                match.id,
                match.imageUrl,
                match.thumbnailUrl,
                match.source,
                match.isDiptych,
                match.aspectRatio
              );
              logger.info('SAVED_DRAFTS_CARD', 'Exercise illustration preloaded', {
                exerciseName: exercise.name,
                illustrationId: match.id
              });
            } else {
              logger.debug('SAVED_DRAFTS_CARD', 'No illustration found for exercise', {
                exerciseName: exercise.name
              });
            }
          } catch (error) {
            logger.warn('SAVED_DRAFTS_CARD', 'Failed to preload exercise illustration', {
              exerciseName: exercise.name,
              error: error instanceof Error ? error.message : 'Unknown'
            });
          }
        });

        // Wait for all preloads to complete (with timeout)
        await Promise.race([
          Promise.allSettled(preloadPromises),
          new Promise(resolve => setTimeout(resolve, 5000)) // 5s timeout
        ]);

        logger.info('SAVED_DRAFTS_CARD', 'Illustration preload completed');
      }

      // Restore preparer data and prescription to store
      setPreparerData(draft.context);
      setSessionPrescription(draft.prescription);

      // Navigate to step 2
      setCurrentStep('activer');
      navigate('/training/pipeline');

      Haptics.success();
      showToast({
        type: 'success',
        title: 'Training chargé',
        message: draft.customName || 'Ton training a été chargé',
        duration: 3000
      });
    } catch (error) {
      logger.error('SAVED_DRAFTS_CARD', 'Failed to resume draft', {
        draftId: draft.id,
        error: error instanceof Error ? error.message : 'Unknown'
      });
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger ce training',
        duration: 4000
      });
    }
  };

  const handleDeleteDraft = (draftId: string, draftName: string | null) => {
    setDeleteConfirmation({
      isOpen: true,
      draftId,
      draftName
    });
    Haptics.impact('light');
  };

  const confirmDeleteDraft = async () => {
    const { draftId, draftName } = deleteConfirmation;
    if (!draftId) return;

    setDeleteConfirmation({ isOpen: false, draftId: null, draftName: null });
    setDeletingId(draftId);
    Haptics.impact('medium');

    try {
      const success = await trainingDraftsService.deleteDraft(draftId);

      if (success) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        showToast({
          type: 'success',
          title: 'Supprimé',
          message: 'Training supprimé avec succès',
          duration: 3000
        });
        Haptics.success();
        logger.info('SAVED_DRAFTS_CARD', 'Draft deleted', { draftId });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      logger.error('SAVED_DRAFTS_CARD', 'Failed to delete draft', {
        draftId,
        error: error instanceof Error ? error.message : 'Unknown'
      });
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer ce training',
        duration: 4000
      });
      Haptics.error();
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDeleteDraft = () => {
    setDeleteConfirmation({ isOpen: false, draftId: null, draftName: null });
    Haptics.impact('light');
  };

  const formatExpirationText = (days: number): string => {
    if (days === 0) return "Expire aujourd'hui";
    if (days === 1) return 'Expire demain';
    return `Expire dans ${days} jours`;
  };

  const getExpirationColor = (days: number): string => {
    if (days <= 1) return '#EF4444'; // Red
    if (days <= 3) return '#F59E0B'; // Orange
    return '#22C55E'; // Green
  };

  if (loading) {
    return (
      <GlassCard className="p-6" style={{ minHeight: '200px' }}>
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <SpatialIcon Icon={ICONS.Loader} size={32} style={{ color: TRAINING_COLOR }} />
          </motion.div>
        </div>
      </GlassCard>
    );
  }

  if (drafts.length === 0) {
    return null; // Don't show card if no drafts
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <GlassCard
        className="p-6 space-y-4"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${TRAINING_COLOR} 40%, transparent) 0%, transparent 70%), rgba(255, 255, 255, 0.12)`,
              border: `1.5px solid color-mix(in srgb, ${TRAINING_COLOR} 50%, transparent)`,
              boxShadow: `0 4px 12px color-mix(in srgb, ${TRAINING_COLOR} 30%, transparent)`
            }}
          >
            <SpatialIcon
              Icon={ICONS.Bookmark}
              size={20}
              style={{
                color: TRAINING_COLOR,
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${TRAINING_COLOR} 60%, transparent))`
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Trainings Sauvegardés</h3>
            <p className="text-white/60 text-sm">{drafts.length} brouillon{drafts.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Drafts List */}
        <div className="space-y-3">
          <AnimatePresence>
            {drafts.map((draft, index) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  x: 20,
                  scale: 0.9,
                  height: 0,
                  marginBottom: 0,
                  transition: {
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
                transition={{
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 400,
                  damping: 30
                }}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  transition: {
                    type: 'spring',
                    stiffness: 500,
                    damping: 25
                  }
                }}
                className="p-4 rounded-xl cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold truncate">
                        {draft.customName || draft.sessionType}
                      </h4>
                      {draft.customName && (
                        <span className="text-xs text-white/50 px-2 py-0.5 rounded-full bg-white/5">
                          {draft.sessionType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/60">
                      <div className="flex items-center gap-1">
                        <SpatialIcon Icon={ICONS.Clock} size={12} />
                        <span>{draft.durationTarget}min</span>
                      </div>
                      {draft.venue && (
                        <div className="flex items-center gap-1">
                          <SpatialIcon Icon={ICONS.MapPin} size={12} />
                          <span className="truncate max-w-[100px]">{draft.venue}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className="text-xs font-medium mt-2"
                      style={{ color: getExpirationColor(draft.daysUntilExpiration) }}
                    >
                      {formatExpirationText(draft.daysUntilExpiration)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleResumeDraft(draft)}
                      whileHover={{
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                        transition: {
                          type: 'spring',
                          stiffness: 500,
                          damping: 20,
                          rotate: {
                            duration: 0.3
                          }
                        }
                      }}
                      whileTap={{ scale: 0.9 }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${TRAINING_COLOR} 0%, color-mix(in srgb, ${TRAINING_COLOR} 80%, black) 100%)`,
                        boxShadow: `0 2px 8px color-mix(in srgb, ${TRAINING_COLOR} 40%, transparent)`,
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)'
                      }}
                    >
                      <motion.div
                        animate={{ x: [0, 2, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      >
                        <SpatialIcon Icon={ICONS.Play} size={16} style={{ color: 'white' }} />
                      </motion.div>
                    </motion.button>

                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDraft(draft.id, draft.customName);
                      }}
                      disabled={deletingId === draft.id}
                      whileHover={{ scale: deletingId === draft.id ? 1 : 1.05 }}
                      whileTap={{ scale: deletingId === draft.id ? 1 : 0.95 }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        opacity: deletingId === draft.id ? 0.5 : 1
                      }}
                    >
                      {deletingId === draft.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <SpatialIcon Icon={ICONS.Loader} size={14} style={{ color: '#EF4444' }} />
                        </motion.div>
                      ) : (
                        <SpatialIcon Icon={ICONS.Trash2} size={14} style={{ color: '#EF4444' }} />
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDeleteDraft}
        onConfirm={confirmDeleteDraft}
        title="Supprimer ce training ?"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirmation.draftName || 'ce training'}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </motion.div>
  );
};

export default SavedDraftsCard;
