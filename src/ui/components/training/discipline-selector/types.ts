/**
 * Types for Discipline Selector Modal
 */

import type { IconName } from '../../../icons/registry';
import type { AgentType } from '../../../../domain/ai/trainingAiTypes';

export interface Discipline {
  value: string;
  label: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  icon: IconName;
  coachType: AgentType;
  available: boolean;
  isNew?: boolean;
}

export interface DisciplineCategory {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: IconName;
  coachType: AgentType;
  disciplines: Discipline[];
}

export interface DisciplineSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDiscipline: string | null;
  profileDiscipline?: string | null;
  onDisciplineChange?: (discipline: string, coachType: AgentType) => void;
  onSelect?: (discipline: string, coachType: AgentType) => void;
  initialCategoryId?: string | null;
}

export interface DisciplineCardProps {
  discipline: Discipline;
  isSelected: boolean;
  isProfileDefault: boolean;
  onClick: () => void;
}

export interface CategorySectionProps {
  category: DisciplineCategory;
  currentDiscipline: string | null;
  profileDiscipline: string | null;
  onDisciplineClick: (discipline: Discipline) => void;
  isExpanded: boolean;
  onToggle: () => void;
}
