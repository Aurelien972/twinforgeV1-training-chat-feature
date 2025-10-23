import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  calculateBodyProjection,
  type ProjectionInputs,
  type ProjectionOutputs
} from '../lib/projection/morphologicalProjectionEngine';
import { type ProjectionParams } from '../app/pages/BodyProjection/ProjectionControlPanel';
import logger from '../lib/utils/logger';
import { env } from '../system/env';

// Cache local LRU (Least Recently Used) pour éviter les recalculs identiques
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private accessOrder: K[] = [];
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    // Add to end
    this.cache.set(key, value);
    this.accessOrder.push(key);

    // Evict least recently used if over limit
    if (this.cache.size > this.maxSize) {
      const lruKey = this.accessOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  get size(): number {
    return this.cache.size;
  }
}

// PHASE 1 OPTIMIZATION: Increased cache size from 100 to 250 for longer sessions
const projectionCache = new LRUCache<string, ProjectionOutputs>(250);

interface UseBodyProjectionProps {
  profile: any;
  bodyScan: any;
  projectionParams: ProjectionParams;
  enabled?: boolean;
}

interface UseBodyProjectionResult {
  projection: ProjectionOutputs | null;
  isCalculating: boolean;
  error: string | null;
  recalculate: () => void;
}

/**
 * Custom hook for managing body projection calculations
 * Handles debouncing, memoization, and error states
 */
