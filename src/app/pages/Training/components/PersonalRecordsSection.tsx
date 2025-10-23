/**
 * PersonalRecordsSection Component
 * Displays personal records and achievements
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

interface PersonalRecordsSectionProps {
  records: PersonalRecord[];
}

const PersonalRecordsSection: React.FC<PersonalRecordsSectionProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <GlassCard
          className="p-8 text-center"
          style={{
            background: 'var(--glass-opacity)',
            borderColor: 'color-mix(in srgb, #F59E0B 20%, transparent)'
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              background: 'color-mix(in srgb, #F59E0B 15%, transparent)',
              border: '2px solid color-mix(in srgb, #F59E0B 30%, transparent)'
            }}
          >
            <SpatialIcon Icon={ICONS.Trophy} size={32} style={{ color: '#F59E0B' }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aucun Record Enregistré</h3>
          <p className="text-white/60">
            Continuez à vous entraîner pour établir vos premiers records personnels
          </p>
        </GlassCard>
      </motion.div>
    );
  }

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
      transition={{ duration: 0.4, delay: 0.3 }}
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
              <SpatialIcon Icon={ICONS.Trophy} size={20} style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Records Personnels</h3>
              <p className="text-orange-200 text-sm">{records.length} record{records.length > 1 ? 's' : ''} établi{records.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {records.map((record, index) => {
            const disciplineColor = getDisciplineColor(record.discipline);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
              >
                <div
                  className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: `color-mix(in srgb, ${disciplineColor} 6%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${disciplineColor} 15%, transparent)`
                  }}
                >
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

                      <div className="text-right text-white/50 text-xs w-20">
                        {format(record.achievedAt, 'dd MMM', { locale: fr })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Link to full records view */}
        <div className="mt-6 text-center">
          <button
            className="text-sm text-orange-300 hover:text-orange-200 transition-colors font-medium"
            style={{
              textShadow: '0 0 10px rgba(245, 158, 11, 0.3)'
            }}
          >
            Voir tous les records →
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(PersonalRecordsSection);
