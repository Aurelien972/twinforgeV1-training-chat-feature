/**
 * WarmupCard Component
 * Displays warmup prescription with joint mobility exercises
 * Features collapsible exercises/drills section
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';
import type { WarmupPrescription } from '../../../../system/store/trainingPipeline/types';

interface WarmupCardProps {
  warmup: WarmupPrescription;
  stepColor?: string;
}

const WARMUP_COLOR = '#FF8C42';

const WarmupCard: React.FC<WarmupCardProps> = ({ warmup, stepColor }) => {
  const hasExercises = warmup.exercises && warmup.exercises.length > 0;
  const hasDynamicDrills = warmup.dynamicDrills && warmup.dynamicDrills.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  const itemCount = hasExercises ? warmup.exercises.length : (hasDynamicDrills ? warmup.dynamicDrills!.length : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        className="overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${WARMUP_COLOR} 15%, transparent) 0%, transparent 65%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`,
          boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.25),
            0 0 30px color-mix(in srgb, ${WARMUP_COLOR} 20%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.12)
          `,
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <GlowIcon
            icon="Flame"
            color={WARMUP_COLOR}
            size="medium"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Échauffement {hasExercises ? 'Articulaire' : ''}</h3>
              <span className="text-white/60 text-sm font-medium">{warmup.duration} min</span>
            </div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3">
              {hasExercises ? 'Mobilité et préparation articulaire' : 'Montée en température progressive'}
            </p>
            {warmup.instructions && (
              <p className="text-white/80 text-sm leading-relaxed mb-4">{warmup.instructions}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-medium">
                {warmup.targetZone}
              </span>
              {warmup.targetHR && (
                <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-medium">
                  {warmup.targetHR}
                </span>
              )}
              {warmup.isOptional && (
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: `color-mix(in srgb, ${WARMUP_COLOR} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`,
                    color: WARMUP_COLOR
                  }}
                >
                  Optionnel
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        {(hasExercises || hasDynamicDrills) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-4 transition-all duration-300 hover:scale-[1.01]"
            style={{
              background: isExpanded
                ? `color-mix(in srgb, ${WARMUP_COLOR} 12%, transparent)`
                : 'rgba(255, 255, 255, 0.04)',
              border: isExpanded
                ? `1px solid color-mix(in srgb, ${WARMUP_COLOR} 25%, transparent)`
                : '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="flex items-center gap-3">
              <SpatialIcon
                Icon={ICONS.List}
                size={18}
                style={{ color: isExpanded ? WARMUP_COLOR : 'rgba(255, 255, 255, 0.6)' }}
              />
              <div className="text-left">
                <p className="text-white font-medium text-sm">
                  {isExpanded ? 'Masquer les détails' : `Découvrir les ${itemCount} ${hasExercises ? 'exercices' : 'instructions'}`}
                </p>
                {!isExpanded && (
                  <p className="text-white/50 text-xs mt-0.5">
                    {hasExercises ? 'Mobilité ciblée et préparation articulaire optimale' : 'Instructions détaillées pour un échauffement progressif'}
                  </p>
                )}
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <SpatialIcon
                Icon={ICONS.ChevronDown}
                size={20}
                style={{ color: isExpanded ? WARMUP_COLOR : 'rgba(255, 255, 255, 0.6)' }}
              />
            </motion.div>
          </button>
        )}

        {/* Dynamic Drills (Endurance) - Collapsible */}
        <AnimatePresence>
        {hasDynamicDrills && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3 mb-4"
          >
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3">Instructions de préparation</div>
            {warmup.dynamicDrills!.map((drill, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: `color-mix(in srgb, ${WARMUP_COLOR} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: WARMUP_COLOR }}
                  >
                    {idx + 1}
                  </span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed flex-1">{drill}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Exercises List (Force Training) - Collapsible */}
        <AnimatePresence>
        {hasExercises && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3 mb-4"
          >
            <div className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3">Exercices de mobilité</div>
            {warmup.exercises.map((exercise, idx) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: `color-mix(in srgb, ${WARMUP_COLOR} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 30%, transparent)`
                  }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: WARMUP_COLOR }}
                  >
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold text-sm mb-1">
                    {exercise.name}
                  </h4>
                  <p className="text-white/70 text-xs mb-2">
                    {exercise.instructions}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {exercise.sets && exercise.reps && (
                      <div
                        className="px-2 py-1 rounded"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        {exercise.sets} × {exercise.reps} reps
                      </div>
                    )}
                    {exercise.duration && (
                      <div
                        className="px-2 py-1 rounded"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        {exercise.duration}s
                      </div>
                    )}
                    {exercise.targetAreas && exercise.targetAreas.map((area) => (
                      <div
                        key={area}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: `color-mix(in srgb, ${WARMUP_COLOR} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 25%, transparent)`,
                          color: WARMUP_COLOR
                        }}
                      >
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Notes */}
        {warmup.notes && (
          <div
            className="p-4 rounded-xl text-sm mt-4"
            style={{
              background: `color-mix(in srgb, ${WARMUP_COLOR} 8%, transparent)`,
              border: `1px solid color-mix(in srgb, ${WARMUP_COLOR} 20%, transparent)`,
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <div className="flex items-start gap-2">
              <SpatialIcon
                Icon={ICONS.Info}
                size={16}
                style={{
                  color: WARMUP_COLOR,
                  marginTop: '2px',
                  flexShrink: 0
                }}
              />
              <p className="leading-relaxed">{warmup.notes}</p>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default WarmupCard;
