/**
 * EquipmentFilters Component
 * Filter buttons and search for equipment
 */

import React from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { FilterType, EquipmentStats } from '../types';

interface EquipmentFiltersProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: EquipmentStats;
  hasPhotos: boolean;
}

const EquipmentFilters: React.FC<EquipmentFiltersProps> = ({
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  stats,
  hasPhotos
}) => {
  if (stats.total === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-white/80 text-sm font-medium">Filtrer par type</h4>
      <div className="flex flex-wrap gap-2">
        <motion.button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedFilter === 'all'
              ? 'bg-white/20 text-white border-2 border-white/40'
              : 'bg-white/5 text-white/70 border-2 border-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Tous ({stats.total})
        </motion.button>
        {hasPhotos && stats.ai > 0 && (
          <motion.button
            onClick={() => onFilterChange('ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              selectedFilter === 'ai'
                ? 'bg-cyan-500/20 text-cyan-200 border-2 border-cyan-400/40'
                : 'bg-cyan-500/5 text-cyan-400/70 border-2 border-cyan-400/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SpatialIcon Icon={ICONS.Sparkles} size={10} />
            <span>IA</span>
          </motion.button>
        )}
        {!hasPhotos && stats.manual > 0 && (
          <motion.button
            onClick={() => onFilterChange('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              selectedFilter === 'manual'
                ? 'bg-blue-500/20 text-blue-200 border-2 border-blue-400/40'
                : 'bg-blue-500/5 text-blue-400/70 border-2 border-blue-400/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SpatialIcon Icon={ICONS.List} size={10} />
            <span>Manuels</span>
          </motion.button>
        )}
        {stats.custom > 0 && (
          <motion.button
            onClick={() => onFilterChange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              selectedFilter === 'custom'
                ? 'bg-green-500/20 text-green-200 border-2 border-green-400/40'
                : 'bg-green-500/5 text-green-400/70 border-2 border-green-400/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SpatialIcon Icon={ICONS.Plus} size={10} />
            <span>Personnalisés</span>
          </motion.button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SpatialIcon Icon={ICONS.Search} size={16} className="text-white/40" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un équipement..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors text-sm"
        />
      </div>
    </div>
  );
};

export default EquipmentFilters;
