/**
 * Step 1 - Preparer (Refactored)
 * Context gathering with new location system
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../../ui/icons/registry';
import StepContainer from '../components/StepContainer';
import TrainingButton from '../components/TrainingButton';
import { LocationQuickSelector, DisciplineSelector, FloatingGenerateButton } from '../../../../../ui/components/training';
import { LocationQuickSelectorSkeleton, DisciplineSelectorSkeleton } from '../../../../../ui/components/skeletons';
import logger from '../../../../../lib/utils/logger';
import TrainingCoachNotificationBubble from '../../../../../ui/components/training/TrainingCoachNotificationBubble';
import {
  useTrainingPipeline,
  DEFAULT_SESSION_DURATION,
  SHORT_SESSION_DURATION,
  STEP_COLORS
} from '../../../../../system/store/trainingPipeline';
import type { TrainingLocationWithDetails } from '../../../../../domain/trainingLocation';
import { step1NotificationService } from '../../../../../system/services/step1NotificationService';
import { useChatButtonRef } from '../../../../../system/context/ChatButtonContext';
import { useTrainingLocations } from '../../../../../hooks/useTrainingLocations';
import { useUserStore } from '../../../../../system/store/userStore';
import type { AgentType } from '../../../../../domain/ai/trainingAiTypes';
import { useProfileValidation } from '../../../../../hooks/useProfileValidation';
import Step1ProfileIncompleteEmptyState from '../components/Step1ProfileIncompleteEmptyState';

const Step1Preparer: React.FC = () => {
  const { setPreparerData, goToNextStep } = useTrainingPipeline();
  const stepColor = STEP_COLORS.preparer;
  const { chatButtonRef } = useChatButtonRef();
  const { locations } = useTrainingLocations();
  const { profile } = useUserStore();
  const profileValidation = useProfileValidation();

  const initialTime = profile?.preferences?.workout?.preferredDuration || DEFAULT_SESSION_DURATION;
  const [availableTime, setAvailableTime] = useState(initialTime);
  const [wantsShortVersion, setWantsShortVersion] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<TrainingLocationWithDetails | null>(null);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [hasFatigue, setHasFatigue] = useState(false);
  const [hasPain, setHasPain] = useState(false);
  const [painDetails, setPainDetails] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(
    profile?.preferences?.workout?.type || 'strength'
  );
  const [selectedCoachType, setSelectedCoachType] = useState<AgentType>('coach-force');
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  const timeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const energyDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownInitialEnergyNotification = useRef(false);
  const continueButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    step1NotificationService.initialize();
    return () => {
      step1NotificationService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (locations) {
      setIsLoadingLocations(false);
    }
  }, [locations]);

  useEffect(() => {
    const justCreatedLocationId = typeof window !== 'undefined'
      ? sessionStorage.getItem('justCreatedLocationId')
      : null;

    if (justCreatedLocationId && !selectedLocation) {
      const justCreatedLocation = locations.find(loc => loc.id === justCreatedLocationId);
      if (justCreatedLocation) {
        setSelectedLocation(justCreatedLocation);
        logger.info('STEP_1_PREPARER', 'Auto-selected newly created location', {
          locationId: justCreatedLocation.id
        });
      }
    }
  }, [locations, selectedLocation]);

  const handleShortVersionToggle = () => {
    if (!wantsShortVersion) {
      setAvailableTime(SHORT_SESSION_DURATION);
      setWantsShortVersion(true);
      step1NotificationService.onShortVersionEnabled();
    } else {
      setAvailableTime(DEFAULT_SESSION_DURATION);
      setWantsShortVersion(false);
    }
  };

  const handleTimeChange = (newTime: number) => {
    setAvailableTime(newTime);

    if (timeDebounceRef.current) {
      clearTimeout(timeDebounceRef.current);
    }

    timeDebounceRef.current = setTimeout(() => {
      step1NotificationService.onTimeSelection(newTime);
    }, 800);
  };

  const handleEnergyChange = (newEnergy: number) => {
    setEnergyLevel(newEnergy);

    if (energyDebounceRef.current) {
      clearTimeout(energyDebounceRef.current);
    }

    if (!hasShownInitialEnergyNotification.current) {
      hasShownInitialEnergyNotification.current = true;
      return;
    }

    energyDebounceRef.current = setTimeout(() => {
      step1NotificationService.onEnergyLevelChange(newEnergy);
    }, 1000);
  };

  const handleLocationSelect = (location: TrainingLocationWithDetails | null) => {
    console.log('[Step1Preparer] handleLocationSelect called:', {
      locationId: location?.id,
      locationName: location?.name,
      previousLocationId: selectedLocation?.id
    });
    setSelectedLocation(location);
    if (location) {
      step1NotificationService.onLocationSelected();
      step1NotificationService.stopNotifications();

      setTimeout(() => {
        if (continueButtonRef.current) {
          const isMobile = window.innerWidth <= 768;
          const element = continueButtonRef.current;
          const elementRect = element.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;

          const bottomBarHeight = 80;
          const bottomBarOffset = 24;
          const notificationSpace = 80;
          const additionalPadding = 32;
          const totalBottomSpace = bottomBarHeight + bottomBarOffset + notificationSpace + additionalPadding;

          const middleOfViewport = window.innerHeight / 2;
          const targetScrollPosition = absoluteElementTop - (isMobile ? totalBottomSpace : middleOfViewport);

          window.scrollTo({
            top: Math.max(0, targetScrollPosition),
            behavior: 'smooth'
          });
        }
      }, 400);
    } else {
      step1NotificationService.resumeNotifications();
    }
  };

  const handleFatigueToggle = (checked: boolean) => {
    setHasFatigue(checked);
    if (checked) {
      step1NotificationService.onFatigueChecked();
    }
  };

  const handlePainToggle = (checked: boolean) => {
    setHasPain(checked);
    if (checked) {
      step1NotificationService.onPainChecked();
    }
  };

  const handleDisciplineChange = (discipline: string, coachType: AgentType) => {
    setSelectedDiscipline(discipline);
    setSelectedCoachType(coachType);
    logger.info('STEP_1_PREPARER', 'Discipline changed', {
      discipline,
      coachType,
      willUseCoach: coachType
    });
  };

  useEffect(() => {
    if (profile?.preferences?.workout?.type) {
      const initialDiscipline = profile.preferences.workout.type;
      setSelectedDiscipline(initialDiscipline);

      const disciplineMap: Record<string, AgentType> = {
        'strength': 'coach-force',
        'powerlifting': 'coach-force',
        'bodybuilding': 'coach-force',
        'strongman': 'coach-force',
        'running': 'coach-endurance',
        'cycling': 'coach-endurance',
        'swimming': 'coach-endurance',
        'triathlon': 'coach-endurance',
        'cardio': 'coach-endurance',
        'calisthenics': 'coach-calisthenics',
        'street-workout': 'coach-calisthenics'
      };

      const initialCoach = disciplineMap[initialDiscipline] || 'coach-force';
      setSelectedCoachType(initialCoach);

      logger.info('STEP_1_PREPARER', 'Initialized with profile discipline', {
        discipline: initialDiscipline,
        coachType: initialCoach
      });
    }

    if (profile?.preferences?.workout?.preferredDuration) {
      const profileTime = profile.preferences.workout.preferredDuration;
      setAvailableTime(profileTime);
      logger.info('STEP_1_PREPARER', 'Initialized available time from profile', {
        preferredDuration: profileTime
      });
    }
  }, [profile]);

  const handleContinue = () => {
    if (!selectedLocation) {
      logger.error('STEP_1_PREPARER', 'Cannot continue - no location selected');
      return;
    }

    const preparerPayload = {
      availableTime,
      wantsShortVersion,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name || selectedLocation.type,
      locationPhotos: selectedLocation.photos.map((p) => p.photo_url),
      availableEquipment: selectedLocation.equipment.map((eq) => eq.equipment_name),
      energyLevel,
      hasFatigue,
      hasPain,
      painDetails: hasPain ? painDetails : undefined,
      tempSport: selectedDiscipline
    };

    logger.info('STEP_1_PREPARER', 'Saving preparerData to store', {
      locationId: preparerPayload.locationId,
      locationName: preparerPayload.locationName,
      energyLevel: preparerPayload.energyLevel,
      availableTime: preparerPayload.availableTime,
      equipmentCount: preparerPayload.availableEquipment.length,
      photosCount: preparerPayload.locationPhotos.length,
      selectedDiscipline: selectedDiscipline,
      selectedCoachType: selectedCoachType,
      tempSport: preparerPayload.tempSport,
      profileDiscipline: profile?.preferences?.workout?.type,
      disciplineSource: 'step1_user_selection'
    });

    step1NotificationService.onReadyToContinue();

    setTimeout(() => {
      setPreparerData(preparerPayload);
      logger.info('STEP_1_PREPARER', 'PreparerData saved, navigating to Step 2');
      goToNextStep();
    }, 1000);
  };

  const canContinue = selectedLocation !== null;

  // Show empty state if profile is incomplete
  const showEmptyState = !profileValidation.isValidating && !profileValidation.isValid;

  return (
    <>
      <TrainingCoachNotificationBubble
        chatButtonRef={chatButtonRef}
        isStep1={true}
        hidden={canContinue || showEmptyState}
      />

      {/* Floating Generate Button - Appears after location selection */}
      <FloatingGenerateButton
        visible={canContinue && !showEmptyState}
        onClick={handleContinue}
        disabled={!canContinue}
        stepColor={stepColor}
        locationName={selectedLocation?.name}
      />

      <StepContainer>
      {/* Profile Incomplete Empty State */}
      {showEmptyState && (
        <Step1ProfileIncompleteEmptyState validationState={profileValidation} />
      )}

      {/* Regular form - only show when profile is complete */}
      {!showEmptyState && (
        <>
      {/* Time Available - Position 1 */}
      <GlassCard
        className="space-y-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
              boxShadow: `
                0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <SpatialIcon
              Icon={ICONS.Clock}
              size={24}
              variant="pure"
              style={{
                color: stepColor,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Temps Disponible</h3>
            <p className="text-white/60 text-sm">Combien de temps avez-vous?</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="15"
            max="120"
            step="5"
            value={availableTime}
            onChange={(e) => handleTimeChange(Number(e.target.value))}
            className="flex-1"
            style={{
              accentColor: stepColor
            }}
          />
          <span className="text-2xl font-bold text-white min-w-[80px] text-right">
            {availableTime} min
          </span>
        </div>

        <div className="mt-6">
          <TrainingButton
            variant={wantsShortVersion ? 'primary' : 'secondary'}
            size="sm"
            icon="Zap"
            onClick={handleShortVersionToggle}
            fullWidth
            stepColor={stepColor}
          >
            {wantsShortVersion ? 'Version Courte Activée' : 'Activer Version Courte (15-25 min)'}
          </TrainingButton>
        </div>
      </GlassCard>

      {/* Energy Level - Position 2 */}
      <GlassCard
        className="space-y-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
              boxShadow: `
                0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <SpatialIcon
              Icon={ICONS.Zap}
              size={24}
              variant="pure"
              style={{
                color: stepColor,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Niveau d'Énergie</h3>
            <p className="text-white/60 text-sm">Comment vous sentez-vous aujourd'hui?</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-white/70">Faible</span>
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => handleEnergyChange(Number(e.target.value))}
            className="flex-1"
            style={{
              accentColor: stepColor
            }}
          />
          <span className="text-sm text-white/70">Élevé</span>
        </div>

        <div className="text-center">
          <span
            className="text-4xl font-bold"
            style={{
              color: energyLevel > 7 ? '#22C55E' : energyLevel > 4 ? '#F59E0B' : '#EF4444',
              textShadow: `0 0 20px ${energyLevel > 7 ? 'rgba(34, 197, 94, 0.5)' : energyLevel > 4 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
            }}
          >
            {energyLevel}/10
          </span>
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <label
            className="flex items-center gap-2 flex-1 cursor-pointer p-3 rounded-lg transition-all"
            style={{
              background: hasFatigue ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              border: hasFatigue ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent'
            }}
          >
            <input
              type="checkbox"
              checked={hasFatigue}
              onChange={(e) => handleFatigueToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-white/80">Fatigue aujourd'hui</span>
          </label>

          <label
            className="flex items-center gap-2 flex-1 cursor-pointer p-3 rounded-lg transition-all"
            style={{
              background: hasPain ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              border: hasPain ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent'
            }}
          >
            <input
              type="checkbox"
              checked={hasPain}
              onChange={(e) => handlePainToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-white/80">Douleur présente</span>
          </label>
        </div>

        {hasPain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text"
              value={painDetails}
              onChange={(e) => setPainDetails(e.target.value)}
              placeholder="Précisez la zone (ex: épaule droite, genou gauche...)"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-400/50"
            />
          </motion.div>
        )}
      </GlassCard>

      {/* Discipline Selector */}
      <GlassCard
        className="space-y-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.08) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: '2px solid rgba(236, 72, 153, 0.2)',
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 24px rgba(236, 72, 153, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(236, 72, 153, 0.35) 0%, transparent 60%),
                rgba(255, 255, 255, 0.12)
              `,
              border: '2px solid rgba(236, 72, 153, 0.5)',
              boxShadow: `
                0 4px 16px rgba(236, 72, 153, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <SpatialIcon
              Icon={ICONS.Dumbbell}
              size={24}
              variant="pure"
              style={{
                color: '#EC4899',
                filter: 'drop-shadow(0 0 12px rgba(236, 72, 153, 0.7))'
              }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Discipline Sportive</h3>
            <p className="text-white/60 text-sm">Choisissez votre discipline pour cette séance</p>
          </div>
        </div>

        {!profile ? (
          <DisciplineSelectorSkeleton />
        ) : (
          <DisciplineSelector
            profileDiscipline={profile?.preferences?.workout?.type || 'strength'}
            onDisciplineChange={handleDisciplineChange}
            compact={true}
            showConfirmation={true}
          />
        )}
      </GlassCard>

      {/* Location Selection - Version Simplifiée */}
      <GlassCard
        className="space-y-3 mt-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
          boxShadow: `
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
              boxShadow: `
                0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <SpatialIcon
              Icon={ICONS.MapPin}
              size={20}
              variant="pure"
              style={{
                color: stepColor,
                filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Lieu & Équipements</h3>
            <p className="text-white/60 text-xs">Les équipements dépendent du lieu</p>
          </div>
        </div>

        {isLoadingLocations ? (
          <LocationQuickSelectorSkeleton stepColor={stepColor} />
        ) : (
          <LocationQuickSelector
            selectedLocationId={selectedLocation?.id}
            onLocationSelect={handleLocationSelect}
            color={stepColor}
          />
        )}
      </GlassCard>

      {/* Spacer for bottom padding */}
      <div className="mb-32" ref={continueButtonRef} />
        </>
      )}
      </StepContainer>
    </>
  );
};

export default Step1Preparer;
