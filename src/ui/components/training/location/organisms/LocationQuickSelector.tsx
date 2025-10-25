/**
 * LocationQuickSelector Component - Version Simplifiée
 * Sélection rapide d'un lieu d'entraînement avec affichage compact des équipements
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { EquipmentChip } from '../../equipment';
import { useTrainingLocations } from '../../../../../hooks/useTrainingLocations';
import type { LocationQuickSelectorProps } from '../types';
import { getLocationIcon, getLocationColor, getLocationLabel } from '../utils';

const LocationQuickSelector: React.FC<LocationQuickSelectorProps> = ({
  selectedLocationId,
  onLocationSelect,
  color = '#EC4899'
}) => {
  const { locations, loading } = useTrainingLocations();
  const navigate = useNavigate();
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);

  // Auto-expand newly selected location
  React.useEffect(() => {
    if (selectedLocationId && selectedLocationId !== expandedLocationId) {
      setExpandedLocationId(selectedLocationId);
    }
  }, [selectedLocationId]);

  const handleAddLocationClick = () => {
    // Naviguer vers l'onglet Training du profil
    navigate('/profile?tab=training');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <SpatialIcon Icon={ICONS.Loader2} size={28} variant="pure" className="text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="p-4 rounded-lg border-2 border-dashed border-cyan-400/30 bg-cyan-500/5">
        <div className="text-center space-y-3">
          <SpatialIcon Icon={ICONS.MapPin} size={40} variant="pure" className="text-cyan-400 mx-auto" />
          <div>
            <h4 className="text-white font-medium text-sm mb-1">Aucun lieu configuré</h4>
            <p className="text-white/60 text-xs">
              Créez votre premier lieu pour commencer
            </p>
          </div>
          <motion.button
            onClick={handleAddLocationClick}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-all"
            style={{
              background: `${color}20`,
              border: `2px solid ${color}50`,
              color: color
            }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <SpatialIcon Icon={ICONS.Plus} size={16} variant="pure" />
            <span>Créer un lieu</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Liste compacte des lieux */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {locations.map((location) => {
            const Icon = getLocationIcon(location.type);
            const locationColor = getLocationColor(location.type);
            const isSelected = selectedLocationId === location.id;
            const isExpanded = expandedLocationId === location.id;

            return (
              <motion.div
                key={location.id}
                className="rounded-lg transition-all cursor-pointer overflow-hidden"
                style={{
                  background: isSelected
                    ? `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 12%, transparent) 0%, transparent 60%), rgba(255, 255, 255, 0.06)`
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected
                    ? `2px solid color-mix(in srgb, ${color} 50%, transparent)`
                    : '2px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isSelected
                    ? `0 0 16px color-mix(in srgb, ${color} 25%, transparent)`
                    : 'none'
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  onLocationSelect(location);
                  setExpandedLocationId(isExpanded ? null : location.id);
                }}
              >
                <div className="p-3">
                  {/* Header compact */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${locationColor} 20%, transparent)`,
                        border: `1.5px solid color-mix(in srgb, ${locationColor} 35%, transparent)`
                      }}
                    >
                      <SpatialIcon Icon={Icon} size={18} variant="pure" style={{ color: locationColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {location.name || getLocationLabel(location.type)}
                        </h4>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: color,
                              boxShadow: `0 0 10px ${color}`
                            }}
                          >
                            <SpatialIcon Icon={ICONS.Check} size={10} variant="pure" className="text-white" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-white/50 text-xs">{getLocationLabel(location.type)}</span>
                        {location.equipment.length > 0 && (
                          <>
                            <span className="text-white/30 text-xs">•</span>
                            <span className="text-white/50 text-xs">
                              {location.equipment.length} équip.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {location.equipment.length > 0 && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLocationId(isExpanded ? null : location.id);
                        }}
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <SpatialIcon
                          Icon={isExpanded ? ICONS.ChevronUp : ICONS.ChevronDown}
                          size={14}
                          variant="pure"
                          className="text-white/60"
                        />
                      </motion.button>
                    )}
                  </div>

                  {/* Equipements (collapsible) */}
                  <AnimatePresence>
                    {isExpanded && location.equipment.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-white/10">
                          <div className="flex flex-wrap gap-1.5">
                            {location.equipment.slice(0, 6).map((eq) => (
                              <EquipmentChip
                                key={eq.id}
                                label={eq.equipment_name}
                                isCustom={eq.is_custom}
                                color={locationColor}
                                disabled
                                size="sm"
                              />
                            ))}
                            {location.equipment.length > 6 && (
                              <div className="px-2 py-1 rounded-md bg-white/5 text-white/50 text-xs">
                                +{location.equipment.length - 6}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bouton Ajouter un lieu */}
      <motion.button
        onClick={handleAddLocationClick}
        className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
        style={{
          background: `${color}20`,
          border: `2px solid ${color}50`,
          color: color
        }}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99 }}
      >
        <SpatialIcon Icon={ICONS.Plus} size={16} variant="pure" />
        <span>Ajouter un lieu</span>
      </motion.button>

      {/* Info: Les équipements dépendent du lieu */}
      {selectedLocationId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.08)), rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}
        >
          <div className="flex items-start gap-2">
            <SpatialIcon Icon={ICONS.Info} size={14} variant="pure" className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-cyan-300/80 text-xs leading-relaxed">
              Les équipements disponibles sont automatiquement liés au lieu sélectionné
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LocationQuickSelector;
