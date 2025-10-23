/**
 * Exercise Adjustment Panel
 * Granular CTA buttons for modifying exercises
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import {
  EXERCISE_ADJUSTMENT_BUTTONS,
  ADJUSTMENT_CATEGORIES,
  type ExerciseAdjustmentCategory,
  type ExerciseAdjustmentButton
} from '../../../../../config/exerciseAdjustmentConfig';
import { useFeedback } from '../../../../../hooks/useFeedback';
import type { Exercise } from '../../../../../system/store/trainingPipeline/types';

interface ExerciseAdjustmentPanelProps {
  exercise: Exercise;
  onAdjustment: (exerciseId: string, adjustmentId: string, message: string) => void;
  stepColor: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

const ExerciseAdjustmentPanel: React.FC<ExerciseAdjustmentPanelProps> = ({
  exercise,
  onAdjustment,
  stepColor,
  isExpanded = true,
  onToggleExpand,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseAdjustmentCategory | null>(null);
  const { triggerHaptic } = useFeedback();

  const handleAdjustmentClick = (button: ExerciseAdjustmentButton) => {
    onAdjustment(exercise.id, button.id, button.shortMessage);
    triggerHaptic('medium');

    setTimeout(() => {
      if (onToggleExpand) {
        onToggleExpand();
      }
    }, 300);
  };

  const filteredButtons = selectedCategory
    ? EXERCISE_ADJUSTMENT_BUTTONS.filter(b => b.category === selectedCategory)
    : EXERCISE_ADJUSTMENT_BUTTONS;

  return (
    <div className={`exercise-adjustment-panel ${className}`}>
      {/* Toggle Button (if collapsible) */}
      {onToggleExpand && (
        <motion.button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-between p-3 rounded-xl mb-3"
          style={{
            background: `
              radial-gradient(circle at 50% 0%, color-mix(in srgb, ${stepColor} 12%, transparent) 0%, transparent 70%),
              rgba(255, 255, 255, 0.06)
            `,
            border: `1px solid color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.12))`,
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Settings} size={18} style={{ color: stepColor }} />
            <span className="text-sm font-semibold text-white">Options avancées</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <SpatialIcon Icon={ICONS.ChevronDown} size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </motion.div>
        </motion.button>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Category Filter */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 hide-scrollbar">
              <motion.button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0"
                style={{
                  background: !selectedCategory
                    ? `
                        radial-gradient(circle at 30% 30%, color-mix(in srgb, ${stepColor} 25%, transparent) 0%, transparent 70%),
                        color-mix(in srgb, ${stepColor} 20%, rgba(255, 255, 255, 0.08))
                      `
                    : 'rgba(255, 255, 255, 0.05)',
                  border: !selectedCategory
                    ? `1.5px solid color-mix(in srgb, ${stepColor} 40%, transparent)`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: !selectedCategory ? stepColor : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: !selectedCategory
                    ? `0 0 16px color-mix(in srgb, ${stepColor} 20%, transparent)`
                    : 'none'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Tout
              </motion.button>

              {ADJUSTMENT_CATEGORIES.map((cat) => {
                const Icon = ICONS[cat.icon as keyof typeof ICONS];
                const isSelected = selectedCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as ExerciseAdjustmentCategory)}
                    className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
                    style={{
                      background: isSelected
                        ? `
                            radial-gradient(circle at 30% 30%, color-mix(in srgb, ${cat.color} 25%, transparent) 0%, transparent 70%),
                            color-mix(in srgb, ${cat.color} 18%, rgba(255, 255, 255, 0.08))
                          `
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected
                        ? `1.5px solid color-mix(in srgb, ${cat.color} 40%, transparent)`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? cat.color : 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: isSelected
                        ? `0 0 16px color-mix(in srgb, ${cat.color} 20%, transparent)`
                        : 'none'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {Icon && <SpatialIcon Icon={Icon} size={12} />}
                    {cat.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Adjustment Buttons Grid */}
            <motion.div
              className="grid grid-cols-2 gap-2"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredButtons.map((button) => {
                  const Icon = ICONS[button.icon as keyof typeof ICONS];
                  return (
                    <motion.button
                      key={button.id}
                      onClick={() => handleAdjustmentClick(button)}
                      className="p-3 rounded-xl text-left"
                      style={{
                        background: `
                          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${button.color} 15%, transparent) 0%, transparent 70%),
                          rgba(255, 255, 255, 0.06)
                        `,
                        border: `1px solid color-mix(in srgb, ${button.color} 25%, rgba(255, 255, 255, 0.12))`,
                        backdropFilter: 'blur(10px)',
                        boxShadow: `
                          0 2px 8px rgba(0, 0, 0, 0.12),
                          0 0 16px color-mix(in srgb, ${button.color} 8%, transparent),
                          inset 0 1px 0 rgba(255, 255, 255, 0.08)
                        `
                      }}
                      whileHover={{
                        scale: 1.03,
                        y: -2,
                        boxShadow: `
                          0 4px 16px rgba(0, 0, 0, 0.18),
                          0 0 24px color-mix(in srgb, ${button.color} 15%, transparent),
                          inset 0 1px 0 rgba(255, 255, 255, 0.12)
                        `
                      }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      layout
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {Icon && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `
                                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${button.color} 30%, transparent) 0%, transparent 70%),
                                color-mix(in srgb, ${button.color} 20%, rgba(255, 255, 255, 0.08))
                              `,
                              border: `1px solid color-mix(in srgb, ${button.color} 40%, transparent)`,
                              boxShadow: `0 0 12px color-mix(in srgb, ${button.color} 25%, transparent)`
                            }}
                          >
                            <SpatialIcon
                              Icon={Icon}
                              size={14}
                              style={{
                                color: button.color,
                                filter: `drop-shadow(0 0 6px color-mix(in srgb, ${button.color} 50%, transparent))`
                              }}
                            />
                          </div>
                        )}
                        <span
                          className="text-xs font-bold flex-1"
                          style={{
                            color: button.color,
                            textShadow: `0 0 8px color-mix(in srgb, ${button.color} 30%, transparent)`
                          }}
                        >
                          {button.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/70 leading-tight line-clamp-2 font-medium">
                        {button.description}
                      </p>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ExerciseAdjustmentPanel;
