/**
 * Photo Types
 * Types et interfaces pour la gestion des photos
 */

/**
 * Statut d'analyse d'une photo
 */
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'error';

/**
 * Information de statut d'analyse pour une photo
 */
export interface PhotoAnalysisStatus {
  status: AnalysisStatus;
  progress: number;
  equipmentCount?: number;
  error?: string;
}

/**
 * Map des statuts d'analyse par ID de photo
 */
export type AnalysisStatusMap = {
  [photoId: string]: PhotoAnalysisStatus;
};

/**
 * Photo simplifiée pour l'analyse
 */
export interface PhotoForAnalysis {
  url: string;
  id: string;
  order: number;
}

/**
 * Props pour PhotoAnalysisProgress
 */
export interface PhotoAnalysisProgressProps {
  photos: PhotoForAnalysis[];
  analysisStatus: AnalysisStatusMap;
  onRetry?: (photoId: string) => void;
}

/**
 * Props pour PhotoGallery
 */
export interface PhotoGalleryProps {
  photos: any[];
  onRemove?: (photoId: string, photoUrl: string) => void;
  readonly?: boolean;
  maxPhotos?: number;
}

/**
 * Props pour LocationPhotoCapture
 */
export interface LocationPhotoCaptureProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
  onRemoveExisting?: (photoId: string, photoUrl: string) => void;
  disabled?: boolean;
  hideHeader?: boolean;
}
