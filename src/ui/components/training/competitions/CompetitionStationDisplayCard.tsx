/**
 * Competition Station Display Card
 * Optimized display for competition stations in Step2 review phase
 * Shows distance/time instead of generic reps/sets for better UX
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import GlowIcon from '../GlowIcon';
import { ICONS } from '../../../icons/registry';
import { ExerciseIllustration, ExerciseIllustrationModal } from '../illustrations';
import { MuscleGroupsBadges } from '../shared';

interface Station {
  id: string;
  stationNumber: number;
  stationType: 'cardio' | 'strength' | 'hybrid';
  name: string;
  equipment?: string[];
  muscleGroups?: string[];
  prescription: string;
  targetTime: number;
  targetPace?: string;
  intensity?: string;
  rpeTarget: number;
  transitionTime: number;
  executionCues: string[];
  pacingStrategy: string;
  coachNotes: string;
  substitutions?: string[];
  distance?: number;
}

interface CompetitionStationDisplayCardProps {
  station: Station;
  stationIndex: number;
  totalStations: number;
  disciplineColor?: string;
  onRequestHelp?: (stationName: string, stationContext: any) => void;
  onStationRegenerate?: (stationId: string) => void;
  isRegenerating?: boolean;
}

const CompetitionStationDisplayCard: React.FC<CompetitionStationDisplayCardProps> = ({
  station,
  stationIndex,
  totalStations,
  disciplineColor = '#F59E0B',
  onRequestHelp,
  onStationRegenerate,
  isRegenerating = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [illustrationModalOpen, setIllustrationModalOpen] = useState(false);

  const handleRegenerateClick = () => {
    if (onStationRegenerate) {
      onStationRegenerate(station.id);
    }
  };

  const handleRequestHelp = () => {
    if (onRequestHelp) {
      onRequestHelp(station.name, {
        stationType: station.stationType,
        targetTime: station.targetTime,
        rpeTarget: station.rpeTarget,
        muscleGroups: station.muscleGroups,
        equipment: station.equipment
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStationTypeIcon = (type: string) => {
    switch (type) {
      case 'cardio':
        return ICONS.Activity;
      case 'strength':
        return ICONS.Dumbbell;
      case 'hybrid':
        return ICONS.Zap;
      default:
        return ICONS.Target;
    }
  };

  const getStationTypeLabel = (type: string) => {
    switch (type) {
      case 'cardio':
        return 'Cardio';
      case 'strength':
        return 'Force';
      case 'hybrid':
        return 'Hybride';
      default:
        return 'Station';
    }
  };

  const getRpeColor = (rpe: number): string => {
    if (rpe >= 9) return '#EF4444';
    if (rpe >= 7) return '#F59E0B';
    if (rpe >= 5) return '#3B82F6';
    return '#22C55E';
  };

  const rpeColor = getRpeColor(station.rpeTarget);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="py-6"
    >
      <GlassCard
        className="space-y-4"
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, color-mix(in srgb, ${disciplineColor} 12%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${disciplineColor} 25%, transparent)`,
          borderRadius: '20px',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.24),
            0 2px 8px rgba(0, 0, 0, 0.12),
            0 0 24px color-mix(in srgb, ${disciplineColor} 15%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          overflow: 'hidden'
        }}
      >
        {/* Header with Illustration and Station Number */}
        <div className="space-y-4">
          {/* Mobile: Vertical Stack | Desktop: Horizontal Layout */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Exercise Illustration - Centered on mobile, visible on all screens */}
            <div className="flex justify-center md:justify-start">
              <ExerciseIllustration
                exerciseName={station.name}
                discipline="competitions"
                equipment={station.equipment || []}
                size="thumb"
                fallbackIcon="Target"
                onClick={() => setIllustrationModalOpen(true)}
                className="flex-shrink-0"
              />
            </div>

            {/* Station Info Container */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Station Number and Title - Mobile centered, desktop left */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, ${disciplineColor} 40%, transparent) 0%, transparent 70%),
                      rgba(255, 255, 255, 0.12)
                    `,
                    border: `2px solid color-mix(in srgb, ${disciplineColor} 50%, transparent)`,
                    color: disciplineColor,
                    boxShadow: `
                      0 4px 24px color-mix(in srgb, ${disciplineColor} 35%, transparent),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2)
                    `
                  }}
                >
                  {station.stationNumber}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <SpatialIcon
                      Icon={getStationTypeIcon(station.stationType)}
                      size={18}
                      variant="pure"
                      style={{ color: disciplineColor, opacity: 0.8 }}
                    />
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: disciplineColor, opacity: 0.8 }}
                    >
                      {getStationTypeLabel(station.stationType)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white break-words" style={{
                    letterSpacing: '-0.02em',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {station.name}
                  </h3>
                </div>
              </div>

              {/* RPE Badge and Station Counter - Mobile centered, desktop right */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 30%, color-mix(in srgb, ${rpeColor} 25%, transparent) 0%, transparent 70%),
                      color-mix(in srgb, ${rpeColor} 18%, rgba(255, 255, 255, 0.08))
                    `,
                    border: `1.5px solid color-mix(in srgb, ${rpeColor} 35%, transparent)`,
                    color: rpeColor,
                    textShadow: `0 0 12px color-mix(in srgb, ${rpeColor} 50%, transparent)`,
                    boxShadow: `0 2px 8px color-mix(in srgb, ${rpeColor} 20%, transparent)`
                  }}
                >
                  RPE {station.rpeTarget}
                </div>
                <div className="text-xs text-white/50">
                  Station {stationIndex + 1}/{totalStations}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Muscle Groups Section */}
        <MuscleGroupsBadges
          muscleGroups={station.muscleGroups}
          disciplineColor={disciplineColor}
          className="mb-4"
        />

        {/* Prescription - GlassCard */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}
        >
          <p className="text-sm text-white/80 font-medium leading-relaxed">{station.prescription}</p>
        </div>

        {/* Key Metrics - Competition Specific - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Target Time */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 4px 12px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <SpatialIcon Icon={ICONS.Clock} size={16} variant="pure" style={{ color: disciplineColor }} />
              </div>
              <div
                className="text-3xl font-bold mb-1"
                style={{
                  color: disciplineColor,
                  letterSpacing: '-0.03em',
                  textShadow: `0 0 20px color-mix(in srgb, ${disciplineColor} 40%, transparent)`
                }}
              >
                {formatTime(station.targetTime)}
              </div>
              <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Temps cible</div>
            </div>
          </div>

          {/* Transition Time */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: `
                radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 4px 12px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <SpatialIcon Icon={ICONS.ArrowRight} size={16} variant="pure" style={{ color: '#06B6D4' }} />
              </div>
              <div className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                {station.transitionTime}s
              </div>
              <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Transition</div>
            </div>
          </div>

          {/* Target Pace or Distance - Full Width */}
          <div
            className="p-4 rounded-2xl col-span-1 sm:col-span-2"
            style={{
              background: `
                radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                rgba(255, 255, 255, 0.08)
              `,
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 4px 12px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <SpatialIcon
                  Icon={station.stationType === 'cardio' || station.stationType === 'hybrid' ? ICONS.Gauge : ICONS.Dumbbell}
                  size={16}
                  variant="pure"
                  style={{ color: disciplineColor }}
                />
              </div>
              {station.targetPace ? (
                <>
                  <div className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {station.targetPace}
                  </div>
                  <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Allure</div>
                </>
              ) : station.distance ? (
                <>
                  <div className="text-2xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                    {station.distance}m
                  </div>
                  <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Distance</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white/50 mb-1" style={{ letterSpacing: '-0.03em' }}>
                    Non spécifié
                  </div>
                  <div className="text-[11px] text-white/50 font-semibold uppercase tracking-wider">Allure / Distance</div>
                </>
              )}
            </div>
          </div>

          {/* Equipment */}
          {station.equipment && station.equipment.length > 0 && (
            <div
              className="p-4 rounded-2xl col-span-1 sm:col-span-2 md:col-span-1"
              style={{
                background: `
                  radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.15) 0%, transparent 65%),
                  rgba(255, 255, 255, 0.08)
                `,
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(12px) saturate(140%)',
                WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.2),
                  0 4px 12px rgba(0, 0, 0, 0.15)
                `
              }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <SpatialIcon Icon={ICONS.Package} size={16} variant="pure" style={{ color: '#8B5CF6' }} />
                </div>
                <div className="text-sm font-semibold text-white mb-1">
                  {station.equipment.length} équipement{station.equipment.length > 1 ? 's' : ''}
                </div>
                <div className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Matériel</div>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <div className="mt-4 mb-4">
          <motion.button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background: expanded ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
          <span className="text-sm font-semibold text-white/80">
            {expanded ? 'Masquer les détails' : 'Afficher les détails'}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <SpatialIcon Icon={ICONS.ChevronDown} size={18} style={{ color: 'white', opacity: 0.8 }} />
          </motion.div>
        </motion.button>
        </div>

        {/* Expanded Details Section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden mt-4"
            >
              {/* Pacing Strategy */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SpatialIcon Icon={ICONS.Target} size={16} variant="pure" style={{ color: disciplineColor }} />
                  <span className="text-sm font-semibold" style={{ color: disciplineColor }}>
                    Stratégie de rythme
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{station.pacingStrategy}</p>
              </div>

              {/* Execution Cues */}
              {station.executionCues && station.executionCues.length > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GlowIcon
                      icon="Lightbulb"
                      color="#F59E0B"
                      size="tiny"
                      glowIntensity={35}
                    />
                    <span className="text-sm font-semibold text-amber-400">Conseils d'exécution</span>
                  </div>
                  <ul className="space-y-1 text-sm text-white/80">
                    {station.executionCues.map((cue, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span style={{ color: disciplineColor }}>•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coach Notes */}
              {station.coachNotes && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GlowIcon
                      icon="MessageCircle"
                      color="#3B82F6"
                      size="tiny"
                      glowIntensity={35}
                    />
                    <span className="text-sm font-semibold text-blue-400">Notes du coach</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{station.coachNotes}</p>
                </div>
              )}

              {/* Equipment List */}
              {station.equipment && station.equipment.length > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GlowIcon
                      icon="Package"
                      color="#8B5CF6"
                      size="tiny"
                      glowIntensity={35}
                    />
                    <span className="text-sm font-semibold text-purple-400">Équipement requis</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {station.equipment.map((item, index) => (
                      <div
                        key={index}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Substitutions */}
              {station.substitutions && station.substitutions.length > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <GlowIcon
                      icon="RefreshCw"
                      color="#10B981"
                      size="tiny"
                      glowIntensity={35}
                    />
                    <span className="text-sm font-semibold text-green-400">Alternatives</span>
                  </div>
                  <ul className="space-y-1 text-sm text-white/80">
                    {station.substitutions.map((sub, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-400">→</span>
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </GlassCard>

      {/* Illustration Modal */}
      <ExerciseIllustrationModal
        isOpen={illustrationModalOpen}
        onClose={() => setIllustrationModalOpen(false)}
        exerciseName={station.name}
        discipline="competitions"
        equipment={station.equipment || []}
      />
    </motion.div>
  );
};

export default CompetitionStationDisplayCard;
