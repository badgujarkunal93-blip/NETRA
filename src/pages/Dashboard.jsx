import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FolderSearch, 
  AlertTriangle, 
  Users, 
  Share2, 
  MapPin, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight, 
  Activity,
  FileText,
  Clock,
  Compass,
  CheckCircle2,
  TrendingUp,
  Radio,
  ArrowRight,
  Shield,
  Layers,
  Flame,
  Zap,
  Target
} from 'lucide-react';
import { dbService } from '../services/db';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await dbService.getDashboardMetrics();
      setMetrics(data);
      if (data.hotspots && data.hotspots.length > 0) {
        setSelectedHotspot(data.hotspots[0]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#0A192F] border-t-[#D4A017] rounded-full animate-spin"></div>
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Synchronizing CIU Telemetry...
          </div>
        </div>
      </div>
    );
  }

  // Mini Sparkline SVG Generator
  const renderSparkline = (points, color = '#3B82F6') => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 20;

    const pathData = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const statCards = [
    {
      title: 'Active Cases',
      value: metrics.activeCases,
      trendText: '+2 registered this week',
      trendPositive: true,
      sparklineData: [4, 6, 5, 8, 9, 10, 12],
      sparkColor: '#0A192F',
      path: '/cases'
    },
    {
      title: 'Open Alerts',
      value: metrics.openAlerts,
      trendText: '3 high-severity unresolved',
      isAlert: true,
      trendPositive: false,
      sparklineData: [2, 5, 3, 7, 4, 9, 8],
      sparkColor: '#B91C1C',
      path: '/alerts'
    },
    {
      title: 'Tracked Entities',
      value: metrics.entitiesTracked,
      trendText: '+6 newly linked across cells',
      trendPositive: true,
      sparklineData: [18, 21, 24, 26, 29, 31, 34],
      sparkColor: '#047857',
      path: '/entities'
    },
    {
      title: 'Graph Link Nodes',
      value: '142',
      trendText: '47 AI-inferred • 95 Observed',
      trendPositive: true,
      sparklineData: [90, 105, 112, 120, 128, 136, 142],
      sparkColor: '#B45309',
      path: '/graph'
    }
  ];

  // Separate AI findings into 1 Featured Card and 2 Secondary Cards
  const featuredFinding = metrics.aiFindings[0];
  const secondaryFindings = metrics.aiFindings.slice(1);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. CLEAN INSTITUTIONAL COMMAND CENTER HERO HEADER */}
      <div className="bg-[#0A192F] rounded-md p-4 text-white border border-[#132B4C] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img 
            src="/app_logo.png" 
            alt="CIU Command Crest" 
            className="w-10 h-10 rounded object-contain bg-[#061121] p-1 border border-[#B45309]/80 shadow-md flex-shrink-0"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight uppercase text-white">
              Investigator Command Center
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Live operational fusion, multi-jurisdiction link prediction, and active threat correlation feed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/graph')}
            className="px-3.5 py-1.5 bg-[#D4A017] hover:bg-[#B45309] text-[#0A192F] hover:text-white font-bold text-xs rounded transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Geospatial Network</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. STAT ROW WITH MICRO-METRICS & MINI SPARKLINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className={`text-3xl font-bold font-mono tracking-tight ${card.isAlert ? 'text-[#B91C1C]' : 'text-[#0A192F]'}`}>
                  {card.value}
                </div>
                {/* Embedded Mini Trend Sparkline */}
                <div className="opacity-90 pl-2">
                  {renderSparkline(card.sparklineData, card.sparkColor)}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
              <span className={`truncate font-medium ${card.isAlert ? 'text-[#92400E]' : 'text-slate-600'}`}>
                {card.trendText}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. ASYMMETRIC MAIN SECTION: DOMINANT ALERTS FEED (7.5 Cols) & TACTICAL GIS MAP (4.5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: DOMINANT INTELLIGENCE ALERTS QUEUE (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#0A192F] px-4 py-2.5 flex items-center justify-between text-white border-b border-[#132B4C]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D4A017]" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider">
                  Priority Intelligence Queue
                </span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">
                  {metrics.recentAlerts.length} Active Feeds
                </span>
              </div>
            </div>
            <Link
              to="/alerts"
              className="text-[11px] font-semibold text-[#D4A017] hover:underline flex items-center gap-1 font-mono"
            >
              <span>FULL QUEUE</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Differentiated Alert Rows (High Severity Heavy vs Low Severity Subtle) */}
          <div className="divide-y divide-slate-100 flex-1">
            {metrics.recentAlerts.map((alert) => {
              const isHigh = alert.severity === 'High';
              const isMedium = alert.severity === 'Medium';

              return (
                <div
                  key={alert.id}
                  onClick={() => navigate('/alerts')}
                  className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 hover:bg-[#F8FAFC] ${
                    isHigh
                      ? 'border-l-4 border-[#B91C1C] bg-[#FFFBFB]'
                      : isMedium
                      ? 'border-l-4 border-[#D4A017]'
                      : 'border-l-4 border-slate-300 opacity-80'
                  }`}
                >
                  {/* Severity Indicator */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase border ${
                        isHigh
                          ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                          : isMedium
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs truncate ${isHigh ? 'font-bold text-[#0A192F]' : 'font-semibold text-slate-800'}`}>
                        {alert.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className={`text-[11px] leading-snug mt-0.5 ${isHigh ? 'text-slate-700' : 'text-slate-500'} line-clamp-2`}>
                      {alert.description}
                    </p>

                    {/* Rich Embedded Telemetry Line */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                      {/* Target Callsign */}
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-800 border border-slate-200 font-semibold">
                        {alert.target_type}: {alert.target_id}
                      </span>

                      {/* Embedded Mini Confidence Bar */}
                      <div className="flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                        <span className="text-slate-500 font-mono text-[9.5px]">Conf:</span>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isHigh ? 'bg-[#B91C1C]' : 'bg-[#D4A017]'}`}
                            style={{ width: `${alert.confidence}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[9.5px]">{alert.confidence}%</span>
                      </div>

                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono">{alert.evidence_refs.length} Evidences</span>

                      {isHigh && (
                        <span className="ml-auto text-[10px] font-bold text-[#B91C1C] flex items-center gap-0.5 hover:underline">
                          <span>Inspect →</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: LIVE TACTICAL GIS HOTSPOT MAP (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-2.5 bg-[#0A192F] text-white border-b border-[#132B4C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#D4A017]" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Mumbai GIS Tactical Grid
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-300">
              {metrics.hotspots.length} SECTORS
            </span>
          </div>

          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
            {/* Tactical Live Map Surface */}
            <div className="relative w-full h-64 bg-[#061121] rounded overflow-hidden border border-[#132B4C] flex items-center justify-center">
              {/* Tactical Precision Grid */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:24px_24px]"></div>

              {/* Coastal Topography Vector */}
              <svg className="absolute inset-0 w-full h-full stroke-cyan-800/40 stroke-[1.2] fill-none pointer-events-none">
                <path d="M 80,10 Q 130,60 120,110 T 110,170 Q 90,210 80,240" />
                <path d="M 120,110 Q 160,120 200,130" />
              </svg>

              {/* Hotspot Pulse Markers */}
              {metrics.hotspots.map((hs) => {
                const isSelected = selectedHotspot?.id === hs.id;
                const isHigh = hs.severity === 'High';

                return (
                  <button
                    key={hs.id}
                    onClick={() => setSelectedHotspot(hs)}
                    style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-10"
                    title={hs.name}
                  >
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      {isHigh && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
                      )}
                      <span
                        className={`inline-flex rounded-full h-3.5 w-3.5 items-center justify-center text-[8px] font-mono font-bold text-white shadow-md border ${
                          isHigh
                            ? 'bg-[#B91C1C] border-red-300 ring-2 ring-red-500/30'
                            : 'bg-[#D4A017] border-amber-300'
                        } ${isSelected ? 'ring-2 ring-white scale-125' : ''}`}
                      >
                        {hs.count}
                      </span>
                    </span>
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-[#061121] text-[8.5px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-[#132B4C]">
                      {hs.name} ({hs.count} FIRs)
                    </span>
                  </button>
                );
              })}

              {/* Real-looking GIS Telemetry Readout */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-[#0A192F]/90 rounded border border-[#132B4C] text-[8.5px] font-mono text-cyan-300 backdrop-blur-sm">
                LAT: 19.0760° N | LON: 72.8777° E | GRID: BKC-S4
              </div>
            </div>

            {/* Selected Hotspot Intelligence Brief with Heat-Intensity Meter */}
            {selectedHotspot && (
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#CBD5E1] text-xs">
                <div className="flex items-center justify-between font-bold text-[#0A192F]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B91C1C]" />
                    <span className="text-xs">{selectedHotspot.name}</span>
                  </div>
                  <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    selectedHotspot.severity === 'High' ? 'bg-[#FEE2E2] text-[#B91C1C] border-red-200' : 'bg-[#FEF3C7] text-[#92400E] border-amber-200'
                  }`}>
                    {selectedHotspot.severity} Threat
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 mt-1.5">
                  Pattern MO: <strong className="text-slate-900">{selectedHotspot.type}</strong>
                </div>

                {/* Heat Intensity Bar */}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>SECTOR CLUSTER DENSITY</span>
                    <span className="font-bold text-slate-800">{selectedHotspot.count} Active Cases</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${selectedHotspot.severity === 'High' ? 'bg-[#B91C1C]' : 'bg-[#D4A017]'}`}
                      style={{ width: `${Math.min(100, selectedHotspot.count * 25)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono text-[10px]">Zone: Metro South/Central</span>
                  <button
                    onClick={() => navigate('/cases')}
                    className="text-[#B45309] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>View Cases</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. ASYMMETRIC AI-INFERRED INTELLIGENCE FINDINGS (Featured Hero Card + 2 Secondary Rows) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B45309]" />
            <h2 className="text-xs font-bold text-[#0A192F] uppercase tracking-wider">
              Cross-Jurisdiction AI Inferred Findings
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Model: CIU-LinkPrediction-v2.4
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* FEATURED PRIMARY FINDING (Large Asymmetric Layout - 7 Cols) */}
          {featuredFinding && (
            <div className="lg:col-span-7 bg-white rounded-md border-2 border-[#D4A017]/40 shadow-sm p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-mono font-bold text-[10px] border border-[#FCD34D]">
                      FEATURED CORRELATION
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {featuredFinding.id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#92400E]">
                    <span>{featuredFinding.confidence}% Confidence</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#0A192F] mt-2.5">
                  {featuredFinding.finding}
                </h3>

                {/* Multi-Step Correlation Vector Flow Diagram */}
                <div className="my-3 p-2.5 bg-[#0A192F] rounded border border-[#132B4C] text-white">
                  <span className="text-[9px] font-mono uppercase text-[#D4A017] font-bold block mb-1.5">
                    Multi-Hop Vector Correlation
                  </span>
                  <div className="flex items-center justify-between text-[10px] font-mono gap-1 text-slate-200">
                    <span className="px-2 py-1 rounded bg-[#132B4C] border border-[#1C3B64] truncate">
                      Bandra BKC Cell
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4A017] flex-shrink-0" />
                    <span className="px-2 py-1 rounded bg-[#132B4C] border border-[#1C3B64] truncate">
                      Burner Hop #8801
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4A017] flex-shrink-0" />
                    <span className="px-2 py-1 rounded bg-[#132B4C] border border-[#1C3B64] truncate">
                      Dharavi MD Godown
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded border border-amber-200">
                  <strong className="text-[#92400E]">Forensic Proof:</strong> {featuredFinding.evidence}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700">
                  Linked FIR: {featuredFinding.caseId}
                </span>
                <button
                  onClick={() => navigate(`/graph?case_id=${featuredFinding.caseId}`)}
                  className="px-3 py-1 bg-[#0A192F] hover:bg-[#132B4C] text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5"
                >
                  <span>Inspect in Geospatial Network</span>
                  <ChevronRight className="w-3 h-3 text-[#D4A017]" />
                </button>
              </div>
            </div>
          )}

          {/* SECONDARY FINDINGS (Compact List Stack - 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {secondaryFindings.map((finding) => (
              <div
                key={finding.id}
                className="bg-white rounded-md border border-[#E2E8F0] shadow-sm p-3.5 flex-1 flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 uppercase">
                      HEURISTIC PATTERN
                    </span>
                    <span className="text-[10.5px] font-mono font-bold text-[#92400E]">
                      {finding.confidence}% Conf
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0A192F] leading-snug">
                    {finding.finding}
                  </h4>
                  <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                    <strong className="text-slate-800">Evidence:</strong> {finding.evidence}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[10px] text-slate-500">{finding.caseId}</span>
                  <button
                    onClick={() => navigate(`/cases?id=${finding.caseId}`)}
                    className="font-bold text-[#B45309] hover:underline flex items-center gap-0.5 text-xs"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
