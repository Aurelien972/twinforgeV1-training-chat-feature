/**
 * useEquipmentFiltering Hook
 * Manages equipment search and filtering logic
 */

import { useState, useMemo, useCallback } from 'react';
import type { EquipmentCategory } from '../types';

interface UseEquipmentFilteringProps {
  categories: EquipmentCategory[];
  allEquipment: any[];
  selectedEquipment: string[];
}

export function useEquipmentFiltering({
  categories,
  allEquipment,
  selectedEquipment
}: UseEquipmentFilteringProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        equipment: category.equipment.filter((eq) =>
          eq.label.toLowerCase().includes(query)
        )
      }))
      .filter((category) => category.equipment.length > 0);
  }, [categories, searchQuery]);

  const customEquipmentList = useMemo(() => {
    return selectedEquipment.filter(
      (eq) => !allEquipment.some((predef) => predef.id === eq || predef.label === eq)
    );
  }, [selectedEquipment, allEquipment]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredCategories,
    customEquipmentList,
    clearSearch,
    hasResults: filteredCategories.length > 0
  };
}
