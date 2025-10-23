/**
 * Endurance Session Overview
 * Affiche une vue d'ensemble visuelle de la session d'endurance en Step 2
 * Similaire au PreSessionBriefing mais adapté pour la phase de validation
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { EnduranceSessionPrescription, EnduranceBlock } from '../../../../../domain/enduranceSession';
import { DISCIPLINE_CONFIGS } from '../../../../../domain/enduranceSession';

interface EnduranceSessionOverviewProps {
  prescription: EnduranceSessionPrescription;
  stepColor: string;
  onBlockClick?: (blockIndex: number) => void;
}

const EnduranceSessionOverview: React.FC<EnduranceSessionOverviewProps> = ({
  prescription,
  stepColor,
  onBlockClick
}) => {
  const effectiveDiscipline = prescription.discipline || 'cardio';
  const disciplineConfig = DISCIPLINE_CONFIGS[effectiveDiscipline];

  // Build all blocks array
  const allBlocks: EnduranceBlock[] = [];
  if (prescription.warmup) {
    allBlocks.push({
      id: 'warmup',
      type: 'warmup',
      name: 'Échauffement',
      duration: prescription.warmup.duration,
      targetZone: prescription.warmup.targetZone,
      description: prescription.warmup.description,
      rpeTarget: 3,
    });
  }
  if (prescription.mainWorkout) {
    allBlocks.push(...prescription.mainWorkout);
  }
  if (prescription.cooldown) {
    allBlocks.push({
      id: 'cooldown',
      type: 'cooldown',
      name: 'Retour au calme',
      duration: prescription.cooldown.duration,
      targetZone: prescription.cooldown.targetZone,
      description: prescription.cooldown?.description,
      rpeTarget: 2,
    });
  }

  const totalDuration = allBlocks.reduce((sum, block) => sum + block.duration, 0);
  const mainWorkoutBlocks = allBlocks.filter(b => b.type !== 'warmup' && b.type !== 'cooldown');

  const getZoneColor = (zone: string) => {
    const zoneColors: Record<string, string> = {
      'Z1': '#10b981',
      'Z2': '#3b82f6',
      'Z3': '#f59e0b',
      'Z4': '#ef4444',
      'Z5': '#dc2626',
    };
    return zoneColors[zone] || '#8b5cf6';
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'warmup':
        return ICONS.Flame;
      case 'cooldown':
        return ICONS.Snowflake;
      default:
        return ICONS.Activity;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6"
    >
      <GlassCard
        className="p-6 space-y-5"
        style={{
          background: `
            radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${stepColor} 15%, transparent) 0%, transparent 70%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${stepColor} 25%, rgba(255, 255, 255, 0.15))`,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.2),
            0 0 40px color-mix(in srgb, ${stepColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.12)
          `
        }}
      >
        {/* Header with icon and title */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%),
                linear-gradient(135deg, color-mix(in srgb, ${stepColor} 35%, transparent), color-mix(in srgb, ${stepColor} 25%, transparent))
              `,
              border: `2px solid color-mix(in srgb, ${stepColor} 50%, transparent)`,
              boxShadow: `0 0 30px color-mix(in srgb, ${stepColor} 35%, transparent)`
            }}
          >
            <SpatialIcon
              name={disciplineConfig.icon as any}
              className="w-8 h-8 text-white"
              style={{
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${stepColor} 50%, transparent))`
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {prescription.sessionName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>{disciplineConfig.label}</span>
              <span className="text-white/40">•</span>
              <span>{totalDuration} min</span>
              <span className="text-white/40">•</span>
              <span>{allBlocks.length} blocs</span>
            </div>
          </div>
        </div>

        {/* Session summary if available */}
        {prescription.sessionSummary && (
          <p className="text-white/70 text-sm leading-relaxed">
            {prescription.sessionSummary}
          </p>
        )}

        {/* Visual timeline of blocks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wider px-2">
              Structure
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Blocks timeline */}
          <div className="flex gap-1 h-12 rounded-xl overflow-hidden" style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {allBlocks.map((block, index) => {
              const widthPercentage = (block.duration / totalDuration) * 100;
              const zoneColor = getZoneColor(block.targetZone);

              return (
                <motion.div
                  key={block.id}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="relative group cursor-pointer"
                  style={{
                    width: `${widthPercentage}%`,
                    background: `linear-gradient(135deg, ${zoneColor}90, ${zoneColor}70)`,
                    transformOrigin: 'left'
                  }}
                  onClick={() => onBlockClick?.(index)}
                >
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Block icon - only show for larger blocks */}
                  {widthPercentage > 8 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SpatialIcon
                        Icon={getBlockIcon(block.type)}
                        size={16}
                        className="text-white/90"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Blocks legend */}
          <div className="grid grid-cols-1 gap-2 mt-4">
            {allBlocks.map((block, index) => {
              const zoneColor = getZoneColor(block.targetZone);

              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                  onClick={() => onBlockClick?.(index)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${zoneColor}30`,
                      border: `1px solid ${zoneColor}50`
                    }}
                  >
                    <SpatialIcon
                      Icon={getBlockIcon(block.type)}
                      size={16}
                      style={{ color: zoneColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">
                      {block.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/50 text-xs">{block.duration} min</span>
                      <span className="text-white/30">•</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          color: zoneColor,
                          background: `${zoneColor}20`,
                          border: `1px solid ${zoneColor}40`
                        }}
                      >
                        {block.targetZone}
                      </span>
                    </div>
                  </div>
                  <SpatialIcon
                    Icon={ICONS.ChevronRight}
                    size={16}
                    className="text-white/30 group-hover:text-white/60 transition-colors"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick stats badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {mainWorkoutBlocks.length > 0 && (
            <div
              className="px-3 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2"
              style={{
                background: `color-mix(in srgb, ${stepColor} 15%, rgba(255, 255, 255, 0.08))`,
                border: `1px solid color-mix(in srgb, ${stepColor} 30%, transparent)`
              }}
            >
              <SpatialIcon Icon={ICONS.Zap} size={14} style={{ color: stepColor }} />
              <span>{mainWorkoutBlocks.length} intervalles</span>
            </div>
          )}

          <div
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <SpatialIcon Icon={ICONS.Clock} size={14} className="text-white/70" />
            <span>Durée totale: {totalDuration} min</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default EnduranceSessionOverview;
