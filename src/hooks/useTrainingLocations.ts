/**
 * useTrainingLocations Hook
 * Hook pour gérer l'état et les opérations sur les lieux d'entraînement
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserStore } from '../system/store/userStore';
import {
  fetchUserLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  setSelectedLocation as setSelectedLocationService,
  uploadLocationPhotos,
  deleteLocationPhoto as deleteLocationPhotoService,
  addEquipmentToLocation,
  removeEquipmentFromLocation,
  getSelectedLocation
} from '../system/services/trainingLocationService';
import type {
  TrainingLocationWithDetails,
  CreateLocationDTO,
  UpdateLocationDTO
} from '../domain/trainingLocation';
import logger from '../lib/utils/logger';

interface UseTrainingLocationsReturn {
  locations: TrainingLocationWithDetails[];
  selectedLocation: TrainingLocationWithDetails | null;
  loading: boolean;
  error: string | null;
  justCreatedLocationId: string | null;

  refetchLocations: () => Promise<void>;
  createNewLocation: (locationData: CreateLocationDTO) => Promise<TrainingLocationWithDetails>;
  updateExistingLocation: (locationId: string, updateData: UpdateLocationDTO) => Promise<void>;
  removeLocation: (locationId: string) => Promise<void>;
  selectLocationForGeneration: (locationId: string) => Promise<void>;
  addPhotosToLocation: (locationId: string, photos: File[]) => Promise<void>;
  removePhotoFromLocation: (photoId: string, photoUrl: string) => Promise<void>;
  addEquipment: (locationId: string, equipmentNames: string[]) => Promise<void>;
  removeEquipment: (equipmentId: string) => Promise<void>;
  clearJustCreated: () => void;
}

export function useTrainingLocations(): UseTrainingLocationsReturn {
  const { profile } = useUserStore();
  const userId = profile?.userId;

  const [locations, setLocations] = useState<TrainingLocationWithDetails[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<TrainingLocationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justCreatedLocationId, setJustCreatedLocationId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('justCreatedLocationId');
      const timestamp = sessionStorage.getItem('justCreatedLocationTimestamp');
      if (stored && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 2 * 60 * 1000) {
          return stored;
        } else {
          sessionStorage.removeItem('justCreatedLocationId');
          sessionStorage.removeItem('justCreatedLocationTimestamp');
        }
      }
    }
    return null;
  });

  const refetchLocations = useCallback(async () => {
    if (!userId) {
      setLocations([]);
      setSelectedLocation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [fetchedLocations, selected] = await Promise.all([
        fetchUserLocations(userId),
        getSelectedLocation(userId)
      ]);

      setLocations(fetchedLocations);
      setSelectedLocation(selected);

      logger.info('USE_TRAINING_LOCATIONS', 'Locations fetched successfully', {
        userId,
        locationsCount: fetchedLocations.length,
        hasSelected: !!selected
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch locations';
      setError(errorMessage);
      logger.error('USE_TRAINING_LOCATIONS', 'Failed to fetch locations', {
        userId,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetchLocations();
  }, [refetchLocations]);

  const createNewLocation = useCallback(
    async (locationData: CreateLocationDTO): Promise<TrainingLocationWithDetails> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      try {
        setError(null);
        const newLocation = await createLocation(userId, locationData);

        setLocations((prev) => [newLocation, ...prev]);

        await setSelectedLocationService(userId, newLocation.id);
        setSelectedLocation(newLocation);

        setJustCreatedLocationId(newLocation.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('justCreatedLocationId', newLocation.id);
          sessionStorage.setItem('justCreatedLocationTimestamp', Date.now().toString());
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Location created and auto-selected successfully', {
          userId,
          locationId: newLocation.id
        });

        return newLocation;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create location';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to create location', {
          userId,
          error: errorMessage
        });
        throw err;
      }
    },
    [userId]
  );

  const updateExistingLocation = useCallback(
    async (locationId: string, updateData: UpdateLocationDTO): Promise<void> => {
      try {
        setError(null);
        const updatedLocation = await updateLocation(locationId, updateData);

        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId ? { ...loc, ...updatedLocation } : loc
          )
        );

        if (selectedLocation?.id === locationId) {
          setSelectedLocation((prev) => (prev ? { ...prev, ...updatedLocation } : null));
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Location updated successfully', { locationId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to update location', {
          locationId,
          error: errorMessage
        });
        throw err;
      }
    },
    [selectedLocation]
  );

  const removeLocation = useCallback(
    async (locationId: string): Promise<void> => {
      try {
        setError(null);
        await deleteLocation(locationId);

        setLocations((prev) => prev.filter((loc) => loc.id !== locationId));

        if (selectedLocation?.id === locationId) {
          setSelectedLocation(null);
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Location deleted successfully, triggering refetch', { locationId });

        await refetchLocations();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete location';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to delete location', {
          locationId,
          error: errorMessage
        });
        throw err;
      }
    },
    [selectedLocation, refetchLocations]
  );

  const selectLocationForGeneration = useCallback(
    async (locationId: string): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      try {
        setError(null);
        await setSelectedLocationService(userId, locationId);

        setLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            is_default: loc.id === locationId
          }))
        );

        const newSelected = locations.find((loc) => loc.id === locationId);
        if (newSelected) {
          setSelectedLocation({ ...newSelected, is_default: true });
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Location selected for generation', {
          userId,
          locationId
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to select location';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to select location', {
          userId,
          locationId,
          error: errorMessage
        });
        throw err;
      }
    },
    [userId, locations]
  );

  const addPhotosToLocation = useCallback(
    async (locationId: string, photos: File[]): Promise<void> => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      try {
        setError(null);
        const uploadedPhotos = await uploadLocationPhotos(userId, locationId, photos);

        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId
              ? { ...loc, photos: [...loc.photos, ...uploadedPhotos] }
              : loc
          )
        );

        if (selectedLocation?.id === locationId) {
          setSelectedLocation((prev) =>
            prev ? { ...prev, photos: [...prev.photos, ...uploadedPhotos] } : null
          );
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Photos added successfully', {
          userId,
          locationId,
          photosCount: uploadedPhotos.length
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload photos';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to upload photos', {
          userId,
          locationId,
          error: errorMessage
        });
        throw err;
      }
    },
    [userId, selectedLocation]
  );

  const removePhotoFromLocation = useCallback(
    async (photoId: string, photoUrl: string): Promise<void> => {
      try {
        setError(null);
        await deleteLocationPhotoService(photoId, photoUrl);

        setLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            photos: loc.photos.filter((ph) => ph.id !== photoId)
          }))
        );

        if (selectedLocation) {
          setSelectedLocation((prev) =>
            prev
              ? { ...prev, photos: prev.photos.filter((ph) => ph.id !== photoId) }
              : null
          );
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Photo removed successfully', { photoId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to delete photo', {
          photoId,
          error: errorMessage
        });
        throw err;
      }
    },
    [selectedLocation]
  );

  const addEquipment = useCallback(
    async (locationId: string, equipmentNames: string[]): Promise<void> => {
      try {
        setError(null);
        const newEquipment = await addEquipmentToLocation(locationId, equipmentNames);

        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationId
              ? { ...loc, equipment: [...loc.equipment, ...newEquipment] }
              : loc
          )
        );

        if (selectedLocation?.id === locationId) {
          setSelectedLocation((prev) =>
            prev ? { ...prev, equipment: [...prev.equipment, ...newEquipment] } : null
          );
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Equipment added successfully', {
          locationId,
          equipmentCount: newEquipment.length
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add equipment';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to add equipment', {
          locationId,
          error: errorMessage
        });
        throw err;
      }
    },
    [selectedLocation]
  );

  const removeEquipment = useCallback(
    async (equipmentId: string): Promise<void> => {
      try {
        setError(null);
        await removeEquipmentFromLocation(equipmentId);

        setLocations((prev) =>
          prev.map((loc) => ({
            ...loc,
            equipment: loc.equipment.filter((eq) => eq.id !== equipmentId)
          }))
        );

        if (selectedLocation) {
          setSelectedLocation((prev) =>
            prev
              ? { ...prev, equipment: prev.equipment.filter((eq) => eq.id !== equipmentId) }
              : null
          );
        }

        logger.info('USE_TRAINING_LOCATIONS', 'Equipment removed successfully', { equipmentId });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove equipment';
        setError(errorMessage);
        logger.error('USE_TRAINING_LOCATIONS', 'Failed to remove equipment', {
          equipmentId,
          error: errorMessage
        });
        throw err;
      }
    },
    [selectedLocation]
  );

  const clearJustCreated = useCallback(() => {
    setJustCreatedLocationId(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('justCreatedLocationId');
      sessionStorage.removeItem('justCreatedLocationTimestamp');
    }
  }, []);

  return {
    locations,
    selectedLocation,
    loading,
    error,
    justCreatedLocationId,
    refetchLocations,
    createNewLocation,
    updateExistingLocation,
    removeLocation,
    selectLocationForGeneration,
    addPhotosToLocation,
    removePhotoFromLocation,
    addEquipment,
    removeEquipment,
    clearJustCreated
  };
}
