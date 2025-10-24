/**
 * Training Generation Service
 * Central orchestrator for the multi-agent training generation system
 */

import { nanoid } from 'nanoid';
import logger from '../../../lib/utils/logger';
import { supabase } from '../../supabase/client';
import {
  RateLimitError,
  TimeoutError,
  TrainingAIError
} from '../../../domain/ai/trainingAiTypes';
import type {
  AgentType,
  AgentContext,
  AgentResponse,
  GenerationState,
  GenerationProgress,
  GenerationMetrics,
  AgentMetrics,
  UserContext,
  PreparerContext,
  SessionPrescription
} from '../../../domain/ai/trainingAiTypes';
import { normalizePrescription } from '../../../utils/prescriptionNormalizer';

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

class CircuitBreaker {
  private states: Map<AgentType, CircuitBreakerState> = new Map();
  private readonly threshold = 5;
  private readonly timeout = 180000;
  private readonly halfOpenTimeout = 90000;

  async execute<T>(
    agentType: AgentType,
    fn: () => Promise<T>
  ): Promise<T> {
    const state = this.getState(agentType);

    if (state.state === 'open') {
      const timeSinceLastFailure = Date.now() - state.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        throw new Error(`Circuit breaker open for ${agentType}`);
      }
      state.state = 'half-open';
      logger.info('CIRCUIT_BREAKER', 'Transitioning to half-open', { agentType });
    }

    try {
      const result = await fn();
      this.onSuccess(agentType);
      return result;
    } catch (error) {
      this.onFailure(agentType);
      throw error;
    }
  }

  private getState(agentType: AgentType): CircuitBreakerState {
    if (!this.states.has(agentType)) {
      this.states.set(agentType, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      });
    }
    return this.states.get(agentType)!;
  }

  private onSuccess(agentType: AgentType): void {
    const state = this.getState(agentType);
    state.failures = 0;
    state.state = 'closed';
  }

  private onFailure(agentType: AgentType): void {
    const state = this.getState(agentType);
    state.failures++;
    state.lastFailureTime = Date.now();

    if (state.failures >= this.threshold) {
      state.state = 'open';
      logger.error('CIRCUIT_BREAKER', 'Circuit breaker opened', {
        agentType,
        failures: state.failures
      });
    }
  }

  getStatus(agentType: AgentType): CircuitBreakerState {
    return this.getState(agentType);
  }

  reset(agentType: AgentType): void {
    this.states.delete(agentType);
    logger.info('CIRCUIT_BREAKER', 'Circuit breaker reset', { agentType });
  }
}

// ============================================================================
// Retry with Exponential Backoff
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 1,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
};

// Check if error is retryable (only network/rate-limit errors, NOT validation errors)
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  // Schema validation errors should NOT be retried
  if (errorMessage.includes('schema validation failed')) return false;
  if (errorMessage.includes('missing') && errorMessage.includes('for competitions')) return false;
  if (errorMessage.includes('missing') && errorMessage.includes('for endurance')) return false;
  if (errorMessage.includes('missing') && errorMessage.includes('for force')) return false;
  if (errorMessage.includes('invalid prescription')) return false;

  // Network/rate-limit errors ARE retryable
  return true;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  agentType: AgentType
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;
  const totalAttempts = config.maxRetries + 1;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      logger.info('RETRY', `⚡ Starting attempt ${attempt + 1}/${totalAttempts}`, {
        agentType,
        attemptNumber: attempt + 1,
        totalAttempts,
        isRetry: attempt > 0
      });

      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('RETRY', `❌ Attempt ${attempt + 1}/${totalAttempts} FAILED`, {
        agentType,
        attemptNumber: attempt + 1,
        totalAttempts,
        errorMessage,
        errorStack: errorStack?.split('\n').slice(0, 5).join('\n'),
        isRetryable: isRetryableError(lastError)
      });

      // Don't retry if error is not retryable
      if (!isRetryableError(lastError)) {
        logger.error('RETRY', '🚫 Error is NOT retryable, failing immediately', {
          agentType,
          errorMessage,
          attemptNumber: attempt + 1
        });
        throw lastError;
      }

      if (error instanceof RateLimitError) {
        const waitTime = Math.min(delay * Math.pow(config.backoffMultiplier, attempt), config.maxDelayMs);
        logger.warn('RETRY', '⏳ Rate limit hit, retrying after delay', {
          agentType,
          attempt: attempt + 1,
          totalAttempts,
          waitTimeMs: waitTime
        });
        await sleep(waitTime);
        continue;
      }

      if (attempt < config.maxRetries) {
        const waitTime = Math.min(delay * Math.pow(config.backoffMultiplier, attempt), config.maxDelayMs);
        logger.warn('RETRY', `⏳ Retrying after ${waitTime}ms delay`, {
          agentType,
          attempt: attempt + 1,
          totalAttempts,
          waitTimeMs: waitTime,
          errorMessage
        });
        await sleep(waitTime);
      }
    }
  }

  logger.error('RETRY', `💥 All ${totalAttempts} retry attempts EXHAUSTED`, {
    agentType,
    totalAttempts,
    finalError: lastError?.message,
    finalErrorStack: lastError?.stack?.split('\n').slice(0, 5).join('\n')
  });

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 240000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// ============================================================================
// Metrics Tracking
// ============================================================================

class MetricsTracker {
  private metrics: Map<AgentType, AgentMetrics> = new Map();

