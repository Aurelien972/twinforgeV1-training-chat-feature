/**
 * CategorySection - Collapsible category section with disciplines
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import DisciplineCard from './DisciplineCard';
import type { CategorySectionProps } from './types';
import { AVAILABLE_COACHES, COACH_INFO } from './constants';

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  currentDiscipline,
  profileDiscipline,
  onDisciplineClick,
  isExpanded,
  onToggle
}) => {
  const availableCount = category.disciplines.filter(
    d => d.available && AVAILABLE_COACHES.includes(d.coachType)
  ).length;

  const coachInfo = COACH_INFO[category.coachType];
  const isCoachAvailable = AVAILABLE_COACHES.includes(category.coachType);

  return (
    <div className="mb-3">
      {/* Category Header - Toggle Button Style */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group active:scale-[0.98]"
        style={{
          background: isExpanded
            ? `radial-gradient(circle at 30% 20%, ${category.color}28 0%, transparent 60%), rgba(255, 255, 255, 0.18)`
            : 'rgba(255, 255, 255, 0.10)',
          border: `1.5px solid ${isExpanded ? `${category.color}60` : 'rgba(255, 255, 255, 0.15)'}`,
          boxShadow: isExpanded
            ? `0 4px 16px ${category.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.12)`
            : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${category.color}45 0%, transparent 60%), rgba(255, 255, 255, 0.18)`,
              border: `1.5px solid ${category.color}70`,
              boxShadow: isExpanded ? `0 4px 16px ${category.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)` : '0 2px 6px rgba(0, 0, 0, 0.2)'
            }}
          >
            <SpatialIcon
              Icon={ICONS[category.icon]}
              size={20}
              variant="pure"
              style={{
                color: category.color,
                filter: isExpanded ? `drop-shadow(0 0 6px ${category.color})` : 'none'
              }}
            />
          </div>

          {/* Title & Info */}
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-white font-bold text-base leading-tight">
                {category.label}
              </h3>
              <span
                className="px-2 py-0.5 text-[10px] rounded-full font-bold flex-shrink-0"
                style={{
                  background: `${category.color}30`,
                  color: category.color,
                  border: `1px solid ${category.color}60`,
                  boxShadow: `0 2px 6px ${category.color}20`
                }}
              >
                {availableCount}/{category.disciplines.length}
              </span>
            </div>
            <p className="text-white/65 text-xs leading-snug">{category.description}</p>
          </div>
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: isExpanded ? `${category.color}25` : 'rgba(255, 255, 255, 0.10)',
              border: `1px solid ${isExpanded ? `${category.color}50` : 'rgba(255, 255, 255, 0.15)'}`,
            }}
          >
            <SpatialIcon
              Icon={ICONS.ChevronDown}
              size={16}
              style={{
                color: isExpanded ? category.color : 'rgba(255, 255, 255, 0.7)',
                transition: 'color 0.2s ease'
              }}
            />
          </div>
        </motion.div>
      </button>

      {/* Coach Info Banner (when available and expanded) */}
      <AnimatePresence>
        {isExpanded && isCoachAvailable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 p-3 rounded-lg flex items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}08 100%)`,
                border: `1px solid ${category.color}30`
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${category.color}30`,
                  border: `1px solid ${category.color}50`
                }}
              >
                <SpatialIcon
                  Icon={ICONS.User}
                  size={16}
                  style={{ color: category.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium mb-0.5">
                  {coachInfo.name}
                </div>
                <div className="text-white/60 text-xs">
                  {coachInfo.specialties.join(' • ')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disciplines Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 grid grid-cols-1 gap-2.5">
              {category.disciplines.map(discipline => (
                <DisciplineCard
                  key={discipline.value}
                  discipline={discipline}
                  isSelected={currentDiscipline === discipline.value}
                  isProfileDefault={profileDiscipline === discipline.value}
                  onClick={() => onDisciplineClick(discipline)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySection;
