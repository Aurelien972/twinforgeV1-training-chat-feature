/**
 * PersonalBestsTimeline Component
 * Vertical timeline showing personal records
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { PersonalRecord } from '../../../../domain/trainingProgression';

interface PersonalBestsTimelineProps {
  records: PersonalRecord[];
}

const PersonalBestsTimeline: React.FC<PersonalBestsTimelineProps> = ({ records }) => {
  if (records.length === 0) return null;

  const sortedRecords = [...records].sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(251, 191, 36, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(251, 191, 36, 0.12)'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Award" color="#FBB024" size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Records Personnels</h3>
              <p className="text-white/60 text-sm">{records.length} records établis</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {sortedRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
              className="relative"
            >
              {index < sortedRecords.length - 1 && (
                <div
                  className="absolute left-6 top-12 bottom-0 w-0.5"
                  style={{
                    background: `linear-gradient(180deg, ${record.color}40 0%, transparent 100%)`
                  }}
                />
              )}

              <div
                className="p-4 rounded-lg relative"
                style={{
                  background: `radial-gradient(circle at 20% 20%, color-mix(in srgb, ${record.color} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                  border: `1px solid color-mix(in srgb, ${record.color} 20%, transparent)`
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${record.color} 30%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.1)`,
                      border: `2px solid color-mix(in srgb, ${record.color} 40%, transparent)`,
                      boxShadow: `0 0 20px color-mix(in srgb, ${record.color} 30%, transparent)`
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Trophy}
                      size={24}
                      style={{
                        color: record.color,
                        filter: `drop-shadow(0 0 8px ${record.color}60)`
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white mb-0.5">
                          {record.exerciseName}
                        </h4>
                        <p className="text-xs text-white/50">{record.muscleGroup}</p>
                      </div>
                      <div
                        className="text-2xl font-bold"
                        style={{
                          color: record.color,
                          textShadow: `0 0 16px ${record.color}40`
                        }}
                      >
                        {record.value}{record.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-white/60">
                        <SpatialIcon Icon={ICONS.Clock} size={12} />
                        <span>
                          {formatDistanceToNow(record.achievedAt, { addSuffix: true, locale: fr })}
                        </span>
                      </div>

                      {record.improvement && record.previousRecord && (
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <SpatialIcon Icon={ICONS.TrendingUp} size={12} style={{ color: '#22C55E' }} />
                          <span className="font-bold" style={{ color: '#22C55E' }}>
                            +{record.improvement}{record.unit}
                          </span>
                          <span className="text-white/50 ml-1">
                            ({Math.round((record.improvement / record.previousRecord) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {record.notes && (
                      <p className="text-xs text-white/60 mt-2 italic">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {sortedRecords.length === 0 && (
          <div className="text-center py-8 text-white/60">
            Continuez à vous entraîner pour établir vos premiers records!
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default PersonalBestsTimeline;
