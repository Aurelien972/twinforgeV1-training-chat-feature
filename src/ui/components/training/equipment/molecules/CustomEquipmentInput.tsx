/**
 * CustomEquipmentInput Component
 * Input for adding custom equipment
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';

interface CustomEquipmentInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}

const CustomEquipmentInput: React.FC<CustomEquipmentInputProps> = ({
  value,
  onChange,
  onAdd,
  disabled = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-cyan-400/30">
      <h4 className="text-white text-sm font-medium mb-3">Ajouter un équipement personnalisé</h4>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: TRX, Battle rope..."
          disabled={disabled}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-50"
        />
        <motion.button
          type="button"
          onClick={onAdd}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SpatialIcon Icon={ICONS.Check} size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default CustomEquipmentInput;
