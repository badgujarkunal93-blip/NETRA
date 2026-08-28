import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  FolderSearch, 
  Search, 
  Filter, 
  Maximize2,
  Minimize2,
  Crosshair,
  User, 
  Smartphone, 
  Car, 
  CreditCard, 
  Building2, 
  MapPin,
  Cpu,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  FileText,
  Share2,
  Compass,
  AlertCircle
} from 'lucide-react';
import { dbService } from '../services/db';

// Helper component to control map viewport (bounds & flyTo)
function MapViewportController({ bounds, centerTarget }) {
  const map = useMap();

  useEffect(() => {
    try {
      if (centerTarget && typeof centerTarget.lat === 'number' && typeof centerTarget.lng === 'number') {
        map.flyTo([centerTarget.lat, centerTarget.lng], 15, { duration: 1.2 });
      } else if (bounds && Array.isArray(bounds) && bounds.length >= 2 && Array.isArray(bounds[0]) && typeof bounds[0][0] === 'number') {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    } catch (err) {
      console.warn('MapViewportController notice:', err);
    }
  }, [bounds, centerTarget, map]);

  return null;
}

export default function KnowledgeGraph() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Case Selection State
  const [casesList, setCasesList] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case_id') || '');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [isCaseSearchOpen, setIsCaseSearchOpen] = useState(false);

  // Geospatial Network Data
  const [caseData, setCaseData] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [unplacedNodes, setUnplacedNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Inspection State
  const [selectedNode, setSelectedNode] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [expandedConnectionId, setExpandedConnectionId] = useState(null);

  // Analytical Filters
  const [minConfidence, setMinConfidence] = useState(0);
  const [provenanceFilter, setProvenanceFilter] = useState('All'); // 'All' | 'Observed Only' | 'AI-Inferred Only'
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Entity Type Configurations & Colors
  const ENTITY_CONFIG = {
    Person: { code: 'PER', color: '#3B82F6', label: 'Person', icon: User },
    Phone: { code: 'PH', color: '#0EA5E9', label: 'Phone', icon: Smartphone },
    Vehicle: { code: 'VEH', color: '#10B981', label: 'Vehicle', icon: Car },
    Account: { code: 'ACC', color: '#8B5CF6', label: 'Account', icon: CreditCard },
    Organization: { code: 'ORG', color: '#6366F1', label: 'Organization', icon: Building2 },
    Case: { code: 'FIR', color: '#F59E0B', label: 'Case / FIR', icon: FolderSearch },
    Location: { code: 'LOC', color: '#14B8A6', label: 'Location / Event', icon: MapPin },
    Device: { code: 'DEV', color: '#64748B', label: 'Device', icon: Cpu },
  };

  // Load All Cases for Selector
  useEffect(() => {
    async function loadCases() {
      const allCases = await dbService.getCases();
      setCasesList(allCases);
      if (allCases && allCases.length > 0) {
        const urlCaseId = searchParams.get('case_id');
        const match = allCases.find(c => c.id === urlCaseId || c.crime_no === urlCaseId);
        if (match) {
          setSelectedCaseId(match.id);
        } else if (!selectedCaseId || !allCases.find(c => c.id === selectedCaseId)) {
          setSelectedCaseId(allCases[0].id);
          setSearchParams({ case_id: allCases[0].id }, { replace: true });
        }
      }
    }
    loadCases();
  }, []);

  // Load Scoped Case Intelligence Network
  useEffect(() => {
    async function loadCaseNetwork() {
      if (!selectedCaseId) {
        setCaseData(null);
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const network = await dbService.getCaseIntelligenceNetwork(selectedCaseId, {
          minConfidence,
          provenance: provenanceFilter
        });

        if (network) {
          setCaseData(network.caseData);
          setNodes(network.nodes || []);
          setEdges(network.edges || []);
          setUnplacedNodes(network.unplacedNodes || []);

          // Default select case or primary accused
          if (network.nodes && network.nodes.length > 0) {
            const primary = network.nodes.find(n => n.type === 'Person' && (n.subtext === 'Accused' || n.subtext === 'Key Suspect')) || network.nodes[0];
            setSelectedNode(primary);
          } else {
            setSelectedNode(null);
          }
        }
      } catch (err) {
        console.error("Failed to load case network:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCaseNetwork();
  }, [selectedCaseId, minConfidence, provenanceFilter]);

  // Compute Map Bounding Box
  const mapBounds = useMemo(() => {
    const validCoords = nodes.filter(n => n.lat && n.lng).map(n => [n.lat, n.lng]);
    if (validCoords.length === 0) return [[18.90, 72.80], [19.20, 72.95]]; // Mumbai Default
    return validCoords;
  }, [nodes]);

  // Map Basemap & Provider API Key Configuration
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

  // Handle Case Switcher
  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setSearchParams(caseId ? { case_id: caseId } : {});
    setCaseSearchQuery('');
    setIsCaseSearchOpen(false);
    setFlyToTarget(null);
  };

  // Filtered cases for search dropdown
  const filteredCases = useMemo(() => {
    if (!caseSearchQuery.trim()) return casesList;
    const q = caseSearchQuery.toLowerCase();
    return casesList.filter(c =>
      c.crime_no.toLowerCase().includes(q) ||
      c.case_no.toLowerCase().includes(q) ||
      c.crime_category.toLowerCase().includes(q) ||
      c.police_station.toLowerCase().includes(q) ||
      c.brief_facts.toLowerCase().includes(q)
    );
  }, [casesList, caseSearchQuery]);

  // Create Custom Leaflet Marker Icon for Entity Pins - Night-Ops Theme
  const createEntityIcon = (node) => {
    const cfg = ENTITY_CONFIG[node.type] || ENTITY_CONFIG.Person;
    const isSelected = selectedNode?.id === node.id;
    const isCase = node.type === 'Case';

    // Glowing Dot Color & Profile Determination
    let glowColor = '#F59E0B'; // default amber/orange glow
    let ringColor = 'rgba(245, 158, 11, 0.4)';
    let isHigh = false;

    // Confirmed / High-confidence finding / Focal case / Accused -> Glowing Red (#E4232D)
    if (isCase || node.subtext === 'Accused' || node.subtext === 'Key Suspect' || (node.confidence && node.confidence >= 80)) {
      glowColor = '#E4232D';
      ringColor = 'rgba(228, 35, 45, 0.4)';
      isHigh = true;
    }
    // Resolved / Low-priority / Location / Witness / Peripheral -> Muted Green (#10B981)
    else if (node.type === 'Location' || node.subtext === 'Witness' || (node.confidence && node.confidence < 50)) {
      glowColor = '#10B981';
      ringColor = 'rgba(16, 185, 129, 0.4)';
    }

    const size = isCase ? 32 : isSelected ? 28 : 22;
    const code = node.typeCode || cfg.code;

    const html = `
      <div style="
        position: relative;
        width: ${size + 18}px;
        height: ${size + 18}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${(isSelected || isCase || isHigh) ? `
          <div class="radar-ring" style="
            position: absolute;
            width: ${size + 18}px;
            height: ${size + 18}px;
            border-radius: 9999px;
            border: 1.5px solid ${glowColor};
            background: ${ringColor};
            pointer-events: none;
          "></div>
        ` : ''}
        
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          border-radius: 9999px;
          background: #061121;
          border: 2px solid ${glowColor};
          box-shadow: 0 0 10px ${glowColor}, 0 0 20px ${glowColor}80, inset 0 0 6px ${glowColor}99;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 800;
          font-size: ${isCase ? '9px' : '7.5px'};
          letter-spacing: 0.04em;
          text-transform: uppercase;
        ">
          <!-- Inner High-Contrast Core Dot -->
          <div style="
            position: absolute;
            width: 4px;
            height: 4px;
            border-radius: 9999px;
            background: #FFFFFF;
            box-shadow: 0 0 5px #FFFFFF;
            top: 2px;
            right: 2px;
          "></div>
          ${code}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-map-marker',
      iconSize: [size + 18, size + 18],
      iconAnchor: [(size + 18) / 2, (size + 18) / 2],
    });
  };

  // Connected Detailed Connections for Side Card
  const detailedConnectionsList = useMemo(() => {
    if (!selectedNode) return [];

    return edges
      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
      .map(edge => {
        const isSource = edge.source === selectedNode.id;
        const targetId = isSource ? edge.target : edge.source;
        const targetNode = nodes.find(n => n.id === targetId);

        return {
          edgeId: edge.id,
          targetNode,
          verb: edge.verb || edge.label,
          detailLabel: edge.detailLabel || edge.label,
          status: edge.status,
          confidence: edge.confidence,
          evidence: edge.evidence,
          first_seen: edge.first_seen,
          last_seen: edge.last_seen,
          model_version: edge.model_version
        };
      })
      .filter(c => Boolean(c.targetNode));
  }, [selectedNode, edges, nodes]);

  // Filter edges with strictly valid coordinate pairs for Leaflet Polyline rendering
  const validMapEdges = useMemo(() => {
    const map = new Map(nodes.map(n => [n.id, n]));
    return edges
      .map(e => {
        const srcNode = map.get(e.source);
        const tgtNode = map.get(e.target);
        const srcCoords = (Array.isArray(e.sourceCoords) && typeof e.sourceCoords[0] === 'number') 
          ? e.sourceCoords 
          : (srcNode && typeof srcNode.lat === 'number' && typeof srcNode.lng === 'number' ? [srcNode.lat, srcNode.lng] : null);
        const tgtCoords = (Array.isArray(e.targetCoords) && typeof e.targetCoords[0] === 'number') 
          ? e.targetCoords 
          : (tgtNode && typeof tgtNode.lat === 'number' && typeof tgtNode.lng === 'number' ? [tgtNode.lat, tgtNode.lng] : null);

        if (!srcCoords || !tgtCoords) return null;
        return {
          ...e,
          resolvedSourceCoords: srcCoords,
          resolvedTargetCoords: tgtCoords
        };
      })
      .filter(Boolean);
  }, [edges, nodes]);

  // Walk to node from side card: pans map & selects node
  const handleWalkToNode = (targetNode) => {
    if (!targetNode) return;
    setSelectedNode(targetNode);
    if (targetNode.lat && targetNode.lng) {
      setFlyToTarget({ lat: targetNode.lat, lng: targetNode.lng, t: Date.now() });
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-md overflow-hidden border border-[#132B4C] bg-[#061121] select-none flex flex-col ${
        isFullScreen ? 'h-screen w-screen' : 'h-[calc(100vh-6rem)]'
      }`}
    >
      {/* 1. TOP CASE-SCOPED SELECTOR & CONTROLS */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-2">
        {/* Left Searchable Case Selector */}
        <div className="pointer-events-auto relative">
          <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-lg text-xs">
            <FolderSearch className="w-4 h-4 text-[#D4A017]" />
            <input
              type="text"
              value={caseSearchQuery}
              onChange={(e) => { setCaseSearchQuery(e.target.value); setIsCaseSearchOpen(true); }}
              onFocus={() => setIsCaseSearchOpen(true)}
              placeholder={caseData ? `${caseData.crime_no} (${caseData.police_station})` : "Select registered FIR case..."}
              className="w-72 bg-transparent text-white placeholder-slate-400 text-xs focus:outline-none font-sans font-semibold"
            />
            {caseData && (
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 uppercase font-bold">
                {caseData.status}
              </span>
            )}
            {selectedCaseId && (
              <button
                onClick={() => handleSelectCase(null)}
                className="text-slate-400 hover:text-white p-0.5"
                title="Clear selected case"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Searchable Case Dropdown */}
          {isCaseSearchOpen && (
            <div className="absolute top-full left-0 w-96 mt-1.5 bg-[#0A192F] border border-[#254F85] rounded-md shadow-2xl py-1 z-50 max-h-72 overflow-y-auto divide-y divide-white/5">
              <div className="px-3 py-1.5 text-[9.5px] font-mono uppercase text-slate-400 border-b border-white/10 flex items-center justify-between">
                <span>Select Active Investigation FIR</span>
                <span className="text-[#D4A017]">{filteredCases.length} Registered</span>
              </div>
              {filteredCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-[#132B4C] flex items-center justify-between text-xs transition-colors ${
                    selectedCaseId === c.id ? 'bg-[#132B4C] border-l-2 border-[#D4A017]' : ''
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white truncate flex items-center gap-1.5">
                      <span className="text-mono font-bold text-[#D4A017]">{c.crime_no}</span>
                      <span className="text-slate-400 font-normal">({c.case_no})</span>
                    </div>
                    <div className="text-[10px] text-slate-300 truncate mt-0.5">
                      {c.police_station} • {c.crime_major_head}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Viewport Controls */}
        <div className="pointer-events-auto flex items-center gap-1 glass-card p-1 rounded-lg text-xs">
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`p-1.5 rounded transition-colors ${isFilterPanelOpen ? 'bg-[#D4A017] text-[#0A192F]' : 'text-slate-300 hover:bg-white/10'}`}
            title="Toggle Filter Panel"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (caseData) {
                setFlyToTarget({ lat: caseData.latitude, lng: caseData.longitude, t: Date.now() });
              }
            }}
            title="Center on Crime Scene Anchor"
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleFullScreen} title="Toggle Fullscreen" className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10">
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. FILTER PANEL SLIDEOUT */}
      {isFilterPanelOpen && (
        <div className="absolute top-16 left-3 z-[1000] w-64 glass-card rounded-lg p-3 text-xs space-y-3 text-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-white">
              Geospatial Filters
            </span>
            <button onClick={() => setIsFilterPanelOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Provenance Filter */}
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5" title="Filter between confirmed evidence and AI pattern clues">
              Connection Type (Filter)
            </span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[
                { id: 'All', label: 'All Links' },
                { id: 'Observed Only', label: 'Confirmed' },
                { id: 'AI-Inferred Only', label: 'AI Clues' }
              ].map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => setProvenanceFilter(prov.id)}
                  className={`py-1 px-1 rounded text-center font-mono font-medium transition-colors ${
                    provenanceFilter === prov.id
                      ? 'bg-[#D4A017] text-[#0A192F] font-bold'
                      : 'bg-[#0E223D] text-slate-300 hover:bg-[#132B4C]'
                  }`}
                  title={prov.id === 'Observed Only' ? 'Confirmed physical evidence only' : prov.id === 'AI-Inferred Only' ? 'AI pattern predictions only' : 'All links'}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Confidence Slider */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400" title="Hide connections below this certainty threshold">
                Min Match Certainty
              </span>
              <span className="font-mono font-bold text-[#D4A017] text-[11px]">{minConfidence}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-full accent-[#D4A017] cursor-pointer bg-[#061121]"
            />
          </div>
        </div>
      )}

      {/* 3. MAIN GEOSPATIAL MAP CANVAS (React-Leaflet Night-Ops Dark Map) */}
      <div className="w-full h-full flex-1 relative">
        {selectedCaseId && caseData ? (
          <MapContainer
            center={[caseData.latitude || 19.0760, caseData.longitude || 72.8777]}
            zoom={14}
            zoomControl={false}
            className="w-full h-full night-ops-map"
            style={{ background: '#061121' }}
          >
            {/* Night-Ops Filtered Basemap Tiles */}
            <TileLayer
              attribution={tileLayerConfig.attribution}
              url={tileLayerConfig.url}
              maxZoom={tileLayerConfig.maxZoom}
            />

            {/* Viewport Bounds Controller */}
            <MapViewportController bounds={mapBounds} centerTarget={flyToTarget} />

            {/* Luminous Relationship Network Lines */}
            {edges.map((edge) => {
              const isInferred = edge.status === 'inferred';
              const isConnectedToSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

              const srcNode = nodes.find(n => n.id === edge.source);
              const tgtNode = nodes.find(n => n.id === edge.target);
              const sourceCoords = edge.sourceCoords || edge.resolvedSourceCoords || (srcNode && srcNode.lat && srcNode.lng ? [srcNode.lat, srcNode.lng] : null);
              const targetCoords = edge.targetCoords || edge.resolvedTargetCoords || (tgtNode && tgtNode.lat && tgtNode.lng ? [tgtNode.lat, tgtNode.lng] : null);

              if (!sourceCoords || !targetCoords || !Array.isArray(sourceCoords) || !Array.isArray(targetCoords)) {
                return null;
              }

              return (
                <Polyline
                  key={edge.id}
                  positions={[sourceCoords, targetCoords]}
                  pathOptions={{
                    color: isConnectedToSelected ? '#E4232D' : isInferred ? '#F59E0B' : '#38BDF8',
                    weight: isConnectedToSelected ? 2.5 : isInferred ? 1.5 : 1.2,
                    dashArray: isInferred ? '4, 6' : undefined,
                    opacity: isConnectedToSelected ? 0.95 : isInferred ? 0.75 : 0.45
                  }}
                >
                  <Tooltip sticky direction="top" className="night-ops-tooltip">
                    <div className="font-mono text-[9.5px] uppercase tracking-wider">
                      <span className="text-[#D4A017] font-bold">{edge.verb || edge.label}</span>: {edge.detailLabel || edge.label} <span className="text-slate-400">({edge.confidence || 85}% Conf)</span>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

            {/* Pinned Entity High-Contrast Glowing Markers */}
            {nodes.filter(n => n.lat && n.lng).map((node) => {
              return (
                <Marker
                  key={node.id}
                  position={[node.lat, node.lng]}
                  icon={createEntityIcon(node)}
                  eventHandlers={{
                    click: () => {
                      setSelectedNode(node);
                    }
                  }}
                >
                  <Tooltip direction="bottom" offset={[0, 12]} opacity={0.98} className="night-ops-tooltip">
                    <div className="font-mono text-[10px] uppercase tracking-wider">
                      <div className="font-bold text-[#D4A017] flex items-center gap-1">
                        <span>{node.label}</span>
                        {node.confidence && <span className="text-[8.5px] px-1 py-0.2 rounded bg-[#0E223D] text-slate-300">[{node.confidence}%]</span>}
                      </div>
                      <div className="text-slate-400 text-[9px] lowercase tracking-normal font-sans">{node.subtext}</div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          /* Empty State before case selection */
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-[#061121] text-slate-300">
            <div className="w-14 h-14 rounded-full bg-[#0E223D] border border-[#1C3B64] flex items-center justify-center text-[#D4A017] mb-3 shadow-lg">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Select a Case to View its Intelligence Network
            </h2>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Select a registered FIR above to load only the individuals, burner phones, vehicles, and forensic events pinned across Mumbai.
            </p>
            <div className="flex items-center gap-2 mt-4">
              {casesList.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className="px-3 py-1.5 bg-[#0E223D] hover:bg-[#132B4C] text-white text-xs font-mono rounded border border-[#1C3B64] transition-colors"
                >
                  {c.crime_no}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. TACTICAL MAP LEGEND (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0A192F]/95 border border-[#132B4C] p-2.5 rounded shadow-2xl text-[10px] text-slate-300 backdrop-blur-md flex flex-col gap-1.5 pointer-events-auto">
        <div className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between gap-3 border-b border-[#132B4C] pb-1">
          <span>Night-Ops Telemetry</span>
          <span className="text-[#D4A017]">CIU-NET</span>
        </div>
        <div className="flex items-center gap-3 text-[9.5px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E4232D] shadow-[0_0_8px_#E4232D] inline-block"></span>
            <span>Confirmed / Focal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] inline-block"></span>
            <span>Unverified / Lead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] inline-block"></span>
            <span>Resolved / Asset</span>
          </div>
        </div>
      </div>

      {/* 5. UNPLACED ENTITIES STRIP (Bottom Tray if any) */}
      {unplacedNodes.length > 0 && (
        <div className="absolute bottom-16 left-3 z-[1000] glass-card px-3 py-1.5 rounded-lg text-[10px] text-slate-300 flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono font-bold text-white">Unplaced Entities:</span>
          <div className="flex items-center gap-1">
            {unplacedNodes.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedNode(u)}
                className="px-2 py-0.5 bg-[#132B4C] hover:bg-[#1C3B64] text-white rounded font-mono text-[9px] border border-[#254F85]"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. RIGHT SIDE DETAIL CARD */}
      {selectedNode && (
        <aside className="absolute top-16 right-3 bottom-3 z-[1000] w-88 glass-card rounded-lg overflow-hidden flex flex-col text-xs text-slate-200 shadow-2xl">
          {/* Header */}
          <div className="p-3.5 bg-[#0A192F]/90 text-white border-b border-white/10 flex items-start justify-between flex-shrink-0">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase"
                  style={{
                    backgroundColor: `${ENTITY_CONFIG[selectedNode.type]?.color}33`,
                    color: ENTITY_CONFIG[selectedNode.type]?.color || '#FFFFFF'
                  }}
                >
                  {selectedNode.type}
                </span>
                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">
                  {selectedNode.confidence || 90}% Conf
                </span>
              </div>
              <h2 className="text-sm font-bold text-white truncate">
                {selectedNode.label}
              </h2>
              <div className="text-[10.5px] text-slate-300 truncate mt-0.5">
                {selectedNode.subtext || selectedNode.type}
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Card Body with Scrollable Sections */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 divide-y divide-white/10">
            {/* SECTION 1: PROMINENT CONNECTIONS LIST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#D4A017]" />
                  Direct Connections ({detailedConnectionsList.length})
                </h3>
                <span className="text-[9.5px] text-slate-400 font-mono">Click to fly to pin</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {detailedConnectionsList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-300 italic bg-white/[0.05] rounded border border-white/15">
                    No direct connections recorded for this entity.
                  </div>
                ) : (
                  detailedConnectionsList.map((conn) => {
                    const cfg = ENTITY_CONFIG[conn.targetNode.type] || ENTITY_CONFIG.Person;
                    const isExpanded = expandedConnectionId === conn.edgeId;

                    return (
                      <div
                        key={conn.edgeId}
                        className="rounded border border-white/15 hover:border-white/30 bg-white/[0.07] backdrop-blur-sm transition-all overflow-hidden"
                      >
                        {/* Connection Header Row */}
                        <div
                          onClick={() => handleWalkToNode(conn.targetNode)}
                          className="p-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.12] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[8.5px] text-white flex-shrink-0"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {conn.targetNode.typeCode || cfg.code}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-white truncate">
                                {conn.targetNode.label}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1 py-0.2 rounded bg-white/10 font-mono font-bold text-[8.5px] text-slate-200 uppercase border border-white/15">
                                  {conn.verb}
                                </span>
                                <span className={`text-[8.5px] font-mono font-bold uppercase ${
                                  conn.status === 'inferred' ? 'text-[#D4A017]' : 'text-slate-300'
                                }`}>
                                  {conn.status === 'inferred' ? 'AI INFERRED' : 'OBSERVED'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="font-mono text-[9.5px] font-bold text-[#D4A017]">
                              {conn.confidence}%
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedConnectionId(isExpanded ? null : conn.edgeId);
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded"
                              title="Inspect Relationship Evidence"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Inline Evidence & Model Detail */}
                        {isExpanded && (
                          <div className="p-2 bg-white/[0.06] border-t border-white/15 text-[10px] space-y-1 text-slate-200">
                            <div>
                              <strong className="text-white font-mono uppercase text-[9px]">Description:</strong> {conn.detailLabel}
                            </div>
                            <div>
                              <strong className="text-white font-mono uppercase text-[9px]">Evidence:</strong> {conn.evidence}
                            </div>
                            {conn.model_version && (
                              <div className="font-mono text-slate-300 text-[9px]">
                                Model: {conn.model_version}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECTION 2: IDENTITY & KEY ATTRIBUTES */}
            <div className="pt-3 space-y-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Identity & Key Attributes
              </h3>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white/[0.06] p-2 rounded border border-white/15">
                <div>
                  <span className="text-slate-300 text-[9.5px] block">Entity ID:</span>
                  <span className="font-mono font-semibold text-white">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="text-slate-300 text-[9.5px] block">Status:</span>
                  <span className="font-semibold text-white">{selectedNode.subtext || 'Active'}</span>
                </div>
                {selectedNode.lat && selectedNode.lng && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9.5px] block">Coordinates:</span>
                    <span className="font-mono text-[10px] text-[#D4A017]">{selectedNode.lat.toFixed(4)}° N, {selectedNode.lng.toFixed(4)}° E</span>
                  </div>
                )}
                {selectedNode.dob && (
                  <div>
                    <span className="text-slate-400 text-[9.5px] block">DOB / Age:</span>
                    <span className="font-semibold text-white">{selectedNode.dob}</span>
                  </div>
                )}
                {selectedNode.owner && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9.5px] block">Beneficial Owner:</span>
                    <span className="font-semibold text-white">{selectedNode.owner}</span>
                  </div>
                )}
                {selectedNode.aliases && selectedNode.aliases.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9.5px] block">Known Aliases:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedNode.aliases.map((al, idx) => (
                        <span key={idx} className="px-1 py-0.2 bg-[#0E223D] rounded border border-[#132B4C] font-mono text-[9.5px] text-slate-200">
                          "{al}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: INTELLIGENCE & CORRELATION */}
            <div className="pt-3 space-y-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4A017]" />
                Case Intelligence
              </h3>
              <div className="p-2 bg-[#0E223D]/70 border border-[#132B4C] rounded text-[11px] text-slate-200 space-y-1">
                <div>
                  <span className="font-semibold text-[#D4A017]">Case Correlation:</span>
                  <p className="mt-0.5 leading-snug">
                    {selectedNode.type === 'Case'
                      ? selectedNode.brief_facts
                      : `Correlated to active FIR ${caseData.crime_no} under ${caseData.police_station} jurisdiction.`}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: ACTIVITY TIMELINE */}
            {selectedNode.events && selectedNode.events.length > 0 && (
              <div className="pt-3 space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D4A017]" />
                  Activity Timeline
                </h3>
                <div className="space-y-1.5 relative pl-3 border-l border-[#132B4C] text-[10.5px]">
                  {selectedNode.events.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[16px] top-1 w-1.5 h-1.5 rounded-full bg-[#D4A017]"></span>
                      <div className="font-semibold text-white">{evt.event_type}</div>
                      <div className="text-slate-400 text-[9.5px] font-mono">
                        {new Date(evt.event_time).toLocaleDateString()} • {evt.location_text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="p-3 bg-[#061121] border-t border-[#132B4C] flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                if (selectedNode.type === 'Person') navigate(`/entities?id=${selectedNode.id}`);
                else if (selectedNode.type === 'Case') navigate(`/cases?id=${selectedNode.id}`);
                else navigate(`/entities`);
              }}
              className="w-full py-1.5 bg-[#0A192F] hover:bg-[#132B4C] text-white font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 border border-[#132B4C]"
            >
              <span>Inspect Full Dossier</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#D4A017]" />
            </button>
            {selectedNode.lat && selectedNode.lng && (
              <button
                onClick={() => setFlyToTarget({ lat: selectedNode.lat, lng: selectedNode.lng, t: Date.now() })}
                className="w-full py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] rounded border border-slate-300 transition-colors"
              >
                Center Map on Pin
              </button>
            )}
          </div>
        </aside>
      )}

      {/* 6. SIMPLIFIED BOTTOM-LEFT LEGEND */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0A192F]/98 border border-[#132B4C] px-3 py-1.5 rounded shadow-xl text-[10px] text-slate-300 flex items-center gap-4 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#D4A017]"></span>
          <span>Observed Link</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#D4A017]"></span>
          <span>AI Inferred</span>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-[#132B4C]">
          {Object.entries(ENTITY_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }}></span>
              <span className="text-[9px] font-mono">{cfg.code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
