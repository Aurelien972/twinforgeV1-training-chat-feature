import React from 'react';
import { useProfilePerformance } from './hooks/useProfilePerformance';
import { ConditionalMotionSlide } from './components/shared/ConditionalMotionProfile';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import WearableStatusCard from './components/WearableStatusCard';
import EquipmentManagerCard from '../../../ui/components/training/equipment/organisms/EquipmentManagerCard';
import TrainingLocationManager from '../../../ui/components/training/location/organisms/TrainingLocationManager';
import MeasurableGoalsSection from '../../../ui/components/training/feedback/MeasurableGoalsSection';
import { useProfileTrainingForm } from './hooks/useProfileTrainingForm';
import { useProfileCompletion } from './hooks/useProfileCompletion';
import { useUserStore } from '../../../system/store/userStore';
import { ProgressBar } from './components/ProfileIdentityComponents';

const ProfileTrainingTab: React.FC = () => {
  const performanceConfig = useProfilePerformance();
  const { profile } = useUserStore();
  const completion = useProfileCompletion(profile);

  const {
    formData,
    isDirty,
    isSaving,
    handleChange,
    handleSave
  } = useProfileTrainingForm();

  // Debug: Log profile health data
  React.useEffect(() => {
    console.log('[ProfileTrainingTab] Profile:', profile);
    console.log('[ProfileTrainingTab] Profile.health:', (profile as any)?.health);
    console.log('[ProfileTrainingTab] Form Data:', formData);
    console.log('[ProfileTrainingTab] Completion:', completion);
  }, [profile, formData, completion]);

  return (
    <ConditionalMotionSlide
      performanceConfig={performanceConfig}
      direction="up"
      distance={20}
      className="space-y-6 profile-section"
    >
      {/* Header avec progression - Style standard */}
      <ProgressBar
        percentage={completion.percentage}
        title="Profil Sportif"
        subtitle="Configuration de vos préférences d'entraînement"
        color="#06B6D4"
        icon="Dumbbell"
      />

      {/* Formulaire Profil Sportif */}
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'rgba(6, 182, 212, 0.2)'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(6, 182, 212, 0.2))
              `,
              border: '2px solid rgba(6, 182, 212, 0.5)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
            }}
          >
            <SpatialIcon Icon={ICONS.Activity} size={24} style={{ color: '#06B6D4' }} variant="pure" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-xl">Préférences d'Entraînement</h3>
            <p className="text-white/60 text-sm mt-1">Niveau, type et fréquence de vos sessions</p>
          </div>
        </div>

        {/* Grid 2x2 sur desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Niveau de forme physique */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-3">
              <div className="flex items-center gap-2">
                <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#06B6D4' }} />
                <span>Niveau de forme physique</span>
              </div>
            </label>
            <select
              value={formData.fitness_level || ''}
              onChange={(e) => handleChange('fitness_level', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors hover:bg-white/8"
              style={{
                backgroundImage: 'none',
                appearance: 'none',
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Sélectionnez votre niveau</option>
              <option value="sedentary" style={{ background: '#1a1a1a', color: '#fff' }}>Sédentaire - Peu ou pas d'activité physique</option>
              <option value="beginner" style={{ background: '#1a1a1a', color: '#fff' }}>Débutant - Début du parcours fitness</option>
              <option value="novice" style={{ background: '#1a1a1a', color: '#fff' }}>Novice - 3-6 mois d'entraînement régulier</option>
              <option value="intermediate" style={{ background: '#1a1a1a', color: '#fff' }}>Intermédiaire - 6-12 mois d'expérience</option>
              <option value="advanced" style={{ background: '#1a1a1a', color: '#fff' }}>Avancé - 1-2 ans d'entraînement sérieux</option>
              <option value="expert" style={{ background: '#1a1a1a', color: '#fff' }}>Expert - 2-4 ans de pratique intensive</option>
              <option value="elite" style={{ background: '#1a1a1a', color: '#fff' }}>Élite - 4-6 ans de haut niveau</option>
              <option value="professional" style={{ background: '#1a1a1a', color: '#fff' }}>Professionnel - Athlète professionnel</option>
              <option value="athlete" style={{ background: '#1a1a1a', color: '#fff' }}>Athlète Confirmé - Compétiteur de haut niveau</option>
              <option value="champion" style={{ background: '#1a1a1a', color: '#fff' }}>Champion - Niveau champion/compétition internationale</option>
            </select>
          </div>

          {/* Type d'entraînement préféré */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-3">
              <div className="flex items-center gap-2">
                <SpatialIcon Icon={ICONS.Target} size={16} style={{ color: '#06B6D4' }} />
                <span>Type d'entraînement préféré</span>
              </div>
            </label>
            <select
              value={formData.preferred_training_type || ''}
              onChange={(e) => handleChange('preferred_training_type', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors hover:bg-white/8"
              style={{
                backgroundImage: 'none',
                appearance: 'none',
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Sélectionnez un type</option>

              <optgroup label="Force & Powerbuilding" style={{ background: '#1a1a1a', color: '#3B82F6', fontWeight: 'bold' }}>
                <option value="strength" style={{ background: '#1a1a1a', color: '#fff' }}>Musculation</option>
                <option value="powerlifting" style={{ background: '#1a1a1a', color: '#fff' }}>Powerlifting</option>
                <option value="bodybuilding" style={{ background: '#1a1a1a', color: '#fff' }}>Bodybuilding</option>
                <option value="strongman" style={{ background: '#1a1a1a', color: '#fff' }}>Strongman</option>
              </optgroup>

              <optgroup label="Endurance" style={{ background: '#1a1a1a', color: '#22C55E', fontWeight: 'bold' }}>
                <option value="running" style={{ background: '#1a1a1a', color: '#fff' }}>Course à pied</option>
                <option value="cycling" style={{ background: '#1a1a1a', color: '#fff' }}>Cyclisme</option>
                <option value="swimming" style={{ background: '#1a1a1a', color: '#fff' }}>Natation</option>
                <option value="triathlon" style={{ background: '#1a1a1a', color: '#fff' }}>Triathlon</option>
                <option value="cardio" style={{ background: '#1a1a1a', color: '#fff' }}>Cardio général</option>
              </optgroup>

              <optgroup label="Functional & CrossTraining" style={{ background: '#1a1a1a', color: '#DC2626', fontWeight: 'bold' }}>
                <option value="crossfit" style={{ background: '#1a1a1a', color: '#fff' }}>CrossFit</option>
                <option value="hiit" style={{ background: '#1a1a1a', color: '#fff' }}>HIIT</option>
                <option value="functional" style={{ background: '#1a1a1a', color: '#fff' }}>Functional Training</option>
                <option value="circuit" style={{ background: '#1a1a1a', color: '#fff' }}>Circuit Training</option>
              </optgroup>

              <optgroup label="Calisthenics & Street" style={{ background: '#1a1a1a', color: '#06B6D4', fontWeight: 'bold' }}>
                <option value="calisthenics" style={{ background: '#1a1a1a', color: '#fff' }}>Calisthenics</option>
                <option value="street-workout" style={{ background: '#1a1a1a', color: '#fff' }}>Street Workout</option>
              </optgroup>

              <optgroup label="Fitness Competitions" style={{ background: '#1a1a1a', color: '#F59E0B', fontWeight: 'bold' }}>
                <option value="hyrox" style={{ background: '#1a1a1a', color: '#fff' }}>HYROX</option>
                <option value="deka-fit" style={{ background: '#1a1a1a', color: '#fff' }}>DEKA FIT</option>
                <option value="deka-mile" style={{ background: '#1a1a1a', color: '#fff' }}>DEKA MILE</option>
                <option value="deka-strong" style={{ background: '#1a1a1a', color: '#fff' }}>DEKA STRONG</option>
              </optgroup>
            </select>
          </div>

          {/* Séances par semaine */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-3">
              <div className="flex items-center gap-2">
                <SpatialIcon Icon={ICONS.Calendar} size={16} style={{ color: '#06B6D4' }} />
                <span>Séances par semaine</span>
              </div>
            </label>
            <input
              type="number"
              min="0"
              max="14"
              value={formData.sessions_per_week || ''}
              onChange={(e) => handleChange('sessions_per_week', parseInt(e.target.value))}
              placeholder="3"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors hover:bg-white/8"
            />
            <p className="text-white/50 text-xs mt-1">Entre 0 et 14 séances par semaine</p>
          </div>

          {/* Durée préférée par séance */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-3">
              <div className="flex items-center gap-2">
                <SpatialIcon Icon={ICONS.Clock} size={16} style={{ color: '#06B6D4' }} />
                <span>Durée préférée par séance</span>
              </div>
            </label>
            <input
              type="number"
              min="15"
              max="180"
              value={formData.preferred_session_duration || ''}
              onChange={(e) => handleChange('preferred_session_duration', parseInt(e.target.value))}
              placeholder="45"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors hover:bg-white/8"
            />
            <p className="text-white/50 text-xs mt-1">Entre 15 et 180 minutes</p>
          </div>
        </div>

        {/* Wearable Status Card */}
        <WearableStatusCard />

        {/* Bouton de sauvegarde (visible uniquement si modifié) */}
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-cyan-500/20 border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
            }}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <SpatialIcon Icon={ICONS.Loader2} size={18} className="animate-spin" />
                <span>Enregistrement...</span>
              </div>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        )}
      </GlassCard>

      {/* Mes Équipements */}
      <GlassCard
        className="p-6"
        style={{
          background: 'var(--glass-opacity)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '2px solid rgba(59, 130, 246, 0.5)'
            }}
          >
            <SpatialIcon Icon={ICONS.Settings} size={24} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-xl">Mes Équipements</h3>
            <p className="text-white/60 text-sm mt-1">
              Gérez vos lieux d'entraînement et équipements disponibles
            </p>
          </div>
        </div>

        <EquipmentManagerCard />
      </GlassCard>

      {/* Lieux Scannés */}
      <TrainingLocationManager />

      {/* Objectifs Mesurables */}
      <MeasurableGoalsSection />
    </ConditionalMotionSlide>
  );
};

export default ProfileTrainingTab;
