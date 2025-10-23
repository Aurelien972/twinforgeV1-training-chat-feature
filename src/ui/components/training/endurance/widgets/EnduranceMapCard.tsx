/**
 * Endurance Map Card
 * Interactive map display for GPS-tracked endurance sessions
 * Uses react-leaflet for best UI/UX with OpenStreetMap
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import GlassCard from '../../../../cards/GlassCard';
import SpatialIcon from '../../../../icons/SpatialIcon';
import type { GPSCoordinate, RouteStats } from '../../../../../system/services/gpsTrackingService';
import logger from '../../../../../lib/utils/logger';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface EnduranceMapCardProps {
  coordinates: GPSCoordinate[];
  routeStats?: RouteStats | null;
  isLive?: boolean;
  sessionName?: string;
  disciplineColor?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  isTracking?: boolean;
  showLoadingState?: boolean;
}

const MapBoundsSetter: React.FC<{ coordinates: GPSCoordinate[] }> = ({ coordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds: LatLngBoundsExpression = coordinates.map(coord => [coord.lat, coord.lng] as LatLngExpression);
      map.fitBounds(bounds as any, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  return null;
};

const EnduranceMapCard: React.FC<EnduranceMapCardProps> = ({
  coordinates,
  routeStats,
  isLive = false,
  sessionName = 'Parcours',
  disciplineColor = '#3b82f6',
  expanded = false,
  onToggleExpand,
  isTracking = false,
  showLoadingState = false
}) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    logger.info('ENDURANCE_MAP', 'Map card mounted', {
      coordinatesCount: coordinates?.length || 0,
      hasRouteStats: !!routeStats,
      isLive
    });
  }, [coordinates?.length, routeStats, isLive]);

  if (!coordinates || coordinates.length === 0) {
    if (isTracking || showLoadingState) {
      return (
        <GlassCard variant="frosted" className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${disciplineColor}40, ${disciplineColor}20)`,
                border: `1px solid ${disciplineColor}60`
              }}
            >
              <SpatialIcon name="MapPin" className="w-6 h-6" style={{ color: disciplineColor }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/90">Initialisation GPS...</p>
              <p className="text-xs text-white/60">En attente de coordonnées ({coordinates?.length || 0} points)</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${disciplineColor}20` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: disciplineColor }} />
              <span className="text-xs font-medium" style={{ color: disciplineColor }}>Actif</span>
            </div>
          </div>
        </GlassCard>
      );
    }

    return (
      <GlassCard variant="frosted" className="p-4">
        <div className="flex items-center gap-3 text-white/60">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <SpatialIcon name="MapPinOff" className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">Aucune donnée GPS</p>
            <p className="text-xs text-white/60">Le suivi GPS n'a pas capturé de coordonnées</p>
            <p className="text-xs text-orange-400 mt-1">Vérifiez que le GPS est activé</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const routePath: LatLngExpression[] = coordinates.map(coord => [coord.lat, coord.lng]);
  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatPace = (minPerKm: number) => {
    const minutes = Math.floor(minPerKm);
    const seconds = Math.round((minPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  };

  const formatElevation = (meters: number) => {
    return `${Math.round(meters)} m`;
  };

  const mapHeight = expanded ? '500px' : '300px';

  return (
    <GlassCard variant="frosted" className="overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${disciplineColor}40, ${disciplineColor}20)`,
                border: `1px solid ${disciplineColor}60`
              }}
            >
              <SpatialIcon name="Map" className="w-5 h-5" style={{ color: disciplineColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{sessionName}</h3>
              {isLive && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">Suivi en direct • {coordinates.length} pts</span>
                </div>
              )}
              {!isLive && (
                <span className="text-xs text-white/60">{coordinates.length} points capturés</span>
              )}
            </div>
          </div>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <SpatialIcon
                name={expanded ? 'Minimize2' : 'Maximize2'}
                className="w-4 h-4 text-white/70"
              />
            </button>
          )}
        </div>
      </div>

      <div style={{ height: mapHeight, width: '100%', position: 'relative' }}>
        <MapContainer
          center={[startPoint.lat, startPoint.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Polyline
            positions={routePath}
            pathOptions={{
              color: disciplineColor,
              weight: 4,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          <Marker position={[startPoint.lat, startPoint.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>Départ</strong>
                <br />
                {new Date(startPoint.timestamp).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>

          {!isLive && (
            <Marker position={[endPoint.lat, endPoint.lng]}>
              <Popup>
                <div className="text-sm">
                  <strong>Arrivée</strong>
                  <br />
                  {new Date(endPoint.timestamp).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
          )}

          <MapBoundsSetter coordinates={coordinates} />
        </MapContainer>
      </div>

      {routeStats && (
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SpatialIcon name="Route" className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Distance</span>
              </div>
              <p className="text-lg font-bold text-white">
                {formatDistance(routeStats.totalDistance)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SpatialIcon name="Gauge" className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Allure</span>
              </div>
              <p className="text-lg font-bold text-white">
                {formatPace(routeStats.avgPace)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SpatialIcon name="TrendingUp" className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60 uppercase tracking-wide">D+</span>
              </div>
              <p className="text-lg font-bold text-white">
                {formatElevation(routeStats.elevationGain)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SpatialIcon name="Clock" className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Durée</span>
              </div>
              <p className="text-lg font-bold text-white">
                {Math.floor(routeStats.duration / 60)}:{(routeStats.duration % 60).toFixed(0).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLive && (
        <div className="px-4 pb-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-400 font-medium">
                Suivi GPS actif - {coordinates.length} points enregistrés
              </span>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default EnduranceMapCard;
