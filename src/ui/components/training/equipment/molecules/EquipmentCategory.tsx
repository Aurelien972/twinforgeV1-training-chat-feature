/**
 * EquipmentCategory Component
 * Display a category of equipment items with selection
 */

import React from 'react';
import { EquipmentChip } from '../atoms';
import { ICONS } from '../../../../icons/registry';
import type { EquipmentCategory as EquipmentCategoryType } from '../types';

interface EquipmentCategoryProps {
  category: EquipmentCategoryType;
  selectedEquipment: string[];
  onToggle: (equipmentId: string) => void;
  color: string;
  disabled?: boolean;
}

const EquipmentCategory: React.FC<EquipmentCategoryProps> = ({
  category,
  selectedEquipment,
  onToggle,
  color,
  disabled = false
}) => {
  const categorySelectedCount = category.equipment.filter((eq) =>
    selectedEquipment.includes(eq.id)
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-white/90 text-sm font-semibold flex items-center gap-2">
          {category.label}
          {categorySelectedCount > 0 && (
            <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
              {categorySelectedCount}
            </span>
          )}
        </h5>
        <span className="text-xs text-white/50">
          {category.equipment.length} équipement{category.equipment.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {category.equipment.map((equipment) => (
          <EquipmentChip
            key={equipment.id}
            label={equipment.label}
            icon={equipment.icon}
            isSelected={selectedEquipment.includes(equipment.id)}
            onClick={() => onToggle(equipment.id)}
            color={color}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default EquipmentCategory;
