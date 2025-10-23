/**
 * Session Analysis Service
 * Orchestrates post-session analysis using the coach-analyzer AI agent
 */

import logger from '../../lib/utils/logger';
import type { SessionPrescription, SessionFeedback, PreparerData } from '../store/trainingPipeline/types';
import type { WearableSessionMetrics, WearableAnalysis } from '../../domain/ai/trainingAiTypes';

export interface SessionAnalysisResult {
  sessionAnalysis: {
    overallPerformance: {
      score: number;
      rating: 'excellent' | 'good' | 'average' | 'needs-improvement';
      summary: string;
    };
    volumeAnalysis: {
      totalVolume: number;
      volumeEfficiency: number;
      comparedToTarget: string;
    };
    intensityAnalysis: {
      avgRPE: number;
      rpeDistribution: Record<string, number>;
      intensityZones: string;
    };
    techniqueAnalysis: {
      avgTechniqueScore: number;
      exercisesWithIssues: string[];
      recommendations: string[];
    };
  };
  exerciseBreakdown: Array<{
    exerciseId: string;
    exerciseName: string;
    performance: {
      completed: boolean;
      volumeScore: number;
      rpeScore: number;
      techniqueScore: number;
    };
    insights: string[];
    nextSessionRecommendations: string[];
  }>;
  personalizedInsights: {
    strengths: string[];
    areasToImprove: string[];
    keyTakeaways: string[];
    motivationalMessage: string;
  };
  progressionRecommendations: {
    nextSession: {
      volumeAdjustment: string;
      intensityAdjustment: string;
      focusPoints: string[];
    };
    longTerm: {
      goalAlignment: string;
      milestoneProgress: string;
      strategicAdvice: string;
    };
  };
  achievements: Array<{
    type: string;
    title: string;
    description: string;
    earned: boolean;
  }>;
  wearableAnalysis?: WearableAnalysis;
  coachRationale: string;
}

export interface AnalysisMetadata {
  agentType: string;
  modelUsed: string;
  reasoningEffort: string;
  verbosity: string;
  tokensUsed?: number;
  costUsd?: number;
  latencyMs: number;
  responseId?: string;
  cached: boolean;
}

class SessionAnalysisService {
  private static instance: SessionAnalysisService;

  private constructor() {}

  static getInstance(): SessionAnalysisService {
    if (!SessionAnalysisService.instance) {
      SessionAnalysisService.instance = new SessionAnalysisService();
    }
    return SessionAnalysisService.instance;
  }

