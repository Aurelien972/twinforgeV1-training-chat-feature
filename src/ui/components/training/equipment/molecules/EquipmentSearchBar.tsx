/**
 * EquipmentSearchBar Component
 * Search input for filtering equipment
 */

import React from 'react';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';

interface EquipmentSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EquipmentSearchBar: React.FC<EquipmentSearchBarProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Rechercher un équipement...'
}) => {
  return (
    <div className="flex-1 relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <SpatialIcon Icon={ICONS.Search} size={18} className="text-white/40" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-11 pr-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
      />
    </div>
  );
};

export default EquipmentSearchBar;
