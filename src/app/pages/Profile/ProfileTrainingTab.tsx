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

  return (
    <ConditionalMotionSlide
      performanceConfig={performanceConfig}
      direction="up"
      distance={20}
      className="space-y-6 profile-section"
    >
      {/* Header avec progression */}
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'rgba(6, 182, 212, 0.3)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '2px solid rgba(6, 182, 212, 0.5)'
              }}
            >
              <SpatialIcon Icon={ICONS.Dumbbell} size={24} style={{ color: '#06B6D4' }} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-xl">Profil Sportif</h3>
              <p className="text-white/60 text-sm mt-1">
                Configuration de vos préférences d'entraînement
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs mb-1">Profil complété</p>
            <p className="text-2xl font-bold text-cyan-400">{completion.percentage}%</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${completion.percentage}%`,
              background: 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)'
            }}
          />
        </div>
      </GlassCard>

      {/* Formulaire Profil Sportif */}
      <GlassCard
        className="p-6"
        style={{
          background: 'var(--glass-opacity)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="space-y-6">
          {/* Niveau de forme physique */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Niveau de forme physique
            </label>
            <select
              value={formData.fitness_level || ''}
              onChange={(e) => handleChange('fitness_level', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            >
              <option value="">Sélectionnez votre niveau</option>
              <option value="beginner">Débutant - Je commence tout juste</option>
              <option value="intermediate">Intermédiaire - Je m'entraîne régulièrement</option>
              <option value="advanced">Avancé - J'ai plusieurs années d'expérience</option>
              <option value="elite">Élite - Je suis un athlète confirmé</option>
            </select>
          </div>

          {/* Type d'entraînement préféré */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Type d'entraînement préféré
            </label>
            <select
              value={formData.preferred_training_type || ''}
              onChange={(e) => handleChange('preferred_training_type', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
            >
              <option value="">Sélectionnez un type</option>
              <option value="force">Force - Développé couché, squat, deadlift</option>
              <option value="endurance">Endurance - Course, vélo, natation</option>
              <option value="functional">Functional - CrossFit, WODs, métabolique</option>
              <option value="calisthenics">Calisthenics - Poids du corps, street workout</option>
              <option value="competitions">Compétitions - Circuits, défis</option>
            </select>
          </div>

          {/* Séances par semaine */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Séances par semaine
            </label>
            <input
              type="number"
              min="0"
              max="14"
              value={formData.sessions_per_week || ''}
              onChange={(e) => handleChange('sessions_per_week', parseInt(e.target.value))}
              placeholder="3"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
            <p className="text-white/50 text-xs mt-1">Entre 0 et 14 séances par semaine</p>
          </div>

          {/* Durée préférée par séance */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Durée préférée par séance (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="180"
              value={formData.preferred_session_duration || ''}
              onChange={(e) => handleChange('preferred_session_duration', parseInt(e.target.value))}
              placeholder="45"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
            <p className="text-white/50 text-xs mt-1">Entre 15 et 180 minutes</p>
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
        </div>
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