  /**
   * Validates and enriches AI analysis with fallbacks for missing fields
   * Ensures all UI components have the data they need
   */
  private validateAndEnrichAnalysis(
    analysis: any,
    prescription: SessionPrescription,
    feedback: SessionFeedback
  ): SessionAnalysisResult {
    const warnings: string[] = [];
    const isDevMode = import.meta.env.DEV;

    if (isDevMode) {
      logger.warn('SESSION_ANALYSIS', '🔧 [DEV_MODE] Validation started - checking for missing fields', {
        receivedKeys: analysis ? Object.keys(analysis) : [],
        hasSessionAnalysis: !!analysis?.sessionAnalysis,
        hasExerciseBreakdown: !!analysis?.exerciseBreakdown,
        hasPersonalizedInsights: !!analysis?.personalizedInsights
      });
    }

    // Validate sessionAnalysis
    if (!analysis.sessionAnalysis) {
      warnings.push('Missing sessionAnalysis');
      analysis.sessionAnalysis = {};
    }

    // Validate overallPerformance
    if (!analysis.sessionAnalysis.overallPerformance) {
      warnings.push('Missing overallPerformance');
      const avgRpe = feedback.overallRpe || 7;
      const completionRate = feedback.exercises.filter(e => e.completed).length / feedback.exercises.length;
      const score = Math.round(completionRate * 100);

      if (isDevMode) {
        logger.warn('SESSION_ANALYSIS', '⚠️ [FALLBACK] Generating overallPerformance from feedback data (AI did not provide)', {
          score,
          completionRate,
          avgRpe
        });
      }

      analysis.sessionAnalysis.overallPerformance = {
        score,
        rating: score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'average' : 'needs-improvement',
        summary: `Séance complétée avec ${Math.round(completionRate * 100)}% de réussite. RPE moyen de ${avgRpe}/10.`
      };
    }

    // Validate volumeAnalysis
    if (!analysis.sessionAnalysis.volumeAnalysis) {
      warnings.push('Missing volumeAnalysis');
      const totalVolume = feedback.exercises.reduce((sum, ex) => {
        const volume = (ex.loadUsed || 0) * ex.repsActual.reduce((a, b) => a + b, 0);
        return sum + volume;
      }, 0);

      analysis.sessionAnalysis.volumeAnalysis = {
        totalVolume,
        volumeEfficiency: Math.round((totalVolume / prescription.exercises.length) * 100) / 100,
        comparedToTarget: totalVolume > 1000 ? 'Au-dessus de la cible' : 'Dans la cible'
      };
    }

    // Validate intensityAnalysis
    if (!analysis.sessionAnalysis.intensityAnalysis) {
      warnings.push('Missing intensityAnalysis');
      const avgRPE = feedback.overallRpe || 7;

      analysis.sessionAnalysis.intensityAnalysis = {
        avgRPE,
        rpeDistribution: { '6-7': 40, '8-9': 50, '10': 10 },
        intensityZones: avgRPE >= 8 ? 'Zone intense (8-10)' : 'Zone modérée (6-7)'
      };
    }

    // Validate techniqueAnalysis
    if (!analysis.sessionAnalysis.techniqueAnalysis) {
      warnings.push('Missing techniqueAnalysis');
      const avgTechnique = feedback.exercises.reduce((sum, ex) => sum + (ex.technique || 8), 0) / feedback.exercises.length;
      const issuesExercises = feedback.exercises.filter(ex => (ex.technique || 8) < 7);

      analysis.sessionAnalysis.techniqueAnalysis = {
        avgTechniqueScore: Math.round(avgTechnique * 10) / 10,
        exercisesWithIssues: issuesExercises.map(ex => prescription.exercises.find(e => e.id === ex.exerciseId)?.name || 'Exercice inconnu'),
        recommendations: issuesExercises.length > 0
          ? ['Concentrez-vous sur la forme plutôt que la charge', 'Filmez-vous pour analyser votre technique']
          : ['Excellente technique, continuez ainsi !']
      };
    }

    // Validate exerciseBreakdown
    if (!analysis.exerciseBreakdown || analysis.exerciseBreakdown.length === 0) {
      warnings.push('Missing exerciseBreakdown');
      analysis.exerciseBreakdown = feedback.exercises.map(ex => {
        const exercise = prescription.exercises.find(e => e.id === ex.exerciseId);
        return {
          exerciseId: ex.exerciseId,
          exerciseName: exercise?.name || 'Exercice inconnu',
          performance: {
            completed: ex.completed,
            volumeScore: ex.completed ? 90 : 70,
            rpeScore: ex.rpe ? Math.min(100, ex.rpe * 10) : 70,
            techniqueScore: ex.technique ? ex.technique * 10 : 80
          },
          insights: [
            ex.completed ? 'Exercice complété avec succès' : 'Exercice partiellement complété',
            `RPE de ${ex.rpe}/10`
          ],
          nextSessionRecommendations: [
            ex.completed ? 'Augmenter légèrement la charge' : 'Maintenir la charge actuelle'
          ]
        };
      });
    }

    // Validate personalizedInsights
    if (!analysis.personalizedInsights) {
      warnings.push('Missing personalizedInsights');
      const completionRate = feedback.exercises.filter(e => e.completed).length / feedback.exercises.length;

      analysis.personalizedInsights = {
        strengths: [
          completionRate >= 0.9 ? 'Excellent taux de complétion' : 'Bonne persévérance',
          'Gestion de l\'effort adaptée'
        ],
        areasToImprove: completionRate < 0.9
          ? ['Améliorer l\'endurance musculaire']
          : ['Maintenir la régularité'],
        keyTakeaways: [
          `Séance complétée à ${Math.round(completionRate * 100)}%`,
          `RPE moyen de ${feedback.overallRpe}/10`
        ],
        motivationalMessage: 'Excellent travail ! Continuez sur cette lancée pour atteindre vos objectifs.'
      };
    }

    // Validate progressionRecommendations
    if (!analysis.progressionRecommendations) {
      warnings.push('Missing progressionRecommendations');
      const avgRpe = feedback.overallRpe || 7;

      analysis.progressionRecommendations = {
        nextSession: {
          volumeAdjustment: avgRpe < 7 ? 'Augmenter le volume de 5-10%' : 'Maintenir le volume actuel',
          intensityAdjustment: avgRpe < 7 ? 'Augmenter la charge de 2.5-5kg' : 'Conserver l\'intensité',
          focusPoints: ['Maintenir la technique', 'Gérer la récupération']
        },
        longTerm: {
          goalAlignment: 'Progression régulière vers vos objectifs',
          milestoneProgress: 'Sur la bonne voie',
          strategicAdvice: 'Restez constant dans votre entraînement pour maximiser les résultats'
        }
      };
    }

    // Validate achievements
    if (!analysis.achievements || analysis.achievements.length === 0) {
      warnings.push('Missing achievements');
      const completionRate = feedback.exercises.filter(e => e.completed).length / feedback.exercises.length;

      analysis.achievements = [
        {
          type: 'completion',
          title: 'Séance Complétée',
          description: `${Math.round(completionRate * 100)}% des exercices terminés`,
          earned: completionRate >= 0.9
        },
        {
          type: 'consistency',
          title: 'Régularité',
          description: 'Une séance de plus vers vos objectifs',
          earned: true
        }
      ];
    }

    // Validate coachRationale
    if (!analysis.coachRationale) {
      warnings.push('Missing coachRationale');
      analysis.coachRationale = 'Analyse basée sur vos performances et votre ressenti pendant la séance.';
    }

    // Log validation results
    const hasAnyFallbacks = warnings.length > 0;

    if (isDevMode) {
      if (hasAnyFallbacks) {
        logger.warn('SESSION_ANALYSIS', '🔧 [DEV_MODE] ⚠️ FALLBACK DATA USED - AI Response was incomplete', {
          fallbacksApplied: warnings,
          fallbacksCount: warnings.length,
          message: 'The data you see includes COMPUTED FALLBACKS, not pure AI analysis',
          finalStructureKeys: Object.keys(analysis),
          exerciseBreakdownCount: analysis.exerciseBreakdown?.length || 0,
          achievementsCount: analysis.achievements?.length || 0
        });
      } else {
        logger.info('SESSION_ANALYSIS', '✅ [DEV_MODE] Pure AI analysis - no fallbacks needed', {
          message: 'All data came directly from GPT without any computed fallbacks',
          finalStructureKeys: Object.keys(analysis),
          exerciseBreakdownCount: analysis.exerciseBreakdown?.length || 0,
          achievementsCount: analysis.achievements?.length || 0
        });
      }
    }

    logger.info('SESSION_ANALYSIS', 'Validation completed', {
      warnings,
      fallbacksCount: warnings.length,
      hasAllRequiredFields: warnings.length === 0,
      finalStructureKeys: Object.keys(analysis),
      exerciseBreakdownCount: analysis.exerciseBreakdown?.length || 0,
      achievementsCount: analysis.achievements?.length || 0
    });

    // Log warnings if any
    if (warnings.length > 0) {
      logger.warn('SESSION_ANALYSIS', 'Applied fallbacks for missing fields', {
        warnings,
        fallbacksCount: warnings.length
      });
    }

    return analysis as SessionAnalysisResult;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 2,
    timeoutMs: number = 90000,
    isFunctionalSession: boolean = false
  ): Promise<Response> {
    let lastError: Error | null = null;

    const actualTimeout = isFunctionalSession ? 120000 : timeoutMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('SESSION_ANALYSIS', `Attempt ${attempt}/${maxRetries} - calling Edge Function`, {
          url,
          attempt,
          maxRetries,
          timeoutMs: actualTimeout,
          isFunctionalSession
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), actualTimeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        lastError = new Error(`Server error: ${response.status}`);
        logger.warn('SESSION_ANALYSIS', `Attempt ${attempt} failed with server error`, {
          status: response.status,
          willRetry: attempt < maxRetries
        });

        if (attempt < maxRetries) {
          const delayMs = 2000 * attempt;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          logger.error('SESSION_ANALYSIS', `Request timeout after ${actualTimeout}ms`, {
            attempt,
            timeoutMs: actualTimeout,
            isFunctionalSession
          });
          throw new Error(`Request timeout after ${actualTimeout}ms`);
        }

        logger.warn('SESSION_ANALYSIS', `Attempt ${attempt} failed with error`, {
          error: error instanceof Error ? error.message : String(error),
          willRetry: attempt < maxRetries
        });

        if (attempt < maxRetries) {
          const delayMs = 2000 * attempt;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  async analyzeSession(
    userId: string,
    sessionPrescription: SessionPrescription,
    sessionFeedback: SessionFeedback,
    preparerContext: PreparerData | null
  ): Promise<{ analysis: SessionAnalysisResult; metadata: AnalysisMetadata }> {
    const startTime = Date.now();

    logger.info('SESSION_ANALYSIS', 'Starting session analysis', {
      userId,
      sessionId: sessionPrescription.sessionId,
      exercisesCount: sessionPrescription.exercises?.length || 0,
      hasMainWorkout: !!(sessionPrescription as any).mainWorkout,
      hasFunctionalMetrics: !!(sessionFeedback as any).functionalMetrics
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables not configured');
      }

      const isFunctionalSession = !!(sessionFeedback as any).functionalMetrics;

      logger.info('SESSION_ANALYSIS', 'Calling coach-analyzer Edge Function with retry logic', {
        url: `${supabaseUrl}/functions/v1/training-coach-analyzer`,
        userId,
        sessionId: sessionPrescription.sessionId,
        hasAnonKey: !!supabaseAnonKey,
        isFunctionalSession
      });

      const response = await this.fetchWithRetry(
        `${supabaseUrl}/functions/v1/training-coach-analyzer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey
          },
          body: JSON.stringify({
            userId,
            sessionPrescription,
            sessionFeedback,
            preparerContext
          })
        },
        2,
        90000,
        isFunctionalSession
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SESSION_ANALYSIS', 'Coach analyzer HTTP error', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Coach analyzer failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      logger.info('SESSION_ANALYSIS', 'Coach analyzer response received', {
        success: result.success,
        hasAnalysis: !!result.data,
        cached: result.metadata?.cached,
        latencyMs: Date.now() - startTime,
        hasSessionAnalysis: !!result.data?.sessionAnalysis,
        hasExerciseBreakdown: !!result.data?.exerciseBreakdown,
        exerciseBreakdownCount: result.data?.exerciseBreakdown?.length || 0,
        hasPersonalizedInsights: !!result.data?.personalizedInsights,
        hasProgressionRecommendations: !!result.data?.progressionRecommendations,
        achievementsCount: result.data?.achievements?.length || 0
      });

      if (!result.success) {
        logger.error('SESSION_ANALYSIS', 'Analysis reported failure', {
          error: result.error,
          metadata: result.metadata
        });
        throw new Error(result.error || 'Analysis failed');
      }

      // Validate and enrich analysis structure with fallbacks
      if (!result.data) {
        logger.error('SESSION_ANALYSIS', 'Analysis data is missing from response');
        throw new Error('Invalid coach analyzer response: missing analysis data');
      }

      logger.info('SESSION_ANALYSIS', 'Starting validation and enrichment', {
        hasRawData: !!result.data,
        rawDataKeys: result.data ? Object.keys(result.data) : []
      });

      const validatedAnalysis = this.validateAndEnrichAnalysis(result.data, sessionPrescription, sessionFeedback);

      logger.info('SESSION_ANALYSIS', 'Analysis completed successfully', {
        userId,
        latencyMs: Date.now() - startTime,
        cached: result.metadata.cached,
        tokensUsed: result.metadata.tokensUsed,
        overallScore: validatedAnalysis.sessionAnalysis.overallPerformance.score,
        rating: validatedAnalysis.sessionAnalysis.overallPerformance.rating,
        validatedKeys: Object.keys(validatedAnalysis),
        exerciseBreakdownCount: validatedAnalysis.exerciseBreakdown?.length || 0,
        achievementsCount: validatedAnalysis.achievements?.length || 0
      });

      // Save analysis to database
      await this.saveAnalysisToDatabase(
        userId,
        sessionPrescription.sessionId,
        validatedAnalysis,
        result.metadata
      );

      return {
        analysis: validatedAnalysis,
        metadata: result.metadata
      };

    } catch (error) {
      const latencyMs = Date.now() - startTime;

      logger.error('SESSION_ANALYSIS', 'Analysis failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        latencyMs
      });

      throw error;
    }
  }

  /**
   * Save analysis results to Supabase database
   */
  private async saveAnalysisToDatabase(
    userId: string,
    sessionId: string,
    analysis: SessionAnalysisResult,
    metadata: AnalysisMetadata
  ): Promise<void> {
    try {
      logger.info('SESSION_ANALYSIS', 'Saving analysis to database', {
        userId,
        sessionId,
        overallScore: analysis.sessionAnalysis.overallPerformance.score,
        rating: analysis.sessionAnalysis.overallPerformance.rating
      });

      const { supabase } = await import('../supabase/client');

      // First verify the session exists in training_sessions
      const { data: sessionExists, error: checkError } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle();

      if (checkError) {
        logger.error('SESSION_ANALYSIS', 'Error checking if session exists', {
          error: checkError.message,
          sessionId
        });
        throw checkError;
      }

      if (!sessionExists) {
        logger.warn('SESSION_ANALYSIS', 'Session does not exist in training_sessions, skipping analysis save', {
          sessionId,
          userId
        });
        return;
      }

      // Save to training_session_analysis table
      const { error: analysisError } = await supabase
        .from('training_session_analysis')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          analysis_data: analysis,
          overall_score: analysis.sessionAnalysis.overallPerformance.score,
          performance_rating: analysis.sessionAnalysis.overallPerformance.rating,
          metadata: metadata
        }, {
          onConflict: 'session_id'
        });

      if (analysisError) {
        logger.error('SESSION_ANALYSIS', 'Failed to save analysis to database', {
          error: analysisError.message,
          code: analysisError.code
        });
        throw analysisError;
      }

      // Update training_sessions table
      const { error: sessionError } = await supabase
        .from('training_sessions')
        .update({
          has_ai_analysis: true,
          ai_recommendations: analysis.progressionRecommendations
        })
        .eq('id', sessionId);

      if (sessionError) {
        logger.warn('SESSION_ANALYSIS', 'Failed to update training_sessions table', {
          error: sessionError.message,
          code: sessionError.code
        });
      }

      logger.info('SESSION_ANALYSIS', 'Analysis saved to database successfully', {
        userId,
        sessionId
      });

    } catch (error) {
      logger.error('SESSION_ANALYSIS', 'Error saving analysis to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        sessionId
      });
      // Don't throw - analysis was successful, just saving failed
    }
  }

  /**
   * Analyze wearable metrics from a completed session
   * Provides insights on effort accuracy, zone compliance, and recovery impact
   */
  analyzeWearableMetrics(
    wearableMetrics: WearableSessionMetrics,
    sessionPrescription: SessionPrescription,
    sessionFeedback: SessionFeedback
  ): WearableAnalysis {
    logger.info('SESSION_ANALYSIS', 'Analyzing wearable metrics', {
      deviceName: wearableMetrics.deviceName,
      avgHeartRate: wearableMetrics.avgHeartRate,
      maxHeartRate: wearableMetrics.maxHeartRate,
      effortScore: wearableMetrics.effortScore,
      dataQuality: wearableMetrics.dataQuality
    });

    // Calculate effort accuracy by comparing RPE to HR data
    const effortAccuracy = this.calculateEffortAccuracy(
      wearableMetrics,
      sessionFeedback.overallRpe || 7
    );

    // Calculate zone compliance if prescribed zones exist
    const zoneCompliance = sessionPrescription.wearableGuidance?.recommendedZones
      ? this.calculateZoneCompliance(
          wearableMetrics,
          sessionPrescription.wearableGuidance.recommendedZones
        )
      : undefined;

    // Estimate recovery impact based on HR data
    const recoveryImpact = this.calculateRecoveryImpact(wearableMetrics);

    // Generate insights based on HR patterns
    const insights = this.generateWearableInsights(
      wearableMetrics,
      effortAccuracy,
      zoneCompliance
    );

    // Generate recommendations for future sessions
    const recommendations = this.generateWearableRecommendations(
      wearableMetrics,
      effortAccuracy,
      zoneCompliance,
      recoveryImpact
    );

    return {
      effortAccuracy,
      zoneCompliance,
      recoveryImpact,
      insights,
      recommendations
    };
  }

  private calculateEffortAccuracy(
    metrics: WearableSessionMetrics,
    rpe: number
  ): WearableAnalysis['effortAccuracy'] {
    // Estimate expected HR based on RPE (rough correlation)
    // RPE 1-3 = 50-60% max HR, RPE 4-6 = 60-75%, RPE 7-8 = 75-85%, RPE 9-10 = 85-100%
    const estimatedMaxHR = 220 - 30; // Rough estimate, assuming 30 years old
    let expectedAvgHRRange: [number, number];

    if (rpe <= 3) {
      expectedAvgHRRange = [estimatedMaxHR * 0.5, estimatedMaxHR * 0.6];
    } else if (rpe <= 6) {
      expectedAvgHRRange = [estimatedMaxHR * 0.6, estimatedMaxHR * 0.75];
    } else if (rpe <= 8) {
      expectedAvgHRRange = [estimatedMaxHR * 0.75, estimatedMaxHR * 0.85];
    } else {
      expectedAvgHRRange = [estimatedMaxHR * 0.85, estimatedMaxHR * 1.0];
    }

    const avgInRange = metrics.avgHeartRate >= expectedAvgHRRange[0] &&
                       metrics.avgHeartRate <= expectedAvgHRRange[1];

    // Calculate correlation score
    const midExpected = (expectedAvgHRRange[0] + expectedAvgHRRange[1]) / 2;
    const deviation = Math.abs(metrics.avgHeartRate - midExpected);
    const maxDeviation = estimatedMaxHR * 0.2; // 20% considered max deviation
    const correlationScore = Math.max(0, 1 - (deviation / maxDeviation));

    const score = Math.round(correlationScore * 100);
    let rating: 'excellent' | 'good' | 'moderate' | 'poor';
    let analysis: string;

    if (score >= 85) {
      rating = 'excellent';
      analysis = 'Votre effort perçu correspond parfaitement aux données cardiaques. Excellente conscience corporelle.';
    } else if (score >= 70) {
      rating = 'good';
      analysis = 'Bonne corrélation entre votre ressenti et vos données cardiaques.';
    } else if (score >= 50) {
      rating = 'moderate';
      analysis = avgInRange
        ? 'Corrélation modérée. Vous pourriez sous-estimer ou surestimer légèrement votre effort.'
        : 'Votre effort perçu ne correspond pas totalement aux données cardiaques.';
    } else {
      rating = 'poor';
      analysis = metrics.avgHeartRate < expectedAvgHRRange[0]
        ? 'Vous avez peut-être surestimé votre effort. Votre fréquence cardiaque était plus basse que prévu.'
        : 'Vous avez peut-être sous-estimé votre effort. Votre fréquence cardiaque était plus élevée que prévu.';
    }

    return {
      score,
      rating,
      analysis,
      rpeVsHrCorrelation: correlationScore
    };
  }

  private calculateZoneCompliance(
    metrics: WearableSessionMetrics,
    targetZones: string[]
  ): WearableAnalysis['zoneCompliance'] {
    const totalTime = Object.values(metrics.timeInZones).reduce((sum, time) => sum + time, 0);

    // Calculate time in target zones
    const timeInTargetZones = targetZones.reduce((sum, zone) => {
      const zoneKey = zone.toLowerCase().replace(' ', '') as keyof typeof metrics.timeInZones;
      return sum + (metrics.timeInZones[zoneKey] || 0);
    }, 0);

    const overallCompliance = totalTime > 0 ? (timeInTargetZones / totalTime) * 100 : 0;

    // Find deviations (simplified - would need session timeline for real analysis)
    const deviations: any[] = [];

    let recommendation: string;
    if (overallCompliance >= 80) {
      recommendation = 'Excellent respect des zones cibles. Continuez ainsi pour optimiser vos progrès.';
    } else if (overallCompliance >= 60) {
      recommendation = 'Bon respect des zones cibles. Essayez de rester plus concentré sur les intensités prescrites.';
    } else if (overallCompliance >= 40) {
      recommendation = 'Zones cibles partiellement respectées. Utilisez un moniteur HR en temps réel pour mieux vous ajuster.';
    } else {
      recommendation = 'Zones cibles insuffisamment respectées. Revoyez vos allures et intensités avec votre coach.';
    }

    return {
      overallCompliance,
      targetZones,
      actualDistribution: metrics.timeInZones,
      deviations,
      recommendation
    };
  }

  private calculateRecoveryImpact(
    metrics: WearableSessionMetrics
  ): WearableAnalysis['recoveryImpact'] {
    const { effortScore, avgHeartRate, maxHeartRate, durationSeconds } = metrics;

    // Calculate intensity based on effort score and HR zones
    let intensityLevel: 'light' | 'moderate' | 'hard' | 'very-hard';
    let estimatedRecoveryHours: number;

    if (effortScore >= 85) {
      intensityLevel = 'very-hard';
      estimatedRecoveryHours = 48;
    } else if (effortScore >= 70) {
      intensityLevel = 'hard';
      estimatedRecoveryHours = 36;
    } else if (effortScore >= 50) {
      intensityLevel = 'moderate';
      estimatedRecoveryHours = 24;
    } else {
      intensityLevel = 'light';
      estimatedRecoveryHours = 12;
    }

    // Adjust based on duration
    const durationMinutes = durationSeconds / 60;
    if (durationMinutes > 90) {
      estimatedRecoveryHours += 12;
    } else if (durationMinutes > 60) {
      estimatedRecoveryHours += 6;
    }

    const suggestedNextSessionDelay = estimatedRecoveryHours;

    const warnings: string[] = [];
    if (maxHeartRate > 190) {
      warnings.push('Fréquence cardiaque maximale très élevée atteinte. Assurez une récupération complète.');
    }
    if (effortScore >= 90 && durationMinutes > 60) {
      warnings.push('Séance très intense et longue. Surveillez les signes de surentraînement.');
    }

    return {
      estimatedRecoveryHours,
      intensityLevel,
      suggestedNextSessionDelay,
      warnings
    };
  }

  private generateWearableInsights(
    metrics: WearableSessionMetrics,
    effortAccuracy: WearableAnalysis['effortAccuracy'],
    zoneCompliance?: WearableAnalysis['zoneCompliance']
  ): string[] {
    const insights: string[] = [];

    // Heart rate insights
    if (metrics.avgHeartRate < 120) {
      insights.push('Séance à intensité faible/modérée, idéale pour la récupération active.');
    } else if (metrics.avgHeartRate < 150) {
      insights.push('Intensité modérée maintenue, parfait pour développer l\'endurance aérobie.');
    } else if (metrics.avgHeartRate < 170) {
      insights.push('Intensité élevée, excellent travail au seuil anaérobie.');
    } else {
      insights.push('Intensité très élevée, travail optimal pour le VO2max.');
    }

    // Effort accuracy insights
    if (effortAccuracy.rating === 'excellent' || effortAccuracy.rating === 'good') {
      insights.push('Votre perception de l\'effort est fiable, utilisez-la pour réguler vos futures séances.');
    }

    // Zone distribution insights
    const { timeInZones } = metrics;
    const totalTime = Object.values(timeInZones).reduce((sum, time) => sum + time, 0);
    const zone4And5Time = timeInZones.zone4 + timeInZones.zone5;

    if (totalTime > 0 && (zone4And5Time / totalTime) > 0.4) {
      insights.push('Plus de 40% du temps passé en zones intenses (4-5). Excellent pour la progression, surveillez la récupération.');
    }

    // Compliance insights
    if (zoneCompliance && zoneCompliance.overallCompliance >= 80) {
      insights.push('Excellent respect des zones cibles, vous maximisez l\'efficacité de votre entraînement.');
    }

    return insights;
  }

  private generateWearableRecommendations(
    metrics: WearableSessionMetrics,
    effortAccuracy: WearableAnalysis['effortAccuracy'],
    zoneCompliance: WearableAnalysis['zoneCompliance'] | undefined,
    recoveryImpact: WearableAnalysis['recoveryImpact']
  ): string[] {
    const recommendations: string[] = [];

    // Recovery recommendations
    if (recoveryImpact.intensityLevel === 'very-hard') {
      recommendations.push('Accordez-vous au moins 48h avant votre prochaine séance intense.');
      recommendations.push('Privilégiez la récupération active (marche, étirements légers) dans les 24h.');
    } else if (recoveryImpact.intensityLevel === 'hard') {
      recommendations.push('Attendez 36h avant une nouvelle séance à haute intensité.');
    }

    // Effort accuracy recommendations
    if (effortAccuracy.rating === 'poor' || effortAccuracy.rating === 'moderate') {
      recommendations.push('Pratiquez l\'écoute de votre corps en comparant régulièrement votre RPE aux données HR.');
    }

    // Zone compliance recommendations
    if (zoneCompliance && zoneCompliance.overallCompliance < 60) {
      recommendations.push('Utilisez des alertes de zones cardiaques sur votre montre pour mieux respecter les intensités.');
      recommendations.push('Consultez votre coach pour ajuster vos allures d\'entraînement.');
    }

    // Calorie recommendations
    if (metrics.caloriesBurned > 800) {
      recommendations.push('Pensez à reconstituer vos réserves énergétiques dans les 2h post-séance.');
    }

    return recommendations;
  }
}

export const sessionAnalysisService = SessionAnalysisService.getInstance();
