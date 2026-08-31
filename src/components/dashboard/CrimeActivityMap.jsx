import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Compass, 
  MapPin, 
  ChevronRight, 
  Plus, 
  Minus, 
  RotateCcw, 
  ShieldAlert, 
  AlertCircle, 
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { getActivityLevel } from '../../utils/activityLevels.js';
export { getActivityLevel };

// Default Mumbai Metropolitan Geographic Center & View Limits
const MUMBAI_CENTER = [19.0760, 72.8777];
const DEFAULT_ZOOM = 11;
const MUMBAI_BOUNDS = [
  [18.80, 72.70],
  [19.35, 73.05]
];


// Activity Level Color Configuration (NETRA Theme)
const ACTIVITY_CONFIG = {
  'VERY HIGH': {
    label: 'VERY HIGH',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    barClass: 'bg-rose-600',
    dotClass: 'bg-rose-600',
    markerBg: '#DC2626',
    markerBorder: '#FECACA',
    ringColor: 'rgba(220, 38, 38, 0.4)'
  },
  'HIGH': {
    label: 'HIGH',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    barClass: 'bg-[#F5B800]',
    dotClass: 'bg-[#F5B800]',
    markerBg: '#F5B800',
    markerBorder: '#FEF3C7',
    ringColor: 'rgba(245, 184, 0, 0.35)'
  },
  'MEDIUM': {
    label: 'MEDIUM',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    barClass: 'bg-sky-500',
    dotClass: 'bg-sky-500',
    markerBg: '#0EA5E9',
    markerBorder: '#BAE6FD',
    ringColor: 'rgba(14, 165, 233, 0.3)'
  },
  'LOW': {
    label: 'LOW',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    barClass: 'bg-slate-500',
    dotClass: 'bg-slate-500',
    markerBg: '#64748B',
    markerBorder: '#E2E8F0',
    ringColor: 'rgba(100, 116, 139, 0.25)'
  }
};

/**
 * Controller component inside MapContainer to smoothly pan/fly when selectedZone changes
 */
function MapViewController({ targetCenter, targetZoom }) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter && targetCenter[0] && targetCenter[1]) {
      map.flyTo(targetCenter, targetZoom || 13, {
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
  }, [map, targetCenter, targetZoom]);

  return null;
}

/**
 * Custom Map Controls inside MapContainer
 */
