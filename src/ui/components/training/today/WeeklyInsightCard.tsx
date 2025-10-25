/**
 * Weekly Insight Card Component
 * Displays weekly progress, priority today, and cycle phase information
 * Used in Step 1 to guide user's training decision
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import GlassCard from '../../../cards/GlassCard';
import { useConditionalAnimation } from '../../../../lib/motion/useConditionalAnimation';

interface WeeklyProgressData {
  sessionsThisWeek: number;
  currentWeekVolume: number;
  intensityAverage: number;
}

interface PriorityTodayData {
  suggestedDiscipline: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface CyclePhaseData {
  phase: 'accumulation' | 'intensification' | 'deload' | 'realization';
  weekInPhase: number;
  recommendation: string;
}

interface WeeklyInsightCardProps {
  weeklyProgress?: WeeklyProgressData;
  priorityToday?: PriorityTodayData;
  cyclePhase?: CyclePhaseData;
  stepColor: string;
  onGenerateClick?: () => void;
  canGenerate?: boolean;
  showCTA?: boolean;
}

const WeeklyInsightCard: React.FC<WeeklyInsightCardProps> = ({
  weeklyProgress,
  priorityToday,
  cyclePhase,
  stepColor,
  onGenerateClick,
  canGenerate = true,
  showCTA = false
}) => {
  const shouldAnimate = useConditionalAnimation();

  const hasInsightsData = weeklyProgress || priorityToday || cyclePhase;

  const getPhaseColor = (phase?: string) => {
    switch (phase) {
      case 'accumulation':
        return '#3B82F6'; // Blue
      case 'intensification':
        return '#EF4444'; // Red
      case 'deload':
        return '#10B981'; // Green
      case 'realization':
        return '#F59E0B'; // Orange
      default:
        return stepColor;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Orange
      case 'low':
        return '#10B981'; // Green
      default:
        return stepColor;
    }
  };

  const getPhaseLabel = (phase?: string) => {
    switch (phase) {
      case 'accumulation':
        return 'Accumulation';
      case 'intensification':
        return 'Intensification';
      case 'deload':
        return 'Décharge';
      case 'realization':
        return 'Réalisation';
      default:
        return 'Non définie';
    }
  };

  return (
    <GlassCard
      className="space-y-4"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.2),
          0 0 24px color-mix(in srgb, ${stepColor} 15%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
              rgba(255, 255, 255, 0.12)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
            boxShadow: `
              0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `
          }}
        >
          <SpatialIcon
            Icon={ICONS.TrendingUp}
            size={24}
            variant="pure"
            style={{
              color: stepColor,
              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`
            }}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Vision Hebdomadaire</h3>
          <p className="text-white/60 text-sm">Votre progression cette semaine</p>
        </div>
      </div>

      {/* Weekly Progress or Empty State */}
      {!hasInsightsData ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 text-center py-6"
        >
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: `2px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
              }}
            >
              <SpatialIcon
                Icon={ICONS.TrendingUp}
                size={32}
                variant="pure"
                style={{
                  color: stepColor,
                  opacity: 0.6
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-white">Première séance de la semaine</h4>
            <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
              Vos insights hebdomadaires apparaîtront ici après votre première séance.
              Prêt à commencer votre entraînement ?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <SpatialIcon Icon={ICONS.Calendar} size={20} style={{ color: stepColor, opacity: 0.5, margin: '0 auto 8px' }} />
              <div className="text-white/40 text-xs">Séances</div>
              <div className="text-white/60 text-lg font-semibold">0</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <SpatialIcon Icon={ICONS.Activity} size={20} style={{ color: stepColor, opacity: 0.5, margin: '0 auto 8px' }} />
              <div className="text-white/40 text-xs">Volume</div>
              <div className="text-white/60 text-lg font-semibold">-</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <SpatialIcon Icon={ICONS.Zap} size={20} style={{ color: stepColor, opacity: 0.5, margin: '0 auto 8px' }} />
              <div className="text-white/40 text-xs">Intensité</div>
              <div className="text-white/60 text-lg font-semibold">-</div>
            </div>
          </div>
        </motion.div>
      ) : (
        weeklyProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <SpatialIcon Icon={ICONS.Calendar} size={18} style={{ color: '#3B82F6' }} />
                <span className="text-white/80 text-sm">Séances cette semaine</span>
              </div>
              <span className="text-xl font-bold text-white">{weeklyProgress.sessionsThisWeek}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-white/60 text-xs mb-1">Volume</div>
                <div className="text-lg font-semibold text-white">
                  {Math.round(weeklyProgress.currentWeekVolume)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-white/60 text-xs mb-1">Intensité Moy.</div>
                <div className="text-lg font-semibold text-white">
                  {weeklyProgress.intensityAverage ? weeklyProgress.intensityAverage.toFixed(1) : '0.0'}/10
                </div>
              </div>
            </div>
          </motion.div>
        )
      )}

      {/* Priority Today */}
      {hasInsightsData && priorityToday && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${getPriorityColor(priorityToday.priority)}10 0%, transparent 100%)`,
            border: `1px solid ${getPriorityColor(priorityToday.priority)}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <SpatialIcon
              Icon={ICONS.Target}
              size={20}
              style={{ color: getPriorityColor(priorityToday.priority) }}
            />
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wide">Priorité Aujourd'hui</div>
              <div className="text-lg font-semibold text-white capitalize">
                {priorityToday.suggestedDiscipline}
              </div>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{priorityToday.reasoning}</p>
        </motion.div>
      )}

      {/* Cycle Phase */}
      {hasInsightsData && cyclePhase && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${getPhaseColor(cyclePhase.phase)}10 0%, transparent 100%)`,
            border: `1px solid ${getPhaseColor(cyclePhase.phase)}30`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SpatialIcon
                Icon={ICONS.Repeat}
                size={20}
                style={{ color: getPhaseColor(cyclePhase.phase) }}
              />
              <div>
                <div className="text-xs text-white/60 uppercase tracking-wide">Phase du Cycle</div>
                <div className="text-lg font-semibold text-white">
                  {getPhaseLabel(cyclePhase.phase)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">Semaine</div>
              <div className="text-xl font-bold text-white">{cyclePhase.weekInPhase}</div>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{cyclePhase.recommendation}</p>
        </motion.div>
      )}

      {/* CTA Button - Générer ma Séance */}
      {showCTA && onGenerateClick && (
        <motion.button
          initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimate ? { delay: hasInsightsData ? 0.4 : 0.1 } : { duration: 0 }}
          onClick={onGenerateClick}
          disabled={!canGenerate}
          className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all"
          style={{
            background: canGenerate
              ? `linear-gradient(135deg, ${stepColor} 0%, color-mix(in srgb, ${stepColor} 80%, black) 100%)`
              : 'rgba(255, 255, 255, 0.1)',
            border: canGenerate ? `2px solid ${stepColor}` : '2px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            opacity: canGenerate ? 1 : 0.5,
            boxShadow: canGenerate
              ? `0 4px 16px color-mix(in srgb, ${stepColor} 40%, transparent), 0 0 24px color-mix(in srgb, ${stepColor} 20%, transparent)`
              : 'none'
          }}
          whileHover={shouldAnimate && canGenerate ? { scale: 1.02, y: -2 } : {}}
          whileTap={shouldAnimate && canGenerate ? { scale: 0.98 } : {}}
        >
          <div className="flex items-center justify-center gap-3">
            <SpatialIcon Icon={ICONS.Play} size={20} />
            <span>Générer ma Séance</span>
            <SpatialIcon Icon={ICONS.ChevronRight} size={20} />
          </div>
        </motion.button>
      )}
    </GlassCard>
  );
};

export default WeeklyInsightCard;
