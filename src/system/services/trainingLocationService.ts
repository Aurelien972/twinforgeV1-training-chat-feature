/**
 * Training Location Service
 * Service pour gérer les lieux d'entraînement avec équipements et photos
 */

import { supabase } from '../supabase/client';
import logger from '../../lib/utils/logger';
import { getSignedUrl, PRIVATE_BUCKETS } from '../../lib/storage/signedUrlService';
import type {
  TrainingLocation,
  TrainingLocationWithDetails,
  LocationEquipment,
  LocationPhoto,
  CreateLocationDTO,
  UpdateLocationDTO,
  LocationType
} from '../../domain/trainingLocation';

/**
 * Valide un fichier image avant traitement
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté. Utilisez: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Fichier vide' };
  }

  return { valid: true };
}

/**
 * Compresse une image avant upload
 */
async function compressImage(file: File, maxWidth = 1200, quality = 0.85): Promise<Blob> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Helper: Convert storage paths to signed URLs for photos
 */
async function enrichPhotosWithSignedUrls(photos: LocationPhoto[]): Promise<LocationPhoto[]> {
  const enrichedPhotos = await Promise.all(
    photos.map(async (photo) => {
      // If photo_url is already a full URL (legacy), return as-is
      if (photo.photo_url.startsWith('http')) {
        return photo;
      }

      // Generate signed URL from storage path
      const signedUrl = await getSignedUrl(PRIVATE_BUCKETS.TRAINING_LOCATIONS, photo.photo_url);

      if (!signedUrl) {
        logger.warn('TRAINING_LOCATION_SERVICE', 'Failed to generate signed URL for photo', {
          photoId: photo.id,
          storagePath: photo.photo_url
        });
        return photo;
      }

      return {
        ...photo,
        photo_url: signedUrl
      };
    })
  );

  return enrichedPhotos;
}

/**
 * Récupère tous les lieux d'un utilisateur avec leurs détails
 */
export async function fetchUserLocations(userId: string): Promise<TrainingLocationWithDetails[]> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Fetching user locations', { userId });

    const { data: locations, error: locationsError } = await supabase
      .from('training_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (locationsError) {
      throw locationsError;
    }

    if (!locations || locations.length === 0) {
      logger.info('TRAINING_LOCATION_SERVICE', 'No locations found for user', { userId });
      return [];
    }

    const locationIds = locations.map((loc) => loc.id);

    const { data: equipment, error: equipmentError } = await supabase
      .from('training_location_equipment')
      .select('*')
      .in('location_id', locationIds);

    if (equipmentError) {
      throw equipmentError;
    }

    const { data: photos, error: photosError } = await supabase
      .from('training_location_photos')
      .select('*')
      .in('location_id', locationIds)
      .order('photo_order', { ascending: true });

    if (photosError) {
      throw photosError;
    }

    // Enrich photos with signed URLs
    const enrichedPhotos = photos ? await enrichPhotosWithSignedUrls(photos) : [];

    const locationsWithDetails: TrainingLocationWithDetails[] = locations.map((location) => ({
      ...location,
      equipment: (equipment || []).filter((eq) => eq.location_id === location.id),
      photos: enrichedPhotos.filter((ph) => ph.location_id === location.id)
    }));

    logger.info('TRAINING_LOCATION_SERVICE', 'Locations fetched successfully', {
      userId,
      locationsCount: locationsWithDetails.length
    });

    return locationsWithDetails;
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to fetch user locations', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Crée un nouveau lieu d'entraînement
 */