  recordCall(
    agentType: AgentType,
    success: boolean,
    latencyMs: number,
    costUsd: number,
    cached: boolean
  ): void {
    if (!this.metrics.has(agentType)) {
      this.metrics.set(agentType, {
        agentType,
        totalCalls: 0,
        successRate: 0,
        avgLatencyMs: 0,
        avgCostUsd: 0,
        cacheHitRate: 0,
        errorRate: 0,
        lastUpdated: new Date()
      });
    }

    const metric = this.metrics.get(agentType)!;
    const totalCalls = metric.totalCalls + 1;
    const successCount = (metric.successRate * metric.totalCalls) + (success ? 1 : 0);
    const cacheHits = (metric.cacheHitRate * metric.totalCalls) + (cached ? 1 : 0);
    const totalLatency = (metric.avgLatencyMs * metric.totalCalls) + latencyMs;
    const totalCost = (metric.avgCostUsd * metric.totalCalls) + costUsd;

    metric.totalCalls = totalCalls;
    metric.successRate = successCount / totalCalls;
    metric.avgLatencyMs = Math.round(totalLatency / totalCalls);
    metric.avgCostUsd = totalCost / totalCalls;
    metric.cacheHitRate = cacheHits / totalCalls;
    metric.errorRate = 1 - metric.successRate;
    metric.lastUpdated = new Date();
  }

  getMetrics(agentType: AgentType): AgentMetrics | null {
    return this.metrics.get(agentType) || null;
  }

  getAllMetrics(): AgentMetrics[] {
    return Array.from(this.metrics.values());
  }

  async persistMetrics(): Promise<void> {
    const allMetrics = this.getAllMetrics();

    for (const metric of allMetrics) {
      try {
        const { error } = await supabase
          .from('training_ai_metrics')
          .upsert({
            agent_type: metric.agentType,
            total_calls: metric.totalCalls,
            success_rate: metric.successRate,
            avg_latency_ms: metric.avgLatencyMs,
            avg_cost_usd: metric.avgCostUsd,
            cache_hit_rate: metric.cacheHitRate,
            error_rate: metric.errorRate,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'agent_type'
          });

        if (error) {
          logger.error('METRICS', 'Failed to persist metrics', {
            agentType: metric.agentType,
            error
          });
        }
      } catch (error) {
        logger.error('METRICS', 'Exception persisting metrics', {
          agentType: metric.agentType,
          error
        });
      }
    }
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  private memoryCache: Map<string, { data: any; expiresAt: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expiresAt > Date.now()) {
      logger.debug('CACHE', 'Memory cache hit', { key });
      return memCached.data;
    }

    const { data, error } = await supabase
      .from('training_ai_cache')
      .select('cached_data, expires_at')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      logger.debug('CACHE', 'Cache miss', { key });
      return null;
    }

    const expiresAt = new Date(data.expires_at).getTime();
    this.memoryCache.set(key, {
      data: data.cached_data,
      expiresAt
    });

    logger.debug('CACHE', 'Database cache hit', { key });
    return data.cached_data;
  }

  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    this.memoryCache.set(key, {
      data,
      expiresAt: expiresAt.getTime()
    });

    const { error } = await supabase
      .from('training_ai_cache')
      .upsert({
        cache_key: key,
        cached_data: data,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      logger.error('CACHE', 'Failed to persist cache', { key, error });
    } else {
      logger.debug('CACHE', 'Cache set', { key, ttlSeconds });
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);

    const { error } = await supabase
      .from('training_ai_cache')
      .delete()
      .eq('cache_key', key);

    if (error) {
      logger.error('CACHE', 'Failed to invalidate cache', { key, error });
    } else {
      logger.debug('CACHE', 'Cache invalidated', { key });
    }
  }

  generateKey(prefix: string, ...parts: any[]): string {
    return `${prefix}:${parts.map(p =>
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':')}`;
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const keys = Array.from(this.memoryCache.keys()).filter(key => key.includes(pattern));
    keys.forEach(key => this.memoryCache.delete(key));

    const { error } = await supabase
      .from('training_ai_cache')
      .delete()
      .like('cache_key', `%${pattern}%`);

    if (error) {
      logger.error('CACHE', 'Failed to invalidate pattern', { pattern, error });
    } else {
      logger.debug('CACHE', 'Cache pattern invalidated', { pattern, keysDeleted: keys.length });
    }
  }

  async invalidateUserDiscipline(userId: string, discipline: string): Promise<void> {
    await this.invalidateByPattern(`${userId}:${discipline}`);
    logger.info('CACHE', 'User discipline cache invalidated', { userId, discipline });
  }
}

// ============================================================================
// Training Generation Service
// ============================================================================

export class TrainingGenerationService {
  private static instance: TrainingGenerationService;
  private circuitBreaker = new CircuitBreaker();
  private metricsTracker = new MetricsTracker();
  private cacheManager = new CacheManager();
  private progressCallbacks: Map<string, (progress: GenerationProgress) => void> = new Map();

  private constructor() {
    setInterval(() => {
      this.metricsTracker.persistMetrics();
    }, 60000);
  }

  static getInstance(): TrainingGenerationService {
    if (!TrainingGenerationService.instance) {
      TrainingGenerationService.instance = new TrainingGenerationService();
    }
    return TrainingGenerationService.instance;
  }

  onProgress(generationId: string, callback: (progress: GenerationProgress) => void): void {
    this.progressCallbacks.set(generationId, callback);
  }

  private updateProgress(generationId: string, progress: GenerationProgress): void {
    const callback = this.progressCallbacks.get(generationId);
    if (callback) {
      callback(progress);
    }
  }

