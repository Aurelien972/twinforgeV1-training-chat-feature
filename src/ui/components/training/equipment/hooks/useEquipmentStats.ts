/**
 * useEquipmentStats Hook
 * Calculates equipment statistics for filtering and display
 */

import { useMemo } from 'react';
import type { EquipmentStats, FilterType } from '../types';

interface UseEquipmentStatsProps {
  equipment: any[];
  hasPhotos: boolean;
}

export function useEquipmentStats({ equipment, hasPhotos }: UseEquipmentStatsProps) {
  const stats: EquipmentStats = useMemo(() => {
    const ai = equipment.filter((eq) => !eq.is_custom && hasPhotos).length;
    const manual = equipment.filter((eq) => !eq.is_custom && !hasPhotos).length;
    const custom = equipment.filter((eq) => eq.is_custom).length;

    return {
      ai,
      manual,
      custom,
      total: equipment.length
    };
  }, [equipment, hasPhotos]);

  const getFilteredEquipment = useMemo(() => {
    return (filter: FilterType, searchQuery?: string) => {
      let filtered = equipment;

      if (filter === 'ai') {
        filtered = filtered.filter((eq) => !eq.is_custom && hasPhotos);
      } else if (filter === 'manual') {
        filtered = filtered.filter((eq) => !eq.is_custom && !hasPhotos);
      } else if (filter === 'custom') {
        filtered = filtered.filter((eq) => eq.is_custom);
      }

      if (searchQuery?.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((eq) =>
          eq.equipment_name.toLowerCase().includes(query)
        );
      }

      return filtered;
    };
  }, [equipment, hasPhotos]);

  return {
    stats,
    getFilteredEquipment
  };
}