export async function createLocation(
  userId: string,
  locationData: CreateLocationDTO
): Promise<TrainingLocationWithDetails> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Creating location', {
      userId,
      type: locationData.type,
      mode: locationData.mode
    });

    const { data: location, error: locationError } = await supabase
      .from('training_locations')
      .insert({
        user_id: userId,
        name: locationData.name,
        type: locationData.type,
        is_default: locationData.is_default || false
      })
      .select()
      .single();

    if (locationError) {
      throw locationError;
    }

    let equipment: LocationEquipment[] = [];
    let photos: LocationPhoto[] = [];

    if (locationData.equipment && locationData.equipment.length > 0) {
      const equipmentInserts = locationData.equipment.map((equipName) => ({
        location_id: location.id,
        equipment_name: equipName,
        is_custom: false
      }));

      const { data: insertedEquipment, error: equipmentError } = await supabase
        .from('training_location_equipment')
        .insert(equipmentInserts)
        .select();

      if (equipmentError) {
        throw equipmentError;
      }

      equipment = insertedEquipment || [];
    }

    if (locationData.photos && locationData.photos.length > 0) {
      logger.info('TRAINING_LOCATION_SERVICE', 'Uploading photos', {
        userId,
        locationId: location.id,
        photosCount: locationData.photos.length
      });
      const uploadedPhotos = await uploadLocationPhotos(userId, location.id, locationData.photos);
      photos = uploadedPhotos;
      logger.info('TRAINING_LOCATION_SERVICE', 'Photos uploaded successfully', {
        userId,
        locationId: location.id,
        uploadedCount: uploadedPhotos.length
      });
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Location created successfully', {
      userId,
      locationId: location.id,
      equipmentCount: equipment.length,
      photosCount: photos.length
    });

    return {
      ...location,
      equipment,
      photos
    };
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to create location', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Met à jour un lieu existant
 */
export async function updateLocation(
  locationId: string,
  updateData: UpdateLocationDTO
): Promise<TrainingLocation> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Updating location', { locationId });

    const { data: location, error } = await supabase
      .from('training_locations')
      .update(updateData)
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Location updated successfully', { locationId });

    return location;
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to update location', {
      locationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Supprime un lieu et toutes ses données associées (cascade)
 */
