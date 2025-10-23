/**
 * SessionHistoryTimeline Component
 * Timeline of historical training sessions
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionHistoryDetail } from '../../../../domain/trainingToday';

interface SessionHistoryTimelineProps {
  sessions: SessionHistoryDetail[];
  onSessionClick?: (session: SessionHistoryDetail) => void;
}

const DISCIPLINE_COLORS: Record<string, string> = {
  // Force disciplines
  strength: '#18E3FF',
  powerlifting: '#EC4899',
  bodybuilding: '#8B5CF6',
  strongman: '#EF4444',

  // Functional disciplines
  functional: '#22C55E',
  crossfit: '#F59E0B',
  hiit: '#EF4444',
  calisthenics: '#06B6D4',

  // Endurance disciplines
  running: '#10B981',
  cycling: '#3B82F6',
  swimming: '#0EA5E9',
  triathlon: '#8B5CF6',
  cardio: '#22C55E',

  // Session types (fallback)
  upper: '#06B6D4',
  lower: '#8B5CF6',
  push: '#22C55E',
  pull: '#EC4899',
  legs: '#F59E0B',
  full_body: '#18E3FF',
  mobility: '#10B981'
};

const SessionHistoryTimeline: React.FC<SessionHistoryTimelineProps> = ({
  sessions,
  onSessionClick
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRpeColor = (rpe: number) => {
    if (rpe >= 8) return '#EF4444';
    if (rpe >= 7) return '#22C55E';
    return '#18E3FF';
  };

  const formatMetric = (session: SessionHistoryDetail) => {
    if (session.primaryMetric && session.primaryMetricUnit) {
      if (session.primaryMetricUnit === 'kg') {
        return `${Math.round(session.primaryMetric)}kg volume`;
      } else if (session.primaryMetricUnit === 'km') {
        return `${session.primaryMetric.toFixed(1)}km`;
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {sessions.map((session, index) => {
        const discipline = session.discipline || session.type;
        const color = DISCIPLINE_COLORS[discipline] || '#18E3FF';
        const primaryMetric = formatMetric(session);

        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.01, x: 4 }}
            onClick={() => onSessionClick?.(session)}
          >
            <GlassCard
              className="p-5 cursor-pointer"
              style={{
                background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${color} 8%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.05)`,
                border: `2px solid color-mix(in srgb, ${color} 20%, transparent)`
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GlowIcon icon="Dumbbell" color={color} size="small" />
                  <div>
                    <div className="text-white font-semibold capitalize">
                      {session.discipline || session.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-white/60">{formatDate(session.date)}</div>
                  </div>
                </div>

                {session.completed ? (
                  <div className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      color: '#22C55E'
                    }}
                  >
                    Complété
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#EF4444'
                    }}
                  >
                    Incomplet
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">Durée</div>
                  <div className="text-lg font-bold text-white">{session.duration}min</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">RPE</div>
                  <div className="text-lg font-bold" style={{ color: getRpeColor(session.rpeAverage) }}>
                    {session.rpeAverage > 0 ? session.rpeAverage.toFixed(1) : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">Exercices</div>
                  <div className="text-lg font-bold text-white">
                    {session.exercisesCompleted}/{session.exercisesTotal}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 mb-1">
                    {primaryMetric ? 'Métrique' : 'Lieu'}
                  </div>
                  <div className="text-sm font-semibold text-white/90">
                    {primaryMetric || session.location || 'N/A'}
                  </div>
                </div>
              </div>

              {/* RPE Bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(session.rpeAverage / 10) * 100}%`,
                    background: getRpeColor(session.rpeAverage),
                    boxShadow: `0 0 8px ${getRpeColor(session.rpeAverage)}60`
                  }}
                />
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SessionHistoryTimeline;
