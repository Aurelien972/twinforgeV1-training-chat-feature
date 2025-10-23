import React from 'react';
import { useProfilePerformance } from './hooks/useProfilePerformance';
import { ConditionalMotionSlide } from './components/shared/ConditionalMotionProfile';
import GlassCard from '../../../ui/cards/GlassCard';
import SpatialIcon from '../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../ui/icons/registry';
import WearableStatusCard from './components/WearableStatusCard';
import EquipmentManagerCard from '../../../ui/components/training/equipment/organisms/EquipmentManagerCard';

const ProfileTrainingTab: React.FC = () => {
  const performanceConfig = useProfilePerformance();

  return (
    <ConditionalMotionSlide
      performanceConfig={performanceConfig}
      direction="up"
      distance={20}
      className="space-y-6 profile-section"
    >
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
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
              Gérez vos lieux d'entraînement et équipements
            </p>
          </div>
        </div>

        <EquipmentManagerCard />
      </GlassCard>

      <WearableStatusCard />
    </ConditionalMotionSlide>
  );
};

export default ProfileTrainingTab;
