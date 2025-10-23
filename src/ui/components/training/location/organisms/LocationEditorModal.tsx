/**
 * LocationEditorModal Component
 * Modal pour créer ou éditer un lieu d'entraînement
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { LocationTypeCard } from '../atoms';
import { LocationPhotoCapture, PhotoAnalysisProgress } from '../organisms';
import { EquipmentDetectionViewer } from '../../equipment';
import GlowIcon from '../../GlowIcon';
import type { LocationEditorModalProps, LocationEditorData, LocationType, TrainingLocationWithDetails, LocationPhoto } from '../types';
import { LOCATION_NAME_PLACEHOLDERS } from '../constants';
import { detectEquipmentInPhoto, getPhotoDetections, type EquipmentDetection } from '../../../../../system/services/equipmentDetectionService';
import logger from '../../../../../lib/utils/logger';


const LocationEditorModal: React.FC<LocationEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingLocation,
  mode
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const [locationType, setLocationType] = useState<LocationType>('home');
  const [locationName, setLocationName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [isDefault, setIsDefault] = useState(false);

  const [createdLocation, setCreatedLocation] = useState<{ id: string; photos: LocationPhoto[] } | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<{
    [photoId: string]: {
      status: 'pending' | 'analyzing' | 'completed' | 'error';
      progress: number;
      equipmentCount?: number;
      error?: string;
    };
  }>({});
  const [selectedPhotoForView, setSelectedPhotoForView] = useState<string | null>(null);
  const [photoDetections, setPhotoDetections] = useState<{ [photoId: string]: EquipmentDetection[] }>({});

  useEffect(() => {
    if (existingLocation && mode === 'edit') {
      setLocationType(existingLocation.type);
      setLocationName(existingLocation.name || '');
      setSelectedEquipment(existingLocation.equipment.map((eq) => eq.equipment_name));
      setIsDefault(existingLocation.is_default);
    } else {
      resetForm();
    }
  }, [existingLocation, mode, isOpen]);

  const resetForm = () => {
    setStep(1);
    setLocationType('home');
    setLocationName('');
    setSelectedEquipment([]);
    setNewPhotos([]);
    setIsDefault(false);
    setCreatedLocation(null);
    setAnalysisStatus({});
    setAnalyzing(false);
  };

  const [closeAttempted, setCloseAttempted] = useState(false);

  const handleClose = () => {
    if (saving || analyzing) {
      // Afficher un feedback visuel quand l'utilisateur tente de fermer pendant l'analyse
      setCloseAttempted(true);
      setTimeout(() => setCloseAttempted(false), 2000);
      return;
    }
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      logger.info('LOCATION_EDITOR', 'Starting location save', {
        mode,
        locationType,
        hasPhotos: newPhotos.length > 0,
        photosCount: newPhotos.length
      });

      const locationData: LocationEditorData = {
        name: locationName.trim() || undefined,
        type: locationType,
        is_default: isDefault,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        photos: newPhotos.length > 0 ? newPhotos : undefined
      };

      const result = await onSave(locationData) as any;

      logger.info('LOCATION_EDITOR', 'Location saved successfully - FULL RESULT', {
        mode,
        result: JSON.stringify(result),
        resultId: result?.id,
        hasPhotos: result?.photos && result.photos.length > 0,
        photosCount: result?.photos?.length || 0,
        hadPhotosInRequest: newPhotos.length > 0
      });

      if (mode === 'create' && newPhotos.length > 0 && result?.id) {
        const photosToAnalyze = result?.photos || [];

        if (photosToAnalyze.length > 0) {
          logger.info('LOCATION_EDITOR', 'Starting photo analysis workflow', {
            locationId: result.id,
            photosToAnalyze: photosToAnalyze.length
          });

          setCreatedLocation({
            id: result.id,
            photos: photosToAnalyze
          });
          setStep(4);
          setSaving(false);
          startPhotoAnalysis(photosToAnalyze, result.id);
        } else {
          logger.warn('LOCATION_EDITOR', 'Photos were uploaded but not returned in result', {
            locationId: result.id,
            resultKeys: Object.keys(result)
          });
          handleClose();
        }
      } else {
        logger.info('LOCATION_EDITOR', 'No photos to analyze, closing modal');
        handleClose();
      }
    } catch (error) {
      logger.error('LOCATION_EDITOR', 'Failed to save location', {
        error: error instanceof Error ? error.message : 'Unknown error',
        mode,
        locationType
      });
      console.error('Failed to save location:', error);
      setSaving(false);
    }
  };

  const startPhotoAnalysis = async (photos: LocationPhoto[], locationId: string) => {
    logger.info('LOCATION_EDITOR', 'Starting photo analysis for all photos', {
      locationId,
      photosCount: photos.length,
      photoIds: photos.map(p => p.id)
    });

    setAnalyzing(true);

    const initialStatus: typeof analysisStatus = {};
    photos.forEach((photo) => {
      initialStatus[photo.id] = { status: 'pending', progress: 0 };
    });
    setAnalysisStatus(initialStatus);

    logger.info('LOCATION_EDITOR', 'Initial analysis status set to pending for all photos');

    const analysisPromises = photos.map(async (photo, index) => {
      try {
        logger.info('LOCATION_EDITOR', `Starting analysis for photo ${index + 1}/${photos.length}`, {
          photoId: photo.id,
          photoUrl: photo.photo_url.substring(0, 100) + '...'
        });

        setAnalysisStatus((prev) => ({
          ...prev,
          [photo.id]: { status: 'analyzing', progress: 30 }
        }));

        const analysisStartTime = Date.now();
        const result = await detectEquipmentInPhoto(
          photo.photo_url,
          photo.id,
          locationId,
          locationType
        );
        const analysisDuration = Date.now() - analysisStartTime;

        logger.info('LOCATION_EDITOR', `Photo analysis completed successfully`, {
          photoId: photo.id,
          equipmentCount: result.equipment_count,
          durationMs: analysisDuration,
          durationSec: Math.round(analysisDuration / 1000)
        });

        setAnalysisStatus((prev) => ({
          ...prev,
          [photo.id]: {
            status: 'completed',
            progress: 100,
            equipmentCount: result.equipment_count
          }
        }));

        // Load detections for display
        const detections = await getPhotoDetections(photo.id);
        logger.info('LOCATION_EDITOR', `Detections loaded for display`, {
          photoId: photo.id,
          detectionsCount: detections.length
        });

        setPhotoDetections((prev) => ({
          ...prev,
          [photo.id]: detections
        }));
      } catch (error) {
        logger.error('LOCATION_EDITOR', `Photo analysis failed`, {
          photoId: photo.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        });

        console.error(`Failed to analyze photo ${photo.id}:`, error);
        setAnalysisStatus((prev) => ({
          ...prev,
          [photo.id]: {
            status: 'error',
            progress: 0,
            error: error instanceof Error ? error.message : 'Erreur d\'analyse'
          }
        }));
      }
    });

    logger.info('LOCATION_EDITOR', 'Waiting for all analysis promises to settle');
    const results = await Promise.allSettled(analysisPromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    logger.info('LOCATION_EDITOR', 'All photo analyses completed', {
      totalPhotos: photos.length,
      successCount,
      failureCount
    });

    setAnalyzing(false);
  };

  const handleRetryAnalysis = async (photoId: string) => {
    if (!createdLocation) return;

    const photo = createdLocation.photos.find((p) => p.id === photoId);
    if (!photo) return;

    setAnalysisStatus((prev) => ({
      ...prev,
      [photoId]: { status: 'analyzing', progress: 30 }
    }));

    try {
      const result = await detectEquipmentInPhoto(
        photo.photo_url,
        photo.id,
        createdLocation.id,
        locationType
      );

      setAnalysisStatus((prev) => ({
        ...prev,
        [photoId]: {
          status: 'completed',
          progress: 100,
          equipmentCount: result.equipment_count
        }
      }));
    } catch (error) {
      setAnalysisStatus((prev) => ({
        ...prev,
        [photoId]: {
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Erreur d\'analyse'
        }
      }));
    }
  };

  const canProceedToStep2 = locationType !== null;
  const canProceedToStep3 = newPhotos.length > 0 || (existingLocation?.photos.length || 0) > 0;

  const getStepColor = () => {
    switch (step) {
      case 1: return '#10B981';
      case 2: return '#3B82F6';
      case 3: return '#F59E0B';
      case 4: return '#06B6D4';
      default: return '#06B6D4';
    }
  };

  const allAnalysisComplete = createdLocation
    ? createdLocation.photos.every(
        (photo) =>
          analysisStatus[photo.id]?.status === 'completed' ||
          analysisStatus[photo.id]?.status === 'error'
      )
    : false;

  useEffect(() => {
    if (allAnalysisComplete && !analyzing && createdLocation) {
      const timer = setTimeout(() => {
        setShowSuccessScreen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [allAnalysisComplete, analyzing, createdLocation]);

  const handleViewLocation = () => {
    handleClose();
    navigate('/profile?tab=preferences');
    setTimeout(() => {
      const locationManagerElement = document.querySelector('[data-component="training-location-manager"]');
      if (locationManagerElement) {
        locationManagerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleStartTraining = () => {
    handleClose();
    navigate('/training/pipeline');
  };

  const getTotalEquipmentDetected = () => {
    if (!createdLocation) return 0;
    return Object.values(photoDetections).reduce((sum, detections) => sum + detections.length, 0);
  };

  const stepColor = getStepColor();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
            cursor: (saving || analyzing) ? 'not-allowed' : 'default',
            overflow: 'hidden'
          }}
          onClick={(saving || analyzing) ? (e) => {
            e.stopPropagation();
            setCloseAttempted(true);
            setTimeout(() => setCloseAttempted(false), 2000);
          } : handleClose}
        >
          <div
            className="relative w-full h-full sm:h-auto max-w-4xl max-h-[85vh] md:max-h-[90vh] flex flex-col mx-3 rounded-2xl"
            style={{
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
          <div
            className="p-0 overflow-hidden rounded-2xl flex flex-col max-h-full"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
                radial-gradient(circle at 70% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '2px solid rgba(6, 182, 212, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 40px rgba(6, 182, 212, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `
            }}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {step === 4 ? 'Analyse des Équipements' : mode === 'create' ? 'Créer un Lieu d\'Entraînement' : 'Modifier le Lieu'}
                  </h2>
                  <p className="text-white/60 text-sm mt-1">
                    {step === 4 ? 'Détection IA en cours...' : `Étape ${step} sur 3`}
                  </p>
                </div>
                <motion.button
                  onClick={handleClose}
                  disabled={saving || analyzing}
                  className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:opacity-80"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    isolation: 'isolate'
                  }}
                  animate={closeAttempted ? {
                    x: [-10, 10, -10, 10, 0],
                    rotate: [0, -5, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 0.4 }}
                  title={(saving || analyzing) ? 'Veuillez patienter, analyse en cours...' : 'Fermer'}
                >
                  <SpatialIcon Icon={ICONS.X} size={20} className="text-white relative z-10" />
                </motion.button>
                {closeAttempted && (analyzing || saving) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full right-0 mt-2 px-4 py-2 rounded-lg bg-cyan-500/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg whitespace-nowrap z-50"
                    style={{
                      border: '1px solid rgba(6, 182, 212, 0.5)'
                    }}
                  >
                    🔒 Analyse en cours, veuillez patienter...
                  </motion.div>
                )}
              </div>

              {step <= 4 && (
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background: s <= step ? stepColor : 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 overflow-y-auto overscroll-contain flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(6, 182, 212, 0.3) transparent',
              minHeight: 0,
              maxHeight: 'calc(85vh - 180px)',
              overscrollBehavior: 'contain',
              overflowY: 'auto',
              touchAction: 'pan-y'
            }}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent), transparent 70%)`,
                          border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                          boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent)`
                        }}
                      >
                        <SpatialIcon
                          Icon={ICONS.MapPin}
                          size={28}
                          style={{
                            color: stepColor,
                            filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">Type de Lieu</h3>
                        <p className="text-white/60 text-sm">Où allez-vous vous entraîner ?</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <LocationTypeCard
                        type="home"
                        label="Maison"
                        description="Entraînement à domicile"
                        isSelected={locationType === 'home'}
                        onClick={() => setLocationType('home')}
                      />
                      <LocationTypeCard
                        type="gym"
                        label="Salle de Sport"
                        description="Salle équipée"
                        isSelected={locationType === 'gym'}
                        onClick={() => setLocationType('gym')}
                      />
                      <LocationTypeCard
                        type="outdoor"
                        label="Extérieur"
                        description="Entraînement en plein air"
                        isSelected={locationType === 'outdoor'}
                        onClick={() => setLocationType('outdoor')}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent), transparent 70%)`,
                          border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                          boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent)`
                        }}
                      >
                        <SpatialIcon
                          Icon={ICONS.Edit}
                          size={28}
                          style={{
                            color: stepColor,
                            filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">Nom du Lieu</h3>
                        <p className="text-white/60 text-sm">Donnez un nom personnalisé (optionnel)</p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder={`Ex: ${
                          locationType === 'home'
                            ? 'Ma salle à domicile'
                            : locationType === 'gym'
                            ? 'Basic Fit Centre'
                            : 'Parc de la ville'
                        }`}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
                      />
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-400/20">
                      <SpatialIcon Icon={ICONS.Info} size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-200">
                        <p className="font-medium mb-1">Pourquoi nommer votre lieu ?</p>
                        <p className="text-blue-300/90 text-xs">
                          Un nom personnalisé vous permet de différencier facilement plusieurs lieux du même type
                          (ex: "Basic Fit Lyon" et "Basic Fit Paris")
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent), transparent 70%)`,
                          border: `2px solid color-mix(in srgb, ${stepColor} 40%, transparent)`,
                          boxShadow: `0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent)`
                        }}
                      >
                        <SpatialIcon
                          Icon={ICONS.Camera}
                          size={28}
                          style={{
                            color: stepColor,
                            filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Photos de l'Environnement
                        </h3>
                        <p className="text-white/60 text-sm">
                          Ajoutez des photos de votre espace d'entraînement
                        </p>
                      </div>
                    </div>

                    <LocationPhotoCapture
                        onPhotosChange={setNewPhotos}
                        maxPhotos={5}
                        existingPhotos={existingLocation?.photos.map((p) => p.photo_url) || []}
                        hideHeader={true}
                      />

                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors active:opacity-80">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <div>
                          <span className="text-white font-medium">Lieu par défaut</span>
                          <p className="text-white/60 text-xs mt-0.5">
                            Ce lieu sera présélectionné lors de la création de programmes
                          </p>
                        </div>
                      </label>

                    </div>
                  </motion.div>
                )}

                {step === 4 && createdLocation && !showSuccessScreen && (
                  <motion.div
                    key="step4-analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <PhotoAnalysisProgress
                      photos={createdLocation.photos.map((p) => ({
                        url: p.photo_url,
                        id: p.id,
                        order: p.photo_order
                      }))}
                      analysisStatus={analysisStatus}
                      onRetry={handleRetryAnalysis}
                    />

                    {/* Display detection results when available */}
                    {allAnalysisComplete && Object.keys(photoDetections).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                              border: '2px solid rgba(6, 182, 212, 0.4)'
                            }}
                          >
                            <SpatialIcon Icon={ICONS.Eye} size={24} className="text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Équipements détectés</h4>
                            <p className="text-white/60 text-sm">
                              Cliquez sur une photo pour voir les détections en détail
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {createdLocation.photos.map((photo) => {
                            const detections = photoDetections[photo.id] || [];
                            const isSelected = selectedPhotoForView === photo.id;

                            return (
                              <motion.button
                                key={photo.id}
                                onClick={() => setSelectedPhotoForView(isSelected ? null : photo.id)}
                                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                                style={{
                                  border: `2px solid ${isSelected ? 'rgba(6, 182, 212, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
                                  boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.4)' : undefined
                                }}
                              >
                                <img
                                  src={photo.photo_url}
                                  alt={`Photo ${photo.photo_order + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                  <span className="text-white text-xs font-semibold">
                                    {detections.length} équipement{detections.length > 1 ? 's' : ''}
                                  </span>
                                  <span className="text-white/80 text-xs">#{photo.photo_order + 1}</span>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    className="absolute inset-0 bg-cyan-400/20"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Detailed detection view */}
                        <AnimatePresence>
                          {selectedPhotoForView && photoDetections[selectedPhotoForView] && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-6"
                            >
                              <EquipmentDetectionViewer
                                photoUrl={
                                  createdLocation.photos.find((p) => p.id === selectedPhotoForView)
                                    ?.photo_url || ''
                                }
                                detections={photoDetections[selectedPhotoForView]}
                                showAnnotations={true}
                                className="mt-4"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 4 && createdLocation && showSuccessScreen && (
                  <motion.div
                    key="success-screen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1
                      }}
                      className="flex justify-center mb-6"
                    >
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))',
                          border: '3px solid rgba(34, 197, 94, 0.5)',
                          boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <SpatialIcon
                          Icon={ICONS.CheckCircle2}
                          size={56}
                          style={{
                            color: '#22C55E',
                            filter: 'drop-shadow(0 0 16px rgba(34, 197, 94, 0.8))'
                          }}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center"
                    >
                      <h2 className="text-3xl font-bold text-white mb-3">Lieu scanné avec succès!</h2>
                      <p className="text-white/70 text-lg">Votre environnement d'entraînement a été analysé par l'IA Forge</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="grid grid-cols-3 gap-4 max-w-md mx-auto"
                    >
                      <div className="text-center p-4 rounded-xl" style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)'
                      }}>
                        <div className="text-3xl font-bold text-cyan-400 mb-1">
                          {createdLocation.photos.length}
                        </div>
                        <div className="text-white/60 text-xs">Photo{createdLocation.photos.length > 1 ? 's' : ''}</div>
                      </div>

                      <div className="text-center p-4 rounded-xl" style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      }}>
                        <div className="text-3xl font-bold text-green-400 mb-1">
                          {getTotalEquipmentDetected()}
                        </div>
                        <div className="text-white/60 text-xs">Équipements</div>
                      </div>

                      <div className="text-center p-4 rounded-xl" style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                      }}>
                        <div className="text-3xl font-bold text-indigo-400 mb-1">
                          100%
                        </div>
                        <div className="text-white/60 text-xs">Analysé</div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-4 rounded-lg" style={{
                        background: 'rgba(6, 182, 212, 0.08)',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <SpatialIcon Icon={ICONS.Info} size={18} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-cyan-200">
                          <p className="font-medium mb-1">Où retrouver votre lieu?</p>
                          <p className="text-cyan-300/80 text-xs">
                            Rendez-vous dans <span className="font-semibold">Profil {'>'} Training</span> pour consulter et gérer vos lieux scannés.
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex flex-col gap-3 mt-6"
                    >
                      <motion.button
                        onClick={handleStartTraining}
                        className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3"
                        style={{
                          background: 'linear-gradient(135deg, rgba(24, 227, 255, 0.3), rgba(59, 130, 246, 0.3)), rgba(255, 255, 255, 0.1)',
                          border: '2px solid rgba(24, 227, 255, 0.5)',
                          boxShadow: '0 4px 16px rgba(24, 227, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <SpatialIcon Icon={ICONS.Dumbbell} size={24} />
                        <span>Commencer un Training</span>
                      </motion.button>

                      <motion.button
                        onClick={handleViewLocation}
                        className="w-full py-3 rounded-xl text-white font-medium text-base flex items-center justify-center gap-2"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <SpatialIcon Icon={ICONS.MapPin} size={20} />
                        <span>Voir mon lieu</span>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="sticky bottom-0 z-10 px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between gap-2 md:gap-4 flex-shrink-0">
              {step < 4 && (
                <button
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1 || saving}
                  className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation flex items-center justify-center gap-2 active:opacity-80"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                  boxShadow: `
                    0 4px 12px rgba(0, 0, 0, 0.3),
                    0 1px 3px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <SpatialIcon Icon={ICONS.ChevronLeft} size={18} />
                <span className="text-sm md:text-base">Précédent</span>
              </button>
              )}

              {step === 4 ? (
                <button
                  onClick={handleClose}
                  disabled={analyzing}
                  className="flex-1 px-6 py-2.5 md:px-8 md:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation active:opacity-80"
                  style={{
                    background: allAnalysisComplete ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    color: 'white',
                    boxShadow: allAnalysisComplete ? '0 4px 16px rgba(34, 197, 94, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                    border: allAnalysisComplete ? '1px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(255, 255, 255, 0.15)',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {analyzing ? (
                      <>
                        <SpatialIcon Icon={ICONS.Loader2} size={18} className="animate-spin" />
                        <span className="text-sm md:text-base">Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <SpatialIcon Icon={ICONS.Check} size={18} />
                        <span className="text-sm md:text-base">Terminer</span>
                      </>
                    )}
                  </div>
                </button>
              ) : (
                <div className="flex gap-2 md:gap-3 flex-1 md:flex-initial">
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && !canProceedToStep2) ||
                      saving
                    }
                    className="flex-1 md:flex-initial px-6 py-2.5 md:px-8 md:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation flex items-center justify-center gap-2 active:opacity-80"
                    style={{
                      background: `linear-gradient(135deg, ${stepColor}, color-mix(in srgb, ${stepColor} 85%, black))`,
                      color: 'white',
                      boxShadow: `
                        0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent),
                        0 2px 6px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.15)
                      `,
                      border: `1px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span className="text-sm md:text-base">Suivant</span>
                    <SpatialIcon Icon={ICONS.ChevronRight} size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!canProceedToStep3 || saving}
                    className="flex-1 md:flex-initial px-4 py-2.5 md:px-8 md:py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] md:min-h-auto touch-manipulation flex items-center justify-center gap-2 active:opacity-80"
                    style={{
                      background: `linear-gradient(135deg, #22C55E, #16A34A)`,
                      color: 'white',
                      boxShadow: `
                        0 4px 16px rgba(34, 197, 94, 0.4),
                        0 2px 6px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.15)
                      `,
                      border: '1px solid rgba(34, 197, 94, 0.6)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    {saving ? (
                      <>
                        <SpatialIcon Icon={ICONS.Loader2} size={18} className="animate-spin" />
                        <span className="text-xs md:text-sm leading-tight">Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <SpatialIcon Icon={ICONS.Check} size={18} />
                        <span className="text-xs md:text-sm leading-tight">{mode === 'create' ? 'Créer le Lieu' : 'Sauvegarder'}</span>
                      </>
                    )}
                  </button>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LocationEditorModal;
