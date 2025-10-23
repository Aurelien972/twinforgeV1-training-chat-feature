/**
 * EquipmentList Component
 * Display list of equipment with badges
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { EquipmentChip } from '../atoms';
import { getEquipmentBadge } from '../utils';

interface EquipmentListProps {
  equipment: any[];
  hasPhotos: boolean;
  onRemove?: (equipmentId: string, equipmentName: string) => void;
  isDeleting?: string | null;
  disabled?: boolean;
}

const EquipmentList: React.FC<EquipmentListProps> = ({
  equipment,
  hasPhotos,
  onRemove,
  isDeleting,
  disabled = false
}) => {
  if (equipment.length === 0) {
    return (
      <div className="p-8 rounded-xl border-2 border-dashed border-white/20 bg-white/5 text-center">
        <SpatialIcon Icon={ICONS.Package} size={48} className="text-white/40 mx-auto mb-3" />
        <h4 className="text-white font-medium mb-2">Aucun équipement</h4>
        <p className="text-white/60 text-sm mb-4">
          Ajoutez vos équipements disponibles pour personnaliser vos programmes
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      <AnimatePresence mode="popLayout">
        {equipment.map((eq) => {
          const badge = getEquipmentBadge(eq.is_custom, hasPhotos);
          const isDeleting_ = isDeleting === eq.id;

          return (
            <motion.div
              key={eq.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <EquipmentChip
                label={eq.equipment_name}
                isCustom={eq.is_custom}
                color={badge.color}
                onRemove={
                  disabled || isDeleting_ || !onRemove
                    ? undefined
                    : () => onRemove(eq.id, eq.equipment_name)
                }
                disabled={disabled || isDeleting_}
              />
              {!eq.is_custom && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: badge.color,
                    boxShadow: `0 0 8px ${badge.color}60`,
                    border: '1px solid white'
                  }}
                >
                  <SpatialIcon Icon={badge.icon} size={10} className="text-white" />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default EquipmentList;
