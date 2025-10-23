/**
 * EquipmentStatsGrid Component
 * Display equipment statistics in a grid
 */

import React from 'react';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import type { EquipmentStats } from '../types';

interface EquipmentStatsGridProps {
  stats: EquipmentStats;
  hasPhotos: boolean;
}

const EquipmentStatsGrid: React.FC<EquipmentStatsGridProps> = ({ stats, hasPhotos }) => {
  if (stats.total === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-white/80 text-sm font-medium mb-3">Statistiques</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {hasPhotos && stats.ai > 0 && (
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
            <div className="text-cyan-300 text-xs mb-1 flex items-center gap-1">
              <SpatialIcon Icon={ICONS.Sparkles} size={10} />
              <span>Détectés par IA</span>
            </div>
            <div className="text-cyan-200 text-xl font-bold">{stats.ai}</div>
          </div>
        )}
        {!hasPhotos && stats.manual > 0 && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
            <div className="text-blue-300 text-xs mb-1 flex items-center gap-1">
              <SpatialIcon Icon={ICONS.List} size={10} />
              <span>Manuels</span>
            </div>
            <div className="text-blue-200 text-xl font-bold">{stats.manual}</div>
          </div>
        )}
        {stats.custom > 0 && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/20">
            <div className="text-green-300 text-xs mb-1 flex items-center gap-1">
              <SpatialIcon Icon={ICONS.Plus} size={10} />
              <span>Personnalisés</span>
            </div>
            <div className="text-green-200 text-xl font-bold">{stats.custom}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentStatsGrid;
