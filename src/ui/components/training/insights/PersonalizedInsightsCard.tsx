/**
 * PersonalizedInsightsCard Component
 * AI-generated insights highlighting strengths and areas for improvement
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionFeedback, SessionPrescription, PreparerData } from '../../../../system/store/trainingPipeline/types';
import type { SessionAnalysisResult } from '../../../../system/services/sessionAnalysisService';
import logger from '../../../../lib/utils/logger';

interface PersonalizedInsightsCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  preparerData: PreparerData | null;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

const PersonalizedInsightsCard: React.FC<PersonalizedInsightsCardProps> = ({
  sessionFeedback,
  sessionPrescription,
  preparerData,
  stepColor,
  aiAnalysis,
}) => {
  useEffect(() => {
    logger.info('PERSONALIZED_INSIGHTS_CARD', 'Component rendered', {
      hasAiAnalysis: !!aiAnalysis,
      hasPersonalizedInsights: !!aiAnalysis?.personalizedInsights,
      strengthsCount: aiAnalysis?.personalizedInsights?.strengths?.length || 0,
      areasToImproveCount: aiAnalysis?.personalizedInsights?.areasToImprove?.length || 0,
      keyTakeawaysCount: aiAnalysis?.personalizedInsights?.keyTakeaways?.length || 0,
      hasMotivationalMessage: !!aiAnalysis?.personalizedInsights?.motivationalMessage
    });
  }, [aiAnalysis]);
  // Generate insights based on performance patterns
  const generateInsights = () => {
    const insights: string[] = [];

    // Check if user performed better in first half
    const firstHalfExercises = sessionFeedback.exercises.slice(0, Math.ceil(sessionFeedback.exercises.length / 2));
    const secondHalfExercises = sessionFeedback.exercises.slice(Math.ceil(sessionFeedback.exercises.length / 2));

    const firstHalfAvgRpe = firstHalfExercises.reduce((sum, ex) => sum + (ex.rpe || 0), 0) / firstHalfExercises.length;
    const secondHalfAvgRpe = secondHalfExercises.reduce((sum, ex) => sum + (ex.rpe || 0), 0) / secondHalfExercises.length;

    if (firstHalfAvgRpe < secondHalfAvgRpe - 1) {
      insights.push("Tu es plus performant en début de séance. Considère placer les exercices les plus importants au début.");
    } else if (secondHalfAvgRpe < firstHalfAvgRpe - 1) {
      insights.push("Excellente endurance ! Tu maintiens ton intensité jusqu'à la fin de la séance.");
    }

    // Check consistency
    const rpeVariance = sessionFeedback.exercises.reduce((variance, ex) => {
      const diff = (ex.rpe || 0) - sessionFeedback.overallRpe;
      return variance + (diff * diff);
    }, 0) / sessionFeedback.exercises.length;

    if (rpeVariance < 2) {
      insights.push("Tu as une excellente régularité d'effort sur tous les exercices !");
    }

    // Check if energy level matched performance
    if (preparerData) {
      if (preparerData.energyLevel >= 8 && sessionFeedback.overallRpe >= 8) {
        insights.push("Ton énergie élevée t'a permis de tout donner. Continue à écouter ton corps !");
      } else if (preparerData.energyLevel <= 5 && sessionFeedback.overallRpe <= 7) {
        insights.push("Malgré une énergie faible, tu as bien géré ton effort. Excellent ajustement !");
      }
    }

    // Default insight if none generated
    if (insights.length === 0) {
      insights.push("Performance solide sur l'ensemble de la séance. Continue sur cette lancée !");
    }

    return insights;
  };

  // Generate strengths
  const generateStrengths = () => {
    const strengths: Array<{ text: string; icon: any; color: string }> = [];

    // All exercises completed
    const completionRate = sessionFeedback.exercises.filter(ex => ex.completed).length / sessionFeedback.exercises.length;
    if (completionRate === 1) {
      strengths.push({
        text: "100% de complétion - Tu as terminé tous les exercices !",
        icon: ICONS.CheckCircle,
        color: '#22C55E',
      });
    }

    // Good technique
    const avgTechnique = sessionFeedback.exercises.reduce((sum, ex) => sum + (ex.technique || 0), 0) / sessionFeedback.exercises.length;
    if (avgTechnique >= 8) {
      strengths.push({
        text: `Technique excellente (${avgTechnique.toFixed(1)}/10) - Qualité avant tout !`,
        icon: ICONS.Award,
        color: '#F59E0B',
      });
    }

    // Optimal RPE
    if (sessionFeedback.overallRpe >= 7 && sessionFeedback.overallRpe <= 8) {
      strengths.push({
        text: "RPE optimal (7-8/10) - Parfait pour progresser durablement",
        icon: ICONS.Target,
        color: '#3B82F6',
      });
    }

    // High enjoyment
    if (sessionFeedback.enjoyment >= 8) {
      strengths.push({
        text: `Plaisir élevé (${sessionFeedback.enjoyment}/10) - Le meilleur ingrédient pour la consistance !`,
        icon: ICONS.Smile,
        color: '#EC4899',
      });
    }

    // Default strength if none
    if (strengths.length === 0) {
      strengths.push({
        text: "Tu as complété ta séance - C'est déjà une victoire !",
        icon: ICONS.Trophy,
        color: '#22C55E',
      });
    }

    return strengths;
  };

  // Generate areas for improvement
  const generateImprovements = () => {
    const improvements: Array<{ text: string; icon: any; color: string }> = [];

    // Low technique
    const avgTechnique = sessionFeedback.exercises.reduce((sum, ex) => sum + (ex.technique || 0), 0) / sessionFeedback.exercises.length;
    if (avgTechnique < 7 && avgTechnique > 0) {
      improvements.push({
        text: "Concentre-toi sur la technique plutôt que la charge pour éviter les blessures",
        icon: ICONS.AlertCircle,
        color: '#F59E0B',
      });
    }

    // Very high RPE
    if (sessionFeedback.overallRpe >= 9) {
      improvements.push({
        text: "RPE très élevé - Pense à réduire légèrement l'intensité pour récupérer",
        icon: ICONS.TrendingDown,
        color: '#EF4444',
      });
    }

    // Low enjoyment
    if (sessionFeedback.enjoyment < 6) {
      improvements.push({
        text: "Essayons de varier les exercices pour plus de plaisir et d'engagement",
        icon: ICONS.RefreshCw,
        color: '#8B5CF6',
      });
    }

    // Incomplete exercises
    const incompletedCount = sessionFeedback.exercises.filter(ex => !ex.completed).length;
    if (incompletedCount > 0) {
      improvements.push({
        text: `${incompletedCount} exercice(s) non terminé(s) - Ajustons la durée ou l'intensité`,
        icon: ICONS.AlertTriangle,
        color: '#F59E0B',
      });
    }

    return improvements;
  };

  // Use AI data if available, otherwise use local calculations
  const insights = aiAnalysis?.personalizedInsights?.keyTakeaways?.length
    ? aiAnalysis.personalizedInsights.keyTakeaways
    : generateInsights();

  const strengths = aiAnalysis?.personalizedInsights?.strengths?.length
    ? aiAnalysis.personalizedInsights.strengths.map((text, idx) => ({
        text,
        icon: [ICONS.CheckCircle, ICONS.Award, ICONS.Target, ICONS.Smile, ICONS.Trophy][idx % 5],
        color: ['#22C55E', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'][idx % 5],
      }))
    : generateStrengths();

  const improvements = aiAnalysis?.personalizedInsights?.areasToImprove?.length
    ? aiAnalysis.personalizedInsights.areasToImprove.map((text, idx) => ({
        text,
        icon: [ICONS.AlertCircle, ICONS.TrendingDown, ICONS.RefreshCw, ICONS.AlertTriangle][idx % 4],
        color: ['#F59E0B', '#EF4444', '#8B5CF6', '#F59E0B'][idx % 4],
      }))
    : generateImprovements();

  const motivationalMessage = aiAnalysis?.personalizedInsights?.motivationalMessage;

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
            Icon={ICONS.Sparkles}
            size={24}
            style={{
              color: stepColor,
              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`,
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">Insights Personnalisés</h3>
          <p className="text-white/60 text-sm">Analyse de tes patterns</p>
        </div>
        {aiAnalysis && (
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
        )}
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl flex items-start gap-3"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, color-mix(in srgb, ${stepColor} 8%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.04)
              `,
              border: `1px solid color-mix(in srgb, ${stepColor} 15%, transparent)`,
            }}
          >
            <GlowIcon icon="Lightbulb" color={stepColor} size="small" glowIntensity={35} />
            <p className="text-white/80 text-sm leading-relaxed flex-1">{insight}</p>
          </motion.div>
        ))}
      </div>

      {/* Strengths */}
      <div className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <GlowIcon icon="ThumbsUp" color="#22C55E" size="small" glowIntensity={40} />
          <h4 className="text-white font-semibold">Tes Points Forts</h4>
        </div>
        <div className="space-y-2">
          {strengths.map((strength, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-3 rounded-lg flex items-center gap-3"
              style={{
                background: `color-mix(in srgb, ${strength.color} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${strength.color} 20%, transparent)`,
              }}
            >
              <SpatialIcon
                Icon={strength.icon}
                size={18}
                style={{
                  color: strength.color,
                  filter: `drop-shadow(0 0 8px ${strength.color}40)`,
                }}
              />
              <p className="text-white/80 text-sm flex-1">{strength.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement (only if any) */}
      {improvements.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <GlowIcon icon="TrendingUp" color="#F59E0B" size="small" glowIntensity={40} />
            <h4 className="text-white font-semibold">Axes d'Amélioration</h4>
          </div>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 rounded-lg flex items-center gap-3"
                style={{
                  background: `color-mix(in srgb, ${improvement.color} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${improvement.color} 20%, transparent)`,
                }}
              >
                <SpatialIcon
                  Icon={improvement.icon}
                  size={18}
                  style={{
                    color: improvement.color,
                    filter: `drop-shadow(0 0 8px ${improvement.color}40)`,
                  }}
                />
                <p className="text-white/80 text-sm flex-1">{improvement.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Motivational Message */}
      {motivationalMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-6"
        >
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(24, 227, 255, 0.12) 0%, transparent 60%),
                rgba(255, 255, 255, 0.06)
              `,
              border: '2px solid rgba(24, 227, 255, 0.3)',
              boxShadow: '0 4px 16px rgba(24, 227, 255, 0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <GlowIcon icon="MessageCircle" color="#18E3FF" size="small" glowIntensity={50} />
              <h4 className="text-white font-semibold">Message du Coach IA</h4>
            </div>
            <p className="text-white/90 text-sm leading-relaxed italic">
              "{motivationalMessage}"
            </p>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
};

export default PersonalizedInsightsCard;