  async generateTraining(
    userId: string,
    preparerContext: PreparerContext
  ): Promise<{ generationId: string; prescription: SessionPrescription }> {
    const generationId = nanoid();
    const startTime = Date.now();

    logger.info('TRAINING_GENERATION', 'Starting generation', {
      generationId,
      userId
    });

    try {
      this.updateProgress(generationId, {
        state: 'collecting-context',
        progress: 10,
        message: 'Collecte du contexte utilisateur...'
      });

      const userContext = await this.collectUserContext(userId);

      this.updateProgress(generationId, {
        state: 'generating-prescription',
        progress: 50,
        message: 'Génération de la prescription...'
      });

      const prescription = await this.generatePrescription(
        userContext,
        preparerContext,
        userId
      );

      this.updateProgress(generationId, {
        state: 'completed',
        progress: 100,
        message: 'Génération terminée!'
      });

      const totalLatency = Date.now() - startTime;

      logger.info('TRAINING_GENERATION', 'Generation completed', {
        generationId,
        totalLatencyMs: totalLatency
      });

      return { generationId, prescription };

    } catch (error) {
      this.updateProgress(generationId, {
        state: 'error',
        progress: 0,
        message: 'Erreur lors de la génération',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      logger.error('TRAINING_GENERATION', 'Generation failed', {
        generationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorDetails: error
      });

      throw error;
    } finally {
      this.progressCallbacks.delete(generationId);
    }
  }

  private async collectUserContext(userId: string): Promise<UserContext> {
    const agentType: AgentType = 'context-collector';
    const startTime = Date.now();

    try {
      return await this.circuitBreaker.execute(agentType, async () => {
        return await retryWithBackoff(async () => {
          // Call training-context-collector Edge Function
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          logger.info('TRAINING_GENERATION', 'Calling training-context-collector', {
            url: `${supabaseUrl}/functions/v1/training-context-collector`,
            userId,
            hasAnonKey: !!supabaseAnonKey
          });

          const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/training-context-collector`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify({ userId })
          }, 180000);

          if (!response.ok) {
            const errorText = await response.text();
            logger.error('TRAINING_GENERATION', 'Context collector HTTP error', {
              status: response.status,
              statusText: response.statusText,
              errorText
            });
            throw new Error(`Context collector failed: ${response.status} ${errorText}`);
          }

          const result = await response.json();

          logger.info('TRAINING_GENERATION', 'Context collector response received', {
            success: result.success,
            hasData: !!result.data,
            dataStructure: result.data ? {
              hasSummary: !!result.data.summary,
              hasKeyFactors: !!result.data.keyFactors,
              hasWarnings: !!result.data.warnings,
              hasUserContext: !!result.data.userContext
            } : null,
            cached: result.metadata?.cached
          });

          if (!result.success) {
            logger.error('TRAINING_GENERATION', 'Context collection reported failure', {
              error: result.error,
              metadata: result.metadata
            });
            throw new Error(result.error || 'Context collection failed');
          }

          // CRITICAL FIX: The response structure from context-collector is:
          // result.data = { summary, keyFactors, warnings, userContext }
          // We need to return the userContext field which contains the actual UserContext

          logger.info('TRAINING_GENERATION', 'Analyzing returned data structure', {
            resultDataKeys: result.data ? Object.keys(result.data) : [],
            hasUserContextField: result.data ? ('userContext' in result.data) : false,
            userContextType: result.data?.userContext ? typeof result.data.userContext : 'undefined'
          });

          // Track metrics
          const latencyMs = Date.now() - startTime;
          this.metricsTracker.recordCall(
            agentType,
            true,
            latencyMs,
            result.metadata.costUsd || 0,
            result.metadata.cached || false
          );

          logger.info('TRAINING_GENERATION', 'Context collected successfully', {
            userId,
            latencyMs,
            cached: result.metadata.cached,
            tokensUsed: result.metadata.tokensUsed,
            returnedStructure: {
              hasSummary: !!result.data?.summary,
              keyFactorsCount: result.data?.keyFactors?.length || 0,
              warningsCount: result.data?.warnings?.length || 0,
              hasUserContext: !!result.data?.userContext
            }
          });

          // Return the userContext field which contains the actual UserContext
          if (!result.data.userContext || typeof result.data.userContext !== 'object') {
            logger.error('TRAINING_GENERATION', 'userContext field is missing or invalid from response', {
              availableFields: result.data ? Object.keys(result.data) : [],
              hasUserContext: !!result.data?.userContext,
              userContextType: typeof result.data?.userContext,
              schemaVersion: result.data?._schema_version
            });

            // FALLBACK: If cache is invalid, retry with cache invalidation
            if (result.metadata?.cached) {
              logger.warn('TRAINING_GENERATION', 'Invalid cached data detected - will retry with fresh generation', {
                userId,
                schemaVersion: result.data?._schema_version
              });

              // Delete invalid cache and throw to trigger retry
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
              const cacheKey = `context-collector:${userId}`;

              try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(supabaseUrl, supabaseAnonKey);
                await supabase
                  .from('training_ai_cache')
                  .delete()
                  .eq('cache_key', cacheKey);
                logger.info('TRAINING_GENERATION', 'Invalid cache deleted - retry will fetch fresh data');
              } catch (cacheDeleteError) {
                logger.error('TRAINING_GENERATION', 'Failed to delete invalid cache', {
                  error: cacheDeleteError instanceof Error ? cacheDeleteError.message : 'Unknown error'
                });
              }
            }

            throw new Error('Invalid context collector response: missing or invalid userContext field');
          }

          // Additional validation: check if userContext has minimum required fields
          if (!result.data.userContext.userId) {
            logger.warn('TRAINING_GENERATION', 'userContext missing userId - injecting it', {
              userContextKeys: Object.keys(result.data.userContext),
              isFallback: result.data.userContext._fallback,
              userId
            });

            // CRITICAL FIX: Always ensure userId is present in userContext
            result.data.userContext.userId = userId;
          }

          logger.info('TRAINING_GENERATION', 'userContext validated and extracted', {
            hasUserId: !!result.data.userContext.userId,
            userId: result.data.userContext.userId,
            hasProfile: !!result.data.userContext.profile,
            hasSessions: !!result.data.userContext.sessions,
            isFallback: !!result.data.userContext._fallback
          });

          return result.data.userContext;
        }, DEFAULT_RETRY_CONFIG, agentType);
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.metricsTracker.recordCall(agentType, false, latencyMs, 0, false);

      logger.error('TRAINING_GENERATION', 'Context collection failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  private async generatePrescription(
    userContext: UserContext,
    preparerContext: PreparerContext,
    userId: string
  ): Promise<SessionPrescription> {
    const requestId = nanoid();
    const tempSport = (preparerContext as any).tempSport;
    const profileType = userContext?.profile?.preferences?.workout?.type;

    // CRITICAL FIX: tempSport from Step1 ALWAYS takes priority
    const trainingType = tempSport || profileType;

    logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Discipline resolution initiated`, {
      requestId,
      tempSportFromStep1: tempSport,
      profileDiscipline: profileType,
      resolvedTrainingType: trainingType,
      disciplineSource: tempSport ? 'step1_selector' : (profileType ? 'profile_default' : 'none'),
      userId,
      preparerContextKeys: Object.keys(preparerContext)
    });

    if (!tempSport && profileType) {
      logger.warn('TRAINING_GENERATION', `[REQ:${requestId}] ⚠️  No Step1 selection - falling back to profile`, {
        requestId,
        profileType,
        userId,
        warning: 'User did not explicitly select discipline in Step1'
      });
    }

    if (tempSport && profileType && tempSport !== profileType) {
      logger.info('TRAINING_GENERATION', `[REQ:${requestId}] ✅ Step1 discipline OVERRIDES profile`, {
        requestId,
        step1Discipline: tempSport,
        profileDiscipline: profileType,
        usingDiscipline: tempSport,
        userId,
        note: 'This is correct behavior - user explicitly selected a different discipline'
      });
    }

    if (!trainingType) {
      logger.error('TRAINING_GENERATION', `[REQ:${requestId}] ❌ NO DISCIPLINE FOUND`, {
        requestId,
        tempSport,
        profileType,
        userId,
        error: 'Neither Step1 selection nor profile discipline available - falling back to force coach'
      });
    }

    const agentType: AgentType = this.determineCoachType(trainingType);
    const startTime = Date.now();

    logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Coach determination complete`, {
      requestId,
      tempSport,
      profileWorkoutType: profileType,
      resolvedTrainingType: trainingType,
      determinedAgentType: agentType,
      disciplineSource: tempSport ? 'step1' : (profileType ? 'profile' : 'none'),
      userId,
      preparerContextSummary: {
        availableTime: preparerContext.availableTime,
        energyLevel: preparerContext.energyLevel,
        locationName: preparerContext.locationName,
        equipmentCount: preparerContext.availableEquipment?.length || 0,
        hasTempSport: !!tempSport
      }
    });

    try {
      logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Starting circuit breaker execution`, {
        requestId,
        agentType,
        userId
      });

      return await this.circuitBreaker.execute(agentType, async () => {
        logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Starting retry with backoff`, {
          requestId,
          agentType,
          maxRetries: DEFAULT_RETRY_CONFIG.maxRetries
        });

        return await retryWithBackoff(async () => {
          // Call appropriate coach Edge Function based on training type
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const edgeFunctionName = this.getEdgeFunctionName(agentType);

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Calling ${edgeFunctionName}`, {
            requestId,
            url: `${supabaseUrl}/functions/v1/${edgeFunctionName}`,
            userId,
            agentType,
            hasAnonKey: !!supabaseAnonKey,
            preparerContext: {
              availableTime: preparerContext.availableTime,
              locationName: preparerContext.locationName,
              energyLevel: preparerContext.energyLevel,
              equipmentCount: preparerContext.availableEquipment?.length
            }
          });

          const requestBody: any = {
            userId,
            userContext,
            preparerContext
          };

          // CRITICAL: For endurance coach, ALWAYS include discipline parameter
          if (agentType === 'coach-endurance') {
            requestBody.discipline = trainingType;
            logger.info('TRAINING_GENERATION', `[REQ:${requestId}] ✅ Added discipline to request body for endurance coach`, {
              requestId,
              discipline: trainingType,
              hasDiscipline: !!trainingType,
              disciplineSource: tempSport ? 'step1_tempSport' : (profileType ? 'profile' : 'none'),
              note: 'Edge function will use this as priority #1 before any fallback logic'
            });
          } else {
            logger.info('TRAINING_GENERATION', `[REQ:${requestId}] ${agentType} - no discipline parameter needed`, {
              requestId,
              agentType,
              trainingType,
              note: 'Non-endurance coach does not require explicit discipline parameter'
            });
          }

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Sending HTTP request to edge function`, {
            requestId,
            url: `${supabaseUrl}/functions/v1/${edgeFunctionName}`,
            method: 'POST',
            bodySize: JSON.stringify(requestBody).length,
            hasUserContext: !!userContext,
            hasPreparerContext: !!preparerContext
          });

          const fetchStartTime = Date.now();
          const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/${edgeFunctionName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify(requestBody)
          }, 240000);
          const fetchLatency = Date.now() - fetchStartTime;

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] HTTP response received`, {
            requestId,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            fetchLatencyMs: fetchLatency,
            contentType: response.headers.get('content-type')
          });

          if (!response.ok) {
            const errorText = await response.text();
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] ${edgeFunctionName} HTTP error`, {
              requestId,
              status: response.status,
              statusText: response.statusText,
              errorText,
              errorTextLength: errorText.length,
              agentType,
              fetchLatencyMs: fetchLatency
            });
            throw new Error(`${edgeFunctionName} failed: ${response.status} ${errorText}`);
          }

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Parsing JSON response`, {
            requestId,
            agentType
          });

          const result = await response.json();

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] JSON parsed successfully`, {
            requestId,
            hasResult: !!result,
            resultKeys: result ? Object.keys(result) : [],
            success: result?.success,
            hasData: !!result?.data,
            hasMetadata: !!result?.metadata,
            dataKeys: result?.data ? Object.keys(result.data) : []
          });

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] ${edgeFunctionName} response received`, {
            requestId,
            success: result.success,
            hasPrescription: !!result.data,
            cached: result.metadata?.cached,
            prescriptionStructure: result.data ? {
              sessionId: result.data.sessionId,
              sessionName: result.data.sessionName,
              type: result.data.type,
              category: result.data.category,
              discipline: result.data.discipline,
              durationTarget: result.data.durationTarget,
              exercisesCount: result.data.exercises?.length,
              mainWorkoutCount: result.data.mainWorkout?.length,
              hasWarmup: !!result.data.warmup,
              hasCooldown: !!result.data.cooldown,
              hasMetrics: !!result.data.metrics,
              allDataKeys: Object.keys(result.data)
            } : null,
            metadataStructure: result.metadata ? {
              cached: result.metadata.cached,
              tokensUsed: result.metadata.tokensUsed,
              costUsd: result.metadata.costUsd,
              latencyMs: result.metadata.latencyMs,
              model: result.metadata.model
            } : null
          });

          if (!result.success) {
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Prescription generation reported failure`, {
              requestId,
              error: result.error,
              errorType: typeof result.error,
              metadata: result.metadata,
              agentType,
              edgeFunctionName
            });
            throw new Error(result.error || 'Prescription generation failed');
          }

          // LOG RAW DATA BEFORE VALIDATION
          console.log('\n🔍 [DEBUG-VALIDATION] RAW PRESCRIPTION DATA RECEIVED:');
          console.log(JSON.stringify(result.data, null, 2).substring(0, 2000));

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] 📦 Raw prescription data received`, {
            requestId,
            agentType,
            dataKeys: result.data ? Object.keys(result.data) : [],
            dataSize: result.data ? JSON.stringify(result.data).length : 0,
            rawDataPreview: result.data ? JSON.stringify(result.data).substring(0, 500) : null
          });

          // Validate prescription structure
          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Starting prescription structure validation`, {
            requestId,
            hasData: !!result.data,
            agentType
          });

          if (!result.data) {
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Prescription data is missing from response`, {
              requestId,
              resultKeys: Object.keys(result),
              agentType
            });
            throw new Error('Invalid coach response: missing prescription data');
          }

          // Handle different prescription formats
          // Force/Power: uses 'exercises' array
          // Endurance: uses 'mainWorkout' array
          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Validating prescription format`, {
            requestId,
            agentType,
            category: result.data.category,
            type: result.data.type,
            dataKeys: Object.keys(result.data)
          });

          const hasExercises = result.data.exercises && Array.isArray(result.data.exercises);
          const hasMainWorkout = result.data.mainWorkout && Array.isArray(result.data.mainWorkout);
          const hasStations = result.data.stations && Array.isArray(result.data.stations);

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Prescription array fields check`, {
            requestId,
            hasExercises,
            hasMainWorkout,
            hasStations,
            exercisesType: typeof result.data.exercises,
            mainWorkoutType: typeof result.data.mainWorkout,
            stationsType: typeof result.data.stations,
            exercisesIsArray: Array.isArray(result.data.exercises),
            mainWorkoutIsArray: Array.isArray(result.data.mainWorkout),
            stationsIsArray: Array.isArray(result.data.stations),
            exercisesLength: result.data.exercises?.length,
            mainWorkoutLength: result.data.mainWorkout?.length,
            stationsLength: result.data.stations?.length,
            competitionFormat: result.data.competitionFormat
          });

