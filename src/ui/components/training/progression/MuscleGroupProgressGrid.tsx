/**
 * MuscleGroupProgressGrid Component
 * Grid showing progress by muscle group with colors
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { MuscleGroupProgress } from '../../../../domain/trainingToday';

const MuscleGroupProgressGrid: React.FC = () => {
  const [groups, setGroups] = useState<MuscleGroupProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await trainingTodayService.getMuscleGroupProgress();
        setGroups(data);
      } catch (error) {
        console.error('Error loading muscle groups:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  if (loading) return null;

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return ICONS.TrendingUp;
    if (trend === 'down') return ICONS.TrendingDown;
    return ICONS.Minus;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return '#22C55E';
    if (trend === 'down') return '#EF4444';
    return '#F59E0B';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Jamais';
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    return `${days}j`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(236, 72, 153, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(236, 72, 153, 0.12)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <GlowIcon icon="Flame" color="#EC4899" size="medium" />
          <div>
            <h3 className="text-lg font-bold text-white">Groupes Musculaires</h3>
            <p className="text-white/60 text-sm">Répartition du volume</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {groups.map((group, index) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-lg"
              style={{
                background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${group.color} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                border: `2px solid color-mix(in srgb, ${group.color} 25%, transparent)`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 16px color-mix(in srgb, ${group.color} 10%, transparent)`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white text-sm">{group.group}</span>
                <SpatialIcon
                  Icon={getTrendIcon(group.volumeTrend)}
                  size={16}
                  style={{ color: getTrendColor(group.volumeTrend) }}
                />
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold" style={{ color: group.color }}>
                  {group.sessionsCount}
                </span>
                <span className="text-xs text-white/60">séances</span>
              </div>

              <div className="text-xs text-white/50">
                Dernière: {formatDate(group.lastSession)}
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default MuscleGroupProgressGrid;
