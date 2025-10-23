/**
 * ExerciseAnalysisCard Component
 * Detailed analysis highlighting best/hardest exercises
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import GlowIcon from '../GlowIcon';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { SessionFeedback, SessionPrescription, ExerciseFeedback } from '../../../../system/store/trainingPipeline/types';
import type { SessionAnalysisResult } from '../../../../system/services/sessionAnalysisService';
import { calculateExerciseVolume } from '../../../../utils/loadUtils';
import logger from '../../../../lib/utils/logger';

interface ExerciseAnalysisCardProps {
  sessionFeedback: SessionFeedback;
  sessionPrescription: SessionPrescription;
  stepColor: string;
  aiAnalysis?: SessionAnalysisResult | null;
}

const ExerciseAnalysisCard: React.FC<ExerciseAnalysisCardProps> = ({
  sessionFeedback,
  sessionPrescription,
  stepColor,
  aiAnalysis,
}) => {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const isEnduranceSession = !!(sessionPrescription as any).mainWorkout || !!(sessionPrescription as any).discipline;

  useEffect(() => {
    logger.info('EXERCISE_ANALYSIS_CARD', 'Component rendered', {
      hasAiAnalysis: !!aiAnalysis,
      hasExerciseBreakdown: !!aiAnalysis?.exerciseBreakdown,
      exerciseBreakdownCount: aiAnalysis?.exerciseBreakdown?.length || 0,
      feedbackExercisesCount: sessionFeedback.exercises?.length || 0,
      isEnduranceSession
    });
  }, [aiAnalysis, sessionFeedback, isEnduranceSession]);

  // Find best exercise (lowest RPE with completed status and good technique)
  const findBestExercise = () => {
    return sessionFeedback.exercises
      .filter(ex => ex.completed && (ex.technique || 0) >= 7)
      .sort((a, b) => {
        const scoreA = (a.rpe || 10) - ((a.technique || 0) * 0.5);
        const scoreB = (b.rpe || 10) - ((b.technique || 0) * 0.5);
        return scoreA - scoreB;
      })[0];
  };

  // Find hardest exercise (highest RPE)
  const findHardestExercise = () => {
    return sessionFeedback.exercises
      .filter(ex => ex.completed)
      .sort((a, b) => (b.rpe || 0) - (a.rpe || 0))[0];
  };

  // Find exercise with most volume
  const findHighestVolumeExercise = () => {
    return sessionFeedback.exercises
      .map(ex => ({
        ...ex,
        volume: calculateExerciseVolume(ex.repsActual, ex.loadUsed),
      }))
      .sort((a, b) => b.volume - a.volume)[0];
  };

  const getExerciseDetails = (exerciseId: string) => {
    return sessionPrescription.exercises.find(ex => ex.id === exerciseId);
  };

  const bestExercise = findBestExercise();
  const hardestExercise = findHardestExercise();
  const highestVolumeExercise = findHighestVolumeExercise();

  // For endurance sessions, display blocks from AI analysis
  if (isEnduranceSession && aiAnalysis?.exerciseBreakdown) {
    return (
      <GlassCard className="space-y-4" style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${stepColor} 10%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${stepColor} 20%, transparent)`,
      }}>
        <div className="flex items-center gap-3 mb-4">
          <GlowIcon icon="ListChecks" color={stepColor} size="medium" glowIntensity={40} />
          <div>
            <h3 className="text-xl font-bold text-white">Analyse par Bloc</h3>
            <p className="text-white/60 text-sm">Performance de chaque phase de la séance</p>
          </div>
        </div>

        <div className="space-y-3">
          {aiAnalysis.exerciseBreakdown.map((block, index) => (
            <motion.div
              key={block.exerciseId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-all"
              style={{
                background: block.performance.completed
                  ? `rgba(34, 197, 94, 0.1)`
                  : `rgba(239, 68, 68, 0.1)`,
                border: block.performance.completed
                  ? `1px solid rgba(34, 197, 94, 0.2)`
                  : `1px solid rgba(239, 68, 68, 0.2)`,
              }}
              onClick={() => setExpandedExercise(
                expandedExercise === block.exerciseId ? null : block.exerciseId
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-lg">{block.exerciseName}</h4>
                    {block.performance.completed && (
                      <span className="text-green-400">✓</span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm text-white/60">
                    <span>Score: {block.performance.volumeScore}%</span>
                    <span>RPE: {block.performance.rpeScore}/10</span>
                  </div>
                </div>
                <SpatialIcon
                  Icon={expandedExercise === block.exerciseId ? ICONS.ChevronUp : ICONS.ChevronDown}
                  size={20}
                  style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                />
              </div>

              <AnimatePresence>
                {expandedExercise === block.exerciseId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="space-y-2">
                        {block.insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-blue-400 text-sm">•</span>
                            <span className="text-white/80 text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                      {block.nextSessionRecommendations.length > 0 && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <div className="text-xs font-semibold text-white/60 mb-1">Prochaine séance</div>
                          {block.nextSessionRecommendations.map((rec, i) => (
                            <div key={i} className="text-sm text-white/80">{rec}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    );
  }

  // Force session view (original)
  const analyses = [
    {
      id: 'best',
      title: '⭐ Exercice Star',
      description: 'Meilleure performance technique',
      feedback: bestExercise,
      color: '#22C55E',
      icon: 'Star' as const,
      emoji: '🌟',
    },
    {
      id: 'hardest',
      title: '💪 Plus Difficile',
      description: 'RPE le plus élevé',
      feedback: hardestExercise,
      color: '#EF4444',
      icon: 'Flame' as const,
      emoji: '🔥',
    },
    {
      id: 'volume',
      title: '🏋️ Volume Champion',
      description: 'Plus gros volume levé',
      feedback: highestVolumeExercise,
      color: '#8B5CF6',
      icon: 'Weight' as const,
      emoji: '💎',
    },
  ];

  const handleToggleExpand = (id: string) => {
    setExpandedExercise(expandedExercise === id ? null : id);
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
            Icon={ICONS.TrendingUp}
            size={24}
            style={{
              color: stepColor,
              filter: `drop-shadow(0 0 12px color-mix(in srgb, ${stepColor} 70%, transparent))`,
            }}
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Analyse Par Exercice</h3>
          <p className="text-white/60 text-sm">Tes performances clés</p>
        </div>
      </div>

      {/* Exercise Analysis Cards */}
      <div className="space-y-3">
        {analyses.map((analysis, index) => {
          if (!analysis.feedback) return null;

          const exerciseDetails = getExerciseDetails(analysis.feedback.exerciseId);
          if (!exerciseDetails) return null;

          const isExpanded = expandedExercise === analysis.id;

          return (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className="rounded-xl cursor-pointer transition-all duration-300"
                onClick={() => handleToggleExpand(analysis.id)}
                style={{
                  background: `
                    radial-gradient(circle at 30% 20%, color-mix(in srgb, ${analysis.color} 12%, transparent) 0%, transparent 60%),
                    rgba(255, 255, 255, 0.06)
                  `,
                  border: `2px solid color-mix(in srgb, ${analysis.color} ${isExpanded ? '40' : '20'}%, transparent)`,
                  boxShadow: isExpanded
                    ? `0 4px 20px rgba(0, 0, 0, 0.25), 0 0 32px color-mix(in srgb, ${analysis.color} 25%, transparent)`
                    : `0 2px 12px rgba(0, 0, 0, 0.15)`,
                }}
              >
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${analysis.color} 15%, transparent)`,
                        border: `1.5px solid color-mix(in srgb, ${analysis.color} 30%, transparent)`,
                      }}
                    >
                      <GlowIcon icon={analysis.icon} color={analysis.color} size="small" glowIntensity={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm mb-1">{analysis.title}</div>
                      <div className="text-white/60 text-xs mb-1">{analysis.description}</div>
                      <div className="text-white font-bold truncate">{exerciseDetails.name}</div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SpatialIcon Icon={ICONS.ChevronDown} size={20} style={{ color: analysis.color }} />
                  </motion.div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.25, ease: [0.4, 0.0, 0.2, 1] },
                        opacity: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }
                      }}
                      style={{
                        overflow: 'hidden',
                        willChange: 'height, opacity'
                      }}
                    >
                      <div
                        className="px-4 pb-4 space-y-3 pt-2"
                        style={{
                          borderTop: `1px solid color-mix(in srgb, ${analysis.color} 20%, transparent)`,
                        }}
                      >
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Sets/Reps */}
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div className="text-xs text-white/50 mb-1">Séries/Reps</div>
                            <div className="text-white font-semibold text-sm">
                              {analysis.feedback.setsCompleted} × {exerciseDetails.reps}
                            </div>
                          </div>

                          {/* Load */}
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div className="text-xs text-white/50 mb-1">Charge</div>
                            <div className="text-white font-semibold text-sm">
                              {Array.isArray(analysis.feedback.loadUsed)
                                ? `${Math.max(...analysis.feedback.loadUsed)}kg (max)`
                                : `${analysis.feedback.loadUsed || 0}kg`}
                            </div>
                          </div>

                          {/* RPE */}
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div className="text-xs text-white/50 mb-1">RPE</div>
                            <div className="text-white font-semibold text-sm">{analysis.feedback.rpe}/10</div>
                          </div>

                          {/* Technique */}
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div className="text-xs text-white/50 mb-1">Technique</div>
                            <div className="text-white font-semibold text-sm">
                              {analysis.feedback.technique || '-'}/10
                            </div>
                          </div>
                        </div>

                        {/* Volume if applicable */}
                        {analysis.id === 'volume' && (
                          <div
                            className="p-3 rounded-lg"
                            style={{
                              background: `color-mix(in srgb, ${analysis.color} 8%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${analysis.color} 20%, transparent)`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white/70 text-sm">Volume Total</span>
                              <span
                                className="text-lg font-bold"
                                style={{
                                  color: analysis.color,
                                  textShadow: `0 0 10px ${analysis.color}40`,
                                }}
                              >
                                {(highestVolumeExercise as any).volume}kg
                              </span>
                            </div>
                          </div>
                        )}

                        {/* AI-Powered Insights and Recommendations */}
                        {aiAnalysis && aiAnalysis.exerciseBreakdown && (() => {
                          const aiExercise = aiAnalysis.exerciseBreakdown.find(
                            ex => ex.exerciseId === analysis.feedback.exerciseId
                          );

                          if (!aiExercise) return null;

                          return (
                            <>
                              {/* AI Performance Scores */}
                              {(aiExercise.performance.volumeScore || aiExercise.performance.rpeScore || aiExercise.performance.techniqueScore) && (
                                <div
                                  className="p-3 rounded-lg"
                                  style={{
                                    background: 'rgba(24, 227, 255, 0.05)',
                                    border: '1px solid rgba(24, 227, 255, 0.15)',
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <SpatialIcon Icon={ICONS.Sparkles} size={14} style={{ color: '#18E3FF' }} />
                                    <span className="text-xs font-semibold text-white/90">Scores IA</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                      <div className="text-xs text-white/50 mb-1">Volume</div>
                                      <div className="text-white font-bold text-sm">{aiExercise.performance.volumeScore}%</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-white/50 mb-1">RPE</div>
                                      <div className="text-white font-bold text-sm">{aiExercise.performance.rpeScore}%</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-white/50 mb-1">Technique</div>
                                      <div className="text-white font-bold text-sm">{aiExercise.performance.techniqueScore}%</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* AI Insights */}
                              {aiExercise.insights && aiExercise.insights.length > 0 && (
                                <div
                                  className="p-3 rounded-lg"
                                  style={{
                                    background: 'rgba(24, 227, 255, 0.05)',
                                    border: '1px solid rgba(24, 227, 255, 0.15)',
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <SpatialIcon Icon={ICONS.Sparkles} size={14} style={{ color: '#18E3FF' }} />
                                    <span className="text-xs font-semibold text-white/90">Insights IA</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {aiExercise.insights.map((insight, idx) => (
                                      <li key={idx} className="text-white/70 text-xs flex items-start gap-2">
                                        <span className="text-[#18E3FF] mt-0.5">•</span>
                                        <span>{insight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* AI Next Session Recommendations */}
                              {aiExercise.nextSessionRecommendations && aiExercise.nextSessionRecommendations.length > 0 && (
                                <div
                                  className="p-3 rounded-lg"
                                  style={{
                                    background: 'rgba(24, 227, 255, 0.05)',
                                    border: '1px solid rgba(24, 227, 255, 0.15)',
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <SpatialIcon Icon={ICONS.ArrowRight} size={14} style={{ color: '#18E3FF' }} />
                                    <span className="text-xs font-semibold text-white/90">Prochaine séance</span>
                                  </div>
                                  <ul className="space-y-1">
                                    {aiExercise.nextSessionRecommendations.map((rec, idx) => (
                                      <li key={idx} className="text-white/70 text-xs flex items-start gap-2">
                                        <span className="text-[#18E3FF] mt-0.5">→</span>
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default ExerciseAnalysisCard;
