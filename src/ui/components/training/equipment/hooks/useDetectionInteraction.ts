/**
 * useDetectionInteraction Hook
 * Manages detection marker hover, selection and fullscreen state
 */

import { useState, useCallback } from 'react';

export function useDetectionInteraction() {
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleMarkerClick = useCallback((markerNumber: number) => {
    setSelectedMarker((prev) => (prev === markerNumber ? null : markerNumber));
  }, []);

  const handleMarkerHover = useCallback((markerNumber: number | null) => {
    setHoveredMarker(markerNumber);
  }, []);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedMarker(null);
    setHoveredMarker(null);
  }, []);

  return {
    hoveredMarker,
    selectedMarker,
    isFullscreen,
    handleMarkerClick,
    handleMarkerHover,
    openFullscreen,
    closeFullscreen,
    resetSelection
  };
}
