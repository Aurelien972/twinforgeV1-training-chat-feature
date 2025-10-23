/**
 * RecordsByDisciplineView Component
 * Displays records organized by discipline with collapsible sections
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface RecordsByDisciplineViewProps {
  records: PersonalRecord[];
}

const RecordsByDisciplineView: React.FC<RecordsByDisciplineViewProps> = ({ records }) => {
  const [expandedDisciplines, setExpandedDisciplines] = useState<Set<string>>(new Set());

  const disciplineConfig: Record<string, { label: string; icon: keyof typeof ICONS; color: string }> = {
    strength: { label: 'Force', icon: 'Dumbbell', color: '#8B5CF6' },
    endurance: { label: 'Endurance', icon: 'Activity', color: '#F59E0B' },
    functional: { label: 'Fonctionnel', icon: 'Target', color: '#22C55E' },
    calisthenics: { label: 'Callisthénie', icon: 'User', color: '#06B6D4' },
    competitions: { label: 'Compétitions', icon: 'Trophy', color: '#EF4444' }
  };

  const recordsByDiscipline = records.reduce((acc, record) => {
    if (!acc[record.discipline]) {
      acc[record.discipline] = [];
    }
    acc[record.discipline].push(record);
    return acc;
  }, {} as Record<string, PersonalRecord[]>);

  const toggleDiscipline = (discipline: string) => {
    setExpandedDisciplines(prev => {
      const next = new Set(prev);
      if (next.has(discipline)) {
        next.delete(discipline);
      } else {
        next.add(discipline);
      }
      return next;
    });
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {Object.entries(recordsByDiscipline).map(([discipline, disciplineRecords]) => {
        const config = disciplineConfig[discipline] || { label: discipline, icon: 'Trophy', color: '#3B82F6' };
        const isExpanded = expandedDisciplines.has(discipline);

        return (
          <GlassCard
            key={discipline}
            className="p-6"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, ${config.color} 8%, transparent) 0%, transparent 60%),
                var(--glass-opacity)
              `,
              borderColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px color-mix(in srgb, ${config.color} 12%, transparent)`
            }}
          >
            {/* Discipline Header */}
            <button
              onClick={() => toggleDiscipline(discipline)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                      linear-gradient(135deg, color-mix(in srgb, ${config.color} 30%, transparent), color-mix(in srgb, ${config.color} 20%, transparent))
                    `,
                    border: `2px solid color-mix(in srgb, ${config.color} 40%, transparent)`,
                    boxShadow: `0 0 20px color-mix(in srgb, ${config.color} 30%, transparent)`
                  }}
                >
                  <SpatialIcon Icon={ICONS[config.icon]} size={20} style={{ color: config.color }} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white">{config.label}</h3>
                  <p className="text-sm" style={{ color: config.color }}>
                    {disciplineRecords.length} record{disciplineRecords.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <SpatialIcon Icon={ICONS.ChevronDown} size={20} style={{ color: config.color }} />
              </motion.div>
            </button>

            {/* Records List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 overflow-hidden"
                >
                  {disciplineRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                      style={{
                        background: `color-mix(in srgb, ${config.color} 6%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${config.color} 15%, transparent)`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`
                            }}
                          >
                            <SpatialIcon
                              Icon={ICONS[getRecordIcon(record.recordType)]}
                              size={16}
                              style={{ color: config.color }}
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
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        );
      })}
    </motion.div>
  );
};

export default React.memo(RecordsByDisciplineView);
