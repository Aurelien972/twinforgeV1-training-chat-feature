/**
 * Exercise Illustration Component
 * Displays exercise illustrations with intelligent fallback
 * Supports lazy loading, skeleton states, and fullscreen modal
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { illustrationMatchingService } from '../../../../system/services/illustrationMatchingService';
import type { IllustrationMatch } from '../../../../system/services/illustrationMatchingService';
import { illustrationCacheService } from '../../../../system/services/illustrationCacheService';
import { generationLockService } from '../../../../system/services/generationLockService';
import { strictModeHelper } from '../../../../lib/utils/strictModeHelper';
import { env } from '../../../../system/env';
import logger from '../../../../lib/utils/logger';
import { useUserStore } from '../../../../system/store/userStore';

export interface ExerciseIllustrationProps {
  exerciseName: string;
  discipline: string;
  muscleGroups?: string[];
  equipment?: string[];
  movementPattern?: string;
  size?: 'thumb' | 'standard' | 'hd';
  fallbackIcon?: keyof typeof LucideIcons;
  showSkeleton?: boolean;
  onImageLoad?: () => void;
  onClick?: () => void;
  className?: string;
  isDiptych?: boolean;
  aspectRatio?: string;
}

export function ExerciseIllustration({
  exerciseName,
  discipline,
  muscleGroups,
  equipment,
  movementPattern,
  size = 'thumb',
  fallbackIcon = 'Dumbbell',
  showSkeleton = true,
  onImageLoad,
  onClick,
  className = ''
}: ExerciseIllustrationProps) {
  const { user } = useUserStore();
  const [illustration, setIllustration] = useState<IllustrationMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationAttempted, setGenerationAttempted] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [illustrationIsDiptych, setIllustrationIsDiptych] = useState(false);
  const [illustrationAspectRatio, setIllustrationAspectRatio] = useState('1:1');

  // Use refs to track intervals and state without causing re-renders
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const initialLoadRef = useRef(true);
  const lockAcquiredRef = useRef(false);
  const componentIdRef = useRef(`comp-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    mountedRef.current = true;
    let abortController: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Prevent multiple simultaneous generations for the same exercise
    if (generationInProgressRef.current) {
      logger.debug('EXERCISE_ILLUSTRATION', 'Generation already in progress, skipping', {
        exerciseName,
        discipline,
        reason: 'local_ref_lock',
        componentId: componentIdRef.current
      });
      return;
    }

    // Add small random delay to reduce StrictMode collision race conditions
    // This helps stagger mount timing when React StrictMode mounts components twice
    const mountDelay = Math.random() * 50; // 0-50ms random delay

    // CRITICAL: Skip if we already have an exact match loaded
    // This prevents unnecessary re-fetches when component re-renders
    if (illustration && illustration.matchType === 'exact' && !initialLoadRef.current) {
      logger.debug('EXERCISE_ILLUSTRATION', 'Already have exact illustration, skipping fetch', {
        exerciseName,
        discipline,
        illustrationId: illustration.id
      });
      return;
    }
    initialLoadRef.current = false;

    // CRITICAL: Check pending requests FIRST before any other check
    const pendingPromise = illustrationCacheService.getPendingRequest(exerciseName, discipline);
    if (pendingPromise) {
      logger.info('EXERCISE_ILLUSTRATION', 'Reusing pending generation (early check)', {
        exerciseName,
        discipline,
        reason: 'pending_promise_exists'
      });

      // Show generating state while waiting
      if (mountedRef.current) {
        setIsGenerating(true);
        setLoading(true);
      }

      // Start progress tracking for waiting
      const waitStartTime = Date.now();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        const elapsed = Math.floor((Date.now() - waitStartTime) / 1000);
        setGenerationElapsed(elapsed);
        const progress = Math.min(90, Math.floor((elapsed / 120) * 90));
        setGenerationProgress(progress);
      }, 1000);

      pendingPromise
        .then((result) => {
          // Clear progress tracking
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }

          if (result && mountedRef.current) {
            setGenerationProgress(100);
            setIllustration({
              id: result.illustrationId,
              imageUrl: result.imageUrl,
              thumbnailUrl: result.thumbnailUrl,
              matchType: 'exact',
              matchScore: 100,
              source: result.source
            });
            // Extract metadata from result
            setIllustrationIsDiptych(result.isDiptych || false);
            setIllustrationAspectRatio(result.aspectRatio || '1:1');
            setIsGenerating(false);
            setLoading(false);

            logger.info('STEP_2_ACTIVER', 'Illustration generated', {
              exerciseName,
              isDiptych: result.isDiptych,
              aspectRatio: result.aspectRatio
            });

            // Reset progress after short delay
            setTimeout(() => {
              if (mountedRef.current) {
                setGenerationProgress(0);
                setGenerationElapsed(0);
              }
            }, 1000);
          } else if (mountedRef.current) {
            setError(true);
            setIsGenerating(false);
            setLoading(false);
            setGenerationProgress(0);
            setGenerationElapsed(0);
          }
        })
        .catch((pendingError) => {
          // Pending promise failed
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          if (mountedRef.current) {
            logger.warn('EXERCISE_ILLUSTRATION', 'Pending promise failed', {
              exerciseName,
              error: pendingError instanceof Error ? pendingError.message : 'Unknown'
            });
            setError(true);
            setIsGenerating(false);
            setLoading(false);
            setGenerationProgress(0);
            setGenerationElapsed(0);
          }
        });
      return;
    }

    // Skip if this is not the initial load and we already have an illustration or error
    if (!initialLoadRef.current && (illustration || error)) {
      logger.debug('EXERCISE_ILLUSTRATION', 'Skipping fetch - already have result', {
        exerciseName,
        hasIllustration: !!illustration,
        hasError: error
      });
      return;
    }

    initialLoadRef.current = false;

    const fetchIllustration = async () => {
      // Apply mount delay to stagger requests in StrictMode
      if (mountDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, mountDelay));
        if (!mountedRef.current) return;
      }

      // CRITICAL: Check if we should proceed (StrictMode guard)
      const strictModeKey = `illustration:${exerciseName}:${discipline}`;
      const shouldProceed = strictModeHelper.shouldProceed(strictModeKey, componentIdRef.current);

      if (!shouldProceed) {
        logger.info('EXERCISE_ILLUSTRATION', 'Blocked by StrictMode guard - duplicate mount detected', {
          exerciseName,
          discipline,
          componentId: componentIdRef.current
        });
        // Set loading state and wait for the other component to complete
        setIsGenerating(true);
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);

        // Step 0: Check in-memory cache first (HIGH PRIORITY)
        const cached = illustrationCacheService.get(exerciseName, discipline);
        if (cached) {
          logger.info('EXERCISE_ILLUSTRATION', 'Found in cache - using cached illustration', {
            exerciseName,
            discipline,
            illustrationId: cached.illustrationId,
            isDiptych: cached.isDiptych,
            aspectRatio: cached.aspectRatio,
            source: cached.source
          });
          if (mountedRef.current) {
            setIllustration({
              id: cached.illustrationId,
              imageUrl: cached.imageUrl,
              thumbnailUrl: cached.thumbnailUrl,
              matchType: 'exact',
              matchScore: 100,
              source: cached.source
            });
            setIllustrationIsDiptych(cached.isDiptych || false);
            setIllustrationAspectRatio(cached.aspectRatio || '1:1');
            setLoading(false);
            setError(false);
          }
          return;
        }

        // Note: Pending request check moved to beginning of useEffect for earlier detection

        // Step 1: Try to find existing illustration in database
        logger.debug('EXERCISE_ILLUSTRATION', 'Searching for existing illustration in DB', {
          exerciseName,
          discipline
        });

        const match = await illustrationMatchingService.findExerciseIllustration({
          exerciseName,
          discipline,
          muscleGroups,
          equipment,
          movementPattern
        });

        if (!mountedRef.current) return;

        if (match) {
          // Found existing illustration
          logger.info('EXERCISE_ILLUSTRATION', 'Found existing illustration in DB', {
            illustrationId: match.id,
            exerciseName,
            matchType: match.matchType
          });

          // Cache for future use with metadata
          illustrationCacheService.set(
            exerciseName,
            discipline,
            match.id,
            match.imageUrl,
            match.thumbnailUrl,
            match.source,
            match.isDiptych,
            match.aspectRatio
          );

          if (mountedRef.current) {
            setIllustration(match);
            setIllustrationIsDiptych(match.isDiptych || false);
            setIllustrationAspectRatio(match.aspectRatio || '1:1');
            setLoading(false);
          }
          return;
        }

        // Prevent multiple generation attempts for same exercise
        if (generationAttempted) {
          logger.debug('EXERCISE_ILLUSTRATION', 'Generation already attempted, showing fallback', {
            exerciseName
          });
          setError(true);
          setLoading(false);
          return;
        }

        // Step 2: No illustration found - generate directly
        logger.info('EXERCISE_ILLUSTRATION', 'No existing illustration - generating now', {
          exerciseName,
          discipline,
          componentId: componentIdRef.current
        });

        // CRITICAL: Acquire global lock with retry mechanism
        const lockResult = await generationLockService.acquireLockWithRetry('illustration', {
          exerciseName,
          discipline
        }, 3);

        if (!lockResult.success) {
          logger.warn('EXERCISE_ILLUSTRATION', 'Failed to acquire lock after retries - waiting for completion', {
            exerciseName,
            discipline,
            existingLockId: lockResult.existingLock?.lockId,
            componentId: componentIdRef.current
          });
          // Set loading state and wait for existing generation
          if (mountedRef.current) {
            setIsGenerating(true);
          }
          // Don't attempt to generate, just wait for cache to be populated
          // The pending request check at the start of useEffect will handle it
          return;
        }

        // CRITICAL: Double-check DB after lock acquisition
        // This prevents race conditions where illustration was created
        // between our initial check and lock acquisition
        logger.debug('EXERCISE_ILLUSTRATION', 'Lock acquired - double-checking DB', {
          exerciseName,
          discipline,
          lockId: lockResult.lockId
        });

        const doubleCheckMatch = await illustrationMatchingService.findExerciseIllustration({
          exerciseName,
          discipline,
          muscleGroups,
          equipment,
          movementPattern
        });

        if (doubleCheckMatch && !mountedRef.current) {
          // Release lock and return
          generationLockService.releaseLock('illustration', {
            exerciseName,
            discipline
          });
          return;
        }

        if (doubleCheckMatch) {
          logger.info('EXERCISE_ILLUSTRATION', 'Found illustration in double-check - using it', {
            illustrationId: doubleCheckMatch.id,
            exerciseName,
            lockId: lockResult.lockId
          });

          // Release lock
          generationLockService.releaseLock('illustration', {
            exerciseName,
            discipline
          });

          // Cache and use the found illustration
          illustrationCacheService.set(
            exerciseName,
            discipline,
            doubleCheckMatch.id,
            doubleCheckMatch.imageUrl,
            doubleCheckMatch.thumbnailUrl,
            doubleCheckMatch.source,
            doubleCheckMatch.isDiptych,
            doubleCheckMatch.aspectRatio
          );

          if (mountedRef.current) {
            setIllustration(doubleCheckMatch);
            setIllustrationIsDiptych(doubleCheckMatch.isDiptych || false);
            setIllustrationAspectRatio(doubleCheckMatch.aspectRatio || '1:1');
            setLoading(false);
          }
          return;
        }

        // Mark lock as acquired
        lockAcquiredRef.current = true;

        // CRITICAL: Set placeholder in cache immediately to block other requests
        illustrationCacheService.setPlaceholder(exerciseName, discipline, lockResult.lockId!);

        if (mountedRef.current) {
          setIsGenerating(true);
          setGenerationAttempted(true);
        }

        // Only create AbortController for the actual fetch, not for waiting on pending promises
        abortController = new AbortController();

        // Add client-side timeout (135s, slightly more than server 130s)
        timeoutId = setTimeout(() => {
          logger.warn('EXERCISE_ILLUSTRATION', 'Generation timeout - aborting', {
            exerciseName,
            duration: 135000,
            reason: 'client_timeout'
          });
          if (abortController) {
            abortController.abort();
          }
        }, 135000);

        // Mark generation as in progress
        generationInProgressRef.current = true;

        // Update progress indicator
        const progressStartTime = Date.now();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        progressIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - progressStartTime) / 1000);
          setGenerationElapsed(elapsed);
          // Progress: 0-90% based on elapsed time (max 120s)
          // Leave 10% for processing after generation
          const progress = Math.min(90, Math.floor((elapsed / 120) * 90));
          setGenerationProgress(progress);
        }, 1000);

        logger.info('EXERCISE_ILLUSTRATION', 'Starting direct generation', {
          exerciseName,
          discipline,
          url: `${env.supabaseUrl}/functions/v1/generate-training-illustration`,
          timestamp: new Date().toISOString(),
          componentId: componentIdRef.current
        });

        // Create generation promise
        const generationPromise = (async () => {
          try {
            const generationStartTime = Date.now();
            const response = await fetch(
          `${env.supabaseUrl}/functions/v1/generate-training-illustration`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.supabaseAnon}`,
              'apikey': env.supabaseAnon
            },
            body: JSON.stringify({
              type: 'exercise',
              exerciseName,
              discipline,
              muscleGroups,
              equipment,
              movementPattern,
              userId: user?.id,
              style: 'technical',
              viewAngle: 'front'
            }),
            signal: abortController.signal
          }
        );

        const generationDuration = Date.now() - generationStartTime;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Update progress to 95% (almost done)
        if (mountedRef.current) {
          setGenerationProgress(95);
        }

        if (!mountedRef.current) return null;

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

          // Try to parse error details
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            // Not JSON, use status text
          }

          logger.error('EXERCISE_ILLUSTRATION', 'Generation API failed', {
            status: response.status,
            statusText: response.statusText,
            error: errorText.substring(0, 300),
            exerciseName,
            duration: `${Math.floor(generationDuration / 1000)}s`,
            durationMs: generationDuration
          });
          throw new Error(`Generation failed: ${errorMessage}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          logger.error('EXERCISE_ILLUSTRATION', 'Invalid generation result', {
            result,
            exerciseName
          });
          throw new Error(result.error || 'Generation failed');
        }

        logger.info('EXERCISE_ILLUSTRATION', 'Illustration generated successfully', {
          illustrationId: result.data.illustrationId,
          exerciseName,
          duration: generationDuration,
          source: result.data.source,
          isDiptych: result.data.isDiptych,
          aspectRatio: result.data.aspectRatio
        });

        // Release global lock after successful generation
        generationLockService.releaseLock('illustration', {
          exerciseName,
          discipline
        });

          // Set the new illustration
          const newIllustration = {
            id: result.data.illustrationId,
            imageUrl: result.data.imageUrl,
            thumbnailUrl: result.data.thumbnailUrl,
            matchType: 'exact' as const,
            matchScore: 100,
            source: result.data.source
          };

          // Cache it with metadata
          illustrationCacheService.set(
            exerciseName,
            discipline,
            result.data.illustrationId,
            result.data.imageUrl,
            result.data.thumbnailUrl,
            result.data.source,
            result.data.isDiptych,
            result.data.aspectRatio
          );

          if (!mountedRef.current) return null;

          // Set progress to 100%
          if (mountedRef.current) {
            setGenerationProgress(100);
          }

          if (mountedRef.current) {
            setIllustration(newIllustration);
            setIllustrationIsDiptych(result.data.isDiptych || false);
            setIllustrationAspectRatio(result.data.aspectRatio || '1:1');
            setIsGenerating(false);
            setLoading(false);
          }
          generationInProgressRef.current = false;

          // Clear progress interval
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }

          // Reset progress after a short delay
          setTimeout(() => {
            if (mountedRef.current) {
              setGenerationProgress(0);
              setGenerationElapsed(0);
            }
          }, 1000);

            return {
              illustrationId: result.data.illustrationId,
              imageUrl: result.data.imageUrl,
              thumbnailUrl: result.data.thumbnailUrl,
              source: result.data.source,
              isDiptych: result.data.isDiptych,
              aspectRatio: result.data.aspectRatio,
              timestamp: Date.now()
            };
          } catch (error) {
            // Release lock on error
            generationLockService.releaseLock('illustration', {
              exerciseName,
              discipline
            });

            // Remove placeholder on error
            illustrationCacheService.removePlaceholder(exerciseName, discipline);

            // Handle errors within the promise
            if (error instanceof Error && error.name === 'AbortError') {
              logger.info('EXERCISE_ILLUSTRATION', 'Generation aborted', {
                exerciseName,
                reason: 'abort_signal',
                elapsed: generationElapsed,
                timestamp: new Date().toISOString()
              });
              return null;
            }

            logger.error('EXERCISE_ILLUSTRATION', 'Generation promise failed', {
              error: error instanceof Error ? error.message : 'Unknown',
              errorName: error instanceof Error ? error.name : 'N/A',
              errorStack: error instanceof Error ? error.stack?.substring(0, 300) : 'N/A',
              exerciseName,
              elapsed: generationElapsed
            });
            return null;
          } finally {
            // Clear progress interval and reset indicators
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setGenerationProgress(0);
            setGenerationElapsed(0);
            generationInProgressRef.current = false;
          }
        })();

        // CRITICAL: Register pending request BEFORE starting fetch to prevent duplicates
        // This ensures other components can find and reuse this promise immediately
        illustrationCacheService.setPendingRequest(exerciseName, discipline, generationPromise);
        logger.debug('EXERCISE_ILLUSTRATION', 'Pending request registered before fetch', {
          exerciseName,
          discipline,
          componentId: componentIdRef.current
        });

        // Wait for result (with error handling)
        try {
          const result = await generationPromise;
          if (result && mountedRef.current) {
            logger.info('EXERCISE_ILLUSTRATION', 'Generation completed successfully', {
              exerciseName,
              illustrationId: result.illustrationId,
              componentId: componentIdRef.current
            });
          }
        } catch (promiseError) {
          // Promise errors are already handled internally
          if (promiseError instanceof Error && promiseError.name !== 'AbortError') {
            logger.warn('EXERCISE_ILLUSTRATION', 'Promise rejection caught', {
              error: promiseError.message,
              exerciseName,
              componentId: componentIdRef.current
            });
          }
        }

      } catch (err) {
        if (!mountedRef.current) return;

        // Don't log abort errors (user navigated away)
        if (err instanceof Error && err.name === 'AbortError') {
          logger.info('EXERCISE_ILLUSTRATION', 'Fetch aborted', {
            exerciseName,
            reason: 'component_unmount_or_timeout'
          });
          return;
        }

        logger.error('EXERCISE_ILLUSTRATION', 'Error fetching/generating illustration', {
          error: err instanceof Error ? err.message : 'Unknown error',
          exerciseName,
          discipline
        });

        if (mountedRef.current) {
          setError(true);
          setIsGenerating(false);
          setLoading(false);
        }
        generationInProgressRef.current = false;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setGenerationProgress(0);
        setGenerationElapsed(0);
      }
    };

    fetchIllustration().catch((error) => {
      // Catch any unhandled errors from fetchIllustration
      if (error instanceof Error && error.name === 'AbortError') {
        // Silently ignore abort errors
        return;
      }
      logger.error('EXERCISE_ILLUSTRATION', 'Unhandled error in fetchIllustration', {
        error: error instanceof Error ? error.message : 'Unknown',
        exerciseName
      });
    });

    return () => {
      mountedRef.current = false;

      // Only abort if we're actually fetching (not waiting on pending promise)
      // and only if component is truly unmounting (not just re-rendering)
      const isRealUnmount = !document.contains(document.querySelector(`[data-exercise-id="${exerciseName}"]`));

      if (abortController && isRealUnmount) {
        logger.debug('EXERCISE_ILLUSTRATION', 'Component unmounting - aborting fetch', {
          exerciseName,
          reason: 'component_unmount'
        });
        abortController.abort();
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // CRITICAL: Release lock on unmount if generation was in progress
      if (generationInProgressRef.current || lockAcquiredRef.current) {
        logger.info('EXERCISE_ILLUSTRATION', 'Releasing lock on component unmount', {
          exerciseName,
          discipline,
          componentId: componentIdRef.current
        });
        generationLockService.releaseLock('illustration', {
          exerciseName,
          discipline
        });

        // Remove placeholder if we set one
        illustrationCacheService.removePlaceholder(exerciseName, discipline);

        generationInProgressRef.current = false;
        lockAcquiredRef.current = false;
      }

      // Release StrictMode guard
      const strictModeKey = `illustration:${exerciseName}:${discipline}`;
      strictModeHelper.release(strictModeKey, componentIdRef.current);
    };
  }, [exerciseName, discipline]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onImageLoad?.();
  };

  const handleImageError = () => {
    setError(true);
    setImageLoaded(false);
  };

  // Use 3:2 ratio (1536x1024) for all disciplines
  const isEndurance = discipline === 'endurance' || discipline === 'running' || discipline === 'cycling';
  const isWideFormat = isEndurance || illustrationAspectRatio === '16:9' || illustrationAspectRatio === '3:2' || illustrationIsDiptych;

  const sizeClasses = {
    thumb: isWideFormat ? 'w-full max-w-[640px] h-auto' : 'w-[200px] h-[200px]',
    standard: isWideFormat ? 'w-full max-w-[960px] h-auto' : 'w-[600px] h-[600px]',
    hd: isWideFormat ? 'w-full max-w-[1536px] h-auto' : 'w-[1200px] h-[1200px]'
  };

  const imageUrl = illustration?.thumbnailUrl || illustration?.imageUrl;
  const isIconFallback = illustration?.source === 'icon-fallback';
  const aspectRatioClass = isWideFormat ? 'aspect-3-2' : 'aspect-1-1';

  // Show skeleton with progress while loading
  if (loading && showSkeleton) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl relative overflow-hidden">
          {/* Progress bar when generating */}
          {isGenerating && generationProgress > 0 && (
            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-700/50 z-10">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: `${generationProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                }}
              />
            </div>
          )}

          <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            {/* Glow Icon with Progress */}
            {isGenerating ? (
              <div className="relative">
                {/* Pulsing glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)',
                    filter: 'blur(20px)'
                  }}
                />

                {/* Main icon container */}
                <motion.div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <LucideIcons.Sparkles
                    size={40}
                    className="text-blue-400"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
                    }}
                  />
                </motion.div>

                {/* Progress percentage overlay */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white" style={{
                      textShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.4)'
                    }}>
                      {generationProgress}%
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-600/50 animate-pulse" />
            )}

            {/* Show generation progress text */}
            {isGenerating && (
              <motion.div
                className="text-center px-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-white/80 text-base font-semibold mb-1">
                  {generationProgress === 0 ? 'Initialisation...' :
                   generationProgress < 10 ? 'Connexion au serveur...' :
                   generationProgress < 95 ? 'Création de l\'illustration...' :
                   'Finalisation...'}
                </p>
                <p className="text-white/50 text-sm">
                  {generationElapsed}s écoulées
                </p>
                {generationElapsed > 40 && generationElapsed <= 80 && (
                  <motion.p
                    className="text-yellow-400/70 text-xs mt-3 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ✨ Génération haute qualité en cours...
                  </motion.p>
                )}
                {generationElapsed > 80 && (
                  <motion.p
                    className="text-green-400/70 text-xs mt-3 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    🎨 Touches finales en cours...
                  </motion.p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback to icon if error, not found, OR icon-fallback source
  // Note: isGenerating is handled in skeleton above
  if (error || !illustration || isIconFallback) {
    const FallbackIcon = LucideIcons[fallbackIcon] as React.ComponentType<any>;

    return (
      <motion.div
        className={`${sizeClasses[size]} ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-full h-full rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onClick={onClick}
        >
          {FallbackIcon && (
            <FallbackIcon
              size={size === 'thumb' ? 64 : size === 'standard' ? 128 : 256}
              className="text-white/40"
              strokeWidth={1.5}
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Show illustration
  return (
    <motion.div
      className={`${sizeClasses[size]} ${className} relative group`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`w-full h-full rounded-xl overflow-hidden cursor-pointer relative illustration-container ${aspectRatioClass}`}
        onClick={onClick}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Image */}
        <img
          src={imageUrl}
          alt={exerciseName}
          className={`w-full h-full ${isWideFormat ? 'object-contain' : 'object-cover'} transition-all duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-105`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={isWideFormat ? {
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          } : undefined}
        />

        {/* Loading overlay */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-700/50 animate-pulse" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white text-sm font-medium truncate">
              {exerciseName}
            </p>
            {illustration.matchType !== 'exact' && (
              <p className="text-white/60 text-xs mt-1">
                Match similaire ({illustration.matchScore}%)
              </p>
            )}
          </div>
        </div>

        {/* Quality badge for non-exact matches */}
        {illustration.matchType !== 'exact' && (
          <div className="absolute top-2 right-2">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(59, 130, 246, 0.9)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            >
              {illustration.matchType === 'variant' ? 'Variante' : 'Similaire'}
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Fullscreen Modal for Exercise Illustration
 */
export interface ExerciseIllustrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  discipline: string;
  muscleGroups?: string[];
  equipment?: string[];
  movementPattern?: string;
}

export function ExerciseIllustrationModal({
  isOpen,
  onClose,
  exerciseName,
  discipline,
  muscleGroups,
  equipment,
  movementPattern
}: ExerciseIllustrationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <LucideIcons.X size={24} />
              </button>

              {/* Illustration */}
              <ExerciseIllustration
                exerciseName={exerciseName}
                discipline={discipline}
                muscleGroups={muscleGroups}
                equipment={equipment}
                movementPattern={movementPattern}
                size="hd"
                showSkeleton={true}
                className="mx-auto"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
