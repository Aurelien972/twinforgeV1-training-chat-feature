/**
 * LocationPhotoCapture Component
 * Interface de capture de photos pour les lieux d'entraînement
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { PhotoGallery } from '../molecules';
import GlowIcon from '../../GlowIcon';

import type { LocationPhotoCaptureProps } from '../types';
import { MAX_PHOTOS_PER_LOCATION, PHOTO_TIPS } from '../constants';

const LocationPhotoCapture: React.FC<LocationPhotoCaptureProps> = ({
  onPhotosChange,
  maxPhotos = MAX_PHOTOS_PER_LOCATION,
  existingPhotos = [],
  onRemoveExisting,
  disabled = false,
  hideHeader = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const totalPhotosCount = existingPhotos.length + newPhotos.length;
  const canAddMore = totalPhotosCount < maxPhotos;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxPhotos - totalPhotosCount;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length < files.length) {
      alert(`Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`);
    }

    const newPreviewUrls: string[] = [];
    for (const file of filesToAdd) {
      const url = URL.createObjectURL(file);
      newPreviewUrls.push(url);
    }

    const updatedPhotos = [...newPhotos, ...filesToAdd];
    const updatedPreviews = [...previewUrls, ...newPreviewUrls];

    setNewPhotos(updatedPhotos);
    setPreviewUrls(updatedPreviews);
    onPhotosChange(updatedPhotos);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNew = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);

    const updatedPhotos = newPhotos.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);

    setNewPhotos(updatedPhotos);
    setPreviewUrls(updatedPreviews);
    onPhotosChange(updatedPhotos);
  };

  const handleCaptureClick = () => {
    if (!disabled && canAddMore) {
      fileInputRef.current?.click();
    }
  };

  const handleCameraClick = () => {
    if (!disabled && canAddMore) {
      cameraInputRef.current?.click();
    }
  };

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-medium text-sm">Photos de l'environnement</h4>
            <p className="text-white/60 text-xs mt-1">
              Photographiez votre espace d'entraînement sous différents angles
            </p>
          </div>
          <span className="text-white/70 text-sm font-medium">
            {totalPhotosCount} / {maxPhotos}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || !canAddMore}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || !canAddMore}
      />

      {existingPhotos.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-white/80 text-sm font-medium">Photos existantes</h5>
          <PhotoGallery
            photos={existingPhotos}
            onRemove={onRemoveExisting}
            readonly={disabled}
            maxPhotos={maxPhotos}
          />
        </div>
      )}

      {newPhotos.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-white/80 text-sm font-medium flex items-center gap-2">
            Nouvelles photos
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              À uploader
            </span>
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <AnimatePresence mode="popLayout">
              {newPhotos.map((photo, index) => (
                <motion.div
                  key={`new-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={previewUrls[index]}
                    alt={`New photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity" />

                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveNew(index);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                    style={{
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SpatialIcon Icon={ICONS.Trash2} size={14} className="text-white" />
                  </motion.button>

                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-green-500/90 flex items-center gap-1">
                    <SpatialIcon Icon={ICONS.Plus} size={12} className="text-white" />
                    <span className="text-white text-xs font-medium">Nouveau</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {canAddMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.button
            type="button"
            onClick={handleCameraClick}
            disabled={disabled}
            className={`w-full py-4 rounded-xl border-2 border-dashed transition-all ${
              disabled
                ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                : 'border-pink-400/40 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-400/60 cursor-pointer'
            }`}
            whileHover={!disabled ? { scale: 1.01 } : {}}
            whileTap={!disabled ? { scale: 0.99 } : {}}
          >
            <div className="flex flex-col items-center gap-3">
              {!disabled && <GlowIcon icon="Camera" color="#EC4899" size="small" />}
              {disabled && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                  <SpatialIcon Icon={ICONS.Camera} size={20} className="text-white/40" />
                </div>
              )}
              <div>
                <p className={`font-medium text-sm ${disabled ? 'text-white/40' : 'text-white'}`}>
                  Prendre une photo
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Ouvrir la caméra
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={handleCaptureClick}
            disabled={disabled}
            className={`w-full py-4 rounded-xl border-2 border-dashed transition-all ${
              disabled
                ? 'border-white/10 bg-white/5 cursor-not-allowed opacity-50'
                : 'border-cyan-400/40 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-400/60 cursor-pointer'
            }`}
            whileHover={!disabled ? { scale: 1.01 } : {}}
            whileTap={!disabled ? { scale: 0.99 } : {}}
          >
            <div className="flex flex-col items-center gap-3">
              {!disabled && <GlowIcon icon="Image" color="#06B6D4" size="small" />}
              {disabled && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5">
                  <SpatialIcon Icon={ICONS.Image} size={20} className="text-white/40" />
                </div>
              )}
              <div>
                <p className={`font-medium text-sm ${disabled ? 'text-white/40' : 'text-white'}`}>
                  Choisir des photos
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Depuis la galerie
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {!canAddMore && (
        <div className="text-center py-3 px-4 rounded-lg bg-amber-500/10 border border-amber-400/30">
          <p className="text-amber-300 text-sm flex items-center justify-center gap-2">
            <SpatialIcon Icon={ICONS.AlertCircle} size={16} />
            Limite de {maxPhotos} photos atteinte
          </p>
        </div>
      )}

      {totalPhotosCount === 0 && (
        <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
          <div className="flex items-start gap-3">
            <GlowIcon icon="Info" color="#06B6D4" size="small" />
            <div className="text-sm text-cyan-200">
              <p className="font-medium mb-2">Conseils pour de meilleures photos:</p>
              <ul className="space-y-1 text-cyan-300/90 text-xs">
                <li>• Photographiez l'espace d'entraînement complet</li>
                <li>• Montrez les équipements disponibles sous différents angles</li>
                <li>• Assurez-vous que les photos sont bien éclairées</li>
                <li>• Évitez les photos floues ou trop sombres</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPhotoCapture;
