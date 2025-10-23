/**
 * Competition Prescription Card
 * Displays HYROX/DEKA style sessions with stations, times, and pacing
 */

import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { MuscleGroupsBadges } from '../shared';

interface Station {
  id: string;
  stationNumber: number;
  stationType: 'cardio' | 'strength' | 'hybrid';
  name: string;
  equipment: string[];
  muscleGroups?: string[];
  prescription: string;
  targetTime: number;
  targetPace?: string;
  intensity: string;
  rpeTarget: number;
  transitionTime: number;
  executionCues: string[];
  pacingStrategy: string;
  coachNotes: string;
  substitutions: string[];
}

interface CompetitionPrescriptionCardProps {
  sessionName: string;
  competitionFormat: string;
  stations: Station[];
  pacingPlan: {
    overall: string;
    runPacing?: string;
    stationApproach: string;
    transitionGoal: string;
  };
  expectedRpe: number;
  expectedIntensity: string;
  durationTarget: number;
  onStationClick?: (stationId: string) => void;
  disciplineColor?: string;
}

const CompetitionPrescriptionCard: React.FC<CompetitionPrescriptionCardProps> = ({
  sessionName,
  competitionFormat,
  stations,
  pacingPlan,
  expectedRpe,
  expectedIntensity,
  durationTarget,
  onStationClick,
  disciplineColor = '#F59E0B'
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntensityColor = (intensity: string): string => {
    switch (intensity) {
      case 'low':
        return '#22C55E';
      case 'moderate':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      default:
        return disciplineColor;
    }
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

  const totalTime = stations.reduce((sum, s) => sum + s.targetTime + s.transitionTime, 0);

  return (
    <GlassCard
      className="space-y-6"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, color-mix(in srgb, ${disciplineColor} 12%, transparent) 0%, transparent 60%),
          rgba(255, 255, 255, 0.08)
        `,
        border: `2px solid color-mix(in srgb, ${disciplineColor} 25%, transparent)`,
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 0 1px color-mix(in srgb, ${disciplineColor} 20%, transparent),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, color-mix(in srgb, ${disciplineColor} 40%, transparent) 0%, transparent 70%),
                rgba(255, 255, 255, 0.12)
              `,
              border: `2px solid color-mix(in srgb, ${disciplineColor} 50%, transparent)`,
              boxShadow: `
                0 4px 24px color-mix(in srgb, ${disciplineColor} 35%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            }}
          >
            <SpatialIcon
              Icon={ICONS.Trophy}
              size={26}
              variant="pure"
              style={{
                color: disciplineColor,
                filter: `drop-shadow(0 0 16px color-mix(in srgb, ${disciplineColor} 80%, transparent))`
              }}
            />
          </div>
          <div>
            <h3
              className="text-xl font-bold mb-1"
              style={{
                color: disciplineColor,
                textShadow: `0 0 20px color-mix(in srgb, ${disciplineColor} 50%, transparent)`
              }}
            >
              {sessionName}
            </h3>
            <div className="flex items-center gap-2 text-sm opacity-70">
              <span className="capitalize">{competitionFormat}</span>
              <span>•</span>
              <span>{stations.length} station{stations.length > 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{Math.round(totalTime / 60)} min</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{
              background: `color-mix(in srgb, ${disciplineColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${disciplineColor} 30%, transparent)`,
              color: disciplineColor
            }}
          >
            RPE {expectedRpe}
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-sm font-semibold capitalize"
            style={{
              background: `color-mix(in srgb, ${getIntensityColor(expectedIntensity)} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${getIntensityColor(expectedIntensity)} 30%, transparent)`,
              color: getIntensityColor(expectedIntensity)
            }}
          >
            {expectedIntensity}
          </div>
        </div>
      </div>

      <div
        className="p-4 rounded-xl space-y-2"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <SpatialIcon Icon={ICONS.Target} size={18} variant="pure" style={{ color: disciplineColor }} />
          <span className="text-sm font-semibold" style={{ color: disciplineColor }}>
            Stratégie de rythme
          </span>
        </div>
        <div className="space-y-1 text-sm opacity-80">
          <div><strong>Global :</strong> {pacingPlan.overall}</div>
          {pacingPlan.runPacing && <div><strong>Allure course :</strong> {pacingPlan.runPacing}</div>}
          <div><strong>Approche stations :</strong> {pacingPlan.stationApproach}</div>
          <div><strong>Objectif transitions :</strong> {pacingPlan.transitionGoal}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <SpatialIcon Icon={ICONS.ListOrdered} size={18} variant="pure" style={{ color: disciplineColor }} />
          <span className="text-sm font-semibold" style={{ color: disciplineColor }}>
            Stations ({stations.length})
          </span>
        </div>

        {stations.map((station, index) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onStationClick?.(station.id)}
            className="cursor-pointer"
          >
            <div
              className="p-4 rounded-xl hover:bg-white/5 transition-all"
              style={{
                background: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                    style={{
                      background: `color-mix(in srgb, ${disciplineColor} 20%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${disciplineColor} 40%, transparent)`,
                      color: disciplineColor
                    }}
                  >
                    {station.stationNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SpatialIcon
                        Icon={getStationTypeIcon(station.stationType)}
                        size={16}
                        variant="pure"
                        style={{ opacity: 0.7 }}
                      />
                      <span className="font-semibold">{station.name}</span>
                    </div>
                    <div className="text-sm opacity-70">{station.prescription}</div>

                    {/* Muscle Groups for strength/hybrid stations */}
                    {(station.stationType === 'strength' || station.stationType === 'hybrid') && station.muscleGroups && (
                      <div className="mt-2">
                        <MuscleGroupsBadges
                          muscleGroups={station.muscleGroups}
                          disciplineColor={disciplineColor}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg" style={{ color: disciplineColor }}>
                    {formatTime(station.targetTime)}
                  </div>
                  <div className="text-xs opacity-60">cible</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs mt-2">
                <div
                  className="px-2 py-1 rounded-md"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  RPE {station.rpeTarget}
                </div>
                {station.targetPace && (
                  <div
                    className="px-2 py-1 rounded-md"
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {station.targetPace}
                  </div>
                )}
                <div
                  className="px-2 py-1 rounded-md"
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Transition : {station.transitionTime}s
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-xs opacity-70 mb-1">
                  <strong>Rythme :</strong> {station.pacingStrategy}
                </div>
                <div className="text-xs opacity-70">
                  <strong>Coach :</strong> {station.coachNotes}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

export default CompetitionPrescriptionCard;
