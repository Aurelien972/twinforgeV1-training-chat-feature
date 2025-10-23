/**
 * ConsistencyCalendarSection Component
 * Displays training consistency heatmap calendar
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';

interface ConsistencyDay {
  date: Date;
  hasSession: boolean;
  sessionsCount: number;
  totalVolume: number;
  avgRPE: number;
  intensity: 'none' | 'light' | 'moderate' | 'high';
}

interface ConsistencyStats {
  totalDays: number;
  activeDays: number;
  consistencyPercentage: number;
  currentStreak: number;
  longestStreak: number;
}

interface ConsistencyCalendarSectionProps {
  days: ConsistencyDay[];
  stats: ConsistencyStats;
}

const ConsistencyCalendarSection: React.FC<ConsistencyCalendarSectionProps> = ({ days, stats }) => {
  const getIntensityColor = (intensity: string): string => {
    switch (intensity) {
      case 'light': return '#22C55E';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getIntensityOpacity = (intensity: string): number => {
    switch (intensity) {
      case 'light': return 0.4;
      case 'moderate': return 0.6;
      case 'high': return 0.8;
      default: return 0.1;
    }
  };

  // Group days by week
  const weeks: ConsistencyDay[][] = [];
  let currentWeek: ConsistencyDay[] = [];

  days.forEach((day, index) => {
    if (index === 0) {
      const dayOfWeek = getDay(day.date);
      for (let i = 1; i < dayOfWeek; i++) {
        currentWeek.push({
          date: new Date(day.date.getTime() - (dayOfWeek - i) * 24 * 60 * 60 * 1000),
          hasSession: false,
          sessionsCount: 0,
          totalVolume: 0,
          avgRPE: 0,
          intensity: 'none'
        });
      }
    }

    currentWeek.push(day);

    if (getDay(day.date) === 0 || index === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #22C55E 8%, transparent) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #22C55E 20%, transparent)',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px color-mix(in srgb, #22C55E 12%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, #22C55E 30%, transparent), color-mix(in srgb, #10B981 25%, transparent))
                `,
                border: '2px solid color-mix(in srgb, #22C55E 40%, transparent)',
                boxShadow: '0 0 20px color-mix(in srgb, #22C55E 30%, transparent)'
              }}
            >
              <SpatialIcon Icon={ICONS.Calendar} size={20} style={{ color: '#22C55E' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Calendrier de Constance</h3>
              <p className="text-green-200 text-sm">{stats.totalDays} derniers jours</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: 'color-mix(in srgb, #22C55E 8%, transparent)',
              border: '1px solid color-mix(in srgb, #22C55E 15%, transparent)'
            }}
          >
            <div className="text-xs text-white/60 mb-1">Jours Actifs</div>
            <div className="text-xl font-bold text-white">{stats.activeDays}</div>
          </div>

          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: 'color-mix(in srgb, #3B82F6 8%, transparent)',
              border: '1px solid color-mix(in srgb, #3B82F6 15%, transparent)'
            }}
          >
            <div className="text-xs text-white/60 mb-1">Constance</div>
            <div className="text-xl font-bold text-white">{stats.consistencyPercentage}%</div>
          </div>

          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: 'color-mix(in srgb, #F59E0B 8%, transparent)',
              border: '1px solid color-mix(in srgb, #F59E0B 15%, transparent)'
            }}
          >
            <div className="text-xs text-white/60 mb-1">Streak Actuel</div>
            <div className="text-xl font-bold text-white">{stats.currentStreak} j</div>
          </div>

          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: 'color-mix(in srgb, #8B5CF6 8%, transparent)',
              border: '1px solid color-mix(in srgb, #8B5CF6 15%, transparent)'
            }}
          >
            <div className="text-xs text-white/60 mb-1">Record</div>
            <div className="text-xl font-bold text-white">{stats.longestStreak} j</div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="space-y-2">
          {/* Week days header */}
          <div className="flex gap-1 mb-2 pl-8">
            {weekDays.map((day, i) => (
              <div key={i} className="w-full text-center text-xs text-white/50 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {week.map((day, dayIndex) => {
                  const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const color = getIntensityColor(day.intensity);
                  const opacity = getIntensityOpacity(day.intensity);

                  return (
                    <div
                      key={dayIndex}
                      className="group relative flex-1 aspect-square rounded-md transition-all duration-200 hover:scale-110 cursor-pointer"
                      style={{
                        background: day.hasSession
                          ? `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isToday
                          ? '2px solid rgba(59, 130, 246, 0.8)'
                          : `1px solid ${day.hasSession ? `color-mix(in srgb, ${color} ${opacity * 100 + 20}%, transparent)` : 'rgba(255, 255, 255, 0.1)'}`,
                        boxShadow: day.hasSession
                          ? `0 0 8px color-mix(in srgb, ${color} ${opacity * 60}%, transparent)`
                          : 'none'
                      }}
                      title={`${format(day.date, 'dd MMM', { locale: fr })} - ${day.sessionsCount} séance${day.sessionsCount > 1 ? 's' : ''}`}
                    >
                      {day.sessionsCount > 1 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{day.sessionsCount}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span>Moins</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ background: 'rgba(255, 255, 255, 0.05)' }} />
              <div className="w-4 h-4 rounded-sm" style={{ background: 'color-mix(in srgb, #22C55E 30%, transparent)' }} />
              <div className="w-4 h-4 rounded-sm" style={{ background: 'color-mix(in srgb, #F59E0B 50%, transparent)' }} />
              <div className="w-4 h-4 rounded-sm" style={{ background: 'color-mix(in srgb, #EF4444 70%, transparent)' }} />
            </div>
            <span>Plus</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'color-mix(in srgb, #22C55E 40%, transparent)' }} />
              <span className="text-white/70">Léger</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'color-mix(in srgb, #F59E0B 60%, transparent)' }} />
              <span className="text-white/70">Modéré</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'color-mix(in srgb, #EF4444 80%, transparent)' }} />
              <span className="text-white/70">Intense</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(ConsistencyCalendarSection);
