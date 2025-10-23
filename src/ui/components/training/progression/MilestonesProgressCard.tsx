/**
 * MilestonesProgressCard Component
 * Display major milestones with progress tracking
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import ProgressBarAnimated from '../ProgressBarAnimated';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS, type IconName } from '../../../icons/registry';
import type { Milestone } from '../../../../domain/trainingProgression';

interface MilestonesProgressCardProps {
  milestones: Milestone[];
}

const MILESTONE_COLOR = '#18E3FF';

const MilestonesProgressCard: React.FC<MilestonesProgressCardProps> = ({ milestones }) => {
  const completedCount = milestones.filter(m => m.isCompleted).length;
  const activeMilestones = milestones.filter(m => !m.isCompleted).slice(0, 4);
  const recentCompletions = milestones
    .filter(m => m.isCompleted)
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${MILESTONE_COLOR} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${MILESTONE_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${MILESTONE_COLOR} 12%, transparent)`
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlowIcon icon="Target" color={MILESTONE_COLOR} size="medium" />
            <div>
              <h3 className="text-lg font-bold text-white">Milestones</h3>
              <p className="text-white/60 text-sm">
                {completedCount} / {milestones.length} atteints
              </p>
            </div>
          </div>
        </div>

        {recentCompletions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-white/60 font-semibold mb-2">Récemment Complétés</div>
            {recentCompletions.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    boxShadow: '0 0 16px rgba(34, 197, 94, 0.5)'
                  }}
                >
                  <SpatialIcon Icon={ICONS.CheckCircle} size={20} style={{ color: 'white' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{milestone.title}</div>
                  <div className="text-xs text-white/60">{milestone.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-xs text-white/60 font-semibold mb-2">En Progression</div>
          {activeMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="p-4 rounded-lg"
              style={{
                background: `radial-gradient(circle at 20% 20%, color-mix(in srgb, ${milestone.color} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                border: `1px solid color-mix(in srgb, ${milestone.color} 20%, transparent)`
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${milestone.color} 25%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
                    border: `2px solid color-mix(in srgb, ${milestone.color} 35%, transparent)`,
                    boxShadow: `0 0 12px color-mix(in srgb, ${milestone.color} 25%, transparent)`
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS[milestone.icon as IconName] || ICONS.Target}
                    size={20}
                    style={{
                      color: milestone.color,
                      filter: `drop-shadow(0 0 6px ${milestone.color}60)`
                    }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-bold text-white">{milestone.title}</h4>
                      <p className="text-xs text-white/60">{milestone.description}</p>
                    </div>
                    <div
                      className="text-lg font-bold whitespace-nowrap ml-2"
                      style={{
                        color: milestone.color,
                        textShadow: `0 0 12px ${milestone.color}40`
                      }}
                    >
                      {Math.round(milestone.progress)}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                    <span>{milestone.current.toLocaleString()}</span>
                    <span>/</span>
                    <span>{milestone.target.toLocaleString()}</span>
                    {milestone.nextMilestone && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-white/50">
                          Prochain: {milestone.nextMilestone.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>

                  <ProgressBarAnimated
                    progress={milestone.progress}
                    color={milestone.color}
                    height={6}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {activeMilestones.length === 0 && recentCompletions.length === 0 && (
          <div className="text-center py-8 text-white/60">
            Tous les milestones sont complétés! 🎉
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default MilestonesProgressCard;
