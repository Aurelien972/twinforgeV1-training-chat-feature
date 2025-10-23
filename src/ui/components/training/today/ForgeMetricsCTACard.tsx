/**
 * ForgeMetricsCTACard
 * Displays today's training stats and provides link to Forge for global view
 * Shows ONLY training_sessions data (not manual activities)
 * Acts as a bridge to Forge Énergétique for comprehensive activity tracking
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';
import { useTodayTrainingStats } from '../../../../hooks/useTodayTrainingStats';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

const FORGE_COLOR = TRAINING_COLORS.performance;

const ForgeMetricsCTACard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useTodayTrainingStats();

  // Ne pas afficher si aucune session training aujourd'hui
  if (!isLoading && (!stats || stats.sessionsCount === 0)) {
    return null;
  }

  const handleNavigateToForge = () => {
    Haptics.press();
    navigate('/activity?tab=progression');
  };

  if (isLoading) {
    return (
      <GlassCard
        className="p-6"
        style={{
          background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${FORGE_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `1px solid color-mix(in srgb, ${FORGE_COLOR} 20%, transparent)`,
        }}
      >
        <div className="text-white/60 text-center">Chargement...</div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        className="p-6 relative overflow-hidden cursor-pointer"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${FORGE_COLOR} 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, ${FORGE_COLOR} 8%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `1px solid color-mix(in srgb, ${FORGE_COLOR} 25%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${FORGE_COLOR} 12%, transparent)`,
        }}
        onClick={handleNavigateToForge}
      >
        {/* Header avec icône */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${FORGE_COLOR} 30%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.1)`,
                border: `1.5px solid color-mix(in srgb, ${FORGE_COLOR} 40%, transparent)`,
                boxShadow: `0 4px 12px color-mix(in srgb, ${FORGE_COLOR} 25%, transparent)`,
              }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <SpatialIcon
                Icon={ICONS.Activity}
                size={20}
                style={{
                  color: FORGE_COLOR,
                  filter: `drop-shadow(0 0 8px ${FORGE_COLOR}80)`,
                }}
              />
            </motion.div>
            <div>
              <h3 className="text-white font-semibold text-base">
                Forge Énergétique
              </h3>
              <p className="text-white/50 text-xs">
                Vos métriques d'aujourd'hui
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <SpatialIcon
              Icon={ICONS.ChevronRight}
              size={20}
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            />
          </motion.div>
        </div>

        {/* Statistiques du jour */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <SpatialIcon
                Icon={ICONS.Zap}
                size={14}
                style={{ color: '#F59E0B' }}
              />
              <span className="text-xs text-white/60">Calories</span>
            </div>
            <p className="text-white font-bold text-lg">
              {stats?.totalCalories || 0}
            </p>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <SpatialIcon
                Icon={ICONS.Clock}
                size={14}
                style={{ color: '#06B6D4' }}
              />
              <span className="text-xs text-white/60">Durée</span>
            </div>
            <p className="text-white font-bold text-lg">
              {stats?.totalDuration || 0}min
            </p>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <SpatialIcon
                Icon={ICONS.Target}
                size={14}
                style={{ color: '#22C55E' }}
              />
              <span className="text-xs text-white/60">Sessions</span>
            </div>
            <p className="text-white font-bold text-lg">
              {stats?.sessionsCount || 0}
            </p>
          </div>
        </div>

        {/* Info badge */}
        <div
          className="px-3 py-2 rounded-lg mb-3 flex items-center gap-2"
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <SpatialIcon
            Icon={ICONS.Info}
            size={14}
            style={{ color: '#60A5FA' }}
          />
          <span className="text-xs text-white/80">
            Sessions training synchronisées dans la Forge
          </span>
        </div>

        {/* Bouton CTA */}
        <motion.button
          whileHover={{
            scale: 1.02,
            y: -2,
            transition: { type: 'spring', stiffness: 400, damping: 25 },
          }}
          whileTap={{
            scale: 0.98,
            y: 0,
            transition: { type: 'spring', stiffness: 500, damping: 30 },
          }}
          className="w-full px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${FORGE_COLOR} 0%, color-mix(in srgb, ${FORGE_COLOR} 85%, #000) 100%)`,
            border: `1.5px solid ${FORGE_COLOR}`,
            color: '#FFFFFF',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
            boxShadow: `
              0 1px 0 0 rgba(255, 255, 255, 0.3) inset,
              0 -1px 0 0 rgba(0, 0, 0, 0.15) inset,
              0 8px 24px -4px color-mix(in srgb, ${FORGE_COLOR} 50%, transparent),
              0 4px 12px -2px rgba(0, 0, 0, 0.4)
            `,
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(120deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.25) 50%, transparent 60%, transparent 100%)',
            }}
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />

          <span className="relative z-10">Analyser mes Métriques</span>
          <motion.div
            className="relative z-10"
            animate={{ x: [0, 3, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <SpatialIcon
              Icon={ICONS.BarChart3}
              size={18}
              style={{
                color: '#FFFFFF',
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
              }}
            />
          </motion.div>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
};

export default ForgeMetricsCTACard;
