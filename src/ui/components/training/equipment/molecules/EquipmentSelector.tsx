/**
 * EquipmentSelector Component - Refactored
 * Equipment selection with search and custom equipment support
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { EquipmentChip } from '../atoms';
import EquipmentSearchBar from './EquipmentSearchBar';
import CustomEquipmentInput from './CustomEquipmentInput';
import EquipmentCategory from './EquipmentCategory';
import { useEquipmentSelection, useEquipmentFiltering } from '../hooks';
import type { EquipmentSelectorProps } from '../types';
import { getEquipmentCategoriesByLocationType } from '../../../../../system/store/trainingPipeline/constants';
import { DEFAULT_EQUIPMENT_COLOR } from '../constants';

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  locationType,
  selectedEquipment,
  onEquipmentChange,
  disabled = false,
  color = DEFAULT_EQUIPMENT_COLOR
}) => {
  const [customEquipment, setCustomEquipment] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const equipmentCategories = useMemo(
    () => getEquipmentCategoriesByLocationType(locationType),
    [locationType]
  );

  const allEquipment = useMemo(
    () => equipmentCategories.flatMap((cat) => cat.equipment),
    [equipmentCategories]
  );

  const { toggleEquipment } = useEquipmentSelection({
    selectedEquipment,
    onEquipmentChange,
    disabled
  });

  const { searchQuery, setSearchQuery, filteredCategories, customEquipmentList } =
    useEquipmentFiltering({
      categories: equipmentCategories,
      allEquipment,
      selectedEquipment
    });

  const addCustomEquipment = () => {
    const trimmed = customEquipment.trim();
    if (!trimmed) return;

    if (selectedEquipment.includes(trimmed)) {
      alert('Cet équipement est déjà ajouté');
      return;
    }

    onEquipmentChange([...selectedEquipment, trimmed]);
    setCustomEquipment('');
    setShowCustomInput(false);
  };

  const removeCustomEquipment = (equipment: string) => {
    onEquipmentChange(selectedEquipment.filter((eq) => eq !== equipment));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <EquipmentSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          disabled={disabled}
        />

        <motion.button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border transition-all ${
            showCustomInput
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
              : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <div className="flex items-center gap-2">
            <SpatialIcon Icon={ICONS.Plus} size={18} />
            <span className="text-sm font-medium">Custom</span>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CustomEquipmentInput
              value={customEquipment}
              onChange={setCustomEquipment}
              onAdd={addCustomEquipment}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {customEquipmentList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white/80 text-sm font-medium flex items-center gap-2">
            Équipements personnalisés
            <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">
              {customEquipmentList.length}
            </span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {customEquipmentList.map((equipment) => (
              <EquipmentChip
                key={equipment}
                label={equipment}
                isSelected={true}
                isCustom={true}
                onRemove={() => removeCustomEquipment(equipment)}
                color={color}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-white/80 text-sm font-medium">Équipements prédéfinis</h4>
          {selectedEquipment.length > 0 && (
            <span className="text-xs text-white/60">
              {selectedEquipment.length} sélectionné(s)
            </span>
          )}
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-lg bg-white/5">
            <SpatialIcon Icon={ICONS.Search} size={32} className="text-white/30 mx-auto mb-2" />
            <p className="text-white/50 text-sm">Aucun équipement trouvé</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <EquipmentCategory
                key={category.id}
                category={category}
                selectedEquipment={selectedEquipment}
                onToggle={toggleEquipment}
                color={color}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>

      {selectedEquipment.length === 0 && (
        <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-400/20">
          <div className="flex items-start gap-3">
            <SpatialIcon
              Icon={ICONS.AlertCircle}
              size={18}
              className="text-amber-400 mt-0.5 flex-shrink-0"
            />
            <div className="text-sm text-amber-200">
              <p className="font-medium">Sélectionnez au moins un équipement</p>
              <p className="text-amber-300/90 text-xs mt-1">
                La Forge utilisera ces équipements pour créer vos programmes personnalisés
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentSelector;
