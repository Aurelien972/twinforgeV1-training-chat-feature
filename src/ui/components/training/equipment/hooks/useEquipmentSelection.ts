/**
 * useEquipmentSelection Hook
 * Manages equipment selection state and operations
 */

import { useCallback } from 'react';

interface UseEquipmentSelectionProps {
  selectedEquipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
  disabled?: boolean;
}

export function useEquipmentSelection({
  selectedEquipment,
  onEquipmentChange,
  disabled = false
}: UseEquipmentSelectionProps) {
  const toggleEquipment = useCallback(
    (equipmentId: string) => {
      if (disabled) return;

      if (selectedEquipment.includes(equipmentId)) {
        onEquipmentChange(selectedEquipment.filter((id) => id !== equipmentId));
      } else {
        onEquipmentChange([...selectedEquipment, equipmentId]);
      }
    },
    [disabled, selectedEquipment, onEquipmentChange]
  );

  const addEquipment = useCallback(
    (equipmentId: string) => {
      if (disabled || selectedEquipment.includes(equipmentId)) return;
      onEquipmentChange([...selectedEquipment, equipmentId]);
    },
    [disabled, selectedEquipment, onEquipmentChange]
  );

  const removeEquipment = useCallback(
    (equipmentId: string) => {
      if (disabled) return;
      onEquipmentChange(selectedEquipment.filter((id) => id !== equipmentId));
    },
    [disabled, selectedEquipment, onEquipmentChange]
  );

  const clearSelection = useCallback(() => {
    if (disabled) return;
    onEquipmentChange([]);
  }, [disabled, onEquipmentChange]);

  const isSelected = useCallback(
    (equipmentId: string) => selectedEquipment.includes(equipmentId),
    [selectedEquipment]
  );

  return {
    toggleEquipment,
    addEquipment,
    removeEquipment,
    clearSelection,
    isSelected,
    selectedCount: selectedEquipment.length
  };
}
