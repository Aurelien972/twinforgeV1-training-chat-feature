/**
 * TechniqueAnalysisCard Component
 * Displays AI-powered technique analysis with issues and recommendations
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionAnalysisResult } from '../../../../system/services/sessionAnalysisService';

interface TechniqueAnalysisCardProps {
  aiAnalysis: SessionAnalysisResult;
  stepColor: string;
}

const TechniqueAnalysisCard: React.FC<TechniqueAnalysisCardProps> = ({
  aiAnalysis,
  stepColor,
}) => {
  // GUARD: Check if analysis and techniqueAnalysis exist
  if (!aiAnalysis?.sessionAnalysis?.techniqueAnalysis) {
    return (
      <GlassCard
        className="space-y-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <SpatialIcon Icon={ICONS.Info} size={24} style={{ color: stepColor }} />
          <div>
            <h3 className="text-xl font-semibold text-white">Analyse Technique</h3>
            <p className="text-white/60 text-sm">Données insuffisantes</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-white/70 mb-2">Analyse technique non disponible</p>
          <p className="text-white/50 text-sm">L'analyse détaillée nécessite plus de données d'exercices</p>
        </div>
      </GlassCard>
    );
  }

  const techniqueAnalysis = aiAnalysis.sessionAnalysis.techniqueAnalysis;

  // Calculate technique level
  const gettechniqueLevel = (score: number) => {
    if (score >= 9) return { label: 'Excellente', color: '#22C55E', emoji: '🌟' };
    if (score >= 8) return { label: 'Très Bonne', color: '#10B981', emoji: '✨' };
    if (score >= 7) return { label: 'Bonne', color: '#3B82F6', emoji: '👍' };
    if (score >= 6) return { label: 'Correcte', color: '#F59E0B', emoji: '⚠️' };
    return { label: 'À Améliorer', color: '#EF4444', emoji: '🎯' };
  };

  const techniqueLevel = gettechniqueLevel(techniqueAnalysis.avgTechniqueScore);
  const hasIssues = techniqueAnalysis.exercisesWithIssues.length > 0;

  return (
    <GlassCard
      className="space-y-6"
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
        `,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 35%, transparent) 0%, transparent 60%),
              rgba(255, 255, 255, 0.12)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
            boxShadow: `
              0 4px 16px color-mix(in srgb, ${stepColor} 30%, transparent),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
          }}
        >
          <SpatialIcon
            Icon={ICONS.Target}
            size={24}
            style={{
              color: stepColor,
              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`,
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">Analyse Technique</h3>
          <p className="text-white/60 text-sm">Qualité d'exécution</p>
        </div>
        <div
          className="px-3 py-1 rounded-full flex items-center gap-1.5"
          style={{
            background: 'rgba(24, 227, 255, 0.1)',
            border: '1px solid rgba(24, 227, 255, 0.3)',
          }}
        >
          <SpatialIcon Icon={ICONS.Sparkles} size={12} style={{ color: '#18E3FF' }} />
          <span className="text-[10px] font-semibold text-[#18E3FF] uppercase tracking-wider">IA</span>
        </div>
      </div>

      {/* Overall Technique Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div
          className="p-6 rounded-xl text-center"
          style={{
            background: `
              radial-gradient(circle at 50% 30%, color-mix(in srgb, ${techniqueLevel.color} 15%, transparent) 0%, transparent 70%),
              rgba(255, 255, 255, 0.06)
            `,
            border: `2px solid color-mix(in srgb, ${techniqueLevel.color} 30%, transparent)`,
            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2), 0 0 32px color-mix(in srgb, ${techniqueLevel.color} 25%, transparent)`,
          }}
        >
          <div className="text-4xl mb-2">{techniqueLevel.emoji}</div>
          <div className="text-5xl font-bold mb-2" style={{ color: techniqueLevel.color }}>
            {techniqueAnalysis.avgTechniqueScore.toFixed(1)}
            <span className="text-2xl text-white/60">/10</span>
          </div>
          <div className="text-lg font-semibold text-white mb-1">{techniqueLevel.label}</div>
          <div className="text-sm text-white/60">Qualité Moyenne de la Séance</div>
        </div>
      </motion.div>

      {/* Exercises with Issues */}
      {hasIssues && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <GlowIcon icon="AlertTriangle" color="#F59E0B" size="small" glowIntensity={40} />
            <h4 className="text-white font-semibold">Exercices à Surveiller</h4>
          </div>
          <div className="space-y-2">
            {techniqueAnalysis.exercisesWithIssues.map((exercise, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-3 rounded-lg flex items-center gap-3"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <SpatialIcon
                  Icon={ICONS.AlertCircle}
                  size={18}
                  style={{
                    color: '#F59E0B',
                    filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))',
                  }}
                />
                <p className="text-white/80 text-sm flex-1">{exercise}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {techniqueAnalysis.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasIssues ? 0.4 + techniqueAnalysis.exercisesWithIssues.length * 0.1 : 0.3 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <GlowIcon icon="Lightbulb" color={stepColor} size="small" glowIntensity={40} />
            <h4 className="text-white font-semibold">Recommandations</h4>
          </div>
          <div className="space-y-2">
            {techniqueAnalysis.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 rounded-lg flex items-start gap-3"
                style={{
                  background: `color-mix(in srgb, ${stepColor} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
                }}
              >
                <SpatialIcon
                  Icon={ICONS.CheckCircle}
                  size={18}
                  style={{
                    color: stepColor,
                    filter: `drop-shadow(0 0 8px color-mix(in srgb, ${stepColor} 40%, transparent))`,
                  }}
                />
                <p className="text-white/80 text-sm flex-1 leading-relaxed">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Perfect Technique Message */}
      {!hasIssues && techniqueAnalysis.avgTechniqueScore >= 9 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl text-center"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.15)',
          }}
        >
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-white font-semibold mb-1">Technique Exemplaire !</p>
          <p className="text-white/70 text-sm">
            Continue à maintenir cette qualité d'exécution. Tu minimises les risques de blessure et maximises tes résultats.
          </p>
        </motion.div>
      )}
    </GlassCard>
  );
};

export default TechniqueAnalysisCard;
