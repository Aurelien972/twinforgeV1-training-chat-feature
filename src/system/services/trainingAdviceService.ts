/**
 * Training Advice Service
 * Manages AI-powered coaching insights and recommendations
 * Calls training-insights-generator edge function and manages cache
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export interface AdviceRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'volume' | 'intensity' | 'recovery' | 'technique' | 'equipment' | 'strategy';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actionLabel?: string;
  actionRoute?: string;
  reason?: string;
  disciplineSpecific?: string | null;
  disciplines?: string[];
}

export interface ProgressionTrend {
  trend: 'increasing' | 'stable' | 'decreasing';
  percentage?: number;
  comment: string;
}

export interface Imbalance {
  type: 'volume' | 'frequency' | 'zones' | 'muscle_groups';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface WeakPoint {
  exercise: string;
  issue: string;
  recommendation: string;
}

export interface NextWeekFocus {
  suggestedSessions: number;
  focusAreas: string[];
  intensityDistribution: {
    light: number;
    moderate: number;
    intense: number;
  };
  restDaysRecommended: number;
}

export interface DisciplineBreakdown {
  disciplineId: string;
  disciplineName: string;
  sessionsCount: number;
  totalVolume?: number;
  avgIntensity?: number;
  lastSessionDate?: Date;
}

export interface DisciplineComparison {
  mostActive: string;
  mostIntense: string;
  bestConsistency: string;
  recommendations: string[];
}

export interface TrainingInsights {
  summary: string;
  progressionTrends: {
    volume: ProgressionTrend;
    intensity: ProgressionTrend & { avgRPE: number };
    consistency: { percentage: number; comment: string };
  };
  imbalances: Imbalance[];
  weakPoints: WeakPoint[];
  recommendations: AdviceRecommendation[];
  nextWeekFocus: NextWeekFocus;
  generatedAt: Date;
  expiresAt: Date;
  discipline: string;
  allDisciplines?: string[];
  disciplineBreakdown?: DisciplineBreakdown[];
  disciplineComparison?: DisciplineComparison;
}

class TrainingAdviceService {
  private cache: Map<string, { data: TrainingInsights; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000;

  /**
   * Get coaching insights for user
   * Global multi-discipline analysis
   * Returns cached insights if available and not expired
   * Otherwise triggers generation via edge function
   */
  async getCoachingInsights(
    userId?: string,
    forceRefresh: boolean = false
  ): Promise<TrainingInsights | null> {
    const cacheKey = `coaching-insights:${userId || 'current'}:global`;

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        logger.info('ADVICE', 'Returning cached global insights');
        return cached.data;
      }
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        logger.error('ADVICE', 'User not authenticated');
        return null;
      }

      const targetUserId = userId || user.id;

      const { data: existingInsights, error: fetchError } = await supabase
        .from('training_insights')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('discipline', 'all')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        logger.error('ADVICE', 'Error fetching insights', { error: fetchError.message });
        return null;
      }

      if (existingInsights && existingInsights.content) {
        const insights = this.transformInsightsData(existingInsights);
        this.cache.set(cacheKey, { data: insights, timestamp: Date.now() });
        logger.info('ADVICE', 'Global insights loaded from database');
        return insights;
      }

      logger.info('ADVICE', 'No valid global insights found, triggering generation');
      const generated = await this.generateInsights(targetUserId);

      if (generated) {
        this.cache.set(cacheKey, { data: generated, timestamp: Date.now() });
      }

      return generated;

    } catch (error) {
      logger.error('ADVICE', 'Error getting coaching insights', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return null;
    }
  }

  /**
   * Generate new insights by calling edge function
   */
  private async generateInsights(userId: string): Promise<TrainingInsights | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        logger.error('ADVICE', 'Supabase configuration missing');
        return null;
      }

      logger.info('ADVICE', 'Calling training-insights-generator edge function');

      const response = await fetch(`${supabaseUrl}/functions/v1/training-insights-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('ADVICE', 'Edge function error', {
          status: response.status,
          error: errorText
        });
        return null;
      }

      const result = await response.json();

      if (result.success && result.insights) {
        logger.info('ADVICE', 'Insights generated successfully', {
          sessionsAnalyzed: result.sessionsAnalyzed
        });

        return {
          summary: result.insights.summary || '',
          progressionTrends: result.insights.progressionTrends || this.getEmptyTrends(),
          imbalances: result.insights.imbalances || [],
          weakPoints: result.insights.weakPoints || [],
          recommendations: result.insights.recommendations || [],
          nextWeekFocus: result.insights.nextWeekFocus || this.getEmptyNextWeek(),
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          discipline: 'all'
        };
      }

      logger.warn('ADVICE', 'Edge function returned no insights');
      return null;

    } catch (error) {
      logger.error('ADVICE', 'Error generating insights', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return null;
    }
  }

  /**
   * Transform database insights to TrainingInsights format
   */
  private transformInsightsData(dbInsights: any): TrainingInsights {
    const content = typeof dbInsights.content === 'string'
      ? JSON.parse(dbInsights.content)
      : dbInsights.content;

    return {
      summary: content.summary || '',
      progressionTrends: content.progressionTrends || this.getEmptyTrends(),
      imbalances: content.imbalances || [],
      weakPoints: content.weakPoints || [],
      recommendations: content.recommendations || [],
      nextWeekFocus: content.nextWeekFocus || this.getEmptyNextWeek(),
      generatedAt: new Date(dbInsights.created_at),
      expiresAt: new Date(dbInsights.expires_at),
      discipline: dbInsights.discipline || 'all',
      allDisciplines: content.allDisciplines || [],
      disciplineBreakdown: content.disciplineBreakdown || [],
      disciplineComparison: content.disciplineComparison || null
    };
  }

  /**
   * Get priority recommendations only (high priority)
   */
  getPriorityRecommendations(insights: TrainingInsights | null): AdviceRecommendation[] {
    if (!insights) return [];
    return insights.recommendations.filter(r => r.priority === 'high');
  }

  /**
   * Get recommendations by category
   */
  getRecommendationsByCategory(
    insights: TrainingInsights | null,
    category: AdviceRecommendation['category']
  ): AdviceRecommendation[] {
    if (!insights) return [];
    return insights.recommendations.filter(r => r.category === category);
  }

  /**
   * Get critical imbalances (medium and high severity)
   */
  getCriticalImbalances(insights: TrainingInsights | null): Imbalance[] {
    if (!insights) return [];
    return insights.imbalances.filter(i => i.severity === 'medium' || i.severity === 'high');
  }

  /**
   * Check if insights need refresh (expired or close to expiration)
   */
  needsRefresh(insights: TrainingInsights | null): boolean {
    if (!insights) return true;
    const hoursUntilExpiry = (insights.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24;
  }

  /**
   * Mark recommendation as helpful (for future ML improvements)
   */
  async markRecommendationHelpful(recommendationId: string, helpful: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      logger.info('ADVICE', 'Marking recommendation feedback', {
        recommendationId,
        helpful
      });

    } catch (error) {
      logger.error('ADVICE', 'Error marking recommendation', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
    }
  }

  /**
   * Get empty trends structure
   */
  private getEmptyTrends() {
    return {
      volume: { trend: 'stable' as const, comment: 'Données insuffisantes' },
      intensity: { trend: 'stable' as const, avgRPE: 7, comment: 'Données insuffisantes' },
      consistency: { percentage: 0, comment: 'Données insuffisantes' }
    };
  }

  /**
   * Get empty next week structure
   */
  private getEmptyNextWeek(): NextWeekFocus {
    return {
      suggestedSessions: 3,
      focusAreas: [],
      intensityDistribution: { light: 1, moderate: 1, intense: 1 },
      restDaysRecommended: 2
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const trainingAdviceService = new TrainingAdviceService();
