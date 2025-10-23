/**
 * HistoryEmptyState Component
 * Premium empty state for History tab when no sessions exist
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';

const HISTORY_COLOR = '#8B5CF6';

const HistoryEmptyState: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTraining = () => {
    Haptics.press();
    navigate('/training/pipeline');
  };

  const sessionTypes = [
    { icon: ICONS.Dumbbell, label: 'Force', color: '#18E3FF' },
    { icon: ICONS.Zap, label: 'Functional', color: '#F59E0B' },
    { icon: ICONS.Activity, label: 'Endurance', color: '#22C55E' },
    { icon: ICONS.Target, label: 'Compétitions', color: '#EF4444' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <GlassCard
        className="p-10 text-center space-y-6"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, color-mix(in srgb, ${HISTORY_COLOR} 15%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, color-mix(in srgb, ${HISTORY_COLOR} 8%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${HISTORY_COLOR} 30%, transparent)`,
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.3),
            0 0 40px color-mix(in srgb, ${HISTORY_COLOR} 20%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                linear-gradient(135deg, color-mix(in srgb, ${HISTORY_COLOR} 40%, transparent), color-mix(in srgb, ${HISTORY_COLOR} 25%, transparent))
              `,
              border: `3px solid color-mix(in srgb, ${HISTORY_COLOR} 50%, transparent)`,
              boxShadow: `0 0 40px color-mix(in srgb, ${HISTORY_COLOR} 40%, transparent)`
            }}
          >
            <SpatialIcon Icon={ICONS.History} size={48} style={{ color: HISTORY_COLOR }} />
          </motion.div>
        </motion.div>

        <div>
          <h2 className="text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
            Votre Parcours Commence Ici
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-4">
            Historique complet de vos entraînements
          </p>
          <p className="text-white/60 leading-relaxed max-w-lg mx-auto">
            Chaque séance sera archivée ici avec tous ses détails. Revisitez vos performances
            et suivez votre évolution dans le temps.
          </p>
        </div>

        {/* Timeline Preview */}
        <div className="max-w-2xl mx-auto space-y-4">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `color-mix(in srgb, ${HISTORY_COLOR} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${HISTORY_COLOR} 30%, transparent)`
                }}
              >
                <SpatialIcon
                  Icon={ICONS.Calendar}
                  size={20}
                  style={{ color: `${HISTORY_COLOR}80` }}
                />
              </div>

              <div
                className="flex-1 p-4 rounded-lg text-left"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 w-32 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.1)' }} />
                  <div className="h-3 w-16 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.08)' }} />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255, 255, 255, 0.08)' }} />
                  <div className="h-2 w-3/4 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.06)' }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="pt-4"
        >
          <motion.button
            onClick={handleStartTraining}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="px-12 py-5 rounded-xl font-bold text-lg"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${HISTORY_COLOR} 50%, transparent), color-mix(in srgb, ${HISTORY_COLOR} 35%, transparent))`,
            border: `2px solid color-mix(in srgb, ${HISTORY_COLOR} 60%, transparent)`,
            color: '#FFFFFF',
            boxShadow: `0 8px 30px color-mix(in srgb, ${HISTORY_COLOR} 30%, transparent)`
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <SpatialIcon
              Icon={ICONS.Play}
              size={20}
              style={{ color: '#FFFFFF' }}
            />
            <span>Créer ma première séance</span>
          </div>
        </motion.button>
        </motion.div>
      </GlassCard>

      {/* Session Types Preview */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <GlowIcon icon="Grid" color={HISTORY_COLOR} size="small" glowIntensity={40} />
          Types de séances disponibles
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sessionTypes.map((type, index) => (
            <motion.div
              key={type.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="p-4 rounded-lg text-center"
              style={{
                background: `color-mix(in srgb, ${type.color} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${type.color} 20%, transparent)`
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{
                  background: `color-mix(in srgb, ${type.color} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${type.color} 30%, transparent)`
                }}
              >
                <SpatialIcon Icon={type.icon} size={24} style={{ color: type.color }} />
              </div>
              <div className="text-white/70 text-sm font-medium">{type.label}</div>
              <div className="text-white/40 text-xs mt-1">0 séances</div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default HistoryEmptyState;
