/**
 * DisciplineCard - Individual discipline selection card
 * Compact version for mobile full-screen display
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { DisciplineCardProps } from './types';
import { AVAILABLE_COACHES, COACH_INFO } from './constants';

const DisciplineCard: React.FC<DisciplineCardProps> = ({
  discipline,
  isSelected,
  isProfileDefault,
  onClick
}) => {
  const isAvailable = discipline.available && AVAILABLE_COACHES.includes(discipline.coachType);
  const coachInfo = COACH_INFO[discipline.coachType];

  return (
    <motion.button
      whileTap={isAvailable ? { scale: 0.98 } : undefined}
      layout
      disabled={!isAvailable}
      onClick={isAvailable ? onClick : undefined}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        isAvailable ? 'active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
      }`}
      style={{
        background: isSelected
          ? `radial-gradient(circle at 30% 20%, ${discipline.categoryColor}30 0%, transparent 60%), rgba(255, 255, 255, 0.20)`
          : 'rgba(255, 255, 255, 0.12)',
        border: isSelected
          ? `2px solid ${discipline.categoryColor}`
          : '1.5px solid rgba(255, 255, 255, 0.15)',
        boxShadow: isSelected
          ? `0 6px 24px ${discipline.categoryColor}45, inset 0 1px 0 rgba(255, 255, 255, 0.18)`
          : '0 2px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${discipline.categoryColor}45 0%, transparent 60%), rgba(255, 255, 255, 0.18)`,
            border: `1.5px solid ${discipline.categoryColor}70`,
            boxShadow: isSelected
              ? `0 6px 20px ${discipline.categoryColor}45, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}
        >
          <SpatialIcon
            Icon={ICONS[discipline.icon]}
            size={22}
            variant="pure"
            style={{
              color: discipline.categoryColor,
              filter: isSelected
                ? `drop-shadow(0 0 10px ${discipline.categoryColor})`
                : 'none'
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-white font-bold text-base leading-tight">
              {discipline.label}
            </h4>

            {/* Badges */}
            {isProfileDefault && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-pink-500/30 text-pink-300 border border-pink-400/50 font-bold">
                Par défaut
              </span>
            )}
            {discipline.isNew && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-bold animate-pulse">
                Nouveau
              </span>
            )}
            {!isAvailable && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/50 font-bold">
                Bientôt
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-white/70 text-xs leading-relaxed mb-1">
            {discipline.description}
          </p>

          {/* Coach Info */}
          {isAvailable && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/55">
              <SpatialIcon Icon={ICONS.User} size={11} />
              <span className="font-medium">{coachInfo.name}</span>
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex-shrink-0"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: discipline.categoryColor,
                boxShadow: `0 3px 16px ${discipline.categoryColor}70, inset 0 1px 0 rgba(255, 255, 255, 0.3)`
              }}
            >
              <SpatialIcon
                Icon={ICONS.Check}
                size={14}
                style={{ color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default DisciplineCard;