export function useBodyProjection({
  profile,
  bodyScan,
  projectionParams,
  enabled = true
}: UseBodyProjectionProps): UseBodyProjectionResult {
  const [projection, setProjection] = useState<ProjectionOutputs | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationRef = useRef<string>('');
  const isCalculatingRef = useRef(false);

  // OPTIMIZED: Helper pour créer un hash rapide
  const createInputsHash = useCallback((p: any, bs: any, params: ProjectionParams): string => {
    if (!p || !bs) return '';
    // OPTIMIZED: Hash plus simple et plus rapide
    return [
      bs.weight || p.weight,
      p.height,
      p.age,
      p.sex,
      bs.body_fat_percentage || 0,
      params.activityLevel,
      params.nutritionQuality,
      params.caloricBalance,
      params.timePeriodMonths
    ].join('|');
  }, []);

  // Create a stable hash of inputs to detect real changes
  const inputsHash = useMemo(() => {
    if (!profile || !bodyScan || !enabled) return '';
    return createInputsHash(profile, bodyScan, projectionParams);
  }, [profile, bodyScan, projectionParams, enabled, createInputsHash]);

  // OPTIMIZED: Calculate projection avec cache et debouncing amélioré
  useEffect(() => {
    if (!enabled || !profile || !bodyScan) {
      setIsCalculating(false);
      return;
    }

    // Validate scan data
    if (!bodyScan.morph_values || Object.keys(bodyScan.morph_values).length === 0) {
      setError('Données de scan incomplètes');
      setIsCalculating(false);
      return;
    }

    // OPTIMIZED: Skip si inputs identiques
    if (inputsHash === lastCalculationRef.current) {
      // PHASE 1 OPTIMIZATION: Removed logging for identical inputs (too frequent)
      setIsCalculating(false);
      return;
    }

    // OPTIMIZED: Vérifier le cache avant calcul
    if (projectionCache.has(inputsHash)) {
      const cached = projectionCache.get(inputsHash)!;
      setProjection(cached);
      lastCalculationRef.current = inputsHash;
      setIsCalculating(false);
      setError(null);
      // PHASE 1 OPTIMIZATION: Only log cache hits in dev mode
      if (import.meta.env.DEV) {
        logger.debug('USE_BODY_PROJECTION', '🎯 Cache HIT - Using cached projection', {
          cacheSize: projectionCache.size,
          hash: inputsHash.substring(0, 30),
          philosophy: 'cache_hit'
        });
      }
      return;
    }

    // PHASE 1 OPTIMIZATION: Only log cache misses in dev mode to reduce noise
    if (import.meta.env.DEV) {
      logger.debug('USE_BODY_PROJECTION', '🔄 Cache MISS - Calculating new projection', {
        cacheSize: projectionCache.size,
        hash: inputsHash.substring(0, 30),
        inputValues: {
          timePeriodMonths: projectionParams.timePeriodMonths,
          activityLevel: projectionParams.activityLevel,
          nutritionQuality: projectionParams.nutritionQuality,
          caloricBalance: projectionParams.caloricBalance,
          weight: bodyScan.weight || profile.weight,
          height: profile.height
        },
        philosophy: 'cache_miss'
      });
    }

    // Skip si un calcul est déjà en cours
    if (isCalculatingRef.current) {
      return;
    }

    // Clear previous timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    setIsCalculating(true);
    setError(null);

    // PHASE 1 OPTIMIZATION: Debounce reduced from 300ms to 200ms for better responsiveness
    calculationTimeoutRef.current = setTimeout(async () => {
      isCalculatingRef.current = true;
      const calculationStartTime = Date.now();

      try {
        const inputs: ProjectionInputs = {
          currentWeight: bodyScan.weight || profile.weight || 70,
          currentHeight: profile.height || 170,
          currentAge: profile.age || 30,
          currentGender: profile.sex === 'male' ? 'male' : 'female',
          currentBodyFatPercentage: bodyScan.body_fat_percentage,
          currentMorphValues: bodyScan.morph_values || {},
          currentLimbMasses: bodyScan.limb_masses || {},
          ...projectionParams
        };

        let result: ProjectionOutputs;
        let backendUsed = false;

        // Try Edge Function first
        try {
          const response = await fetch(
            `${env.supabaseUrl}/functions/v1/compute-morphology-state`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.supabaseAnon}`,
              },
              body: JSON.stringify(inputs),
            }
          );

          if (response.ok) {
            const { success, data, cached, computeTime } = await response.json();
            if (success && data) {
              result = data;
              backendUsed = true;
              // PHASE 1 OPTIMIZATION: Only log slow backend calls (>500ms) or cache misses
              if (import.meta.env.DEV && (!cached || computeTime > 500)) {
                logger.debug('USE_BODY_PROJECTION', '🌐 Backend calculation successful', {
                  cached,
                  computeTime: `${computeTime}ms`,
                  backendCached: cached,
                  localCacheWillStore: true,
                  philosophy: 'backend_compute'
                });
              }
            } else {
              throw new Error('Backend returned unsuccessful response');
            }
          } else {
            throw new Error(`Backend responded with ${response.status}`);
          }
        } catch (backendError) {
          // Fallback to client-side calculation
          // PHASE 1 OPTIMIZATION: Only log backend errors in dev
          if (import.meta.env.DEV) {
            logger.warn('USE_BODY_PROJECTION', 'Backend unavailable, using client fallback', {
              error: backendError instanceof Error ? backendError.message : 'Unknown',
              willUseClientCalculation: true,
              philosophy: 'backend_fallback'
            });
          }
          result = calculateBodyProjection(inputs);
          backendUsed = false;
        }

        const calculationDuration = Date.now() - calculationStartTime;

        // OPTIMIZED: Mettre en cache avec LRU
        projectionCache.set(inputsHash, result);

        setProjection(result);
        lastCalculationRef.current = inputsHash;

        // PHASE 1 OPTIMIZATION: Only log slow calculations (>200ms)
        if (calculationDuration > 200 || import.meta.env.DEV) {
          logger.info('USE_BODY_PROJECTION', '✨ Projection calculated successfully', {
            duration: `${calculationDuration}ms`,
            backendUsed,
            cacheSize: projectionCache.size,
            projectedWeight: result.projectedWeight.toFixed(1),
            projectedBMI: result.projectedBMI.toFixed(1),
            projectedMorphKeysCount: result.projectedMorphValues ? Object.keys(result.projectedMorphValues).length : 0,
            projectedLimbMassesCount: result.projectedLimbMasses ? Object.keys(result.projectedLimbMasses).length : 0,
            inputHash: inputsHash.substring(0, 30),
            philosophy: 'calculation_success_sampled'
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de calcul';
        setError(errorMessage);
        logger.error('USE_BODY_PROJECTION', 'Calculation error', { error: err });
      } finally {
        setIsCalculating(false);
        isCalculatingRef.current = false;
      }
    }, 200); // PHASE 1 OPTIMIZATION: Reduced from 300ms

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [enabled, profile, bodyScan, projectionParams, inputsHash]);

  // OPTIMIZED: Manual recalculation function with cache clear
  const recalculate = useCallback(() => {
    logger.info('USE_BODY_PROJECTION', '🔄 Manual recalculation triggered', {
      previousCacheSize: projectionCache.size,
      clearedCache: true,
      philosophy: 'manual_recalculation'
    });
    lastCalculationRef.current = '';
    projectionCache.clear();
    setIsCalculating(true);
  }, []);

  // DIAGNOSTIC: Log projection cache stats periodically (debug mode only)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // PHASE 1 OPTIMIZATION: Reduced frequency from 15s to 30s to minimize log spam
    const logInterval = setInterval(() => {
      if (projectionCache.size > 0) {
        logger.debug('USE_BODY_PROJECTION', '📊 PROJECTION CACHE STATS', {
          cacheSize: projectionCache.size,
          maxCacheSize: 250, // Updated to match new cache size
          isCalculating: isCalculatingRef.current,
          lastHash: lastCalculationRef.current.substring(0, 30),
          philosophy: 'projection_cache_stats'
        });
      }
    }, 30000); // PHASE 1 OPTIMIZATION: Every 30 seconds (was 15s)

    return () => clearInterval(logInterval);
  }, []);

  return {
    projection,
    isCalculating,
    error,
    recalculate
  };
}
