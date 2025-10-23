/**
 * usePerformanceMode Hook
 * Detects device performance and adapts UI accordingly
 */

import { useState, useEffect } from 'react';

interface PerformanceMetrics {
  mode: 'high' | 'medium' | 'low';
  enableAnimations: boolean;
  enableComplexEffects: boolean;
  maxDataPoints: number;
  animationDelay: number;
  calendarDays: number;
}

export const usePerformanceMode = (): PerformanceMetrics => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    mode: 'high',
    enableAnimations: true,
    enableComplexEffects: true,
    maxDataPoints: 90,
    animationDelay: 0.01,
    calendarDays: 180
  });

  useEffect(() => {
    const detectPerformance = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /mobile|android|iphone|ipad|tablet/.test(userAgent);
      const isLowEndMobile = /android [4-6]|iphone [5-8]/.test(userAgent);

      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency || 2;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let mode: 'high' | 'medium' | 'low' = 'high';
      let enableAnimations = true;
      let enableComplexEffects = true;
      let maxDataPoints = 90;
      let animationDelay = 0.01;
      let calendarDays = 180;

      if (prefersReducedMotion) {
        mode = 'low';
        enableAnimations = false;
        enableComplexEffects = false;
        maxDataPoints = 30;
        animationDelay = 0;
        calendarDays = 30;
      } else if (isLowEndMobile || (memory && memory < 4) || cores < 4) {
        mode = 'low';
        enableAnimations = false;
        enableComplexEffects = false;
        maxDataPoints = 30;
        animationDelay = 0;
        calendarDays = 60;
      } else if (isMobile || (memory && memory < 8) || cores < 6) {
        mode = 'medium';
        enableAnimations = true;
        enableComplexEffects = false;
        maxDataPoints = 60;
        animationDelay = 0.02;
        calendarDays = 90;
      }

      const fps = measureFPS();
      fps.then((measuredFps) => {
        if (measuredFps < 30) {
          mode = 'low';
          enableAnimations = false;
          enableComplexEffects = false;
          maxDataPoints = 30;
          calendarDays = 60;
        } else if (measuredFps < 50) {
          mode = 'medium';
          enableComplexEffects = false;
          maxDataPoints = 60;
          calendarDays = 90;
        }

        setMetrics({
          mode,
          enableAnimations,
          enableComplexEffects,
          maxDataPoints,
          animationDelay,
          calendarDays
        });
      });

      setMetrics({
        mode,
        enableAnimations,
        enableComplexEffects,
        maxDataPoints,
        animationDelay,
        calendarDays
      });
    };

    detectPerformance();
  }, []);

  return metrics;
};

const measureFPS = (): Promise<number> => {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();
    const duration = 1000;

    const countFrame = () => {
      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < duration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = Math.round((frameCount / elapsed) * 1000);
        resolve(fps);
      }
    };

    requestAnimationFrame(countFrame);
  });
};
