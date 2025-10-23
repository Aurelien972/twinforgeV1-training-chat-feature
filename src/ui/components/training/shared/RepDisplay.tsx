/**
 * RepDisplay Component
 * Optimized display for complex rep schemes
 * Handles alternatives, progressions, ranges with adaptive sizing
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseRepFormat, getDynamicFontSize, formatForMobile, getRepTypeColor, getRepTypeBadge } from '../../../../utils/repFormatParser';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';

interface RepDisplayProps {
  reps: number | string;
  color?: string;
  showBadge?: boolean;
  compact?: boolean;
  className?: string;
}

export const RepDisplay: React.FC<RepDisplayProps> = ({
  reps,
  color,
  showBadge = true,
  compact = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const parsed = parseRepFormat(reps);
  const mobileFormat = formatForMobile(parsed);
  const repTypeColor = getRepTypeColor(parsed.type);
  const badge = getRepTypeBadge(parsed.type);
  const displayColor = color || repTypeColor;

  // Determine font size based on complexity
  const primaryFontSize = getDynamicFontSize(mobileFormat.main, compact ? 2.5 : 3);

  return (
    <div className={`relative ${className}`}>
      {/* Primary Rep Display */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="font-bold text-white"
            style={{
              fontSize: primaryFontSize,
              letterSpacing: '-0.03em',
              lineHeight: '1',
              textShadow: parsed.isComplex
                ? `0 0 20px ${displayColor}40`
                : 'none',
            }}
            whileHover={parsed.isComplex ? { scale: 1.02 } : {}}
            onHoverStart={() => parsed.isComplex && setShowTooltip(true)}
            onHoverEnd={() => setShowTooltip(false)}
            onTap={() => parsed.isComplex && setShowTooltip(!showTooltip)}
          >
            {mobileFormat.main}
          </motion.div>

          {/* Type Badge */}
          {showBadge && badge && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: `${displayColor}30`,
                border: `1px solid ${displayColor}60`,
                color: displayColor,
                boxShadow: `0 2px 8px ${displayColor}20`,
              }}
            >
              {badge}
            </motion.div>
          )}
        </div>

        {/* Secondary Rep Display (Alternative) */}
        {mobileFormat.sub && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 px-3 py-1 rounded-lg text-xs font-semibold text-center"
            style={{
              background: `${displayColor}15`,
              border: `1px solid ${displayColor}30`,
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '100%',
            }}
          >
            <span className="block truncate">{mobileFormat.sub}</span>
          </motion.div>
        )}

        {/* Standard Label */}
        <div className="text-white/70 font-semibold uppercase tracking-wider mt-2" style={{ fontSize: '10px' }}>
          Reps
        </div>
      </div>

      {/* Tooltip for Full Text (when truncated) */}
      <AnimatePresence>
        {showTooltip && parsed.isComplex && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-xl text-xs font-medium text-white whitespace-nowrap pointer-events-none"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              border: `1px solid ${displayColor}40`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${displayColor}30`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-2">
              <SpatialIcon
                Icon={ICONS.Info}
                size={14}
                style={{ color: displayColor }}
              />
              <span>{parsed.fullText}</span>
            </div>
            {/* Tooltip Arrow */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid rgba(0, 0, 0, 0.95)`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CompactRepDisplayProps {
  reps: number | string;
  color?: string;
  className?: string;
}

/**
 * Compact version for smaller cards or list views
 */
export const CompactRepDisplay: React.FC<CompactRepDisplayProps> = ({
  reps,
  color = '#FFFFFF',
  className = '',
}) => {
  const parsed = parseRepFormat(reps);
  const mobileFormat = formatForMobile(parsed);
  const fontSize = getDynamicFontSize(mobileFormat.main, 1.5);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${className}`}>
      <span
        className="font-bold text-white"
        style={{
          fontSize,
          color,
          letterSpacing: '-0.02em',
          lineHeight: '1',
        }}
      >
        {mobileFormat.main}
      </span>
      {mobileFormat.sub && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-lg"
          style={{
            background: `${color}20`,
            border: `1px solid ${color}40`,
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '100%',
          }}
        >
          {mobileFormat.sub}
        </span>
      )}
      <div className="text-white/70 font-semibold uppercase tracking-wider" style={{ fontSize: '10px' }}>
        Reps
      </div>
    </div>
  );
};

export default RepDisplay;
