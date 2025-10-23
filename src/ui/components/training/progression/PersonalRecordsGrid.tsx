/**
 * PersonalRecordsGrid Component
 * Grid of personal records with colorful badges
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { PersonalRecord } from '../../../../domain/trainingToday';

const PersonalRecordsGrid: React.FC = () => {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await trainingTodayService.getPersonalRecords();
        setRecords(data);
      } catch (error) {
        console.error('Error loading records:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  if (loading) return null;

  const formatDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `${days}j`;
    if (days < 30) return `${Math.floor(days / 7)}sem`;
    return `${Math.floor(days / 30)}mois`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.4,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(245, 158, 11, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(245, 158, 11, 0.12)'
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <GlowIcon icon="Award" color="#F59E0B" size="medium" />
          <div>
            <h3 className="text-lg font-bold text-white">Records Personnels</h3>
            <p className="text-white/60 text-sm">Vos meilleures performances</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{
                scale: 1.03,
                y: -4,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 25
                }
              }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-lg relative overflow-hidden cursor-pointer"
              style={{
                background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${record.color} 12%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                border: `2px solid color-mix(in srgb, ${record.color} 30%, transparent)`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 16px color-mix(in srgb, ${record.color} 12%, transparent)`,
                willChange: 'transform, box-shadow',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1" style={{ color: record.color }}>
                    {record.category}
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {record.exerciseName}
                  </div>
                </div>
                <motion.div
                  animate={{
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1],
                    y: [0, -2, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS.Trophy}
                    size={24}
                    style={{
                      color: record.color,
                      filter: `drop-shadow(0 0 12px ${record.color}80)`
                    }}
                  />
                </motion.div>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold" style={{ color: record.color }}>
                  {record.value}
                </span>
                <span className="text-lg text-white/70">{record.unit}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-white/50">
                  {formatDate(record.achievedDate)}
                </div>
                <div className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `color-mix(in srgb, ${record.color} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${record.color} 40%, transparent)`,
                    color: record.color
                  }}
                >
                  PR
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default PersonalRecordsGrid;
