/**
 * Training Progression Insights Service
 * Manages AI-powered progression insights from GPT-5-mini
 * Calls training-progression-analyzer edge function and manages cache
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';

export type ProgressionPeriod = 'week' | 'month' | 'quarter';

export interface ProgressionInsights {
  paragraph1: string;
  paragraph2: string;
  recommendations: string[];
  generatedAt: Date;
  expiresAt: Date;
  period: ProgressionPeriod;
  sessionsAnalyzed: number;
  cached?: boolean;
}

class TrainingProgressionInsightsService {
  private cache: Map<string, { data: ProgressionInsights; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes local cache

  /**
   * Get progression insights for user and period
   * Returns cached insights if available (< 24h in DB)
   * Otherwise triggers generation via edge function
   */
  async getProgressionInsights(
    period: ProgressionPeriod,
    userId?: string,
    forceRefresh: boolean = false
  ): Promise<ProgressionInsights | null> {
    const cacheKey = `progression-insights:${userId || 'current'}:${period}`;

    // Check local cache first
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        logger.info('PROGRESSION_INSIGHTS', 'Returning local cached insights', { period });
        return cached.data;
      }
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        logger.error('PROGRESSION_INSIGHTS', 'User not authenticated');
        return null;
      }

      const targetUserId = userId || user.id;

      // Check database for recent insights (< 24h)
      const { data: existingInsights, error: fetchError } = await supabase
        .from('training_progression_insights')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('period', period)
        .gte('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        logger.error('PROGRESSION_INSIGHTS', 'Error fetching insights', {
          error: fetchError.message,
          period
        });
        return null;
      }

      if (existingInsights && existingInsights.content) {
        const insights = this.transformInsightsData(existingInsights, period);
        this.cache.set(cacheKey, { data: insights, timestamp: Date.now() });
        logger.info('PROGRESSION_INSIGHTS', 'Insights loaded from database', {
          period,
          cached: true
        });
        return insights;
      }

      // No recent insights found, trigger generation
      logger.info('PROGRESSION_INSIGHTS', 'No valid insights found, triggering generation', {
        period
      });
      const generated = await this.generateInsights(targetUserId, period);

      if (generated) {
        this.cache.set(cacheKey, { data: generated, timestamp: Date.now() });
      }

      return generated;

    } catch (error) {
      logger.error('PROGRESSION_INSIGHTS', 'Error getting progression insights', {
        error: error instanceof Error ? error.message : 'Unknown',
        period
      });
      return null;
    }
  }

  /**
   * Generate new insights by calling edge function
   */
  private async generateInsights(
    userId: string,
    period: ProgressionPeriod
  ): Promise<ProgressionInsights | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        logger.error('PROGRESSION_INSIGHTS', 'Supabase configuration missing');
        return null;
      }

      logger.info('PROGRESSION_INSIGHTS', 'Calling training-progression-analyzer edge function', {
        period
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/training-progression-analyzer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ userId, period })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('PROGRESSION_INSIGHTS', 'Edge function error', {
          status: response.status,
          error: errorText,
          period
        });
        return null;
      }

      const result = await response.json();

      if (result.success && result.insights) {
        logger.info('PROGRESSION_INSIGHTS', 'Insights generated successfully', {
          sessionsAnalyzed: result.sessionsAnalyzed,
          cached: result.cached,
          period
        });

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setHours(expiresAt.getHours() + 24);

        return {
          paragraph1: result.insights.paragraph1 || '',
          paragraph2: result.insights.paragraph2 || '',
          recommendations: result.insights.recommendations || [],
          generatedAt: now,
          expiresAt,
          period,
          sessionsAnalyzed: result.sessionsAnalyzed || 0,
          cached: result.cached || false
        };
      }

      logger.warn('PROGRESSION_INSIGHTS', 'Edge function returned no insights', { period });
      return null;

    } catch (error) {
      logger.error('PROGRESSION_INSIGHTS', 'Error generating insights', {
        error: error instanceof Error ? error.message : 'Unknown',
        period
      });
      return null;
    }
  }

  /**
   * Transform database insights to ProgressionInsights format
   */
  private transformInsightsData(
    dbInsights: any,
    period: ProgressionPeriod
  ): ProgressionInsights {
    const content = typeof dbInsights.content === 'string'
      ? JSON.parse(dbInsights.content)
      : dbInsights.content;

    return {
      paragraph1: content.paragraph1 || '',
      paragraph2: content.paragraph2 || '',
      recommendations: content.recommendations || [],
      generatedAt: new Date(dbInsights.generated_at),
      expiresAt: new Date(dbInsights.expires_at),
      period,
      sessionsAnalyzed: dbInsights.sessions_analyzed || 0,
      cached: true
    };
  }

  /**
   * Check if insights need refresh (expired or close to expiration)
   */
  needsRefresh(insights: ProgressionInsights | null): boolean {
    if (!insights) return true;
    const hoursUntilExpiry = (insights.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 12; // Refresh if less than 12h remaining
  }

  /**
   * Force refresh insights (bypass cache)
   */
  async refreshInsights(period: ProgressionPeriod): Promise<ProgressionInsights | null> {
    logger.info('PROGRESSION_INSIGHTS', 'Forcing refresh of progression insights', { period });
    return await this.getProgressionInsights(period, undefined, true);
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('PROGRESSION_INSIGHTS', 'Local cache cleared');
  }
}

export const trainingProgressionInsightsService = new TrainingProgressionInsightsService();
