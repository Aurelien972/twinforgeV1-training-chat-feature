/**
 * PhotoGallery Component
 * Galerie de photos avec preview et suppression
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpatialIcon from '../../../../icons/SpatialIcon';
import { ICONS } from '../../../../icons/registry';
import { getPhotoUrl, getPhotoId } from '../utils';
import type { LocationPhoto } from '../../../../../domain/trainingLocation';

interface PhotoGalleryProps {
  photos: LocationPhoto[] | string[];
  onRemove?: (photoId: string, photoUrl: string) => void;
  readonly?: boolean;
  maxPhotos?: number;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onRemove,
  readonly = false,
  maxPhotos = 5
}) => {

  const handleRemove = (photo: LocationPhoto | string) => {
    if (readonly || !onRemove) return;
    const url = getPhotoUrl(photo);
    const id = getPhotoId(photo);
    onRemove(id, url);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-white/20 bg-white/5">
        <SpatialIcon Icon={ICONS.Camera} size={48} className="text-white/40 mx-auto mb-4" />
        <p className="text-white/60 text-sm">Aucune photo ajoutée</p>
        <p className="text-white/40 text-xs mt-1">
          {readonly
            ? "Ce lieu n'a pas encore de photos"
            : `Ajoutez jusqu'à ${maxPhotos} photos de votre environnement`}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {photos.map((photo, index) => {
            const url = getPhotoUrl(photo);
            const id = getPhotoId(photo);

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {!readonly && onRemove && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(photo);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SpatialIcon Icon={ICONS.Trash2} size={14} className="text-white" />
                  </motion.button>
                )}

                <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{index + 1}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {photos.length < maxPhotos && !readonly && (
        <p className="text-white/50 text-xs mt-2">
          {photos.length} / {maxPhotos} photos
        </p>
      )}
    </>
  );
};

export default PhotoGallery;