export async function deleteLocation(locationId: string): Promise<void> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Deleting location', { locationId });

    const { data: photos } = await supabase
      .from('training_location_photos')
      .select('photo_url')
      .eq('location_id', locationId);

    if (photos && photos.length > 0) {
      for (const photo of photos) {
        await deleteLocationPhotoFile(photo.photo_url);
      }
    }

    const { error } = await supabase.from('training_locations').delete().eq('id', locationId);

    if (error) {
      throw error;
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Location deleted successfully', { locationId });
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to delete location', {
      locationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Marque un lieu comme sélectionné pour la génération
 */
export async function setSelectedLocation(userId: string, locationId: string): Promise<void> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Setting selected location', { userId, locationId });

    const { error: resetError } = await supabase
      .from('training_locations')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (resetError) {
      throw resetError;
    }

    const { error } = await supabase
      .from('training_locations')
      .update({ is_default: true })
      .eq('id', locationId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Selected location set successfully', {
      userId,
      locationId
    });
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to set selected location', {
      userId,
      locationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export interface PhotoUploadProgress {
  photoIndex: number;
  status: 'validating' | 'compressing' | 'uploading' | 'saving' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export type PhotoUploadProgressCallback = (progress: PhotoUploadProgress) => void;

/**
 * Upload une seule photo avec retry automatique
 */
async function uploadSinglePhoto(
  userId: string,
  locationId: string,
  file: File,
  photoIndex: number,
  onProgress?: PhotoUploadProgressCallback,
  retryCount = 0
): Promise<LocationPhoto> {
  const MAX_RETRIES = 3;

  try {
    onProgress?.({
      photoIndex,
      status: 'validating',
      progress: 10
    });

    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.({
      photoIndex,
      status: 'compressing',
      progress: 30
    });

    const compressedBlob = await compressImage(file);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const filename = `${userId}/${locationId}/photo-${timestamp}-${randomSuffix}.jpg`;

    logger.info('TRAINING_LOCATION_SERVICE', 'Uploading photo to storage', {
      userId,
      locationId,
      filename,
      originalSize: file.size,
      compressedSize: compressedBlob.size
    });

    onProgress?.({
      photoIndex,
      status: 'uploading',
      progress: 50
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-locations')
      .upload(filename, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
        cacheControl: '3600'
      });

    if (uploadError) {
      logger.error('TRAINING_LOCATION_SERVICE', 'Storage upload failed', {
        error: uploadError.message,
        filename
      });
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!uploadData || !uploadData.path) {
      throw new Error('Upload succeeded but no path returned');
    }

    const actualPath = uploadData.path;

    logger.info('TRAINING_LOCATION_SERVICE', 'Photo uploaded to storage', {
      requestedPath: filename,
      actualPath: actualPath
    });

    // Generate signed URL for private bucket (1 hour expiry)
    const signedUrl = await getSignedUrl(PRIVATE_BUCKETS.TRAINING_LOCATIONS, actualPath);

    if (!signedUrl) {
      logger.error('TRAINING_LOCATION_SERVICE', 'Failed to generate signed URL after upload', {
        actualPath
      });
      // Cleanup uploaded file
      await supabase.storage.from('training-locations').remove([actualPath]);
      throw new Error('Failed to generate signed URL for uploaded photo');
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Signed URL generated successfully', {
      actualPath,
      urlLength: signedUrl.length
    });

    onProgress?.({
      photoIndex,
      status: 'saving',
      progress: 80
    });

    const { data: photoRecord, error: insertError } = await supabase
      .from('training_location_photos')
      .insert({
        location_id: locationId,
        photo_url: actualPath,
        photo_order: photoIndex
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from('training-locations').remove([filename]);
      throw new Error(`Failed to save photo record: ${insertError.message}`);
    }

    onProgress?.({
      photoIndex,
      status: 'completed',
      progress: 100
    });

    logger.info('TRAINING_LOCATION_SERVICE', 'Photo upload completed', {
      photoId: photoRecord.id,
      storagePath: actualPath
    });

    return photoRecord;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (retryCount < MAX_RETRIES) {
      logger.warn('TRAINING_LOCATION_SERVICE', 'Retrying photo upload', {
        photoIndex,
        retryCount: retryCount + 1,
        error: errorMessage
      });

      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
      return uploadSinglePhoto(userId, locationId, file, photoIndex, onProgress, retryCount + 1);
    }

    onProgress?.({
      photoIndex,
      status: 'error',
      progress: 0,
      error: errorMessage
    });

    throw error;
  }
}

/**
 * Upload multiple photos pour un lieu avec suivi de progression
 */
export async function uploadLocationPhotos(
  userId: string,
  locationId: string,
  photos: File[],
  onProgress?: PhotoUploadProgressCallback
): Promise<LocationPhoto[]> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Starting batch photo upload', {
      userId,
      locationId,
      photosCount: photos.length
    });

    const uploadPromises = photos.slice(0, 5).map((file, index) =>
      uploadSinglePhoto(userId, locationId, file, index, onProgress)
    );

    const results = await Promise.allSettled(uploadPromises);

    const uploadedPhotos: LocationPhoto[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        uploadedPhotos.push(result.value);
      } else {
        errors.push(`Photo ${index + 1}: ${result.reason.message}`);
      }
    });

    if (errors.length > 0) {
      logger.warn('TRAINING_LOCATION_SERVICE', 'Some photos failed to upload', {
        userId,
        locationId,
        successCount: uploadedPhotos.length,
        failureCount: errors.length,
        errors
      });

      if (uploadedPhotos.length === 0) {
        throw new Error(`All uploads failed: ${errors.join('; ')}`);
      }
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Batch photo upload completed', {
      userId,
      locationId,
      uploadedCount: uploadedPhotos.length,
      failedCount: errors.length
    });

    return uploadedPhotos;
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to upload photos', {
      userId,
      locationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Supprime une photo spécifique
 * @param photoId - Photo record ID
 * @param photoPath - Storage path (userId/locationId/photo-xxx.jpg)
 */
