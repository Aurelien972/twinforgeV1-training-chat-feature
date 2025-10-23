/**
 * NextWeekPlanCard Component
 * Suggested plan for next week
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { NextWeekPlan } from '../../../../domain/trainingToday';

const NextWeekPlanCard: React.FC = () => {
  const [plan, setPlan] = useState<NextWeekPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await trainingTodayService.getNextWeekPlan();
        setPlan(data);
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, []);

  if (loading || !plan) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <GlassCard
        className="p-6 space-y-6"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 60%), rgba(255, 255, 255, 0.08)',
          border: '2px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px rgba(34, 197, 94, 0.12)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '2px solid rgba(34, 197, 94, 0.3)'
              }}
            >
              <SpatialIcon Icon={ICONS.CalendarDays} size={24} style={{ color: '#22C55E', filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Plan Semaine Prochaine</h3>
              <p className="text-white/60 text-sm">Semaine {plan.weekNumber}</p>
            </div>
          </div>
          <div className="text-3xl font-bold" style={{ color: '#22C55E' }}>
            {plan.suggestedSessions}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="text-xs text-white/60 mb-2">Jours suggérés</div>
            <div className="flex flex-wrap gap-2">
              {plan.suggestedDays.map((day, i) => (
                <div key={i} className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#22C55E'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="text-xs text-white/60 mb-2">Intensité</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Légère</span>
                <span className="font-bold text-cyan-400">{plan.intensityDistribution.light}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Modérée</span>
                <span className="font-bold text-green-400">{plan.intensityDistribution.moderate}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Intense</span>
                <span className="font-bold text-orange-400">{plan.intensityDistribution.intense}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-white mb-2">Focus prioritaire</div>
            <div className="flex flex-wrap gap-2">
              {plan.focusAreas.map((area, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    color: '#22C55E'
                  }}
                >
                  {area}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <div className="flex items-center gap-2">
              <SpatialIcon Icon={ICONS.Moon} size={16} style={{ color: '#22C55E' }} />
              <span className="text-sm text-white/80">
                {plan.restDaysRecommended} jours de repos recommandés
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default NextWeekPlanCard;
