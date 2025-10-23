/**
 * ConsistencyCalendarHeatmap Component
 * GitHub-style heatmap showing training consistency
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, eachDayOfInterval } from 'date-fns';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import { usePerformanceMode } from '../../../../../hooks/usePerformanceMode';
import type { ConsistencyCalendar } from '../../../../../domain/trainingProgression';

interface ConsistencyCalendarHeatmapProps {
  calendar: ConsistencyCalendar;
}

const CONSISTENCY_COLOR = '#22C55E';

const ConsistencyCalendarHeatmap: React.FC<ConsistencyCalendarHeatmapProps> = ({ calendar }) => {
  const { enableAnimations, animationDelay, calendarDays } = usePerformanceMode();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const getIntensityColor = (intensity: string): string => {
    switch (intensity) {
      case 'high': return CONSISTENCY_COLOR;
      case 'moderate': return '#F59E0B';
      case 'light': return '#8B5CF6';
      case 'none': return 'rgba(255, 255, 255, 0.1)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getIntensityOpacity = (intensity: string): number => {
    switch (intensity) {
      case 'high': return 1;
      case 'moderate': return 0.7;
      case 'light': return 0.4;
      case 'none': return 0.15;
      default: return 0.15;
    }
  };

  const limitedCalendarDays = useMemo(() => {
    return calendar.days.slice(-calendarDays);
  }, [calendar.days, calendarDays]);

  const weeks: typeof calendar.days[][] = useMemo(() => {
    const weeksArray: typeof calendar.days[][] = [];
    let currentWeek: typeof calendar.days = [];

    limitedCalendarDays.forEach((day, index) => {
      currentWeek.push(day);
      if ((index + 1) % 7 === 0 || index === limitedCalendarDays.length - 1) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeksArray;
  }, [limitedCalendarDays]);

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${CONSISTENCY_COLOR} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${CONSISTENCY_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${CONSISTENCY_COLOR} 12%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Calendar" color={CONSISTENCY_COLOR} size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Calendrier de Constance</h3>
              <p className="text-white/60 text-sm">
                {calendar.stats.activeDays} jours actifs sur {calendar.stats.totalDays}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-bold mb-1"
              style={{
                color: CONSISTENCY_COLOR,
                textShadow: `0 0 20px ${CONSISTENCY_COLOR}50`
              }}
            >
              {calendar.stats.consistencyPercentage}%
            </div>
            <div className="text-xs text-white/60">Constance</div>
          </div>
        </div>

        <div className="overflow-x-auto mt-4" style={{ contain: 'layout style paint' }}>
          <div className="inline-flex flex-col gap-1 min-w-full" style={{ willChange: 'transform' }}>
            <div className="flex gap-1 pl-6">
              {weeks.map((week, weekIndex) => {
                if (weekIndex % 4 === 0 && week[0]) {
                  const month = week[0].date.getMonth();
                  return (
                    <div key={weekIndex} className="text-xs text-white/50" style={{ width: '14px' }}>
                      {monthLabels[month]}
                    </div>
                  );
                }
                return <div key={weekIndex} style={{ width: '14px' }} />;
              })}
            </div>

            {dayLabels.map((label, dayIndex) => (
              <div key={dayIndex} className="flex items-center gap-1">
                <div className="w-4 text-xs text-white/50">{label}</div>
                {weeks.map((week, weekIndex) => {
                  const day = week[dayIndex];
                  if (!day) return <div key={weekIndex} className="w-3.5 h-3.5" />;

                  const color = getIntensityColor(day.intensity);
                  const opacity = getIntensityOpacity(day.intensity);

                  const dayKey = weekIndex * 7 + dayIndex;
                  const isHovered = hoveredDay === dayKey;

                  return (
                    <div
                      key={weekIndex}
                      onMouseEnter={() => setHoveredDay(dayKey)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="w-3.5 h-3.5 rounded-sm cursor-pointer relative"
                      style={{
                        backgroundColor: color,
                        opacity,
                        boxShadow: day.hasSession ? `0 0 6px ${color}40` : 'none',
                        transform: isHovered && enableAnimations ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.15s ease-out',
                        contain: 'layout style paint',
                        willChange: isHovered ? 'transform' : 'auto'
                      }}
                      title={`${format(day.date, 'dd/MM/yyyy')} - ${day.sessionsCount} séance(s)`}
                    >
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap z-20">
                          {format(day.date, 'dd MMM')}
                          {day.hasSession && (
                            <>
                              <br />
                              {day.sessionsCount} séance{day.sessionsCount > 1 ? 's' : ''}
                              <br />
                              RPE: {day.avgRPE.toFixed(1)}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Streak Actuel</div>
            <div
              className="text-2xl font-bold"
              style={{
                color: CONSISTENCY_COLOR,
                textShadow: `0 0 16px ${CONSISTENCY_COLOR}40`
              }}
            >
              {calendar.stats.currentStreak}
            </div>
            <div className="text-xs text-white/50">jours</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Record</div>
            <div className="text-2xl font-bold text-white">
              {calendar.stats.longestStreak}
            </div>
            <div className="text-xs text-white/50">jours</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">Taux</div>
            <div className="text-2xl font-bold text-white">
              {calendar.stats.consistencyPercentage}%
            </div>
            <div className="text-xs text-white/50">constance</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-xs text-white/60">
          <span>Moins</span>
          <div className="flex gap-1">
            {['none', 'light', 'moderate', 'high'].map(intensity => (
              <div
                key={intensity}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: getIntensityColor(intensity),
                  opacity: getIntensityOpacity(intensity)
                }}
              />
            ))}
          </div>
          <span>Plus</span>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(ConsistencyCalendarHeatmap);