export async function deleteLocationPhoto(photoId: string, photoPath: string): Promise<void> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Deleting location photo', { photoId });

    await deleteLocationPhotoFile(photoPath);

    const { error } = await supabase.from('training_location_photos').delete().eq('id', photoId);

    if (error) {
      throw error;
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Photo deleted successfully', { photoId });
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to delete photo', {
      photoId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Supprime le fichier physique d'une photo
 * @param photoPath - Storage path or legacy public URL
 */
async function deleteLocationPhotoFile(photoPath: string): Promise<void> {
  try {
    // Handle both legacy public URLs and new storage paths
    let filePath: string;
    if (photoPath.includes('/training-locations/')) {
      // Legacy public URL format
      const urlParts = photoPath.split('/training-locations/');
      if (urlParts.length !== 2) {
        return;
      }
      filePath = urlParts[1];
    } else {
      // New storage path format (userId/locationId/photo-xxx.jpg)
      filePath = photoPath;
    }

    const { error } = await supabase.storage.from('training-locations').remove([filePath]);

    if (error) {
      logger.warn('TRAINING_LOCATION_SERVICE', 'Failed to delete photo file from storage', {
        filePath,
        error: error.message
      });
    }
  } catch (error) {
    logger.warn('TRAINING_LOCATION_SERVICE', 'Error deleting photo file', {
      photoPath,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Ajoute des équipements à un lieu existant
 */
export async function addEquipmentToLocation(
  locationId: string,
  equipmentNames: string[]
): Promise<LocationEquipment[]> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Adding equipment to location', {
      locationId,
      equipmentCount: equipmentNames.length
    });

    const equipmentInserts = equipmentNames.map((name) => ({
      location_id: locationId,
      equipment_name: name,
      is_custom: true
    }));

    const { data: equipment, error } = await supabase
      .from('training_location_equipment')
      .insert(equipmentInserts)
      .select();

    if (error) {
      throw error;
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Equipment added successfully', {
      locationId,
      addedCount: equipment?.length || 0
    });

    return equipment || [];
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to add equipment', {
      locationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Supprime un équipement d'un lieu
 */
export async function removeEquipmentFromLocation(equipmentId: string): Promise<void> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Removing equipment from location', { equipmentId });

    const { error } = await supabase
      .from('training_location_equipment')
      .delete()
      .eq('id', equipmentId);

    if (error) {
      throw error;
    }

    logger.info('TRAINING_LOCATION_SERVICE', 'Equipment removed successfully', { equipmentId });
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to remove equipment', {
      equipmentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Récupère le lieu sélectionné pour la génération
 */
export async function getSelectedLocation(
  userId: string
): Promise<TrainingLocationWithDetails | null> {
  try {
    logger.info('TRAINING_LOCATION_SERVICE', 'Fetching selected location', { userId });

    const { data: locations, error: fetchError } = await supabase
      .from('training_locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true);

    if (fetchError) {
      logger.error('TRAINING_LOCATION_SERVICE', 'Database error fetching default location', {
        userId,
        errorCode: (fetchError as any).code,
        errorMessage: fetchError.message,
        errorDetails: (fetchError as any).details
      });
      throw fetchError;
    }

    if (!locations || locations.length === 0) {
      logger.info('TRAINING_LOCATION_SERVICE', 'No default location found', { userId });
      return null;
    }

    if (locations.length > 1) {
      logger.warn('TRAINING_LOCATION_SERVICE', 'Multiple default locations found, using first one', {
        userId,
        count: locations.length
      });
    }

    const location = locations[0];

    const { data: equipment, error: equipmentError } = await supabase
      .from('training_location_equipment')
      .select('*')
      .eq('location_id', location.id);

    if (equipmentError) {
      logger.error('TRAINING_LOCATION_SERVICE', 'Error fetching equipment', {
        locationId: location.id,
        error: equipmentError.message
      });
    }

    const { data: photos, error: photosError } = await supabase
      .from('training_location_photos')
      .select('*')
      .eq('location_id', location.id)
      .order('photo_order', { ascending: true });

    if (photosError) {
      logger.error('TRAINING_LOCATION_SERVICE', 'Error fetching photos', {
        locationId: location.id,
        error: photosError.message
      });
    }

    // Enrich photos with signed URLs
    const enrichedPhotos = photos ? await enrichPhotosWithSignedUrls(photos) : [];

    return {
      ...location,
      equipment: equipment || [],
      photos: enrichedPhotos
    };
  } catch (error) {
    logger.error('TRAINING_LOCATION_SERVICE', 'Failed to fetch selected location', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
