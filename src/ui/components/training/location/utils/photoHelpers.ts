/**
 * Photo Helper Functions
 * Fonctions utilitaires pour la gestion des photos
 */

import type { LocationPhoto } from '../../../../../domain/trainingLocation';

/**
 * Extrait l'URL d'une photo (gère à la fois les objets LocationPhoto et les strings)
 */
export const getPhotoUrl = (photo: LocationPhoto | string): string => {
  return typeof photo === 'string' ? photo : photo.photo_url;
};

/**
 * Extrait l'ID d'une photo (gère à la fois les objets LocationPhoto et les strings)
 */
export const getPhotoId = (photo: LocationPhoto | string): string => {
  return typeof photo === 'string' ? photo : photo.id;
};

/**
 * Vérifie si un fichier est une image valide
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Vérifie la taille du fichier (en Mo)
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Crée une URL de prévisualisation pour un fichier
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Révoque une URL de prévisualisation
 */
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Révoque plusieurs URLs de prévisualisation
 */
export const revokePreviewUrls = (urls: string[]): void => {
  urls.forEach(url => URL.revokeObjectURL(url));
};

/**
 * Calcule le nombre de slots restants pour l'ajout de photos
 */
export const getRemainingPhotoSlots = (
  currentCount: number,
  maxPhotos: number
): number => {
  return Math.max(0, maxPhotos - currentCount);
};

/**
 * Limite un tableau de fichiers selon le nombre de slots disponibles
 */
export const limitFilesToSlots = (
  files: File[],
  remainingSlots: number
): File[] => {
  return files.slice(0, remainingSlots);
};

/**
 * Valide un ensemble de fichiers photos
 */
export const validatePhotoFiles = (
  files: File[],
  maxSizeMB: number = 10
): { valid: File[]; invalid: File[]; errors: string[] } => {
  const valid: File[] = [];
  const invalid: File[] = [];
  const errors: string[] = [];

  files.forEach(file => {
    if (!isValidImageFile(file)) {
      invalid.push(file);
      errors.push(`${file.name}: Format non supporté (JPEG, PNG, WEBP uniquement)`);
    } else if (!isValidFileSize(file, maxSizeMB)) {
      invalid.push(file);
      errors.push(`${file.name}: Fichier trop volumineux (max ${maxSizeMB}Mo)`);
    } else {
      valid.push(file);
    }
  });

  return { valid, invalid, errors };
};