function MapControls({ onResetView, isFullScreen, onToggleFullScreen }) {
  const map = useMap();

  return (
    <div className="absolute top-2 right-2 z-[400] flex flex-col gap-1 select-none">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-7 h-7 bg-[#071A33]/90 hover:bg-[#0E2A4D] text-white rounded border border-[#1C3B64] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        title="Zoom In"
        aria-label="Zoom in"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-7 h-7 bg-[#071A33]/90 hover:bg-[#0E2A4D] text-white rounded border border-[#1C3B64] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        title="Zoom Out"
        aria-label="Zoom out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onResetView}
        className="w-7 h-7 bg-[#071A33]/90 hover:bg-[#0E2A4D] text-[#F5B800] rounded border border-[#1C3B64] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        title="Center Mumbai Overview"
        aria-label="Center Mumbai"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
      {onToggleFullScreen && (
        <button
          type="button"
          onClick={onToggleFullScreen}
          className="w-7 h-7 bg-[#071A33]/90 hover:bg-[#0E2A4D] text-slate-200 rounded border border-[#1C3B64] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          title={isFullScreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
          aria-label="Toggle Fullscreen"
        >
          {isFullScreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

/**
 * Creates custom Leaflet HTML DivIcon for crime zone markers
 */
function createZoneIcon(zone, isSelected) {
  const level = zone.activityLevel || getActivityLevel(zone.reportedCrimes || zone.caseCount || 0);
  const cfg = ACTIVITY_CONFIG[level] || ACTIVITY_CONFIG['MEDIUM'];
  const count = zone.reportedCrimes || zone.caseCount || zone.count || 0;
  const isVeryHigh = level === 'VERY HIGH';

  const size = isSelected ? 30 : 24;
  const pulseHtml = isVeryHigh ? `
    <span class="animate-ping absolute inset-0 rounded-full" style="background-color: ${cfg.markerBg}; opacity: 0.6;"></span>
  ` : '';

  const borderStyle = isSelected 
    ? 'border: 2px solid #FFFFFF; box-shadow: 0 0 0 3px ' + cfg.markerBg + ', 0 4px 12px rgba(0,0,0,0.5); transform: scale(1.15);' 
    : 'border: 1.5px solid ' + cfg.markerBorder + '; box-shadow: 0 2px 6px rgba(0,0,0,0.4);';

  const html = `
    <div class="relative flex items-center justify-center w-full h-full transition-transform duration-200" style="width: ${size}px; height: ${size}px;">
      ${pulseHtml}
      <div class="relative flex items-center justify-center rounded-full text-white font-mono font-bold select-none cursor-pointer"
           style="width: ${size}px; height: ${size}px; background-color: ${cfg.markerBg}; ${borderStyle} color: ${level === 'HIGH' ? '#071A33' : '#FFFFFF'}; font-size: ${isSelected ? '10px' : '9px'};">
        ${count}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'netra-zone-marker-container',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

/**
 * High Crime Activity Zones Map Component
 */
export default function CrimeActivityMap({ hotspots = [], loading = false, error = null, onRetry }) {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  // Normalize and parse crime zone markers
  const zones = useMemo(() => {
    if (!Array.isArray(hotspots) || hotspots.length === 0) return [];

    const maxCrimes = Math.max(...hotspots.map(h => Number(h.reportedCrimes || h.caseCount || h.count || 0)), 1);

    return hotspots.map((h, idx) => {
      const lat = Number(h.latitude ?? h.lat ?? 19.0760);
      const lng = Number(h.longitude ?? h.lng ?? 72.8777);
      const caseCount = Number(h.reportedCrimes ?? h.caseCount ?? h.count ?? 0);
      const level = h.activityLevel || (h.severity ? h.severity.toUpperCase() : getActivityLevel(caseCount, maxCrimes));
      const station = h.stationJurisdiction || h.station || `${h.name} Police Station`;
      const region = h.region || 'Mumbai Metro Region';
      const topCat = h.topCategory || h.type || 'Organized Crime';

      return {
        id: h.id || `zone-${idx}-${h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: h.name,
        latitude: lat,
        longitude: lng,
        reportedCrimes: caseCount,
        caseCount: caseCount,
        activityLevel: level,
        stationJurisdiction: station,
        region: region,
        topCategory: topCat,
        trend: h.trend || '+12% vs last month'
      };
    });
  }, [hotspots]);

  // Synchronize initial selection to first valid zone
  useEffect(() => {
    if (zones.length > 0) {
      // Keep currently selected zone if still valid, else select first
      const currentStillValid = selectedZone && zones.find(z => z.id === selectedZone.id || z.name === selectedZone.name);
      if (currentStillValid) {
        setSelectedZone(currentStillValid);
      } else {
        setSelectedZone(zones[0]);
      }
    } else {
      setSelectedZone(null);
    }
  }, [zones]);

  // Handle marker click
  const handleMarkerClick = (zone) => {
    setSelectedZone(zone);
    setFlyTarget([zone.latitude, zone.longitude]);
  };

  // Reset view to Mumbai center
  const handleResetView = () => {
    setFlyTarget(MUMBAI_CENTER);
  };

  // Calculate max crimes for dynamic progress bar normalization
  const maxZoneCrimes = useMemo(() => {
    if (zones.length === 0) return 100;
    return Math.max(...zones.map(z => z.reportedCrimes), 1);
  }, [zones]);

  // Navigate to Case Search with station filter
  const handleViewCases = () => {
    if (!selectedZone) {
      navigate('/cases');
      return;
    }
    const queryParam = encodeURIComponent(selectedZone.stationJurisdiction || selectedZone.name);
    navigate(`/cases?station=${queryParam}`);
  };

  const activeLevelConfig = selectedZone 
    ? (ACTIVITY_CONFIG[selectedZone.activityLevel] || ACTIVITY_CONFIG['MEDIUM'])
    : ACTIVITY_CONFIG['MEDIUM'];

  // Map Basemap & Provider API Key Configuration (Identical to Knowledge Graph Night-Ops)
  const tileLayerConfig = useMemo(() => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_API_KEY;
    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
    const stadiaKey = import.meta.env.VITE_STADIA_API_KEY;
    const customTileUrl = import.meta.env.VITE_MAP_TILE_URL;
    const genericKey = import.meta.env.VITE_MAP_API_KEY;

    if (customTileUrl) {
      const url = genericKey ? customTileUrl.replace(/\{key\}|\{apiKey\}/g, genericKey) : customTileUrl;
      return {
        url,
        attribution: '&copy; Map Provider &copy; OpenStreetMap contributors',
        maxZoom: 19
      };
    }

    if (mapboxToken) {
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      };
    }

    if (maptilerKey || (genericKey && genericKey.length >= 16)) {
      const key = maptilerKey || genericKey;
      return {
        url: `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${key}`,
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      };
    }

    if (stadiaKey) {
      return {
        url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaKey}`,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>',
        maxZoom: 20
      };
    }

    // Default 100% Free Night-Ops Basemap (OpenStreetMap with Tactical Dark Shader - Zero API Key / Zero Watermark)
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`glass-card rounded-lg overflow-hidden flex flex-col border border-[#0B2341]/12 bg-white ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#F4F7FB] border-b border-[#0B2341]/10 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#F5B800]" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#071A33]">
            High Crime Activity Zones (Map)
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#071A33]/60 font-semibold">
          {zones.length} SECTORS
        </span>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        {/* Real Interactive Mumbai Leaflet Map Container */}
        <div className="relative w-full h-64 sm:h-72 bg-[#061121] rounded-md overflow-hidden border border-[#0B2341] shadow-inner">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071A33]/90 text-white z-20 gap-2">
              <Loader2 className="w-6 h-6 text-[#F5B800] animate-spin" />
              <span className="text-xs font-mono tracking-wider uppercase text-slate-300">
                Loading crime activity zones...
              </span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071A33]/90 text-white z-20 p-4 text-center gap-2">
              <AlertCircle className="w-6 h-6 text-rose-400" />
              <p className="text-xs font-mono text-rose-200">Unable to load crime activity zones.</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1 rounded bg-[#0E2A4D] hover:bg-[#133560] text-xs text-[#F5B800] border border-[#1C3B64] font-semibold transition-colors mt-1"
                >
                  Retry
                </button>
              )}
            </div>
          ) : zones.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071A33]/90 text-white z-20 p-4 text-center">
              <Compass className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs font-mono text-slate-400">
                No crime activity zones available for the selected period.
              </p>
            </div>
          ) : (
            <MapContainer
              center={MUMBAI_CENTER}
              zoom={DEFAULT_ZOOM}
              zoomControl={false}
              maxBounds={MUMBAI_BOUNDS}
              minZoom={10}
              maxZoom={18}
              className="w-full h-full night-ops-map"
              style={{ background: '#061121' }}
            >
              {/* Night-Ops Filtered Basemap Tiles (Zero Watermark) */}
              <TileLayer
                attribution={tileLayerConfig.attribution}
                url={tileLayerConfig.url}
                maxZoom={tileLayerConfig.maxZoom}
              />


              {/* Viewport Smooth Controller */}
              <MapViewController targetCenter={flyTarget} targetZoom={13} />

              {/* Custom Map Controls */}
              <MapControls 
                onResetView={handleResetView} 
                isFullScreen={isFullScreen}
                onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
              />

              {/* Real Crime Activity Zone Markers */}
              {zones.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                const icon = createZoneIcon(zone, isSelected);

                return (
                  <Marker
                    key={zone.id}
                    position={[zone.latitude, zone.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => handleMarkerClick(zone)
                    }}
                  >
                    <Tooltip 
                      direction="top" 
                      offset={[0, -12]} 
                      opacity={0.98}
                      className="netra-map-tooltip"
                    >
                      <div className="p-1 text-[#071A33] font-sans">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#DC2626]" />
                          <span>{zone.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            ACTIVITY_CONFIG[zone.activityLevel]?.badgeClass || 'bg-slate-100'
                          }`}>
                            {zone.activityLevel} ACTIVITY
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {zone.reportedCrimes} reported crimes
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* Compact Severity Legend inside Map */}
          {zones.length > 0 && !loading && !error && (
            <div className="absolute bottom-2 left-2 z-[400] px-2.5 py-1.5 bg-[#071A33]/90 backdrop-blur-xs rounded border border-[#1C3B64] text-[9px] font-mono text-white shadow-lg pointer-events-none flex items-center gap-2.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider">SEVERITY:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span className="text-rose-300">VERY HIGH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F5B800]"></span>
                <span className="text-amber-300">HIGH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="text-sky-300">MEDIUM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="text-slate-300">LOW</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Bottom Information Card synchronized with Selected Marker */}
        {selectedZone ? (
          <div className="p-3 bg-[#F4F7FB] rounded-md border border-[#0B2341]/10 text-xs">
            <div className="flex items-center justify-between font-bold text-[#071A33]">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626] flex-shrink-0" />
                <span className="text-xs truncate">{selectedZone.name}</span>
              </div>
              <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap ${activeLevelConfig.badgeClass}`}>
                {selectedZone.topCategory || 'Crime Sector'}
              </span>
            </div>

            <div className="text-[11px] text-[#071A33]/80 mt-1.5">
              Station Jurisdiction: <strong className="text-[#071A33]">{selectedZone.stationJurisdiction}</strong>
            </div>

            {/* Dynamic Activity Intensity Progress Bar */}
            <div className="mt-2 pt-2 border-t border-[#0B2341]/10">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#071A33]/70 mb-1">
                <span className="font-semibold">AREA ACTIVITY LEVEL</span>
                <span className="font-bold text-[#071A33]">
                  {selectedZone.reportedCrimes} Reported Crimes ({selectedZone.activityLevel})
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0B2341]/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${activeLevelConfig.barClass}`}
                  style={{
                    width: `${Math.min(100, Math.max(12, (selectedZone.reportedCrimes / maxZoneCrimes) * 100))}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] gap-2">
              <div className="text-[#071A33]/60 font-mono text-[10px] truncate">
                Zone: <span className="text-[#071A33] font-semibold">{selectedZone.name}</span> • Region: <span className="text-[#071A33] font-semibold">{selectedZone.region}</span>
              </div>
              <button
                type="button"
                onClick={handleViewCases}
                className="text-[#071A33] font-bold hover:text-[#D97706] flex items-center gap-0.5 flex-shrink-0 transition-colors cursor-pointer"
                title={`View all registered cases in ${selectedZone.stationJurisdiction}`}
              >
                <span>View Cases</span>
                <ChevronRight className="w-3 h-3 text-[#F5B800]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#F4F7FB] rounded-md border border-[#0B2341]/10 text-xs text-center text-[#071A33]/60 font-mono">
            No crime activity zones available.
          </div>
        )}
      </div>
    </div>
  );
}
