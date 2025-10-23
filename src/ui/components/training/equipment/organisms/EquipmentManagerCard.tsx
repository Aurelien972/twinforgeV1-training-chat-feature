/**
 * EquipmentManagerCard Component - Refactored Organism
 * Central hub for managing training locations and equipment
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import GlassCard from '../../../../cards/GlassCard';
import GenericDrawer from '../../../GenericDrawer';
import { useToast } from '../../../ToastProvider';
import { useTrainingLocations } from '../../../../../hooks/useTrainingLocations';
import {
  addEquipmentToLocation,
  removeEquipmentFromLocation
} from '../../../../../system/services/trainingLocationService';
import {
  LocationSelector,
  EquipmentStatsGrid,
  EquipmentFilters,
  EquipmentList,
  EquipmentSelector,
  LocationCreationActions
} from '../molecules';
import {
  LocationEditorModal,
  CreateLocationManualModal,
  type LocationEditorData,
  type CreateLocationManualData
} from '../../location';
import { useEquipmentStats } from '../hooks';
import type { FilterType } from '../types';
import type { TrainingLocationWithDetails } from '../../../../../domain/trainingLocation';

interface EquipmentManagerCardProps {
  onLocationChange?: (location: TrainingLocationWithDetails) => void;
  disabled?: boolean;
}

const EquipmentManagerCard: React.FC<EquipmentManagerCardProps> = ({
  onLocationChange,
  disabled = false
}) => {
  const { showToast } = useToast();
  const { locations, loading, createNewLocation, refetchLocations } = useTrainingLocations();

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedEquipmentForAdd, setSelectedEquipmentForAdd] = useState<string[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) {
      return locations.find((loc) => loc.is_default) || locations[0] || null;
    }
    const found = locations.find((loc) => loc.id === selectedLocationId);
    if (!found && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
      return locations[0];
    }
    return found || null;
  }, [selectedLocationId, locations]);

  React.useEffect(() => {
    if (selectedLocation && onLocationChange) {
      onLocationChange(selectedLocation);
    }
  }, [selectedLocation, onLocationChange]);

  React.useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      const defaultLoc = locations.find((loc) => loc.is_default) || locations[0];
      setSelectedLocationId(defaultLoc.id);
    }
  }, [locations, selectedLocation]);

  const hasPhotos = selectedLocation?.photos.length > 0;

  const { stats, getFilteredEquipment } = useEquipmentStats({
    equipment: selectedLocation?.equipment || [],
    hasPhotos
  });

  const filteredEquipment = useMemo(() => {
    return getFilteredEquipment(selectedFilter, searchQuery);
  }, [getFilteredEquipment, selectedFilter, searchQuery]);

  const handleLocationSelect = (location: TrainingLocationWithDetails) => {
    setSelectedLocationId(location.id);
    if (onLocationChange) {
      onLocationChange(location);
    }
  };

  const handleRemoveEquipment = async (equipmentId: string, equipmentName: string) => {
    try {
      setIsDeleting(equipmentId);
      await removeEquipmentFromLocation(equipmentId);

      showToast({
        type: 'success',
        title: 'Équipement supprimé',
        message: `"${equipmentName}" a été retiré de votre lieu`,
        duration: 3000
      });

      await refetchLocations();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: "Impossible de supprimer l'équipement",
        duration: 4000
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddEquipment = async () => {
    if (!selectedLocation || selectedEquipmentForAdd.length === 0) return;

    try {
      const existingNames = selectedLocation.equipment.map((eq) =>
        eq.equipment_name.toLowerCase()
      );
      const newEquipment = selectedEquipmentForAdd.filter(
        (name) => !existingNames.includes(name.toLowerCase())
      );

      if (newEquipment.length === 0) {
        showToast({
          type: 'warning',
          title: 'Équipements déjà présents',
          message: 'Tous les équipements sélectionnés existent déjà',
          duration: 3000
        });
        return;
      }

      await addEquipmentToLocation(selectedLocation.id, newEquipment);

      showToast({
        type: 'success',
        title: 'Équipements ajoutés',
        message: `${newEquipment.length} équipement${newEquipment.length > 1 ? 's' : ''} ajouté${
          newEquipment.length > 1 ? 's' : ''
        }`,
        duration: 3000
      });

      setSelectedEquipmentForAdd([]);
      setIsDrawerOpen(false);
      await refetchLocations();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erreur',
        message: "Impossible d'ajouter les équipements",
        duration: 4000
      });
    }
  };

  const handleCreateScanLocation = async (locationData: LocationEditorData) => {
    const newLocation = await createNewLocation(locationData);
    setSelectedLocationId(newLocation.id);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
    return newLocation;
  };

  const handleCreateManualLocation = async (locationData: CreateLocationManualData) => {
    const newLocation = await createNewLocation(locationData);
    setSelectedLocationId(newLocation.id);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center">
          <SpatialIcon Icon={ICONS.Loader2} size={32} className="text-cyan-400 animate-spin" />
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard
        className="space-y-4 p-4"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 60%),
            var(--glass-opacity)
          `,
          borderColor: 'rgba(6, 182, 212, 0.2)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `
                  radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.35) 0%, transparent 60%),
                  rgba(255, 255, 255, 0.12)
                `,
                border: '2px solid rgba(6, 182, 212, 0.5)',
                boxShadow: `
                  0 4px 16px rgba(6, 182, 212, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
            >
              <SpatialIcon
                Icon={ICONS.Dumbbell}
                size={24}
                style={{
                  color: '#06B6D4',
                  filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.7))'
                }}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Mes Équipements</h3>
              <p className="text-white/60 text-xs mt-0.5">
                {locations.length} lieu{locations.length > 1 ? 'x' : ''} configuré
                {locations.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Location Selector */}
        <LocationSelector
          locations={locations}
          selectedLocation={selectedLocation}
          onSelect={handleLocationSelect}
          disabled={disabled}
        />

        {/* Equipment Section */}
        {selectedLocation && (
          <>
            {/* Statistics */}
            <EquipmentStatsGrid stats={stats} hasPhotos={hasPhotos} />

            {/* Filters and Search */}
            <EquipmentFilters
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              stats={stats}
              hasPhotos={hasPhotos}
            />

            {/* Equipment List */}
            <div className="space-y-3 mt-5">
              {filteredEquipment.length === 0 && stats.total > 0 ? (
                <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
                  <SpatialIcon
                    Icon={ICONS.Search}
                    size={32}
                    className="text-white/40 mx-auto mb-2"
                  />
                  <p className="text-white/60 text-sm">Aucun équipement trouvé</p>
                </div>
              ) : (
                <EquipmentList
                  equipment={filteredEquipment}
                  hasPhotos={hasPhotos}
                  onRemove={handleRemoveEquipment}
                  isDeleting={isDeleting}
                  disabled={disabled}
                />
              )}

              {/* Add Equipment Button */}
              <motion.button
                onClick={() => setIsDrawerOpen(true)}
                disabled={disabled}
                className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-white text-sm font-medium transition-all"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3)), rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(6, 182, 212, 0.5)',
                  boxShadow:
                    '0 4px 16px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer'
                }}
                whileHover={!disabled ? { scale: 1.01, y: -2 } : {}}
                whileTap={!disabled ? { scale: 0.99, y: 0 } : {}}
              >
                <SpatialIcon Icon={ICONS.Plus} size={16} />
                <span>Ajouter des équipements</span>
              </motion.button>
            </div>
          </>
        )}

        {/* Location Creation Actions */}
        <LocationCreationActions
          onScanLocation={() => setIsScanModalOpen(true)}
          onCreateLocation={() => setIsCreateModalOpen(true)}
          disabled={disabled}
        />
      </GlassCard>

      {/* Drawer for Adding Equipment */}
      <GenericDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedEquipmentForAdd([]);
        }}
        title="Ajouter des équipements"
        size="full"
      >
        <div className="space-y-4 pb-24">
          {selectedLocation && (
            <EquipmentSelector
              locationType={selectedLocation.type}
              selectedEquipment={selectedEquipmentForAdd}
              onEquipmentChange={setSelectedEquipmentForAdd}
              color="#06B6D4"
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-md border-t border-white/10">
          <div className="flex gap-3">
            <motion.button
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedEquipmentForAdd([]);
              }}
              className="flex-1 py-3 rounded-lg text-white text-sm font-medium transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Annuler
            </motion.button>
            <motion.button
              onClick={handleAddEquipment}
              disabled={selectedEquipmentForAdd.length === 0}
              className="flex-1 py-3 rounded-lg text-white text-sm font-medium transition-all"
              style={{
                background:
                  selectedEquipmentForAdd.length === 0
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3)), rgba(255, 255, 255, 0.1)',
                border:
                  selectedEquipmentForAdd.length === 0
                    ? '2px solid rgba(255, 255, 255, 0.2)'
                    : '2px solid rgba(34, 197, 94, 0.5)',
                boxShadow:
                  selectedEquipmentForAdd.length === 0
                    ? 'none'
                    : '0 4px 16px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                opacity: selectedEquipmentForAdd.length === 0 ? 0.5 : 1,
                cursor: selectedEquipmentForAdd.length === 0 ? 'not-allowed' : 'pointer'
              }}
              whileHover={selectedEquipmentForAdd.length > 0 ? { scale: 1.02, y: -2 } : {}}
              whileTap={selectedEquipmentForAdd.length > 0 ? { scale: 0.98, y: 0 } : {}}
            >
              Ajouter {selectedEquipmentForAdd.length > 0 && `(${selectedEquipmentForAdd.length})`}
            </motion.button>
          </div>
        </div>
      </GenericDrawer>

      {/* Scan Location Modal */}
      <LocationEditorModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSave={handleCreateScanLocation}
        mode="create"
      />

      {/* Create Location Manual Modal */}
      <CreateLocationManualModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateManualLocation}
      />
    </>
  );
};

export default EquipmentManagerCard;