          if (!hasExercises && !hasMainWorkout && !hasStations) {
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Prescription is missing exercises/mainWorkout/stations array`, {
              requestId,
              dataKeys: Object.keys(result.data),
              agentType,
              category: result.data.category,
              type: result.data.type,
              competitionFormat: result.data.competitionFormat,
              hasExercises,
              hasMainWorkout,
              hasStations,
              exercisesValue: result.data.exercises,
              mainWorkoutValue: result.data.mainWorkout,
              stationsValue: result.data.stations,
              fullDataStructure: JSON.stringify(Object.keys(result.data))
            });
            throw new Error('Invalid prescription: missing exercises, mainWorkout, or stations array');
          }

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Prescription format validated successfully`, {
            requestId,
            hasExercises,
            hasMainWorkout,
            hasStations,
            exercisesCount: hasExercises ? result.data.exercises.length : 0,
            mainWorkoutCount: hasMainWorkout ? result.data.mainWorkout.length : 0,
            stationsCount: hasStations ? result.data.stations.length : 0,
            agentType,
            category: result.data.category,
            type: result.data.type
          });

          // Additional schema validation
          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Performing schema validation`, {
            requestId,
            agentType
          });

          const schemaErrors: string[] = [];

          // Common required fields
          console.log('\n🔍 [DEBUG-VALIDATION] Checking common required fields...');

          if (!result.data.sessionId) {
            const error = 'Missing sessionId';
            schemaErrors.push(error);
            console.log(`  ❌ ${error}`);
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Field validation error`, {
              requestId,
              field: 'sessionId',
              error,
              receivedValue: result.data.sessionId,
              receivedType: typeof result.data.sessionId
            });
          } else {
            console.log(`  ✅ sessionId: ${result.data.sessionId}`);
          }

          if (!result.data.type) {
            const error = 'Missing type';
            schemaErrors.push(error);
            console.log(`  ❌ ${error}`);
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Field validation error`, {
              requestId,
              field: 'type',
              error,
              receivedValue: result.data.type,
              receivedType: typeof result.data.type
            });
          } else {
            console.log(`  ✅ type: ${result.data.type}`);
          }

          if (!result.data.category) {
            const error = 'Missing category';
            schemaErrors.push(error);
            console.log(`  ❌ ${error}`);
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Field validation error`, {
              requestId,
              field: 'category',
              error,
              receivedValue: result.data.category,
              receivedType: typeof result.data.category
            });
          } else {
            console.log(`  ✅ category: ${result.data.category}`);
          }

          if (!result.data.durationTarget || typeof result.data.durationTarget !== 'number') {
            const error = 'Missing or invalid durationTarget';
            schemaErrors.push(error);
            console.log(`  ❌ ${error}`);
            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Field validation error`, {
              requestId,
              field: 'durationTarget',
              error,
              receivedValue: result.data.durationTarget,
              receivedType: typeof result.data.durationTarget
            });
          } else {
            console.log(`  ✅ durationTarget: ${result.data.durationTarget}`);
          }

          // Competitions-specific validation
          if (agentType === 'coach-competitions' && hasStations) {
            console.log('\n🏆 [DEBUG-VALIDATION] Validating COMPETITIONS-specific fields...');

            if (!result.data.competitionFormat) {
              const error = 'Missing competitionFormat for competitions';
              schemaErrors.push(error);
              console.log(`  ❌ ${error}`);
              logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Competition field error`, {
                requestId,
                field: 'competitionFormat',
                error,
                receivedValue: result.data.competitionFormat
              });
            } else {
              console.log(`  ✅ competitionFormat: ${result.data.competitionFormat}`);
            }

            if (!result.data.warmup) {
              const error = 'Missing warmup for competitions';
              schemaErrors.push(error);
              console.log(`  ❌ ${error}`);
              logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Competition field error`, {
                requestId,
                field: 'warmup',
                error,
                receivedValue: result.data.warmup,
                receivedType: typeof result.data.warmup
              });
            } else {
              console.log(`  ✅ warmup: ${JSON.stringify(result.data.warmup).substring(0, 100)}...`);
            }

            if (!result.data.cooldown) {
              const error = 'Missing cooldown for competitions';
              schemaErrors.push(error);
              console.log(`  ❌ ${error}`);
              logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Competition field error`, {
                requestId,
                field: 'cooldown',
                error,
                receivedValue: result.data.cooldown,
                receivedType: typeof result.data.cooldown
              });
            } else {
              console.log(`  ✅ cooldown: ${JSON.stringify(result.data.cooldown).substring(0, 100)}...`);
            }

            // Validate stations array structure
            console.log(`\n  📋 Validating ${result.data.stations.length} stations...`);
            result.data.stations.forEach((station: any, idx: number) => {
              console.log(`\n  Station [${idx}]:`);

              if (!station.id) {
                const error = `station[${idx}] missing id`;
                schemaErrors.push(error);
                console.log(`    ❌ ${error}`);
                logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Station validation error`, {
                  requestId,
                  stationIndex: idx,
                  field: 'id',
                  error,
                  stationData: station
                });
              } else {
                console.log(`    ✅ id: ${station.id}`);
              }

              if (!station.name) {
                const error = `station[${idx}] missing name`;
                schemaErrors.push(error);
                console.log(`    ❌ ${error}`);
                logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Station validation error`, {
                  requestId,
                  stationIndex: idx,
                  field: 'name',
                  error,
                  stationData: station
                });
              } else {
                console.log(`    ✅ name: ${station.name}`);
              }

              if (!station.stationType) {
                const error = `station[${idx}] missing stationType`;
                schemaErrors.push(error);
                console.log(`    ❌ ${error}`);
                logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Station validation error`, {
                  requestId,
                  stationIndex: idx,
                  field: 'stationType',
                  error,
                  stationData: station
                });
              } else {
                console.log(`    ✅ stationType: ${station.stationType}`);
              }

              // Log full station for first one
              if (idx === 0) {
                console.log(`    🔍 Full station[0] data:`);
                console.log(JSON.stringify(station, null, 2));
              }
            });

            logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Competition stations validated`, {
              requestId,
              stationsCount: result.data.stations.length,
              competitionFormat: result.data.competitionFormat,
              hasWarmup: !!result.data.warmup,
              hasCooldown: !!result.data.cooldown,
              firstStationSample: result.data.stations[0]
            });
          }

          // Endurance-specific validation
          if (agentType === 'coach-endurance' && hasMainWorkout) {
            if (!result.data.discipline) schemaErrors.push('Missing discipline for endurance');
            if (!result.data.warmup) schemaErrors.push('Missing warmup for endurance');
            if (!result.data.cooldown) schemaErrors.push('Missing cooldown for endurance');

            // Validate mainWorkout array structure
            result.data.mainWorkout.forEach((item: any, idx: number) => {
              if (!item.id) schemaErrors.push(`mainWorkout[${idx}] missing id`);
              if (!item.name) schemaErrors.push(`mainWorkout[${idx}] missing name`);
              if (!item.duration && typeof item.duration !== 'number') {
                schemaErrors.push(`mainWorkout[${idx}] missing or invalid duration`);
              }
            });
          }

          // Force-specific validation
          if (agentType === 'coach-force' && hasExercises) {
            if (!result.data.warmup) schemaErrors.push('Missing warmup for force');
            if (!result.data.cooldown) schemaErrors.push('Missing cooldown for force');
            if (!result.data.coachRationale) schemaErrors.push('Missing coachRationale for force');

            // Validate exercises array structure
            result.data.exercises.forEach((ex: any, idx: number) => {
              if (!ex.id) schemaErrors.push(`exercise[${idx}] missing id`);
              if (!ex.name) schemaErrors.push(`exercise[${idx}] missing name`);
              if (!ex.sets || typeof ex.sets !== 'number') {
                schemaErrors.push(`exercise[${idx}] missing or invalid sets`);
              }
              // Must have either reps or repsProgression
              const hasReps = typeof ex.reps === 'number' && ex.reps > 0;
              const hasRepsProgression = Array.isArray(ex.repsProgression) && ex.repsProgression.length > 0;
              if (!hasReps && !hasRepsProgression) {
                schemaErrors.push(`exercise[${idx}] missing both reps and repsProgression`);
              }
            });
          }

          if (schemaErrors.length > 0) {
            console.log('\n💥 [DEBUG-VALIDATION] VALIDATION FAILED!');
            console.log(`   Total errors: ${schemaErrors.length}`);
            console.log('   Errors list:');
            schemaErrors.forEach((err, idx) => {
              console.log(`     ${idx + 1}. ${err}`);
            });

            console.log('\n   📊 Full prescription data keys received:');
            console.log('   ', Object.keys(result.data).join(', '));

            console.log('\n   🔍 Expected vs Received:');
            console.log('   Expected fields:', ['sessionId', 'type', 'category', 'durationTarget', 'competitionFormat', 'warmup', 'cooldown', 'stations']);
            console.log('   Received fields:', Object.keys(result.data));
            console.log('   Missing fields:', ['sessionId', 'type', 'category', 'durationTarget', 'competitionFormat', 'warmup', 'cooldown', 'stations'].filter(f => !Object.keys(result.data).includes(f)));

            logger.error('TRAINING_GENERATION', `[REQ:${requestId}] ❌ Schema validation FAILED`, {
              requestId,
              agentType,
              totalErrors: schemaErrors.length,
              errors: schemaErrors,
              prescriptionStructure: {
                sessionId: result.data.sessionId,
                type: result.data.type,
                category: result.data.category,
                hasExercises,
                hasMainWorkout,
                hasStations,
                competitionFormat: result.data.competitionFormat,
                hasWarmup: !!result.data.warmup,
                hasCooldown: !!result.data.cooldown,
                stationsCount: result.data.stations?.length,
                dataKeys: Object.keys(result.data),
                receivedDataSample: JSON.stringify(result.data).substring(0, 500)
              }
            });
            throw new Error(`Schema validation failed: ${schemaErrors.join(', ')}`);
          }

          console.log('\n✅ [DEBUG-VALIDATION] All validations PASSED!');

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Schema validation passed`, {
            requestId,
            agentType
          });

          // Track metrics
          const latencyMs = Date.now() - startTime;
          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Recording metrics`, {
            requestId,
            latencyMs,
            agentType,
            success: true,
            cached: result.metadata?.cached || false,
            costUsd: result.metadata?.costUsd || 0
          });

          this.metricsTracker.recordCall(
            agentType,
            true,
            latencyMs,
            result.metadata?.costUsd || 0,
            result.metadata?.cached || false
          );

          // FIXED: Use conditional access for exercises/mainWorkout/stations
          const workoutItemsCount = hasExercises
            ? result.data.exercises.length
            : (hasMainWorkout ? result.data.mainWorkout.length : (hasStations ? result.data.stations.length : 0));

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Prescription generated successfully`, {
            requestId,
            userId,
            latencyMs,
            fetchLatencyMs: fetchLatency,
            cached: result.metadata?.cached,
            tokensUsed: result.metadata?.tokensUsed,
            costUsd: result.metadata?.costUsd,
            model: result.metadata?.model,
            agentType,
            prescription: {
              sessionId: result.data.sessionId,
              sessionName: result.data.sessionName,
              type: result.data.type,
              category: result.data.category,
              discipline: result.data.discipline,
              competitionFormat: result.data.competitionFormat,
              durationTarget: result.data.durationTarget,
              distanceTarget: result.data.distanceTarget,
              workoutItemsCount,
              hasExercises,
              hasMainWorkout,
              hasStations,
              hasWarmup: !!result.data.warmup,
              hasCooldown: !!result.data.cooldown
            }
          });

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Normalizing prescription before return`, {
            requestId,
            dataKeys: Object.keys(result.data),
            agentType,
            hasMainWorkout: !!result.data.mainWorkout,
            hasExercises: !!result.data.exercises
          });

          const normalizedPrescription = normalizePrescription(result.data);

          logger.info('TRAINING_GENERATION', `[REQ:${requestId}] Prescription normalized and returning`, {
            requestId,
            normalizedExercisesCount: normalizedPrescription.exercises?.length || 0,
            hasMainWorkoutPreserved: !!normalizedPrescription.mainWorkout,
            agentType
          });

          return normalizedPrescription;
        }, DEFAULT_RETRY_CONFIG, agentType);
      });
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      this.metricsTracker.recordCall(agentType, false, latencyMs, 0, false);

      logger.error('TRAINING_GENERATION', `[REQ:${requestId}] Prescription generation failed`, {
        requestId,
        userId,
        agentType,
        trainingType,
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorDetails: error,
        preparerContextSummary: {
          availableTime: preparerContext.availableTime,
          energyLevel: preparerContext.energyLevel,
          locationName: preparerContext.locationName
        }
      });

      throw error;
    }
  }

  getCircuitBreakerStatus(agentType: AgentType) {
    return this.circuitBreaker.getStatus(agentType);
  }

  resetCircuitBreaker(agentType: AgentType): void {
    this.circuitBreaker.reset(agentType);
  }

  getMetrics(agentType?: AgentType): AgentMetrics | AgentMetrics[] {
    if (agentType) {
      return this.metricsTracker.getMetrics(agentType) || {
        agentType,
        totalCalls: 0,
        successRate: 0,
        avgLatencyMs: 0,
        avgCostUsd: 0,
        cacheHitRate: 0,
        errorRate: 0,
        lastUpdated: new Date()
      };
    }
    return this.metricsTracker.getAllMetrics();
  }

  async invalidateCache(key: string): Promise<void> {
    await this.cacheManager.invalidate(key);
  }

  private determineCoachType(trainingType?: string): AgentType {
    if (!trainingType) {
      logger.warn('TRAINING_GENERATION', 'No training type provided, defaulting to coach-force', {
        trainingType: 'undefined'
      });
      return 'coach-force';
    }

    const normalizedType = trainingType.toLowerCase();

    const enduranceTypes = ['running', 'cycling', 'swimming', 'triathlon', 'cardio'];
    if (enduranceTypes.includes(normalizedType)) {
      logger.info('TRAINING_GENERATION', 'Matched endurance discipline', {
        trainingType,
        normalizedType,
        matchedCoach: 'coach-endurance',
        enduranceTypes
      });
      return 'coach-endurance';
    }

    const functionalTypes = ['crossfit', 'hiit', 'functional', 'circuit'];
    if (functionalTypes.includes(normalizedType)) {
      logger.info('TRAINING_GENERATION', 'Matched functional discipline', {
        trainingType,
        normalizedType,
        matchedCoach: 'coach-functional',
        functionalTypes
      });
      return 'coach-functional';
    }

    const calisthenicsTypes = ['calisthenics', 'street-workout', 'streetlifting', 'freestyle'];
    if (calisthenicsTypes.includes(normalizedType)) {
      logger.info('TRAINING_GENERATION', 'Matched calisthenics discipline', {
        trainingType,
        normalizedType,
        matchedCoach: 'coach-calisthenics',
        calisthenicsTypes
      });
      return 'coach-calisthenics';
    }

    const competitionTypes = ['hyrox', 'deka-fit', 'deka-mile', 'deka-strong'];
    if (competitionTypes.includes(normalizedType)) {
      logger.info('TRAINING_GENERATION', 'Matched competitions discipline', {
        trainingType,
        normalizedType,
        matchedCoach: 'coach-competitions',
        competitionTypes
      });
      return 'coach-competitions';
    }

    const forceTypes = ['strength', 'powerlifting', 'bodybuilding', 'strongman'];
    if (forceTypes.includes(normalizedType)) {
      logger.info('TRAINING_GENERATION', 'Matched force discipline', {
        trainingType,
        normalizedType,
        matchedCoach: 'coach-force',
        forceTypes
      });
      return 'coach-force';
    }

    logger.warn('TRAINING_GENERATION', 'Unknown training type, defaulting to coach-force', {
      trainingType,
      normalizedType,
      availableEnduranceTypes: enduranceTypes,
      availableFunctionalTypes: functionalTypes,
      availableCalisthenicsTypes: calisthenicsTypes,
      availableCompetitionTypes: competitionTypes,
      availableForceTypes: forceTypes
    });
    return 'coach-force';
  }

  private getEdgeFunctionName(agentType: AgentType): string {
    switch (agentType) {
      case 'coach-force':
        return 'training-coach-force';
      case 'coach-endurance':
        return 'training-coach-endurance';
      case 'coach-functional':
        return 'training-coach-functional';
      case 'coach-calisthenics':
        return 'training-coach-calisthenics';
      case 'coach-competitions':
        return 'training-coach-competitions';
      default:
        return 'training-coach-force';
    }
  }
}

export const trainingGenerationService = TrainingGenerationService.getInstance();
