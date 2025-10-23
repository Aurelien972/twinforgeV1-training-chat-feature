/**
 * WeeklyPatternHeatmap Component
 * Heatmap showing training patterns by day of week
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { trainingTodayService } from '../../../../../system/services/trainingTodayService';
import type { WeeklyPattern } from '../../../../../domain/trainingToday';

const WeeklyPatternHeatmap: React.FC = () => {
  const [patterns, setPatterns] = useState<WeeklyPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const data = await trainingTodayService.getWeeklyPatterns();
        setPatterns(data);
      } catch (error) {
        console.error('Error loading weekly patterns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatterns();
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6" style={{ minHeight: '280px' }}>
        <div className="text-white/60 text-center">Chargement des patterns...</div>
      </GlassCard>
    );
  }

  const maxSessions = Math.max(...patterns.map(p => p.sessionsCount));

  const getIntensityColor = (count: number, avgRpe: number) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';

    const intensity = count / maxSessions;
    if (avgRpe >= 8) {
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`;
    } else if (avgRpe >= 7) {
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.5})`;
    } else {
      return `rgba(24, 227, 255, ${0.3 + intensity * 0.5})`;
    }
  };

  const getBorderColor = (count: number, avgRpe: number) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.1)';

    if (avgRpe >= 8) {
      return 'rgba(239, 68, 68, 0.5)';
    } else if (avgRpe >= 7) {
      return 'rgba(34, 197, 94, 0.5)';
    } else {
      return 'rgba(24, 227, 255, 0.5)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.1,
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: '2px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(139, 92, 246, 0.12)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Calendar" color="#8B5CF6" size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Pattern Hebdomadaire</h3>
              <p className="text-white/60 text-sm">Vos habitudes d'entraînement</p>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="space-y-3">
          {patterns.map((pattern, index) => (
            <motion.div
              key={pattern.dayOfWeek}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.1 + index * 0.05,
                type: 'spring',
                stiffness: 400,
                damping: 30
              }}
              whileHover={{
                x: 4,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 25
                }
              }}
              className="flex items-center gap-3"
              style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
            >
              {/* Day name */}
              <div className="w-24 text-sm font-medium text-white/80">
                {pattern.dayName}
              </div>

              {/* Heatmap bar */}
              <motion.div
                className="flex-1 h-12 relative rounded-lg overflow-hidden"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  delay: 0.15 + index * 0.05,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1]
                }}
                style={{
                  background: getIntensityColor(pattern.sessionsCount, pattern.avgRpe),
                  border: `2px solid ${getBorderColor(pattern.sessionsCount, pattern.avgRpe)}`,
                  transformOrigin: 'left',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden'
                }}
              >
                {pattern.sessionsCount > 0 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-between px-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-lg">
                        {pattern.sessionsCount} {pattern.sessionsCount === 1 ? 'séance' : 'séances'}
                      </span>
                      {pattern.avgRpe > 0 && (
                        <span className="text-sm text-white/70">
                          RPE {pattern.avgRpe.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {pattern.avgDuration > 0 && (
                      <span className="text-sm text-white/70">
                        ~{Math.round(pattern.avgDuration)}min
                      </span>
                    )}
                  </motion.div>
                )}

                {pattern.sessionsCount === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white/40">Aucune séance</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">Légende Intensité:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    background: 'rgba(24, 227, 255, 0.5)',
                    border: '1px solid rgba(24, 227, 255, 0.7)'
                  }}
                />
                <span className="text-white/70">Légère</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    background: 'rgba(34, 197, 94, 0.5)',
                    border: '1px solid rgba(34, 197, 94, 0.7)'
                  }}
                />
                <span className="text-white/70">Modérée</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    background: 'rgba(239, 68, 68, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.7)'
                  }}
                />
                <span className="text-white/70">Intense</span>
              </div>
            </div>
          </div>
        </div>

        {/* Best Day Insight */}
        {patterns.some(p => p.sessionsCount > 0) && (
          <div
            className="p-4 rounded-lg mt-4"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <GlowIcon icon="Star" color="#8B5CF6" size="small" />
              <span className="text-sm font-semibold text-white">Jour Favori</span>
            </div>
            <p className="text-sm text-white/80">
              Vous vous entraînez principalement le{' '}
              {patterns.reduce((max, p) => p.sessionsCount > max.sessionsCount ? p : max).dayName}
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default WeeklyPatternHeatmap;
