/**
 * QuickHistoryCard Component
 * Displays last 3 training sessions compactly
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { trainingTodayService } from '../../../../system/services/trainingTodayService';
import type { QuickHistoryItem } from '../../../../domain/trainingToday';
import { TRAINING_COLORS } from '../../../theme/trainingColors';

const TRAINING_COLOR = TRAINING_COLORS.history;

const SESSION_TYPE_LABELS: Record<string, string> = {
  full_body: 'Full Body',
  upper: 'Upper Body',
  lower: 'Lower Body',
  push: 'Push',
  pull: 'Pull',
  legs: 'Jambes',
  cardio: 'Cardio',
  mobility: 'Mobilité'
};

const QuickHistoryCard: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<QuickHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyData = await trainingTodayService.getQuickHistory();
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading quick history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays <= 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getPerformanceColor = (indicator: string): string => {
    if (indicator === 'good') return '#22C55E';
    if (indicator === 'moderate') return '#F59E0B';
    return '#EF4444';
  };

  const getRpeColor = (rpe: number): string => {
    if (rpe >= 7 && rpe <= 8.5) return '#22C55E';
    if (rpe < 7 || rpe > 9) return '#EF4444';
    return '#F59E0B';
  };

  if (loading) {
    return (
      <GlassCard className="p-6" style={{ minHeight: '240px' }}>
        <div className="text-white/60 text-center">Chargement de l'historique...</div>
      </GlassCard>
    );
  }

  if (history.length === 0) {
    return (
      <GlassCard
        className="p-6 text-center space-y-4"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`
        }}
      >
        <SpatialIcon
          Icon={ICONS.Calendar}
          size={48}
          style={{ color: TRAINING_COLOR, opacity: 0.5, margin: '0 auto' }}
        />
        <div>
          <h4 className="text-white font-semibold mb-1">Aucune séance enregistrée</h4>
          <p className="text-white/60 text-sm">Lancez votre première séance pour commencer</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <GlassCard
        className="p-6 space-y-4"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${TRAINING_COLOR} 10%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.08)`,
          border: `2px solid color-mix(in srgb, ${TRAINING_COLOR} 20%, transparent)`,
          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 24px color-mix(in srgb, ${TRAINING_COLOR} 15%, transparent)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <GlowIcon icon="History" color={TRAINING_COLOR} size="small" />
            <h3 className="text-lg font-bold text-white">Historique Récent</h3>
          </div>
          <button
            onClick={() => navigate('/training?tab=progression')}
            className="text-sm font-medium hover:underline"
            style={{ color: TRAINING_COLOR }}
          >
            Voir tout
          </button>
        </div>

        {/* History Items */}
        <div className="space-y-3">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className="p-4 rounded-lg cursor-pointer transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: getPerformanceColor(item.performanceIndicator),
                      boxShadow: `0 0 8px ${getPerformanceColor(item.performanceIndicator)}60`
                    }}
                  />
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {SESSION_TYPE_LABELS[item.type] || item.type}
                    </div>
                    <div className="text-white/50 text-xs">{getRelativeDate(item.date)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-white/50 text-xs">Durée</div>
                    <div className="text-white font-semibold text-sm">{item.duration}min</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/50 text-xs">RPE</div>
                    <div
                      className="font-bold text-sm"
                      style={{ color: getRpeColor(item.rpeAverage) }}
                    >
                      {item.rpeAverage.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* RPE Bar */}
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.rpeAverage / 10) * 100}%`,
                    background: getRpeColor(item.rpeAverage),
                    boxShadow: `0 0 8px ${getRpeColor(item.rpeAverage)}60`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default QuickHistoryCard;