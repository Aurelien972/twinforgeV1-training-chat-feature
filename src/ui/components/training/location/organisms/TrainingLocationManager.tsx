/**
 * TrainingLocationManager Component
 * Bibliothèque de lieux scannés - Consultation des photos et détections IA
 * Version 3.1 - Focus sur la visualisation des lieux et équipements détectés
 *
 * Note: Pour la gestion active des équipements (ajout/suppression), voir EquipmentManagerCard
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import GlassCard from '../../../../cards/GlassCard';
import { LocationEditorModal, LocationCardSkeleton } from '../index';
import type { LocationEditorData, TrainingLocationWithDetails } from '../types';
import { EquipmentChip, EquipmentDetectionViewer } from '../../equipment';
import Create3DButton from '../../../../buttons/Create3DButton';
import ConfirmationModal from '../../../ConfirmationModal';
import { BackgroundAnalysisIndicator } from '../../feedback';
import GenericDrawer from '../../../GenericDrawer';
import { useTrainingLocations } from '../../../../../hooks/useTrainingLocations';
import { useToast } from '../../../ToastProvider';
import { useBackgroundAnalysis } from '../../../../../hooks/useBackgroundAnalysis';
import { useGlobalChatStore } from '../../../../../system/store/globalChatStore';
import { getLocationMetadata } from '../utils';
import {
  getPhotoDetections,
  isPhotoAnalyzed,
  type EquipmentDetection
} from '../../../../../system/services/equipmentDetectionService';
import type { PhotoJobInfo } from '../../../../system/services/backgroundAnalysisService';

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'home':
      return ICONS.Home;
    case 'gym':
      return ICONS.Dumbbell;
    case 'outdoor':
      return ICONS.TreePine;
    default:
      return ICONS.MapPin;
  }
};

const getLocationColor = (type: string) => {
  switch (type) {
    case 'home':
      return '#10B981';
    case 'gym':
      return '#3B82F6';
    case 'outdoor':
      return '#F59E0B';
    default:
      return '#06B6D4';
  }
};

const getLocationLabel = (type: string) => {
  switch (type) {
    case 'home':
      return 'Maison';
    case 'gym':
      return 'Salle de Sport';
    case 'outdoor':
      return 'Extérieur';
    default:
      return type;
  }
};

const TrainingLocationManager: React.FC = () => {
  const {
    locations,
    selectedLocation,
    loading,
    error,
    justCreatedLocationId,
    createNewLocation,
    updateExistingLocation,
    removeLocation,
    selectLocationForGeneration,
    refetchLocations,
    clearJustCreated
  } = useTrainingLocations();

  const { showToast } = useToast();
  const { showNotification } = useGlobalChatStore();

  const {
    batchProgress,
    hasActiveJobs,
    startBatchAnalysis,
    getLocationProgress
  } = useBackgroundAnalysis();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TrainingLocationWithDetails | null>(null);
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);
  const [viewingDetections, setViewingDetections] = useState<{ [photoId: string]: EquipmentDetection[] }>({});
  const [viewingDetectionPhotoId, setViewingDetectionPhotoId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    locationId: string;
    locationName: string;
  }>({ isOpen: false, locationId: '', locationName: '' });
  const [showBackgroundIndicator, setShowBackgroundIndicator] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // Track if we're currently toggling to prevent double-calls
  const isTogglingRef = React.useRef(false);

  // Track the actual viewing state to handle React StrictMode double-renders
  const viewingDetectionRef = React.useRef<string | null>(null);

  // Ref for auto-scroll to new location
  const newLocationRef = React.useRef<HTMLDivElement | null>(null);

  const handleCreateClick = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (location: TrainingLocationWithDetails) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleModalClose = async () => {
    setIsModalOpen(false);
    console.log('[TrainingLocationManager] Modal closed, refetching locations to get latest equipment data...');
    await refetchLocations();
    console.log('[TrainingLocationManager] Locations refetched successfully');
  };

  const handleSaveLocation = async (locationData: LocationEditorData) => {
    try {
      if (editingLocation) {
        await updateExistingLocation(editingLocation.id, {
          name: locationData.name,
          type: locationData.type,
          is_default: locationData.is_default
        });

        showToast({
          type: 'success',
          title: 'Lieu modifié',
          message: 'Le lieu a été mis à jour avec succès',
          duration: 3000
        });

        return null;
      } else {
        const createdLocation = await createNewLocation(locationData);

        showToast({
          type: 'success',
          title: 'Lieu créé',
          message: 'Le nouveau lieu a été créé avec succès',
          duration: 3000
        });

        return createdLocation;
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Impossible de sauvegarder le lieu',
        duration: 4000
      });
      throw error;
    }
  };

  const handleDeleteClick = (locationId: string, locationName?: string) => {
    setDeleteConfirmModal({
      isOpen: true,
      locationId,
      locationName: locationName || 'ce lieu'
    });
  };

  const handleConfirmDelete = async () => {
    const { locationId } = deleteConfirmModal;

    try {
      await removeLocation(locationId);

      showToast({
        type: 'success',
        title: 'Lieu supprimé',
        message: 'Le lieu a été supprimé avec succès',
        duration: 3000
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le lieu',
        duration: 4000
      });
    }
  };

  const handleSelectForGeneration = async (locationId: string) => {
    try {
      await selectLocationForGeneration(locationId);

      showToast({
        type: 'success',
        title: 'Lieu sélectionné',
        message: 'Ce lieu sera utilisé pour la prochaine génération',
        duration: 3000
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sélectionner le lieu',
        duration: 4000
      });
    }
  };

  const handleCloseExpandedLocation = useCallback(() => {
    setExpandedLocationId(null);
    viewingDetectionRef.current = null;
    setViewingDetectionPhotoId(null);
  }, []);

  const handleAnalyzeAllPhotos = useCallback(async (
    location: TrainingLocationWithDetails
  ) => {
    try {
      const photosToAnalyze: PhotoJobInfo[] = [];

      for (const photo of location.photos) {
        const analyzed = await isPhotoAnalyzed(photo.id);
        if (!analyzed) {
          photosToAnalyze.push({
            photoId: photo.id,
            photoUrl: photo.photo_url,
            photoOrder: photo.photo_order
          });
        }
      }

      if (photosToAnalyze.length === 0) {
        showToast({
          type: 'info',
          title: 'Déjà analysé',
          message: 'Toutes les photos ont déjà été analysées',
          duration: 3000
        });
        return;
      }

      await startBatchAnalysis(location.id, photosToAnalyze, location.type as 'home' | 'gym' | 'outdoor');

      showToast({
        type: 'success',
        title: 'Analyse lancée',
        message: `${photosToAnalyze.length} photo${photosToAnalyze.length > 1 ? 's' : ''} en cours d'analyse en arrière-plan`,
        duration: 4000
      });

      setShowBackgroundIndicator(true);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Impossible de lancer l\'analyse',
        duration: 4000
      });
    }
  }, [startBatchAnalysis, showToast]);

  const handleToggleDetections = useCallback((photoId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Prevent double-calls within 100ms
    if (isTogglingRef.current) {
      console.log('[Toggle Detections] Prevented double-call');
      return;
    }

    isTogglingRef.current = true;

    console.log('[Toggle Detections] Opening drawer for photo:', photoId);

    // Always open drawer (never toggle, always show)
    viewingDetectionRef.current = photoId;
    setViewingDetectionPhotoId(photoId);

    // Reset the toggling flag after a short delay
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 100);
  }, []);

  const handleCloseDetectionDrawer = useCallback(() => {
    console.log('[Toggle Detections] Closing drawer');
    viewingDetectionRef.current = null;
    setViewingDetectionPhotoId(null);
  }, []);

  const handleToggleExpand = useCallback((locationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log('[handleToggleExpand] Called for location:', locationId);

    setExpandedLocationId((prev) => {
      const isCurrentlyExpanded = prev === locationId;
      console.log('[handleToggleExpand] Currently expanded:', prev, 'Is currently expanded:', isCurrentlyExpanded);

      if (isCurrentlyExpanded) {
        // Si on ferme, réinitialiser aussi la vue des détections
        viewingDetectionRef.current = null;
        setViewingDetectionPhotoId(null);
        console.log('[handleToggleExpand] Closing expansion');
        return null;
      }
      // Si on ouvre un nouveau lieu, fermer la vue des détections de l'ancien
      viewingDetectionRef.current = null;
      setViewingDetectionPhotoId(null);
      console.log('[handleToggleExpand] Opening expansion');
      return locationId;
    });
  }, []);

  useEffect(() => {
    const loadDetections = async () => {
      const detectionsMap: { [photoId: string]: EquipmentDetection[] } = {};

      await Promise.all(
        locations.map(async (location) => {
          if (location.photos.length > 0) {
            await Promise.all(
              location.photos.map(async (photo) => {
                try {
                  const analyzed = await isPhotoAnalyzed(photo.id);
                  if (analyzed) {
                    const detections = await getPhotoDetections(photo.id);
                    if (detections.length > 0) {
                      detectionsMap[photo.id] = detections;
                    }
                  }
                } catch (error) {
                  console.error('Failed to load detections for photo:', photo.id, error);
                }
              })
            );
          }
        })
      );

      setViewingDetections(detectionsMap);
    };

    if (locations.length > 0) {
      loadDetections();
    }
  }, [locations]);

  useEffect(() => {
    if (deleteConfirmModal.isOpen || isModalOpen) {
      setExpandedLocationId(null);
      viewingDetectionRef.current = null;
      setViewingDetectionPhotoId(null);
    }
  }, [deleteConfirmModal.isOpen, isModalOpen]);

  useEffect(() => {
    if (justCreatedLocationId) {
      setShowCelebration(true);
      setTimeout(() => {
        if (newLocationRef.current) {
          newLocationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [justCreatedLocationId]);

  if (loading) {
    return (
      <GlassCard
        className="space-y-4 p-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'rgba(6, 182, 212, 0.2)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.35) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.12)
                `,
                border: '2px solid rgba(6, 182, 212, 0.5)'
              }}
            >
              <SpatialIcon
                Icon={ICONS.MapPin}
                size={24}
                style={{ color: '#06B6D4' }}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Lieux Scannés</h3>
              <p className="text-white/60 text-xs mt-0.5">Chargement...</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <LocationCardSkeleton />
          <LocationCardSkeleton />
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <SpatialIcon Icon={ICONS.AlertCircle} size={48} className="text-red-400 mb-4" />
          <p className="text-red-300 font-medium mb-2">Erreur de chargement</p>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard
        className="space-y-4 p-4"
        data-component="training-location-manager"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'rgba(6, 182, 212, 0.2)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.35) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.12)
                `,
                border: '2px solid rgba(6, 182, 212, 0.5)',
                boxShadow: `
                  0 4px 16px rgba(6, 182, 212, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
            >
              <SpatialIcon
                Icon={ICONS.MapPin}
                size={24}
                style={{
                  color: '#06B6D4',
                  filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.7))'
                }}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Lieux Scannés</h3>
              <p className="text-white/60 text-xs mt-0.5">
                {locations.length === 0
                  ? 'Aucun lieu scanné'
                  : `${locations.length} lieu${locations.length > 1 ? 'x' : ''} avec photos et détections IA`}
              </p>
            </div>
          </div>

        </div>

        {locations.length === 0 ? (
          <div className="p-8 rounded-xl border-2 border-dashed border-cyan-400/30 bg-cyan-500/5">
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.3) 0%, transparent 60%), rgba(6, 182, 212, 0.1)',
                  border: '2px solid rgba(6, 182, 212, 0.4)',
                  boxShadow: '0 4px 16px rgba(6, 182, 212, 0.2)'
                }}
              >
                <SpatialIcon
                  Icon={ICONS.MapPin}
                  size={40}
                  style={{
                    color: '#06B6D4',
                    filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.7))'
                  }}
                />
              </div>
              <h4 className="text-white font-semibold text-lg mb-2">Aucun lieu scanné</h4>
              <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
                Scannez votre premier lieu avec des photos pour détecter automatiquement vos équipements.
              </p>
              <Create3DButton
                onClick={handleCreateClick}
                icon="Plus"
                color="#06B6D4"
                size="lg"
              >
                Créer mon premier lieu
              </Create3DButton>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Create3DButton
                onClick={handleCreateClick}
                icon="Plus"
                color="#06B6D4"
                size="md"
              >
                Ajouter un lieu
              </Create3DButton>
            </div>
            <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {locations.map((location) => {
                const Icon = getLocationIcon(location.type);
                const color = getLocationColor(location.type);
                const isExpanded = expandedLocationId === location.id;
                const isSelected = selectedLocation?.id === location.id;
                const isNew = justCreatedLocationId === location.id;

                return (
                  <motion.div
                    key={location.id}
                    ref={isNew ? newLocationRef : null}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      boxShadow: isNew && showCelebration
                        ? ['0 0 0 0 rgba(6, 182, 212, 0.7)', '0 0 0 20px rgba(6, 182, 212, 0)', '0 0 0 0 rgba(6, 182, 212, 0)']
                        : '0 0 0 0 rgba(6, 182, 212, 0)'
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      boxShadow: {
                        duration: 1.5,
                        repeat: showCelebration ? 2 : 0,
                        ease: 'easeOut'
                      }
                    }}
                  >
                    <GlassCard
                      className="relative overflow-hidden"
                      style={{
                        background: isNew && showCelebration
                          ? `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.2) 0%, transparent 70%), rgba(255, 255, 255, 0.08)`
                          : isSelected
                          ? `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 15%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`
                          : undefined,
                        border: isNew && showCelebration
                          ? '2px solid rgba(6, 182, 212, 0.6)'
                          : isSelected
                          ? `2px solid color-mix(in srgb, ${color} 50%, transparent)`
                          : undefined
                      }}
                    >
                      <div className="p-3">
                        {/* Ligne 1: Icônes edit/delete */}
                        <div className="flex justify-end mb-2">
                          <div className="flex gap-1.5">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(location);
                              }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                              style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.25), transparent 70%), rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(59, 130, 246, 0.4)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                              }}
                              whileHover={{
                                scale: 1.05,
                                y: -2,
                                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                              }}
                              whileTap={{ scale: 0.95, y: 0 }}
                              title="Modifier"
                            >
                              <SpatialIcon Icon={ICONS.Edit} size={16} style={{ color: '#3B82F6', filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))' }} />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(location.id, location.name);
                              }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                              style={{
                                background: 'radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.25), transparent 70%), rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(239, 68, 68, 0.4)',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                              }}
                              whileHover={{
                                scale: 1.05,
                                y: -2,
                                boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                              }}
                              whileTap={{ scale: 0.95, y: 0 }}
                              title="Supprimer"
                            >
                              <SpatialIcon Icon={ICONS.Trash2} size={16} style={{ color: '#EF4444', filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))' }} />
                            </motion.button>
                          </div>
                        </div>

                        {/* Ligne 2: Icône + Titre/Sous-titre */}
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `color-mix(in srgb, ${color} 20%, transparent)`,
                              border: `2px solid color-mix(in srgb, ${color} 40%, transparent)`,
                              boxShadow: `0 4px 12px color-mix(in srgb, ${color} 20%, transparent)`
                            }}
                          >
                            <SpatialIcon Icon={Icon} size={24} style={{ color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-semibold text-base">
                                {location.name || getLocationLabel(location.type)}
                              </h4>
                              {isNew && (
                                <motion.span
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                  className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 font-bold"
                                  style={{
                                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearJustCreated();
                                  }}
                                >
                                  <span className="mr-1">✨</span>
                                  NOUVEAU
                                </motion.span>
                              )}
                              {isSelected && !isNew && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-400/20 text-green-300 border border-green-400/30 font-medium">
                                  <span className="mr-1">✓</span>
                                  Sélectionné
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-white/70 text-sm">{getLocationLabel(location.type)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {location.photos.length > 0 ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm font-semibold">
                                  Photos ({location.photos.length})
                                </span>
                                <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleExpand(location.id, e);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all flex items-center gap-1.5"
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      border: '2px solid rgba(255, 255, 255, 0.2)',
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                    }}
                                    whileHover={{
                                      y: -2,
                                      background: 'rgba(255, 255, 255, 0.15)',
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    }}
                                    whileTap={{ scale: 0.98, y: 0 }}
                                  >
                                    <SpatialIcon
                                      Icon={isExpanded ? ICONS.ChevronUp : ICONS.ChevronDown}
                                      size={14}
                                    />
                                    {isExpanded ? 'Masquer' : 'Voir tout'}
                                  </motion.button>
                              </div>
                              {isExpanded ? (
                                <div className="space-y-4">
                                  {location.photos.map((photo) => {
                                    const hasDetections = !!viewingDetections[photo.id];
                                    const isViewing = viewingDetectionPhotoId === photo.id;
                                    const locationProgress = getLocationProgress(location.id);

                                    return (
                                      <div key={photo.id} className="space-y-3">
                                        <div className="relative group rounded-lg overflow-hidden">
                                          <img
                                            src={photo.photo_url}
                                            alt={`Photo ${photo.photo_order + 1}`}
                                            className="w-full h-auto object-cover"
                                          />
                                          {hasDetections && (
                                            <div className="absolute top-2 right-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-green-500/90 backdrop-blur-sm flex items-center gap-1 md:gap-1.5 shadow-lg">
                                              <SpatialIcon Icon={ICONS.Check} size={12} className="text-white" />
                                              <span className="text-white text-[10px] md:text-xs font-semibold">
                                                {viewingDetections[photo.id].length} équipement{viewingDetections[photo.id].length > 1 ? 's' : ''}
                                              </span>
                                            </div>
                                          )}
                                          {locationProgress && locationProgress.processingPhotos > 0 && (
                                            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-cyan-500/90 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                                              <SpatialIcon Icon={ICONS.Loader2} size={14} className="text-white animate-spin" />
                                              <span className="text-white text-xs font-semibold">
                                                Analyse...
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {hasDetections && (
                                          <motion.button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleDetections(photo.id, e);
                                            }}
                                            className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                                            style={{
                                              background: 'rgba(255, 255, 255, 0.1)',
                                              border: '2px solid rgba(255, 255, 255, 0.2)',
                                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                            }}
                                            whileHover={{
                                              y: -2,
                                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                            }}
                                            whileTap={{ scale: 0.98, y: 0 }}
                                          >
                                            <SpatialIcon Icon={ICONS.Eye} size={16} />
                                            <span>Voir les détections</span>
                                          </motion.button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : location.photos.length > 0 ? (
                                <div className="flex gap-3 flex-wrap">
                                  {location.photos.slice(0, 4).map((photo, idx) => {
                                    const hasDetections = !!viewingDetections[photo.id];
                                    return (
                                      <div
                                        key={photo.id}
                                        className="relative group cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (hasDetections) {
                                            handleToggleDetections(photo.id, e);
                                          } else {
                                            handleToggleExpand(location.id, e);
                                          }
                                        }}
                                      >
                                        <img
                                          src={photo.photo_url}
                                          alt={`Photo ${idx + 1}`}
                                          className="w-20 h-20 rounded-lg object-cover transition-all group-hover:scale-105 group-hover:shadow-lg"
                                        />
                                        {hasDetections && (
                                          <>
                                            <div className="absolute top-1 right-1 px-2 py-0.5 rounded-full bg-green-500/95 backdrop-blur-sm flex items-center gap-1 shadow-lg border border-white/20">
                                              <SpatialIcon Icon={ICONS.Check} size={10} className="text-white" />
                                              <span className="text-white text-[10px] font-bold">
                                                {viewingDetections[photo.id].length}
                                              </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-2">
                                              <span className="text-white text-[10px] font-semibold flex items-center gap-1">
                                                <SpatialIcon Icon={ICONS.Eye} size={10} />
                                                Détections
                                              </span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {location.photos.length > 4 && (
                                    <div
                                      className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleExpand(location.id, e);
                                      }}
                                    >
                                      <span className="text-white/80 text-sm font-semibold">
                                        +{location.photos.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-white/50 text-xs">Aucune photo</p>
                              )}

                              {/* Bouton pour voir toutes les détections */}
                              {location.photos.some(photo => viewingDetections[photo.id]?.length > 0) && !isExpanded && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firstPhotoWithDetections = location.photos.find(
                                      photo => viewingDetections[photo.id]?.length > 0
                                    );
                                    if (firstPhotoWithDetections) {
                                      handleToggleDetections(firstPhotoWithDetections.id, e);
                                    }
                                  }}
                                  className="w-full mt-3 py-2 px-4 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2)), rgba(255, 255, 255, 0.05)',
                                    border: '2px solid rgba(34, 197, 94, 0.4)',
                                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                  }}
                                  whileHover={{
                                    y: -2,
                                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                  }}
                                  whileTap={{ scale: 0.98, y: 0 }}
                                >
                                  <SpatialIcon Icon={ICONS.Eye} size={16} />
                                  <span>Voir les détections</span>
                                </motion.button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white/80 text-sm font-semibold">
                                  Équipements ({location.equipment.length})
                                </span>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExpand(location.id, e);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all flex items-center gap-1.5"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                  }}
                                  whileHover={{
                                    y: -2,
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                  }}
                                  whileTap={{ scale: 0.98, y: 0 }}
                                >
                                  <SpatialIcon
                                    Icon={isExpanded ? ICONS.ChevronUp : ICONS.ChevronDown}
                                    size={14}
                                  />
                                  {isExpanded ? 'Masquer' : 'Voir tout'}
                                </motion.button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(isExpanded
                                  ? location.equipment
                                  : location.equipment.slice(0, 4)
                                ).map((eq) => (
                                  <EquipmentChip
                                    key={eq.id}
                                    label={eq.equipment_name}
                                    isCustom={eq.is_custom}
                                    color={color}
                                    disabled
                                  />
                                ))}
                                {!isExpanded && location.equipment.length > 4 && (
                                  <div className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-xs">
                                    +{location.equipment.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('[TrainingLocationManager] Select button clicked for location:', location.id, 'Current selected:', selectedLocation?.id);
                              handleSelectForGeneration(location.id);
                            }}
                            className="w-full mt-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 relative z-10"
                            style={{
                              background: isSelected
                                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2)), rgba(255, 255, 255, 0.05)'
                                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3)), rgba(255, 255, 255, 0.1)',
                              border: isSelected
                                ? '2px solid rgba(34, 197, 94, 0.4)'
                                : '2px solid rgba(34, 197, 94, 0.5)',
                              boxShadow: isSelected
                                ? '0 2px 12px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                : '0 4px 16px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                              textShadow: '0 0 12px rgba(34, 197, 94, 0.6)',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              isolation: 'isolate'
                            }}
                            whileHover={{
                              y: -2,
                              scale: 1.01,
                              boxShadow: isSelected
                                ? '0 4px 16px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                : '0 6px 20px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                            }}
                            whileTap={{ scale: 0.98, y: 0 }}
                          >
                            <SpatialIcon Icon={ICONS.Check} size={16} style={{ filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))' }} />
                            {isSelected ? (
                              <>
                                <span className="hidden sm:inline">Lieu actif - Cliquer pour confirmer</span>
                                <span className="sm:hidden">Lieu actif</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline">Sélectionner pour génération</span>
                                <span className="sm:hidden">Sélectionner</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          </>
        )}

        {/* Info Card - Rôle du composant */}
        <div className="mt-4 p-4 rounded-lg" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.08)), rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
              background: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <SpatialIcon Icon={ICONS.Info} size={20} style={{ color: '#06B6D4' }} />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold text-sm mb-2">À propos de cette section</h4>
              <p className="text-white/70 text-xs leading-relaxed mb-2">
                Cette bibliothèque affiche tous vos lieux scannés avec leurs photos et détections IA.
                C'est un espace de consultation pour visualiser l'analyse de vos équipements.
              </p>
              <p className="text-cyan-300 text-xs leading-relaxed">
                Pour gérer activement vos équipements (ajouter, supprimer, modifier), utilisez la section
                <span className="font-semibold"> "Mes Équipements"</span> ci-dessus.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      <LocationEditorModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveLocation}
        existingLocation={editingLocation}
        mode={editingLocation ? 'edit' : 'create'}
      />

      <ConfirmationModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, locationId: '', locationName: '' })}
        onConfirm={handleConfirmDelete}
        title="Supprimer le lieu"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirmModal.locationName}" ? Cette action est irréversible et supprimera toutes les photos et données associées.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <AnimatePresence>
        {hasActiveJobs && batchProgress && showBackgroundIndicator && (
          <BackgroundAnalysisIndicator
            progress={batchProgress}
            onExpand={() => {
              // TODO: Ouvrir un modal détaillé de progression
            }}
            onDismiss={() => setShowBackgroundIndicator(false)}
          />
        )}
      </AnimatePresence>

      {/* Detection Viewer Drawer */}
      <GenericDrawer
        isOpen={!!viewingDetectionPhotoId}
        onClose={handleCloseDetectionDrawer}
        title="Équipements détectés"
        size="full"
      >
        {viewingDetectionPhotoId && (() => {
          const photo = locations.flatMap(loc => loc.photos).find(p => p.id === viewingDetectionPhotoId);
          const detections = viewingDetections[viewingDetectionPhotoId];

          console.log('[DRAWER DEBUG]', {
            photoId: viewingDetectionPhotoId,
            hasPhoto: !!photo,
            hasDetections: !!detections,
            detectionsCount: detections?.length || 0
          });

          if (!photo) {
            return <div className="p-4 text-white">Photo introuvable</div>;
          }

          if (!detections || detections.length === 0) {
            return (
              <div className="p-4 text-white">
                <p>Chargement des détections...</p>
              </div>
            );
          }

          return (
            <div className="h-full">
              <EquipmentDetectionViewer
                photoUrl={photo.photo_url}
                detections={detections}
                showAnnotations={true}
                enableFullscreen={false}
              />
            </div>
          );
        })()}
      </GenericDrawer>
    </>
  );
};

export default TrainingLocationManager;
