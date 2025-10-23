/**
 * RecordsTimeline Component
 * Chronological timeline of all personal records
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';

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

interface RecordsTimelineProps {
  records: PersonalRecord[];
}

const RecordsTimeline: React.FC<RecordsTimelineProps> = ({ records }) => {
  const sortedRecords = [...records].sort((a, b) =>
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  const getRecordTypeLabel = (type: string): string => {
    switch (type) {
      case 'max_weight': return 'Poids Max';
      case 'max_volume': return 'Volume Max';
      case 'max_distance': return 'Distance Max';
      case 'max_duration': return 'Durée Max';
      default: return type;
    }
  };

  const getRecordIcon = (type: string): keyof typeof ICONS => {
    switch (type) {
      case 'max_weight': return 'Dumbbell';
      case 'max_volume': return 'TrendingUp';
      case 'max_distance': return 'MapPin';
      case 'max_duration': return 'Clock';
      default: return 'Trophy';
    }
  };

  const getDisciplineColor = (discipline: string): string => {
    const colors: Record<string, string> = {
      strength: '#8B5CF6',
      endurance: '#F59E0B',
      functional: '#22C55E',
      calisthenics: '#06B6D4',
      competitions: '#EF4444'
    };
    return colors[discipline] || '#3B82F6';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
              <SpatialIcon Icon={ICONS.Clock} size={20} style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Chronologie des Records</h3>
              <p className="text-orange-200 text-sm">{sortedRecords.length} record{sortedRecords.length > 1 ? 's' : ''} établi{sortedRecords.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-0.5"
            style={{
              background: 'linear-gradient(to bottom, color-mix(in srgb, #F59E0B 40%, transparent), color-mix(in srgb, #F59E0B 10%, transparent))'
            }}
          />

          <div className="space-y-6">
            {sortedRecords.map((record, index) => {
              const disciplineColor = getDisciplineColor(record.discipline);

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative pl-16"
                >
                  {/* Timeline Dot */}
                  <div
                    className="absolute left-3.5 top-6 w-5 h-5 rounded-full z-10"
                    style={{
                      background: `
                        radial-gradient(circle at center, ${disciplineColor}, color-mix(in srgb, ${disciplineColor} 80%, transparent))
                      `,
                      border: `2px solid color-mix(in srgb, ${disciplineColor} 60%, transparent)`,
                      boxShadow: `0 0 15px ${disciplineColor}60`
                    }}
                  />

                  {/* Record Card */}
                  <div
                    className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    style={{
                      background: `color-mix(in srgb, ${disciplineColor} 6%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${disciplineColor} 15%, transparent)`
                    }}
                  >
                    {/* Date Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <SpatialIcon Icon={ICONS.Calendar} size={14} style={{ color: disciplineColor }} />
                      <span className="text-xs font-medium" style={{ color: disciplineColor }}>
                        {format(record.achievedAt, 'EEEE dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    {/* Record Details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `color-mix(in srgb, ${disciplineColor} 15%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${disciplineColor} 25%, transparent)`
                          }}
                        >
                          <SpatialIcon
                            Icon={ICONS[getRecordIcon(record.recordType)]}
                            size={16}
                            style={{ color: disciplineColor }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm truncate">
                            {record.exerciseName}
                          </div>
                          <div className="text-white/60 text-xs">
                            {getRecordTypeLabel(record.recordType)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {record.value}{record.unit}
                          </div>
                          {record.improvement > 0 && (
                            <div className="flex items-center gap-1 justify-end">
                              <SpatialIcon Icon={ICONS.TrendingUp} size={12} style={{ color: '#22C55E' }} />
                              <span className="text-green-400 text-xs font-medium">
                                +{record.improvement}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(RecordsTimeline);
