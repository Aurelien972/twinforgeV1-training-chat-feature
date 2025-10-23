/**
 * Competition Station Card - Refonte complète
 * Carte de station active optimisée pour la compétition
 * Focus sur temps, distance, et stratégie de pacing
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../../cards/GlassCard';
import GlowIcon from '../../GlowIcon';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import TrainingButton from '../../../../../app/pages/Training/Pipeline/components/TrainingButton';
import { ExerciseIllustration } from '../../illustrations';

interface Station {
  id: string;
  stationNumber: number;
  stationType: 'cardio' | 'strength' | 'hybrid';
  name: string;
  equipment?: string[];
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

interface CompetitionStationCardProps {
  station: Station;
  stationIndex: number;
  totalStations: number;
  currentTime: number;
  isActive: boolean;
  isRunning: boolean;
  onComplete: () => void;
  disciplineColor?: string;
}

const CompetitionStationCard: React.FC<CompetitionStationCardProps> = ({
  station,
  stationIndex,
  totalStations,
  currentTime,
  isActive,
  isRunning,
  onComplete,
  disciplineColor = '#F59E0B'
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStationTypeIcon = (type: string) => {
    switch (type) {
      case 'cardio': return 'Activity';
      case 'strength': return 'Dumbbell';
      case 'hybrid': return 'Zap';
      default: return 'Target';
    }
  };

  const getRpeColor = (rpe: number): string => {
    if (rpe >= 9) return '#EF4444';
    if (rpe >= 7) return '#F59E0B';
    if (rpe >= 5) return '#3B82F6';
    return '#22C55E';
  };

  const timeRemaining = Math.max(0, station.targetTime - currentTime);
  const timePercent = (currentTime / station.targetTime) * 100;
  const isOvertime = currentTime > station.targetTime;

  const rpeColor = getRpeColor(station.rpeTarget);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 50% 20%, color-mix(in srgb, ${disciplineColor} 20%, transparent) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, color-mix(in srgb, ${disciplineColor} 10%, transparent) 0%, transparent 50%),
            rgba(255, 255, 255, 0.08)
          `,
          border: `2px solid color-mix(in srgb, ${disciplineColor} 35%, transparent)`,
          borderRadius: '20px',
          boxShadow: `
            0 12px 48px rgba(0, 0, 0, 0.4),
            0 0 60px color-mix(in srgb, ${disciplineColor} 35%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          `
        }}
      >
        {/* Shimmer effect - Contenu DANS la GlassCard */}
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            borderRadius: '20px',
            zIndex: 0
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                color-mix(in srgb, ${disciplineColor} 20%, rgba(255, 255, 255, 0.3)) 45%,
                color-mix(in srgb, ${disciplineColor} 30%, rgba(255, 255, 255, 0.4)) 50%,
                color-mix(in srgb, ${disciplineColor} 20%, rgba(255, 255, 255, 0.3)) 55%,
                transparent 100%
              )`,
              width: '50%',
              height: '100%'
            }}
            animate={{
              x: ['-50%', '200%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>

        <div className="relative z-10 p-4 space-y-4">
          {/* Header - Badges en haut */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <GlowIcon
                icon={getStationTypeIcon(station.stationType) as any}
                color={disciplineColor}
                size="tiny"
                glowIntensity={35}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: disciplineColor, opacity: 0.9 }}
              >
                Station {stationIndex + 1}/{totalStations}
              </span>
            </div>

            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
              style={{
                background: `color-mix(in srgb, ${rpeColor} 20%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${rpeColor} 40%, transparent)`,
                color: rpeColor,
                boxShadow: `0 2px 12px color-mix(in srgb, ${rpeColor} 25%, transparent)`
              }}
            >
              RPE {station.rpeTarget}
            </div>
          </div>

          {/* Exercise Illustration */}
          <div className="relative z-20 mb-6 flex justify-center w-full">
            <div className="w-full max-w-[400px]">
              <ExerciseIllustration
                exerciseName={station.name}
                discipline="competitions"
                equipment={station.equipment}
                size="thumb"
                showSkeleton={true}
                fallbackIcon="Target"
                className="rounded-xl w-full"
              />
            </div>
          </div>

          {/* Titre avec icône de station */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, color-mix(in srgb, ${disciplineColor} 45%, transparent) 0%, transparent 70%),
                  rgba(255, 255, 255, 0.15)
                `,
                border: `2px solid color-mix(in srgb, ${disciplineColor} 55%, transparent)`,
                color: disciplineColor,
                boxShadow: `0 4px 24px color-mix(in srgb, ${disciplineColor} 40%, transparent)`
              }}
            >
              {station.stationNumber}
            </div>

            <h3 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {station.name}
            </h3>
          </div>

          {/* Prescription - GlassCard */}
          <div
            className="p-4 rounded-xl mt-4"
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

          {/* Timer principal géant */}
          <div className="text-center py-8">
            <motion.div
              className="text-7xl font-bold mb-2"
              style={{
                color: isOvertime ? '#EF4444' : disciplineColor,
                letterSpacing: '-0.04em',
                textShadow: `
                  0 0 40px color-mix(in srgb, ${isOvertime ? '#EF4444' : disciplineColor} 50%, transparent),
                  0 0 20px color-mix(in srgb, ${isOvertime ? '#EF4444' : disciplineColor} 70%, transparent),
                  0 2px 8px rgba(0, 0, 0, 0.5)
                `
              }}
              animate={isRunning ? {
                scale: [1, 1.02, 1],
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {formatTime(currentTime)}
            </motion.div>

            {/* Barre de progression du temps */}
            <div
              className="h-3 rounded-full overflow-hidden mx-auto"
              style={{
                maxWidth: '400px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, timePercent)}%` }}
                style={{
                  height: '100%',
                  background: isOvertime
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : `linear-gradient(90deg, ${disciplineColor}, color-mix(in srgb, ${disciplineColor} 70%, white))`,
                  boxShadow: `0 0 16px ${isOvertime ? '#EF4444' : disciplineColor}80`
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="mt-3 text-sm">
              {isOvertime ? (
                <span className="text-red-400 font-bold">
                  +{formatTime(currentTime - station.targetTime)} overtime
                </span>
              ) : (
                <span className="text-white/60">
                  Temps restant : {formatTime(timeRemaining)}
                </span>
              )}
            </div>
          </div>

          {/* Métriques clés - 2x2 avec allure full width */}
          <div className="grid grid-cols-2 gap-3">
            {/* Temps cible */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="flex justify-center mb-2">
                <GlowIcon icon="Clock" color="#3B82F6" size="small" glowIntensity={30} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatTime(station.targetTime)}
              </div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">
                Cible
              </div>
            </div>

            {/* Transition */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="flex justify-center mb-2">
                <GlowIcon icon="ArrowRight" color="#06B6D4" size="small" glowIntensity={30} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {station.transitionTime}s
              </div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider">
                Transition
              </div>
            </div>

            {/* Distance ou allure - Full width */}
            <div
              className="p-4 rounded-xl text-center col-span-2"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="flex justify-center mb-2">
                <GlowIcon icon="Gauge" color={disciplineColor} size="small" glowIntensity={30} />
              </div>
              {station.distance ? (
                <>
                  <div className="text-xl font-bold text-white mb-1">
                    {station.distance}m
                  </div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">
                    Distance
                  </div>
                </>
              ) : station.targetPace ? (
                <>
                  <div className="text-xl font-bold text-white mb-1">
                    {station.targetPace}
                  </div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">
                    Allure
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-white/50 mb-1">
                    Non spécifié
                  </div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider">
                    Allure / Distance
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stratégie de pacing - Toujours visible */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: `
                radial-gradient(circle at 30% 20%, color-mix(in srgb, ${disciplineColor} 10%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.06)
              `,
              border: `1.5px solid color-mix(in srgb, ${disciplineColor} 25%, transparent)`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <GlowIcon
                icon="Target"
                color={disciplineColor}
                size="tiny"
                glowIntensity={35}
              />
              <span className="text-sm font-bold" style={{ color: disciplineColor }}>
                Stratégie de rythme
              </span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {station.pacingStrategy}
            </p>
          </div>

          {/* Conseils d'exécution */}
          {station.executionCues && station.executionCues.length > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.25)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <GlowIcon icon="Lightbulb" color="#FB923C" size="tiny" glowIntensity={35} />
                <span className="text-sm font-bold text-orange-400">
                  Points clés
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {station.executionCues.map((cue, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{
                      background: 'rgba(251, 146, 60, 0.15)',
                      border: '1px solid rgba(251, 146, 60, 0.3)'
                    }}
                  >
                    {cue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bouton de détails */}
          <div className="mt-4">
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
              style={{
                background: showDetails ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <span className="text-sm font-semibold text-white/80">
                {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
              </span>
              <motion.div animate={{ rotate: showDetails ? 180 : 0 }}>
                <SpatialIcon Icon={ICONS.ChevronDown} size={18} style={{ color: 'white', opacity: 0.8 }} />
              </motion.div>
            </motion.button>
          </div>

          {/* Détails étendus */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Notes du coach */}
                {station.coachNotes && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GlowIcon icon="MessageCircle" color="#3B82F6" size="tiny" glowIntensity={35} />
                      <span className="text-sm font-bold text-blue-400">Notes du coach</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{station.coachNotes}</p>
                  </div>
                )}

                {/* Équipement */}
                {station.equipment && station.equipment.length > 0 && (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.25)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GlowIcon icon="Package" color="#8B5CF6" size="tiny" glowIntensity={35} />
                      <span className="text-sm font-bold text-purple-400">Équipement</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {station.equipment.map((item, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton de completion */}
          <div className="pt-2">
            <TrainingButton
              variant="primary"
              size="lg"
              icon="Check"
              iconPosition="right"
              onClick={onComplete}
              fullWidth
              stepColor={disciplineColor}
            >
              Station terminée
            </TrainingButton>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default CompetitionStationCard;
