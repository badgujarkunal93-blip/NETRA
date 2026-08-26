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
    if (centerTarget && centerTarget.lat && centerTarget.lng) {
      map.flyTo([centerTarget.lat, centerTarget.lng], 15, { duration: 1.2 });
    } else if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
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
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('case_id') || 'CASE-2026-0811');
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
  const [minConfidence, setMinConfidence] = useState(50);
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
      const network = await dbService.getCaseIntelligenceNetwork(selectedCaseId, {
        minConfidence,
        provenance: provenanceFilter
      });

      setCaseData(network.caseData);
      setNodes(network.nodes);
      setEdges(network.edges);
      setUnplacedNodes(network.unplacedNodes || []);

      // Default select case or primary accused
      if (network.nodes.length > 0) {
        const primary = network.nodes.find(n => n.type === 'Person' && (n.subtext === 'Accused' || n.subtext === 'Key Suspect')) || network.nodes[0];
        setSelectedNode(primary);
      } else {
        setSelectedNode(null);
      }

      setLoading(false);
    }
    loadCaseNetwork();
  }, [selectedCaseId, minConfidence, provenanceFilter]);

  // Compute Map Bounding Box
  const mapBounds = useMemo(() => {
    const validCoords = nodes.filter(n => n.lat && n.lng).map(n => [n.lat, n.lng]);
    if (validCoords.length === 0) return [[18.90, 72.80], [19.20, 72.95]]; // Mumbai Default
    return validCoords;
  }, [nodes]);

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

  // Create Custom Leaflet Marker Icon for Entity Pins
  const createEntityIcon = (node) => {
    const cfg = ENTITY_CONFIG[node.type] || ENTITY_CONFIG.Person;
    const isSelected = selectedNode?.id === node.id;
    const isCase = node.type === 'Case';

    const size = isCase ? 38 : isSelected ? 34 : 28;
    const code = node.typeCode || cfg.code;

    const html = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${isSelected ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 9999px;
            border: 2px solid #D4A017;
            background: rgba(212, 160, 23, 0.25);
          "></div>
        ` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 9999px;
          background: #0A192F;
          border: ${isCase ? '2.5px solid #F59E0B' : `2px solid ${cfg.color}`};
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isSelected ? '#D4A017' : '#FFFFFF'};
          font-family: 'Inter', monospace;
          font-weight: bold;
          font-size: ${isCase ? '9.5px' : '8.5px'};
          letter-spacing: -0.02em;
        ">
          ${code}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-map-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
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
          <div className="flex items-center gap-2 bg-[#0A192F]/98 border border-[#132B4C] px-3 py-1.5 rounded shadow-xl text-xs backdrop-blur-md">
            <FolderSearch className="w-4 h-4 text-[#D4A017]" />
            <input
              type="text"
              value={caseSearchQuery}
              onChange={(e) => { setCaseSearchQuery(e.target.value); setIsCaseSearchOpen(true); }}
              onFocus={() => setIsCaseSearchOpen(true)}
              placeholder={caseData ? `${caseData.crime_no} (${caseData.police_station})` : "Select registered FIR case..."}
              className="w-72 bg-transparent text-white placeholder-slate-300 text-xs focus:outline-none font-sans font-semibold"
            />
            {caseData && (
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[#B45309]/30 text-[#D4A017] border border-[#B45309]/50 uppercase font-bold">
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
            <div className="absolute top-full left-0 w-96 mt-1.5 bg-[#0A192F] border border-[#132B4C] rounded shadow-2xl py-1 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[9.5px] font-mono uppercase text-slate-400 border-b border-[#132B4C] flex items-center justify-between">
                <span>Select Active Investigation FIR</span>
                <span>{filteredCases.length} Registered</span>
              </div>
              {filteredCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-[#132B4C] flex items-center justify-between text-xs transition-colors border-b border-[#132B4C]/40 last:border-0 ${
                    selectedCaseId === c.id ? 'bg-[#132B4C]/80 border-l-2 border-[#D4A017]' : ''
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
        <div className="pointer-events-auto flex items-center gap-1 bg-[#0A192F]/98 border border-[#132B4C] p-1 rounded shadow-xl text-xs backdrop-blur-md">
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`p-1.5 rounded transition-colors ${isFilterPanelOpen ? 'bg-[#D4A017] text-[#0A192F]' : 'text-slate-300 hover:bg-[#132B4C]'}`}
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
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#132B4C]"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleFullScreen} title="Toggle Fullscreen" className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#132B4C]">
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. FILTER PANEL SLIDEOUT */}
      {isFilterPanelOpen && (
        <div className="absolute top-16 left-3 z-[1000] w-64 bg-[#0A192F]/98 border border-[#132B4C] rounded shadow-2xl p-3 text-xs space-y-3 text-slate-200 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#132B4C] pb-1.5">
            <span className="font-bold uppercase tracking-wider text-[10px] text-white">
              Geospatial Filters
            </span>
            <button onClick={() => setIsFilterPanelOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Provenance Filter */}
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
              Relationship Links
            </span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {['All', 'Observed Only', 'AI-Inferred Only'].map((prov) => (
                <button
                  key={prov}
                  onClick={() => setProvenanceFilter(prov)}
                  className={`py-1 px-1 rounded text-center font-mono font-medium transition-colors ${
                    provenanceFilter === prov
                      ? 'bg-[#D4A017] text-[#0A192F] font-bold'
                      : 'bg-[#0E223D] text-slate-300 hover:bg-[#132B4C]'
                  }`}
                >
                  {prov.replace(' Only', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Confidence Slider */}
          <div className="pt-2 border-t border-[#132B4C]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Min Confidence</span>
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

      {/* 3. MAIN GEOSPATIAL MAP CANVAS (React-Leaflet Dark Map) */}
      <div className="w-full h-full flex-1 relative">
        {selectedCaseId && caseData ? (
          <MapContainer
            center={[caseData.latitude || 19.0760, caseData.longitude || 72.8777]}
            zoom={14}
            zoomControl={false}
            className="w-full h-full"
            style={{ background: '#061121' }}
          >
            {/* Dark Matter Basemap Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {/* Viewport Bounds Controller */}
            <MapViewportController bounds={mapBounds} centerTarget={flyToTarget} />

            {/* Relationship Lines (Polylines between pinned nodes) */}
            {edges.map((edge) => {
              const isInferred = edge.status === 'inferred';
              const isConnectedToSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

              return (
                <Polyline
                  key={edge.id}
                  positions={[edge.sourceCoords, edge.targetCoords]}
                  pathOptions={{
                    color: isConnectedToSelected ? '#D4A017' : isInferred ? 'rgba(212, 160, 23, 0.45)' : 'rgba(255, 255, 255, 0.25)',
                    weight: isConnectedToSelected ? 3.5 : 1.8,
                    dashArray: isInferred ? '6, 6' : undefined,
                    opacity: isConnectedToSelected ? 1 : 0.6
                  }}
                >
                  <Tooltip sticky direction="top">
                    <div className="bg-[#0A192F] text-white p-1 rounded font-mono text-[9px] border border-[#132B4C]">
                      <strong>{edge.verb}</strong>: {edge.detailLabel} ({edge.confidence}% Conf)
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

            {/* Pinned Entity Markers */}
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
                  <Tooltip direction="bottom" offset={[0, 10]} opacity={0.95}>
                    <div className="bg-[#0A192F] text-white p-1.5 rounded shadow-lg border border-[#132B4C] text-[10px]">
                      <div className="font-bold text-[#D4A017]">{node.label}</div>
                      <div className="text-slate-300 text-[9px]">{node.subtext}</div>
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

      {/* 4. UNPLACED ENTITIES STRIP (Bottom Tray if any) */}
      {unplacedNodes.length > 0 && (
        <div className="absolute bottom-12 left-3 z-[1000] bg-[#0A192F]/98 border border-[#132B4C] px-3 py-1.5 rounded shadow-lg text-[10px] text-slate-300 flex items-center gap-2 backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono font-bold">Unplaced Entities:</span>
          <div className="flex items-center gap-1">
            {unplacedNodes.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedNode(u)}
                className="px-1.5 py-0.5 bg-[#132B4C] hover:bg-[#1C3B64] text-white rounded font-mono text-[9px]"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. RIGHT SIDE DETAIL CARD (Populated with selected entity data) */}
      {selectedNode && (
        <aside className="absolute top-16 right-3 bottom-3 z-[1000] w-88 bg-white border border-[#CBD5E1] rounded-md shadow-2xl overflow-hidden flex flex-col text-xs text-[#0F172A]">
          {/* Header */}
          <div className="p-3.5 bg-[#0A192F] text-white border-b border-[#132B4C] flex items-start justify-between flex-shrink-0">
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
                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] font-bold">
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
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#132B4C]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Card Body with Scrollable Sections */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 divide-y divide-slate-100">
            {/* SECTION 1: PROMINENT CONNECTIONS LIST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#0A192F]" />
                  Direct Connections ({detailedConnectionsList.length})
                </h3>
                <span className="text-[9.5px] text-slate-400 font-mono">Click to fly to pin</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {detailedConnectionsList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded">
                    No direct connections recorded for this entity.
                  </div>
                ) : (
                  detailedConnectionsList.map((conn) => {
                    const cfg = ENTITY_CONFIG[conn.targetNode.type] || ENTITY_CONFIG.Person;
                    const isExpanded = expandedConnectionId === conn.edgeId;

                    return (
                      <div
                        key={conn.edgeId}
                        className="rounded border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC] transition-all overflow-hidden"
                      >
                        {/* Connection Header Row (Click to fly & walk) */}
                        <div
                          onClick={() => handleWalkToNode(conn.targetNode)}
                          className="p-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#F1F5F9] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[8.5px] text-white flex-shrink-0"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {conn.targetNode.typeCode || cfg.code}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-[#0A192F] truncate">
                                {conn.targetNode.label}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1 py-0.2 rounded bg-slate-200 font-mono font-bold text-[8.5px] text-slate-700 uppercase">
                                  {conn.verb}
                                </span>
                                <span className={`text-[8.5px] font-mono font-bold uppercase ${
                                  conn.status === 'inferred' ? 'text-[#92400E]' : 'text-slate-500'
                                }`}>
                                  {conn.status === 'inferred' ? 'AI INFERRED' : 'OBSERVED'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="font-mono text-[9.5px] font-bold text-[#92400E]">
                              {conn.confidence}%
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedConnectionId(isExpanded ? null : conn.edgeId);
                              }}
                              className="p-1 text-slate-400 hover:text-[#0A192F] rounded"
                              title="Inspect Relationship Evidence"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Inline Evidence & Model Detail */}
                        {isExpanded && (
                          <div className="p-2 bg-white border-t border-slate-200 text-[10px] space-y-1 text-slate-600">
                            <div>
                              <strong className="text-slate-800">Description:</strong> {conn.detailLabel}
                            </div>
                            <div>
                              <strong className="text-slate-800">Evidence:</strong> {conn.evidence}
                            </div>
                            {conn.model_version && (
                              <div className="font-mono text-slate-400 text-[9px]">
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
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Identity & Key Attributes
              </h3>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#F8FAFC] p-2 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[9.5px] block">Entity ID:</span>
                  <span className="font-mono font-semibold text-[#0A192F]">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[9.5px] block">Status:</span>
                  <span className="font-semibold text-[#0A192F]">{selectedNode.subtext || 'Active'}</span>
                </div>
                {selectedNode.lat && selectedNode.lng && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9.5px] block">Coordinates:</span>
                    <span className="font-mono text-[10px] text-[#0A192F]">{selectedNode.lat.toFixed(4)}° N, {selectedNode.lng.toFixed(4)}° E</span>
                  </div>
                )}
                {selectedNode.dob && (
                  <div>
                    <span className="text-slate-400 text-[9.5px] block">DOB / Age:</span>
                    <span className="font-semibold text-[#0A192F]">{selectedNode.dob}</span>
                  </div>
                )}
                {selectedNode.owner && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9.5px] block">Beneficial Owner:</span>
                    <span className="font-semibold text-[#0A192F]">{selectedNode.owner}</span>
                  </div>
                )}
                {selectedNode.aliases && selectedNode.aliases.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9.5px] block">Known Aliases:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedNode.aliases.map((al, idx) => (
                        <span key={idx} className="px-1 py-0.2 bg-white rounded border border-slate-200 font-mono text-[9.5px]">
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
                <Sparkles className="w-3 h-3 text-[#B45309]" />
                Case Intelligence
              </h3>
              <div className="p-2 bg-[#FEF3C7]/40 border border-[#FCD34D] rounded text-[11px] text-slate-800 space-y-1">
                <div>
                  <span className="font-semibold text-[#92400E]">Case Correlation:</span>
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
                  <Clock className="w-3 h-3 text-[#0A192F]" />
                  Activity Timeline
                </h3>
                <div className="space-y-1.5 relative pl-3 border-l border-slate-200 text-[10.5px]">
                  {selectedNode.events.map((evt, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[16px] top-1 w-1.5 h-1.5 rounded-full bg-[#0A192F]"></span>
                      <div className="font-semibold text-[#0A192F]">{evt.event_type}</div>
                      <div className="text-slate-500 text-[9.5px] font-mono">
                        {new Date(evt.event_time).toLocaleDateString()} • {evt.location_text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="p-3 bg-[#F8FAFC] border-t border-slate-200 flex flex-col gap-1.5 flex-shrink-0">
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
