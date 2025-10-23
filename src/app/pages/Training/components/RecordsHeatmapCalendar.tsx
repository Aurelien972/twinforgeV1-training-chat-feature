/**
 * RecordsHeatmapCalendar Component
 * Heatmap showing when records are achieved
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import { format, eachDayOfInterval, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PersonalRecord {
  id: string;
  exerciseName: string;
  recordType: 'max_weight' | 'max_volume' | 'max_distance' | 'max_duration';
  value: number;
  unit: string;
  achievedAt: Date;
  improvement: number;
  discipline: string;
}

interface RecordsHeatmapCalendarProps {
  records: PersonalRecord[];
}

const RecordsHeatmapCalendar: React.FC<RecordsHeatmapCalendarProps> = ({ records }) => {
  const heatmapData = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, 90);
    const days = eachDayOfInterval({ start: startDate, end: now });

    const recordsByDate = records.reduce((acc, record) => {
      const dateKey = format(record.achievedAt, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {} as Record<string, PersonalRecord[]>);

    return days.map(day => ({
      date: day,
      recordsCount: recordsByDate[format(day, 'yyyy-MM-dd')]?.length || 0,
      records: recordsByDate[format(day, 'yyyy-MM-dd')] || []
    }));
  }, [records]);

  const maxRecordsPerDay = Math.max(...heatmapData.map(d => d.recordsCount), 1);

  const getIntensityColor = (count: number): string => {
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';
    const intensity = count / maxRecordsPerDay;
    if (intensity < 0.25) return 'rgba(245, 158, 11, 0.2)';
    if (intensity < 0.5) return 'rgba(245, 158, 11, 0.4)';
    if (intensity < 0.75) return 'rgba(245, 158, 11, 0.6)';
    return 'rgba(245, 158, 11, 0.8)';
  };

  const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #F59E0B 8%, transparent) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #F59E0B 20%, transparent)',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px color-mix(in srgb, #F59E0B 12%, transparent)`
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                linear-gradient(135deg, color-mix(in srgb, #F59E0B 30%, transparent), color-mix(in srgb, #D97706 25%, transparent))
              `,
              border: '2px solid color-mix(in srgb, #F59E0B 40%, transparent)',
              boxShadow: '0 0 20px color-mix(in srgb, #F59E0B 30%, transparent)'
            }}
          >
            <SpatialIcon Icon={ICONS.Calendar} size={20} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Calendrier des Records</h3>
            <p className="text-orange-200 text-sm">90 derniers jours</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Weekday labels */}
          <div className="flex gap-1">
            <div className="w-8" />
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="w-3 h-3 flex items-center justify-center text-[10px] text-white/50 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          <div className="flex gap-1">
            {Array.from({ length: 13 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {weekdays.map((_, dayIndex) => {
                  const dataIndex = weekIndex * 7 + dayIndex;
                  const dayData = heatmapData[dataIndex];

                  if (!dayData) return <div key={dayIndex} className="w-3 h-3" />;

                  return (
                    <motion.div
                      key={dayIndex}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: weekIndex * 0.02 + dayIndex * 0.01 }}
                      className="w-3 h-3 rounded-sm cursor-pointer group relative"
                      style={{
                        background: getIntensityColor(dayData.recordsCount),
                        border: dayData.recordsCount > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                      title={`${format(dayData.date, 'dd MMM yyyy', { locale: fr })} - ${dayData.recordsCount} record${dayData.recordsCount > 1 ? 's' : ''}`}
                    >
                      {/* Tooltip */}
                      {dayData.recordsCount > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <div className="px-3 py-2 rounded-lg text-xs font-medium text-white space-y-1"
                            style={{
                              background: 'rgba(245, 158, 11, 0.95)',
                              boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <div className="font-bold">{format(dayData.date, 'dd MMMM yyyy', { locale: fr })}</div>
                            <div>{dayData.recordsCount} record{dayData.recordsCount > 1 ? 's' : ''}</div>
                            {dayData.records.slice(0, 3).map(record => (
                              <div key={record.id} className="text-[10px] opacity-90">
                                • {record.exerciseName}
                              </div>
                            ))}
                            {dayData.records.length > 3 && (
                              <div className="text-[10px] opacity-75">
                                +{dayData.records.length - 3} autre{dayData.records.length - 3 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-white/50 mt-4">
            <span>Moins</span>
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-sm"
                style={{
                  background: getIntensityColor(Math.ceil(intensity * maxRecordsPerDay)),
                  border: intensity > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            ))}
            <span>Plus</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(RecordsHeatmapCalendar);
