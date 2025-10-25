/**
 * Discipline Preferences Selector with Default Selection
 * Multi-select discipline component for ProfileTrainingTab
 * Supports default discipline selection with visual indicators
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../../cards/GlassCard';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import type { AgentType } from '../../../../domain/ai/trainingAiTypes';
import { useConditionalAnimation } from '../../../../lib/motion/useConditionalAnimation';

interface DisciplineOption {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof ICONS;
  color: string;
  coachType: AgentType;
  category: 'force' | 'endurance' | 'calisthenics' | 'functional' | 'competitions';
}

const DISCIPLINE_OPTIONS: DisciplineOption[] = [
  // Force
  { id: 'strength', label: 'Musculation', description: 'Force générale et hypertrophie', icon: 'Dumbbell', color: '#EC4899', coachType: 'coach-force', category: 'force' },
  { id: 'powerlifting', label: 'Powerlifting', description: 'Squat, Bench, Deadlift', icon: 'Weight', color: '#DC2626', coachType: 'coach-force', category: 'force' },
  { id: 'bodybuilding', label: 'Bodybuilding', description: 'Esthétique et volume', icon: 'Muscle', color: '#F97316', coachType: 'coach-force', category: 'force' },
  { id: 'strongman', label: 'Strongman', description: 'Force athlétique extrême', icon: 'Hammer', color: '#EF4444', coachType: 'coach-force', category: 'force' },

  // Endurance
  { id: 'running', label: 'Course à pied', description: 'Running et trail', icon: 'PersonRunning', color: '#3B82F6', coachType: 'coach-endurance', category: 'endurance' },
  { id: 'cycling', label: 'Cyclisme', description: 'Route et VTT', icon: 'Bike', color: '#06B6D4', coachType: 'coach-endurance', category: 'endurance' },
  { id: 'swimming', label: 'Natation', description: 'Piscine et eau libre', icon: 'Waves', color: '#0EA5E9', coachType: 'coach-endurance', category: 'endurance' },
  { id: 'triathlon', label: 'Triathlon', description: 'Natation, vélo, course', icon: 'Trophy', color: '#8B5CF6', coachType: 'coach-endurance', category: 'endurance' },

  // Calisthenics
  { id: 'calisthenics', label: 'Calisthenics', description: 'Street workout avancé', icon: 'User', color: '#10B981', coachType: 'coach-calisthenics', category: 'calisthenics' },
  { id: 'street-workout', label: 'Street Workout', description: 'Skills et freestyle', icon: 'Zap', color: '#14B8A6', coachType: 'coach-calisthenics', category: 'calisthenics' },

  // Functional
  { id: 'functional', label: 'Functional Fitness', description: 'CrossFit et WODs', icon: 'Activity', color: '#F59E0B', coachType: 'coach-functional', category: 'functional' },

  // Competitions
  { id: 'hyrox', label: 'HYROX', description: 'Course + stations force', icon: 'Medal', color: '#F97316', coachType: 'coach-competitions', category: 'competitions' },
  { id: 'deka', label: 'DEKA', description: '10 zones d\'épreuves', icon: 'Trophy', color: '#EF4444', coachType: 'coach-competitions', category: 'competitions' },
];

const CATEGORY_LABELS: Record<string, string> = {
  force: 'Force & Muscle',
  endurance: 'Endurance & Cardio',
  calisthenics: 'Calisthenics & Street',
  functional: 'Functional Training',
  competitions: 'Compétitions',
};

interface DisciplinePreferencesSelectorProps {
  selectedDisciplines: string[];
  defaultDiscipline: string | null;
  onDisciplinesChange: (disciplines: string[]) => void;
  onDefaultChange: (disciplineId: string) => void;
  stepColor?: string;
}

export const DisciplinePreferencesSelector: React.FC<DisciplinePreferencesSelectorProps> = ({
  selectedDisciplines,
  defaultDiscipline,
  onDisciplinesChange,
  onDefaultChange,
  stepColor = '#EC4899'
}) => {
  const shouldAnimate = useConditionalAnimation();
  const [localSelected, setLocalSelected] = useState<string[]>(selectedDisciplines);
  const [localDefault, setLocalDefault] = useState<string | null>(defaultDiscipline);

  useEffect(() => {
    setLocalSelected(selectedDisciplines);
  }, [selectedDisciplines]);

  useEffect(() => {
    setLocalDefault(defaultDiscipline);
  }, [defaultDiscipline]);

  const handleDisciplineToggle = (disciplineId: string) => {
    let newSelected: string[];

    if (localSelected.includes(disciplineId)) {
      if (localSelected.length === 1) {
        return;
      }
      newSelected = localSelected.filter(id => id !== disciplineId);

      if (localDefault === disciplineId && newSelected.length > 0) {
        const newDefault = newSelected[0];
        setLocalDefault(newDefault);
        onDefaultChange(newDefault);
      }
    } else {
      newSelected = [...localSelected, disciplineId];
    }

    setLocalSelected(newSelected);
    onDisciplinesChange(newSelected);
  };

  const handleSetDefault = (disciplineId: string) => {
    if (!localSelected.includes(disciplineId)) return;
    setLocalDefault(disciplineId);
    onDefaultChange(disciplineId);
  };

  const groupedDisciplines = DISCIPLINE_OPTIONS.reduce((acc, discipline) => {
    if (!acc[discipline.category]) {
      acc[discipline.category] = [];
    }
    acc[discipline.category].push(discipline);
    return acc;
  }, {} as Record<string, DisciplineOption[]>);

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <GlassCard
        className="p-4"
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 border border-blue-500/30">
            <SpatialIcon Icon={ICONS.Info} size={20} style={{ color: '#3B82F6' }} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              Disciplines Pratiquées
            </h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Sélectionnez toutes les disciplines que vous pratiquez. L'étoile ⭐ indique votre discipline principale,
              qui sera présélectionnée lors de la création d'un programme.
              <strong className="text-white/80"> Vous choisirez ensuite une discipline spécifique</strong> pour chaque séance d'entraînement.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Selected Count */}
      {localSelected.length > 0 && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
          className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5 border border-white/10"
        >
          <span className="text-sm text-white/70">
            {localSelected.length} discipline{localSelected.length > 1 ? 's' : ''} sélectionnée{localSelected.length > 1 ? 's' : ''}
          </span>
          {localDefault && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Par défaut:</span>
              <span className="text-sm font-semibold text-white">
                {DISCIPLINE_OPTIONS.find(d => d.id === localDefault)?.label}
              </span>
              <span className="text-base">⭐</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Discipline Grid by Category */}
      {Object.entries(groupedDisciplines).map(([category, disciplines]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider px-1">
            {CATEGORY_LABELS[category]}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {disciplines.map((discipline) => {
              const isSelected = localSelected.includes(discipline.id);
              const isDefault = localDefault === discipline.id;

              return (
                <motion.div
                  key={discipline.id}
                  initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : false}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
                  whileHover={shouldAnimate ? { scale: 1.02 } : {}}
                  whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                >
                  <GlassCard
                    className="p-4 cursor-pointer transition-all"
                    style={{
                      background: isSelected
                        ? `radial-gradient(circle at 30% 20%, ${discipline.color}15 0%, transparent 60%), rgba(255, 255, 255, 0.08)`
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected
                        ? `2px solid ${discipline.color}50`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected
                        ? `0 0 20px ${discipline.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                    onClick={() => handleDisciplineToggle(discipline.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected
                            ? `${discipline.color}20`
                            : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected
                            ? `2px solid ${discipline.color}60`
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <SpatialIcon
                          Icon={ICONS[discipline.icon]}
                          size={24}
                          style={{
                            color: isSelected ? discipline.color : '#ffffff80',
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white">
                            {discipline.label}
                          </h4>
                          {isDefault && (
                            <span className="text-base" title="Discipline par défaut">
                              ⭐
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {discipline.description}
                        </p>
                      </div>

                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-6 h-6 rounded border-2 flex items-center justify-center"
                          style={{
                            borderColor: isSelected ? discipline.color : 'rgba(255, 255, 255, 0.3)',
                            background: isSelected ? `${discipline.color}30` : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <SpatialIcon
                              Icon={ICONS.Check}
                              size={16}
                              style={{ color: discipline.color }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Set as Default Button */}
                    {isSelected && !isDefault && (
                      <motion.button
                        initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
                        animate={shouldAnimate ? { opacity: 1, height: 'auto' } : {}}
                        className="mt-3 pt-3 border-t border-white/10 w-full text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(discipline.id);
                        }}
                      >
                        <div className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
                          <SpatialIcon Icon={ICONS.Star} size={14} />
                          <span>Définir par défaut</span>
                        </div>
                      </motion.button>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DisciplinePreferencesSelector;
