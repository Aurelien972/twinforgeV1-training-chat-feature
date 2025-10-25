/**
 * Filtered Discipline Selector for Step 1
 * Only shows disciplines from user's preferred_disciplines
 * Includes "Add Discipline" button to navigate to Profile
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SpatialIcon from '../../../icons/SpatialIcon';
import { ICONS } from '../../../icons/registry';
import { DISCIPLINE_CATEGORIES } from './constants';
import type { AgentType } from '../../../../domain/ai/trainingAiTypes';

interface FilteredDisciplineSelectorProps {
  preferredDisciplines: string[];
  defaultDiscipline: string | null;
  selectedDiscipline: string;
  onDisciplineChange: (discipline: string, coachType: AgentType) => void;
  stepColor?: string;
}

const FilteredDisciplineSelector: React.FC<FilteredDisciplineSelectorProps> = ({
  preferredDisciplines,
  defaultDiscipline,
  selectedDiscipline,
  onDisciplineChange,
  stepColor = '#EC4899',
}) => {
  const navigate = useNavigate();

  const filteredCategories = useMemo(() => {
    if (!preferredDisciplines || preferredDisciplines.length === 0) {
      return [];
    }

    return DISCIPLINE_CATEGORIES.map(category => ({
      ...category,
      disciplines: category.disciplines.filter(d =>
        preferredDisciplines.includes(d.value)
      ),
    })).filter(cat => cat.disciplines.length > 0);
  }, [preferredDisciplines]);

  const availableDisciplines = useMemo(() => {
    return filteredCategories.flatMap(cat => cat.disciplines);
  }, [filteredCategories]);

  const handleDisciplineSelect = (disciplineId: string, coachType: AgentType) => {
    onDisciplineChange(disciplineId, coachType);
  };

  const handleAddDiscipline = () => {
    navigate('/profile', { state: { openTab: 'training', scrollTo: 'disciplines' } });
  };

  if (preferredDisciplines.length === 0) {
    return (
      <div className="text-center py-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{
            background: `${stepColor}20`,
            border: `2px solid ${stepColor}40`,
          }}
        >
          <SpatialIcon Icon={ICONS.AlertCircle} size={32} style={{ color: stepColor }} />
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">
          Aucune discipline sélectionnée
        </h4>
        <p className="text-white/60 text-sm mb-4">
          Vous devez d'abord sélectionner vos disciplines dans votre profil
        </p>
        <button
          onClick={handleAddDiscipline}
          className="px-6 py-3 rounded-lg font-semibold transition-all"
          style={{
            background: `${stepColor}20`,
            border: `2px solid ${stepColor}50`,
            color: stepColor,
          }}
        >
          <div className="flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Plus} size={18} />
            <span>Ajouter une discipline</span>
          </div>
        </button>
      </div>
    );
  }

  if (availableDisciplines.length === 1) {
    const discipline = availableDisciplines[0];
    const category = filteredCategories[0];

    return (
      <div className="space-y-4">
        <div
          className="p-4 rounded-lg"
          style={{
            background: `${category.color}10`,
            border: `2px solid ${category.color}30`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `${category.color}20`,
                border: `2px solid ${category.color}40`,
              }}
            >
              <SpatialIcon
                Icon={ICONS[discipline.icon as keyof typeof ICONS] || ICONS.Dumbbell}
                size={20}
                style={{ color: category.color }}
              />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold">{discipline.label}</h4>
              <p className="text-white/60 text-xs">{discipline.description}</p>
            </div>
            {defaultDiscipline === discipline.value && (
              <span className="text-lg" title="Discipline par défaut">
                ⭐
              </span>
            )}
          </div>
          <p className="text-white/50 text-xs">
            Vous n'avez qu'une seule discipline. Ajoutez-en d'autres pour plus de variété.
          </p>
        </div>

        <button
          onClick={handleAddDiscipline}
          className="w-full px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `${stepColor}15`,
            border: `1px solid ${stepColor}30`,
            color: `${stepColor}`,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <SpatialIcon Icon={ICONS.Plus} size={16} />
            <span>Ajouter une discipline</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {availableDisciplines.map(discipline => {
          const category = filteredCategories.find(cat =>
            cat.disciplines.some(d => d.value === discipline.value)
          );
          if (!category) return null;

          const isSelected = selectedDiscipline === discipline.value;
          const isDefault = defaultDiscipline === discipline.value;

          return (
            <motion.button
              key={discipline.value}
              onClick={() => handleDisciplineSelect(discipline.value, discipline.coachType)}
              className="p-4 rounded-xl transition-all text-left"
              style={{
                background: isSelected
                  ? `radial-gradient(circle at 30% 20%, ${category.color}25 0%, transparent 60%), rgba(255, 255, 255, 0.12)`
                  : `rgba(255, 255, 255, 0.05)`,
                border: isSelected
                  ? `2px solid ${category.color}60`
                  : `1px solid rgba(255, 255, 255, 0.1)`,
                boxShadow: isSelected
                  ? `0 0 20px ${category.color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isSelected
                      ? `${category.color}30`
                      : `rgba(255, 255, 255, 0.05)`,
                    border: isSelected
                      ? `2px solid ${category.color}60`
                      : `1px solid rgba(255, 255, 255, 0.1)`,
                  }}
                >
                  <SpatialIcon
                    Icon={ICONS[discipline.icon as keyof typeof ICONS] || ICONS.Dumbbell}
                    size={20}
                    style={{ color: isSelected ? category.color : '#ffffff80' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {discipline.label}
                    </h4>
                    {isDefault && (
                      <span className="text-base flex-shrink-0" title="Discipline par défaut">
                        ⭐
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                    {discipline.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: category.color }}
                >
                  <SpatialIcon Icon={ICONS.Check} size={14} />
                  <span>Sélectionné</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={handleAddDiscipline}
        className="w-full px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: `${stepColor}10`,
          border: `1px dashed ${stepColor}30`,
          color: `${stepColor}`,
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <SpatialIcon Icon={ICONS.Plus} size={16} />
          <span>Ajouter une discipline</span>
        </div>
      </button>
    </div>
  );
};

export default FilteredDisciplineSelector;
