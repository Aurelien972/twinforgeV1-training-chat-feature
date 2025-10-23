/**
 * Discipline Selector with Expandable Categories
 * Each category button expands to show its disciplines inline
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { DISCIPLINE_CATEGORIES, AVAILABLE_COACHES } from './constants';
import type { AgentType } from '../../../../domain/ai/trainingAiTypes';

interface DisciplineSelectorProps {
  profileDiscipline?: string;
  onDisciplineChange: (discipline: string, coachType: AgentType) => void;
  compact?: boolean;
  showConfirmation?: boolean;
}

const DisciplineSelector: React.FC<DisciplineSelectorProps> = ({
  profileDiscipline = 'strength',
  onDisciplineChange,
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(profileDiscipline);

  // Find which category contains the selected discipline
  const activeCategoryId = React.useMemo(() =>
    DISCIPLINE_CATEGORIES.find(cat =>
      cat.disciplines.some(d => d.value === selectedDiscipline)
    )?.id || null,
    [selectedDiscipline]
  );

  // Categories are closed by default - user needs to open them
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Sync selectedDiscipline with profileDiscipline
  React.useEffect(() => {
    if (profileDiscipline) {
      setSelectedDiscipline(profileDiscipline);
    }
  }, [profileDiscipline]);

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleDisciplineClick = (disciplineId: string, coachType: AgentType) => {
    setSelectedDiscipline(disciplineId);
    onDisciplineChange(disciplineId, coachType);
    setExpandedCategory(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {DISCIPLINE_CATEGORIES.map(category => {
        const isActiveCategory = category.id === activeCategoryId;
        const isExpanded = expandedCategory === category.id;

        return (
          <motion.div
            key={category.id}
            layout
            className="rounded-2xl overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 50% 20%, color-mix(in srgb, ${category.color} ${
                isActiveCategory ? '20%' : '12%'
              }, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, ${isActiveCategory ? '0.12' : '0.08'})
              `,
              border: `2px solid color-mix(in srgb, ${category.color} ${
                isActiveCategory ? '45%' : '25%'
              }, rgba(255, 255, 255, 0.12))`,
              boxShadow: isActiveCategory
                ? `0 6px 20px rgba(0, 0, 0, 0.3), 0 0 24px color-mix(in srgb, ${category.color} 20%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.12)`
                : `0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
              backdropFilter: 'blur(12px) saturate(150%)',
            }}
          >
            {/* Category Header Button */}
            <button
              onClick={() => handleCategoryClick(category.id)}
              className="w-full p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, color-mix(in srgb, ${category.color} 30%, transparent) 0%, transparent 70%),
                    color-mix(in srgb, ${category.color} 15%, rgba(255, 255, 255, 0.1))
                  `,
                  border: `1.5px solid color-mix(in srgb, ${category.color} 40%, transparent)`,
                  boxShadow: `0 4px 12px color-mix(in srgb, ${category.color} 25%, transparent)`,
                }}
              >
                <SpatialIcon
                  Icon={ICONS[category.icon as keyof typeof ICONS] || ICONS.Dumbbell}
                  size={24}
                  style={{
                    color: category.color,
                    filter: `drop-shadow(0 0 8px color-mix(in srgb, ${category.color} 40%, transparent))`,
                  }}
                />
              </div>

              {/* Title & Description */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-white font-bold text-base leading-tight">
                    {category.label}
                  </h3>
                  {isActiveCategory && (
                    <span
                      className="px-2 py-0.5 text-[10px] rounded-full font-bold"
                      style={{
                        background: `color-mix(in srgb, ${category.color} 25%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${category.color} 50%, transparent)`,
                        color: category.color,
                      }}
                    >
                      Actif
                    </span>
                  )}
                </div>
                <p className="text-white/65 text-xs leading-snug">
                  {category.description}
                </p>
              </div>

              {/* Expand Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: isExpanded
                      ? `color-mix(in srgb, ${category.color} 20%, transparent)`
                      : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${
                      isExpanded
                        ? `color-mix(in srgb, ${category.color} 40%, transparent)`
                        : 'rgba(255, 255, 255, 0.12)'
                    }`,
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS.ChevronDown}
                    size={16}
                    style={{
                      color: isExpanded ? category.color : 'rgba(255, 255, 255, 0.6)',
                    }}
                  />
                </div>
              </motion.div>
            </button>

            {/* Disciplines List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    {category.disciplines.map(discipline => {
                      const isAvailable =
                        discipline.available && AVAILABLE_COACHES.includes(discipline.coachType);
                      const isSelected = selectedDiscipline === discipline.value;

                      return (
                        <motion.button
                          key={discipline.value}
                          disabled={!isAvailable}
                          onClick={() =>
                            isAvailable && handleDisciplineClick(discipline.value, discipline.coachType)
                          }
                          whileTap={isAvailable ? { scale: 0.98 } : undefined}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            isAvailable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{
                            background: isSelected
                              ? `linear-gradient(135deg, color-mix(in srgb, ${category.color} 20%, rgba(255, 255, 255, 0.15)) 0%, color-mix(in srgb, ${category.color} 12%, rgba(255, 255, 255, 0.1)) 100%)`
                              : 'rgba(255, 255, 255, 0.06)',
                            border: isSelected
                              ? `1.5px solid color-mix(in srgb, ${category.color} 50%, transparent)`
                              : '1.5px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isSelected
                              ? `0 4px 16px color-mix(in srgb, ${category.color} 30%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.12)`
                              : 'none',
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Discipline Icon */}
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                background: `color-mix(in srgb, ${category.color} ${
                                  isSelected ? '20%' : '12%'
                                }, rgba(255, 255, 255, 0.08))`,
                                border: `1px solid color-mix(in srgb, ${category.color} ${
                                  isSelected ? '40%' : '25%'
                                }, transparent)`,
                              }}
                            >
                              <SpatialIcon
                                Icon={ICONS[discipline.icon as keyof typeof ICONS]}
                                size={18}
                                style={{ color: category.color }}
                              />
                            </div>

                            {/* Discipline Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white font-semibold text-sm">
                                  {discipline.label}
                                </span>
                                {!isAvailable && (
                                  <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/25 text-amber-300 border border-amber-400/40 font-bold">
                                    Bientôt
                                  </span>
                                )}
                              </div>
                              <p className="text-white/60 text-xs leading-snug">
                                {discipline.description}
                              </p>
                            </div>

                            {/* Check Indicator */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0"
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{
                                    background: category.color,
                                    boxShadow: `0 2px 12px color-mix(in srgb, ${category.color} 60%, transparent)`,
                                  }}
                                >
                                  <SpatialIcon Icon={ICONS.Check} size={14} style={{ color: 'white' }} />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DisciplineSelector;
