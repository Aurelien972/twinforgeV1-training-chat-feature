/**
 * PreparationCountdown Optimized
 * Pure CSS animations, 60fps, minimal JS
 */

import React, { useEffect, useState, useCallback, memo } from 'react';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { Haptics } from '../../../../utils/haptics';
import { countdownTick, countdownGo } from '../../../../audio';

interface PreparationCountdownProps {
  duration: number;
  exerciseName: string;
  exerciseVariant?: string;
  onComplete: () => void;
  stepColor: string;
}

const PreparationCountdownOptimized: React.FC<PreparationCountdownProps> = memo(({
  duration = 10,
  exerciseName,
  exerciseVariant,
  onComplete,
  stepColor,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (countdown === 0) {
      setIsComplete(true);
      Haptics.success();
      countdownGo();
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
      countdownTick(countdown - 1, duration);

      // Progressive haptic intensity
      if (countdown <= 3) {
        Haptics.impact();
      } else if (countdown <= 5) {
        Haptics.press();
      } else {
        Haptics.tap();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete, duration]);

  const progress = ((duration - countdown) / duration) * 100;

  return (
    <div
      className="fullscreen-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div className="w-full max-w-md">
        <GlassCard
          className="p-10 text-center space-y-8 relative"
          style={{
            background: `
              radial-gradient(circle at 50% 30%, color-mix(in srgb, ${stepColor} 20%, transparent) 0%, transparent 70%),
              rgba(15, 15, 15, 0.95)
            `,
            border: `2px solid color-mix(in srgb, ${stepColor} 40%, rgba(255, 255, 255, 0.2))`,
            boxShadow: `
              0 20px 60px rgba(0, 0, 0, 0.6),
              0 0 40px color-mix(in srgb, ${stepColor} 25%, transparent)
            `,
          }}
        >
          {/* Exercise Name */}
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2">{exerciseName}</h2>
            {exerciseVariant && (
              <p className="text-white/60 text-lg">{exerciseVariant}</p>
            )}
          </div>

          {/* Countdown Number or GO */}
          <div className="relative">
            {!isComplete ? (
              <div
                key={countdown}
                className="countdown-number text-9xl font-bold text-white"
                style={{
                  textShadow: `0 0 40px color-mix(in srgb, ${stepColor} 60%, transparent)`,
                }}
              >
                {countdown}
              </div>
            ) : (
              <div
                className="countdown-go text-8xl font-bold"
                style={{
                  color: stepColor,
                  textShadow: `0 0 60px ${stepColor}`,
                }}
              >
                GO!
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div
            className="relative h-3 rounded-full overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${stepColor}, color-mix(in srgb, ${stepColor} 80%, #fff))`,
                boxShadow: `0 0 20px ${stepColor}`,
              }}
            />
          </div>

          {/* Preparation Message */}
          <div className="text-white/70 text-sm animate-fadeIn" style={{ animationDelay: '200ms' }}>
            {countdown > 5 ? 'Préparez-vous...' : countdown > 0 ? 'C\'est parti dans...' : 'Allez-y !'}
          </div>
        </GlassCard>
      </div>
    </div>
  );
});

PreparationCountdownOptimized.displayName = 'PreparationCountdownOptimized';

export default PreparationCountdownOptimized;
