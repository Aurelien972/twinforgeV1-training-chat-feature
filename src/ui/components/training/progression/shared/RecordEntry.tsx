/**
 * RecordEntry Component
 * Displays a single personal record with improvement data
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import TrendBadge from './TrendBadge';
import type { RecordEntryProps } from '../types';
import { formatRecordValue, formatRelativeDate, formatMuscleGroup } from '../utils/formatters';
import { compareRecords } from '../utils/recordComparisons';

const RecordEntry: React.FC<RecordEntryProps> = ({
  record,
  showTimeline = true,
  showImprovement = true,
  isLast = false,
}) => {
  const comparison = compareRecords(record.value, record.previousRecord || undefined);
  
  return (
    <div className="relative">
      {showTimeline && (
        <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-white/10" />
      )}
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3 pb-4"
      >
        {showTimeline && (
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{
              background: `radial-gradient(circle at center, color-mix(in srgb, ${record.color} 30%, transparent), rgba(255, 255, 255, 0.05))`,
              border: `2px solid ${record.color}`,
              boxShadow: `0 0 16px ${record.color}50`,
            }}
          >
            <SpatialIcon
              Icon={ICONS.Trophy}
              size={20}
              style={{ color: record.color }}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white truncate">
                {record.exerciseName}
              </h4>
              <p className="text-xs text-white/60">
                {formatMuscleGroup(record.muscleGroup)}
              </p>
            </div>
            
            {showImprovement && comparison.improvementPercentage !== undefined && (
              <TrendBadge value={comparison.improvementPercentage} size="sm" />
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div
              className="text-lg font-bold"
              style={{
                color: record.color,
                textShadow: `0 0 12px ${record.color}40`,
              }}
            >
              {formatRecordValue(
                record.value,
                record.recordType.includes('weight') ? 'weight' :
                record.recordType.includes('reps') ? 'reps' :
                record.recordType.includes('time') ? 'time' : 'weight'
              )}
            </div>
            
            {record.previousRecord && (
              <div className="text-xs text-white/50">
                Précédent: {formatRecordValue(
                  record.previousRecord,
                  record.recordType.includes('weight') ? 'weight' :
                  record.recordType.includes('reps') ? 'reps' :
                  record.recordType.includes('time') ? 'time' : 'weight'
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/60">
            <SpatialIcon Icon={ICONS.Calendar} size={12} style={{ color: '#fff', opacity: 0.6 }} />
            <span>{formatRelativeDate(record.achievedAt)}</span>
          </div>
          
          {record.notes && (
            <p className="mt-2 text-xs text-white/60 italic">{record.notes}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(RecordEntry);
