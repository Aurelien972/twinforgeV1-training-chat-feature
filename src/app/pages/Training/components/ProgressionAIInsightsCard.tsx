/**
 * ProgressionAIInsightsCard Component
 * Displays AI-generated progression insights from GPT-5-mini
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../ui/cards/GlassCard';
import SpatialIcon from '../../../../ui/icons/SpatialIcon';
import { ICONS } from '../../../../ui/icons/registry';
import { useProgressionInsights, useRefreshProgressionInsights } from '../../../../hooks/useProgressionInsights';
import type { ProgressionPeriod } from '../../../../system/services/trainingProgressionInsightsService';

interface ProgressionAIInsightsCardProps {
  period: ProgressionPeriod;
}

const ProgressionAIInsightsCard: React.FC<ProgressionAIInsightsCardProps> = ({ period }) => {
  const { data: insights, isLoading, error } = useProgressionInsights(period);
  const refreshMutation = useRefreshProgressionInsights();

  const handleRefresh = () => {
    refreshMutation.mutate(period);
  };

  if (isLoading) {
    return (
      <GlassCard
        className="p-8"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #8B5CF6 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          borderColor: 'color-mix(in srgb, #8B5CF6 25%, transparent)'
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10"></div>
            <div className="flex-1">
              <div className="h-5 bg-white/10 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-white/5 rounded"></div>
            <div className="h-4 bg-white/5 rounded"></div>
            <div className="h-4 bg-white/5 rounded w-5/6"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error || !insights) {
    return null;
  }

  const hoursUntilExpiry = Math.floor((insights.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
  const canRefresh = hoursUntilExpiry < 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        className="p-8 relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, #8B5CF6 12%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, #3B82F6 8%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: '2px solid color-mix(in srgb, #8B5CF6 30%, transparent)',
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.3),
            0 0 40px color-mix(in srgb, #8B5CF6 15%, transparent),
            inset 0 2px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-16 h-16 rounded-xl flex items-center justify-center relative"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                  linear-gradient(135deg, color-mix(in srgb, #8B5CF6 35%, transparent), color-mix(in srgb, #8B5CF6 25%, transparent))
                `,
                border: '2px solid color-mix(in srgb, #8B5CF6 45%, transparent)',
                boxShadow: '0 4px 20px color-mix(in srgb, #8B5CF6 30%, transparent)'
              }}
              animate={{
                boxShadow: [
                  '0 4px 20px color-mix(in srgb, #8B5CF6 30%, transparent)',
                  '0 6px 30px color-mix(in srgb, #8B5CF6 40%, transparent)',
                  '0 4px 20px color-mix(in srgb, #8B5CF6 30%, transparent)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <SpatialIcon
                Icon={ICONS.Sparkles}
                size={28}
                style={{
                  color: '#A78BFA',
                  filter: 'drop-shadow(0 0 12px rgba(167, 139, 250, 0.6))'
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  opacity: 0.6
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 0.3, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1" style={{ letterSpacing: '-0.01em' }}>
                Analyse IA de votre Progression
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">
                  {insights.sessionsAnalyzed} sessions analysées
                </span>
                <span className="text-white/40">•</span>
                <span className="text-sm text-white/60">
                  par GPT-5-mini
                </span>
              </div>
            </div>
          </div>

          {canRefresh && (
            <motion.button
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-lg"
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                opacity: refreshMutation.isPending ? 0.5 : 1
              }}
            >
              <SpatialIcon
                Icon={ICONS.RefreshCw}
                size={18}
                style={{ color: '#A78BFA' }}
              />
            </motion.button>
          )}
        </div>

        {/* Paragraph 1 - Analyse */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <SpatialIcon Icon={ICONS.TrendingUp} size={16} style={{ color: '#60A5FA' }} />
            </div>
            <h4 className="text-base font-semibold text-white/90">État de votre progression</h4>
          </div>
          <p className="text-white/80 leading-relaxed text-base">
            {insights.paragraph1}
          </p>
        </div>

        {/* Paragraph 2 - Recommandations */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}
            >
              <SpatialIcon Icon={ICONS.Target} size={16} style={{ color: '#A78BFA' }} />
            </div>
            <h4 className="text-base font-semibold text-white/90">Recommandations personnalisées</h4>
          </div>
          <p className="text-white/80 leading-relaxed text-base">
            {insights.paragraph2}
          </p>
        </div>

        {/* Recommendations List */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div
            className="rounded-xl p-5 space-y-3"
            style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SpatialIcon Icon={ICONS.Lightbulb} size={16} style={{ color: '#4ADE80' }} />
              <span className="text-sm font-semibold text-white/90">Actions à prioriser</span>
            </div>
            {insights.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-3"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <SpatialIcon Icon={ICONS.CheckCircle} size={14} style={{ color: '#4ADE80' }} />
                </div>
                <span className="text-white/80 text-sm leading-relaxed">{rec}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-6 pt-4 flex items-center justify-between text-xs text-white/50"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <span>
            Généré {insights.cached ? 'et mis en cache' : ''} il y a {hoursUntilExpiry > 24 ? Math.floor(hoursUntilExpiry / 24) + 'j' : hoursUntilExpiry + 'h'}
          </span>
          {!canRefresh && (
            <span className="flex items-center gap-1.5">
              <SpatialIcon Icon={ICONS.Shield} size={12} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              Analyse valide 24h
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ProgressionAIInsightsCard;
