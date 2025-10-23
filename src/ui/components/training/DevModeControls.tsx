/**
 * Dev Mode Controls
 * Developer tools for rapid navigation and testing during sessions
 * Only visible when VITE_DEV_MODE is enabled
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../cards/GlassCard';
import SpatialIcon from '../../icons/SpatialIcon';
import { ICONS } from '../../icons/registry';

interface DevModeControlsProps {
  onSkipBlock?: () => void;
  onSkipCountdown?: () => void;
  onSkipSet?: () => void;
  onSkipWarmup?: () => void;
  onComplete?: () => void;
  currentBlock?: string;
  totalBlocks?: number;
  sessionType?: 'force' | 'endurance' | 'calisthenics' | 'functional' | 'sport';
  additionalInfo?: string;
}

const DevModeControls: React.FC<DevModeControlsProps> = ({
  onSkipBlock,
  onSkipCountdown,
  onSkipSet,
  onSkipWarmup,
  onComplete,
  currentBlock,
  totalBlocks,
  sessionType = 'force',
  additionalInfo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';

  if (!isDev) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-24 right-4 z-[100]"
    >
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <GlassCard
              className="p-4 space-y-3"
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                border: '2px solid rgba(251, 146, 60, 0.6)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 60px rgba(251, 146, 60, 0.4)',
                minWidth: '240px',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(251, 146, 60, 0.2)',
                      border: '1.5px solid rgba(251, 146, 60, 0.5)',
                    }}
                  >
                    <SpatialIcon
                      Icon={ICONS.Wrench}
                      size={16}
                      style={{ color: '#FB923C' }}
                    />
                  </div>
                  <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">
                    Dev Mode
                  </span>
                </div>
                <motion.button
                  onClick={() => setIsExpanded(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <SpatialIcon Icon={ICONS.X} size={14} style={{ color: 'white' }} />
                </motion.button>
              </div>

              {/* Session Info */}
              {currentBlock !== undefined && totalBlocks !== undefined && (
                <div
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <div className="font-semibold text-white mb-1">Session: {sessionType}</div>
                  <div>Bloc: {currentBlock} / {totalBlocks}</div>
                  {additionalInfo && (
                    <div className="text-[10px] text-white/50 mt-1">{additionalInfo}</div>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="space-y-2">
                {onSkipCountdown && (
                  <motion.button
                    onClick={onSkipCountdown}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1.5px solid rgba(34, 197, 94, 0.4)',
                      color: '#22C55E',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.FastForward} size={14} style={{ color: '#22C55E' }} />
                    Skip Countdown
                  </motion.button>
                )}

                {onSkipWarmup && (
                  <motion.button
                    onClick={onSkipWarmup}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: 'rgba(251, 146, 60, 0.15)',
                      border: '1.5px solid rgba(251, 146, 60, 0.4)',
                      color: '#FB923C',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.FastForward} size={14} style={{ color: '#FB923C' }} />
                    Skip Warmup
                  </motion.button>
                )}

                {onSkipSet && (
                  <motion.button
                    onClick={onSkipSet}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: 'rgba(14, 165, 233, 0.15)',
                      border: '1.5px solid rgba(14, 165, 233, 0.4)',
                      color: '#0EA5E9',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.SkipForward} size={14} style={{ color: '#0EA5E9' }} />
                    Skip Set
                  </motion.button>
                )}

                {onSkipBlock && (
                  <motion.button
                    onClick={onSkipBlock}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1.5px solid rgba(59, 130, 246, 0.4)',
                      color: '#3B82F6',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.SkipForward} size={14} style={{ color: '#3B82F6' }} />
                    {sessionType === 'force' || sessionType === 'calisthenics' || sessionType === 'functional' ? 'Skip Exercise' : 'Skip Block'}
                  </motion.button>
                )}

                {onComplete && (
                  <motion.button
                    onClick={onComplete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2"
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1.5px solid rgba(168, 85, 247, 0.4)',
                      color: '#A855F7',
                    }}
                  >
                    <SpatialIcon Icon={ICONS.CheckCircle} size={14} style={{ color: '#A855F7' }} />
                    Complete Session
                  </motion.button>
                )}
              </div>

              {/* Warning */}
              <div
                className="px-3 py-2 rounded-lg text-[10px] text-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'rgba(239, 68, 68, 0.9)',
                }}
              >
                ⚠️ Dev only - Hidden in prod
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.button
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.4) 0%, transparent 70%),
                rgba(0, 0, 0, 0.9)
              `,
              border: '2px solid rgba(251, 146, 60, 0.6)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 40px rgba(251, 146, 60, 0.3)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <SpatialIcon
              Icon={ICONS.Wrench}
              size={24}
              style={{
                color: '#FB923C',
                filter: 'drop-shadow(0 0 12px rgba(251, 146, 60, 0.6))',
              }}
            />
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{
                background: '#EF4444',
                color: 'white',
                border: '2px solid rgba(0, 0, 0, 0.9)',
              }}
            >
              D
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DevModeControls;
