/**
 * RecordOpportunitiesWidget Component
 * Suggests exercises where a new record is close to being achieved
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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

interface RecordOpportunitiesWidgetProps {
  records: PersonalRecord[];
}

interface Opportunity {
  exerciseName: string;
  currentRecord: number;
  suggestedTarget: number;
  unit: string;
  discipline: string;
  recordType: string;
  daysAgo: number;
}

const RecordOpportunitiesWidget: React.FC<RecordOpportunitiesWidgetProps> = ({ records }) => {
  const opportunities = useMemo(() => {
    const now = new Date();
    const recentRecords = records.filter(record => {
      const daysAgo = Math.floor((now.getTime() - new Date(record.achievedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo >= 14 && daysAgo <= 60;
    });

    const ops: Opportunity[] = recentRecords.slice(0, 3).map(record => {
      const daysAgo = Math.floor((now.getTime() - new Date(record.achievedAt).getTime()) / (1000 * 60 * 60 * 24));
      const suggestedIncrease = record.improvement > 0 ? record.improvement : 5;
      const suggestedTarget = Math.round(record.value * (1 + suggestedIncrease / 100));

      return {
        exerciseName: record.exerciseName,
        currentRecord: record.value,
        suggestedTarget,
        unit: record.unit,
        discipline: record.discipline,
        recordType: record.recordType,
        daysAgo
      };
    });

    return ops;
  }, [records]);

  if (opportunities.length === 0) {
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

  const getRecordTypeLabel = (type: string): string => {
    switch (type) {
      case 'max_weight': return 'Poids Max';
      case 'max_volume': return 'Volume Max';
      case 'max_distance': return 'Distance Max';
      case 'max_duration': return 'Durée Max';
      default: return type;
    }
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
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #22C55E 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, #10B981 8%, transparent) 0%, transparent 50%),
            var(--glass-opacity)
          `,
          borderColor: 'color-mix(in srgb, #22C55E 25%, transparent)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.25),
            0 0 30px color-mix(in srgb, #22C55E 15%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%),
                linear-gradient(135deg, color-mix(in srgb, #22C55E 30%, transparent), color-mix(in srgb, #10B981 25%, transparent))
              `,
              border: '2px solid color-mix(in srgb, #22C55E 40%, transparent)',
              boxShadow: '0 0 20px color-mix(in srgb, #22C55E 30%, transparent)'
            }}
            animate={{
              boxShadow: [
                '0 0 20px color-mix(in srgb, #22C55E 30%, transparent)',
                '0 0 30px color-mix(in srgb, #22C55E 50%, transparent)',
                '0 0 20px color-mix(in srgb, #22C55E 30%, transparent)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <SpatialIcon Icon={ICONS.Target} size={20} style={{ color: '#22C55E' }} />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">Opportunités de Records</h3>
            <p className="text-green-200 text-sm">Nouveaux records à portée de main</p>
          </div>
        </div>

        <div className="space-y-3">
          {opportunities.map((opportunity, index) => {
            const color = getDisciplineColor(opportunity.discipline);

            return (
              <motion.div
                key={`${opportunity.exerciseName}-${opportunity.recordType}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: `color-mix(in srgb, ${color} 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={ICONS.Zap} size={16} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">
                        {opportunity.exerciseName}
                      </div>
                      <div className="text-white/60 text-xs">
                        {getRecordTypeLabel(opportunity.recordType)}
                      </div>
                    </div>
                  </div>

                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: `color-mix(in srgb, ${color} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                      color
                    }}
                  >
                    Il y a {opportunity.daysAgo}j
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">Record actuel:</span>
                    <span className="text-white font-bold text-sm">
                      {opportunity.currentRecord}{opportunity.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <SpatialIcon Icon={ICONS.ArrowRight} size={14} style={{ color: '#22C55E' }} />
                    <span className="text-green-400 font-bold text-sm">
                      {opportunity.suggestedTarget}{opportunity.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/70 text-xs">
                    💪 Tentez de battre ce record lors de votre prochaine séance
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default React.memo(RecordOpportunitiesWidget);
