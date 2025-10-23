/**
 * MilestoneProgress Component
 * Displays milestone with progress bar
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { MilestoneProgressProps } from '../types';
import { formatMilestoneProgress, formatAchievementProgress } from '../utils/formatters';

const MilestoneProgress: React.FC<MilestoneProgressProps> = ({
  milestone,
  showPercentage = true,
  animated = true,
  compact = false,
}) => {
  const progressPercentage = (milestone.current / milestone.target) * 100;
  
  const content = (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg flex items-center justify-center`}
          style={{
            background: `color-mix(in srgb, ${milestone.color} 20%, transparent)`,
            border: `1px solid color-mix(in srgb, ${milestone.color} 40%, transparent)`,
          }}
        >
          <SpatialIcon
            Icon={ICONS[milestone.icon as keyof typeof ICONS] || ICONS.Target}
            size={compact ? 20 : 24}
            style={{ color: milestone.color }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4
              className={`${compact ? 'text-sm' : 'text-base'} font-bold text-white truncate`}
              style={{ color: milestone.color }}
            >
              {milestone.title}
            </h4>
            {milestone.isCompleted && (
              <SpatialIcon Icon={ICONS.Check} size={16} style={{ color: '#22C55E' }} />
            )}
          </div>
          <p className="text-xs text-white/60">{milestone.description}</p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
          <span>{formatAchievementProgress(milestone.current, milestone.target)}</span>
          {showPercentage && (
            <span className="font-semibold" style={{ color: milestone.color }}>
              {formatMilestoneProgress(milestone.current, milestone.target)}
            </span>
          )}
        </div>
        
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${milestone.color}, color-mix(in srgb, ${milestone.color} 70%, white))`,
              boxShadow: `0 0 8px ${milestone.color}80`,
            }}
            initial={animated ? { width: 0 } : undefined}
            animate={{ width: `${Math.min(100, progressPercentage)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        
        {milestone.nextMilestone && !milestone.isCompleted && (
          <p className="mt-2 text-xs text-white/50">
            Prochain jalon: {milestone.nextMilestone}
          </p>
        )}
        
        {milestone.isCompleted && milestone.completedAt && (
          <p className="mt-2 text-xs text-white/50">
            Terminé le {new Date(milestone.completedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
  
  if (!animated) return content;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
};

export default React.memo(MilestoneProgress);
