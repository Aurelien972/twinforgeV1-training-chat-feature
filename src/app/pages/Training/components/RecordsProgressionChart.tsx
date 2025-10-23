/**
 * RecordsProgressionChart Component
 * Chart showing the progression of records over time
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import { format } from 'date-fns';
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

interface RecordsProgressionChartProps {
  records: PersonalRecord[];
}

const RecordsProgressionChart: React.FC<RecordsProgressionChartProps> = ({ records }) => {
  const chartData = useMemo(() => {
    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
    );

    const recordsByExercise = sortedRecords.reduce((acc, record) => {
      const key = `${record.exerciseName}-${record.recordType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {} as Record<string, PersonalRecord[]>);

    return Object.entries(recordsByExercise).slice(0, 5);
  }, [records]);

  if (chartData.length === 0) {
    return null;
  }

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
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <GlassCard
        className="p-6"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #3B82F6 8%, transparent) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #3B82F6 20%, transparent)',
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 30px color-mix(in srgb, #3B82F6 12%, transparent)`
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                linear-gradient(135deg, color-mix(in srgb, #3B82F6 30%, transparent), color-mix(in srgb, #2563EB 25%, transparent))
              `,
              border: '2px solid color-mix(in srgb, #3B82F6 40%, transparent)',
              boxShadow: '0 0 20px color-mix(in srgb, #3B82F6 30%, transparent)'
            }}
          >
            <SpatialIcon Icon={ICONS.TrendingUp} size={20} style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Progression des Records</h3>
            <p className="text-blue-200 text-sm">Top 5 exercices avec historique</p>
          </div>
        </div>

        <div className="space-y-6">
          {chartData.map(([key, exerciseRecords], index) => {
            const latestRecord = exerciseRecords[exerciseRecords.length - 1];
            const firstRecord = exerciseRecords[0];
            const totalImprovement = exerciseRecords.length > 1
              ? ((latestRecord.value - firstRecord.value) / firstRecord.value) * 100
              : 0;
            const color = getDisciplineColor(latestRecord.discipline);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, ${color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS.Target} size={14} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {latestRecord.exerciseName}
                      </div>
                      <div className="text-white/60 text-xs">
                        {exerciseRecords.length} record{exerciseRecords.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-bold text-sm">
                      {latestRecord.value}{latestRecord.unit}
                    </div>
                    {totalImprovement > 0 && (
                      <div className="flex items-center gap-1 justify-end">
                        <SpatialIcon Icon={ICONS.TrendingUp} size={12} style={{ color: '#22C55E' }} />
                        <span className="text-green-400 text-xs font-medium">
                          +{Math.round(totalImprovement)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-10 rounded-lg overflow-hidden" style={{
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  {exerciseRecords.map((record, recordIndex) => {
                    const position = (recordIndex / (exerciseRecords.length - 1 || 1)) * 100;
                    const intensity = 0.5 + (recordIndex / exerciseRecords.length) * 0.5;

                    return (
                      <motion.div
                        key={record.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 + recordIndex * 0.05 }}
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer group"
                        style={{
                          left: `${position}%`,
                          background: color,
                          boxShadow: `0 0 10px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                        title={`${record.value}${record.unit} - ${format(record.achievedAt, 'dd/MM/yyyy', { locale: fr })}`}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <div className="px-2 py-1 rounded text-xs font-medium text-white"
                            style={{
                              background: color,
                              boxShadow: `0 0 10px ${color}60`
                            }}
                          >
                            {record.value}{record.unit}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Date Range */}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{format(firstRecord.achievedAt, 'dd MMM yyyy', { locale: fr })}</span>
                  <span>{format(latestRecord.achievedAt, 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(RecordsProgressionChart);
