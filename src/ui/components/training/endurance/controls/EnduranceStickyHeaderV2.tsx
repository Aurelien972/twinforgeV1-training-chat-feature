/**
 * Endurance Sticky Header V2
 * VisionOS26 redesigned header for endurance sessions with integrated controls
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { HeartRateZone, EnduranceDiscipline } from '../../../../../domain/enduranceSession';
import { HEART_RATE_ZONES, DISCIPLINE_CONFIGS } from '../../../../../domain/enduranceSession';
import GlowIcon from '../../GlowIcon';
import WearableTrackingBadge from '../../WearableTrackingBadge';
import type { UseWearableTrackingReturn } from '../../../../../hooks/useWearableTracking';

interface EnduranceStickyHeaderV2Props {
  sessionTime: number;
  currentZone: HeartRateZone;
  progressPercent: number;
  discipline: EnduranceDiscipline;
  isPaused: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  wearableTracking?: UseWearableTrackingReturn;
}

const EnduranceStickyHeaderV2: React.FC<EnduranceStickyHeaderV2Props> = ({
  sessionTime,
  currentZone,
  progressPercent,
  discipline,
  isPaused,
  onPause,
  onResume,
  onStop,
  wearableTracking,
}) => {
  const zoneConfig = HEART_RATE_ZONES[currentZone];
  const disciplineConfig = DISCIPLINE_CONFIGS[discipline];

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 py-3"
      style={{
        background: `
          radial-gradient(circle at 50% 0%, color-mix(in srgb, ${disciplineConfig.color} 15%, transparent) 0%, transparent 70%),
          rgba(0, 0, 0, 0.92)
        `,
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: `1px solid color-mix(in srgb, ${disciplineConfig.color} 20%, rgba(255, 255, 255, 0.1))`,
        boxShadow: `
          0 4px 24px rgba(0, 0, 0, 0.4),
          0 0 40px color-mix(in srgb, ${disciplineConfig.color} 15%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.08)
        `,
        borderRadius: '20px',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Left: Time & Wearable Badge */}
        <div className="flex items-center gap-3">
          <div className="text-white font-bold text-2xl leading-tight tabular-nums">
            {formatTime(sessionTime)}
          </div>
          {wearableTracking?.isTracking && wearableTracking.deviceInfo && (
            <WearableTrackingBadge
              deviceName={wearableTracking.deviceInfo.deviceName}
              stepColor={disciplineConfig.color}
              compact={true}
            />
          )}
        </div>

        {/* Right: Zone & Controls */}
        <div className="flex items-center gap-2">
          <motion.div
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${zoneConfig.color} 25%, transparent) 0%, transparent 70%),
                color-mix(in srgb, ${zoneConfig.color} 20%, rgba(255, 255, 255, 0.1))
              `,
              color: zoneConfig.color,
              border: `1.5px solid color-mix(in srgb, ${zoneConfig.color} 40%, transparent)`,
              boxShadow: `0 0 16px color-mix(in srgb, ${zoneConfig.color} 25%, transparent)`,
              textShadow: `0 0 10px color-mix(in srgb, ${zoneConfig.color} 40%, transparent)`,
            }}
          >
            {currentZone}
          </motion.div>

          {/* Pause/Resume Button */}
          {(onPause || onResume) && (
            <motion.button
              onClick={isPaused ? onResume : onPause}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isPaused
                  ? `
                    radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.25) 0%, transparent 70%),
                    rgba(34, 197, 94, 0.15)
                  `
                  : `
                    radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.25) 0%, transparent 70%),
                    rgba(251, 146, 60, 0.15)
                  `,
                border: isPaused
                  ? '1.5px solid rgba(34, 197, 94, 0.4)'
                  : '1.5px solid rgba(251, 146, 60, 0.4)',
                boxShadow: isPaused
                  ? '0 0 16px rgba(34, 197, 94, 0.3)'
                  : '0 0 16px rgba(251, 146, 60, 0.3)',
              }}
            >
              <GlowIcon
                icon={isPaused ? 'Play' : 'Pause'}
                color={isPaused ? '#22C55E' : '#FB923C'}
                size="tiny"
                glowIntensity={40}
              />
            </motion.button>
          )}

          {/* Stop Button */}
          {onStop && (
            <motion.button
              onClick={onStop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.25) 0%, transparent 70%),
                  rgba(239, 68, 68, 0.15)
                `,
                border: '1.5px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)',
              }}
            >
              <GlowIcon
                icon="Square"
                color="#EF4444"
                size="tiny"
                glowIntensity={40}
              />
            </motion.button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          <motion.div
            className="h-full relative"
            style={{
              background: `linear-gradient(90deg, ${disciplineConfig.color}, ${zoneConfig.color})`,
              boxShadow: `0 0 16px color-mix(in srgb, ${zoneConfig.color} 40%, transparent)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
                animation: 'shimmer 2s infinite',
              }}
            />
          </motion.div>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">
            Progression
          </span>
          <span className="text-white/70 text-[10px] font-bold tabular-nums">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default EnduranceStickyHeaderV2;
