/**
 * Formatter Functions
 * Fonctions utilitaires de formatage
 */

/**
 * Formate un temps en secondes au format "Xm Ys" ou "Xs"
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

/**
 * Formate un temps en secondes au format "MM:SS"
 */
export const formatTimeMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formate un nombre de photos avec le pluriel approprié
 */
export const formatPhotoCount = (count: number): string => {
  return `${count} photo${count > 1 ? 's' : ''}`;
};

/**
 * Formate un nombre d'équipements avec le pluriel approprié
 */
export const formatEquipmentCount = (count: number): string => {
  return `${count} équipement${count > 1 ? 's' : ''}`;
};

/**
 * Formate un pourcentage avec arrondi
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Tronque un texte avec ellipse
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formate un nom de fichier pour l'affichage
 */
export const formatFileName = (fileName: string, maxLength: number = 20): string => {
  if (fileName.length <= maxLength) return fileName;

  const extension = fileName.split('.').pop() || '';
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);

  return `${truncatedName}...${extension}`;
};
