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
      try {
        const data = await dbService.getDashboardMetrics();
        if (data) {
          setMetrics(data);
          if (data.hotspots && data.hotspots.length > 0) {
            setSelectedHotspot(data.hotspots[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-white/20 border-t-[#D4A017] rounded-full animate-spin"></div>
          <div className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">
            Loading live intelligence dashboard...
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
      subTitle: 'Registered FIRs',
      value: metrics.activeCases,
      trendText: '+2 registered this week',
      trendPositive: true,
      sparklineData: [4, 6, 5, 8, 9, 10, 12],
      sparkColor: '#0A192F',
      path: '/cases'
    },
    {
      title: 'Open Alerts',
      subTitle: 'Unresolved Warnings',
      value: metrics.openAlerts,
      trendText: '3 high-priority to review',
      isAlert: true,
      trendPositive: false,
      sparklineData: [2, 5, 3, 7, 4, 9, 8],
      sparkColor: '#B91C1C',
      path: '/alerts'
    },
    {
      title: 'Tracked Suspects',
      subTitle: 'People of Interest',
      value: metrics.entitiesTracked,
      trendText: '+6 newly linked in network',
      trendPositive: true,
      sparklineData: [18, 21, 24, 26, 29, 31, 34],
      sparkColor: '#047857',
      path: '/entities'
    },
    {
      title: 'Connected Clues',
      subTitle: 'Network Links & Evidence',
      value: '142',
      trendText: '47 AI pattern clues • 95 confirmed facts',
      trendPositive: true,
      sparklineData: [90, 105, 112, 120, 128, 136, 142],
      sparkColor: '#B45309',
      path: '/graph'
    }
  ];

  // Separate AI findings into 1 Featured Card and 2 Secondary Cards
  const aiFindingsList = metrics?.aiFindings || [];
  const featuredFinding = aiFindingsList[0];
  const secondaryFindings = aiFindingsList.slice(1);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. CLEAN INSTITUTIONAL COMMAND CENTER HERO HEADER */}
      <div className="glass-card rounded-lg p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img 
            src="/app_logo.png" 
            alt="CIU Command Crest" 
            className="w-10 h-10 rounded object-contain bg-[#061121] p-1 border border-[#D4A017]/80 shadow-md flex-shrink-0"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight uppercase text-white">
              Investigator Command Center
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time police cases, suspect connections, and pattern alerts in one place.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/graph')}
            className="px-3.5 py-1.5 bg-[#D4A017] hover:bg-[#F59E0B] text-[#0A192F] font-bold text-xs rounded transition-all flex items-center gap-1.5 shadow-md"
          >
            <span>Open Knowledge Graph</span>
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
            className="glass-card-interactive p-4 rounded-lg cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300">
                  {card.title}
                </span>
                <span className="text-[9.5px] font-mono text-slate-400">
                  {card.subTitle}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div className={`text-3xl font-extrabold font-mono tracking-tight ${card.isAlert ? 'text-[#E4232D]' : 'text-white'}`}>
                  {card.value}
                </div>
                {/* Embedded Mini Trend Sparkline */}
                <div className="opacity-90 pl-2">
                  {renderSparkline(card.sparklineData, card.isAlert ? '#E4232D' : '#D4A017')}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className={`truncate font-medium ${card.isAlert ? 'text-rose-300 font-semibold' : 'text-slate-300'}`}>
                {card.trendText}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. ASYMMETRIC MAIN SECTION: ALERTS FEED (7 Cols) & TACTICAL GIS MAP (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: DOMINANT INTELLIGENCE ALERTS QUEUE (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white/[0.08] px-4 py-3 flex items-center justify-between text-white border-b border-white/15">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D4A017]" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Important Alerts & Clues
                </span>
                <span className="text-[10px] text-slate-300 ml-2 font-mono">
                  {metrics.recentAlerts.length} Active Notifications
                </span>
              </div>
            </div>
            <Link
              to="/alerts"
              className="text-[11px] font-semibold text-[#D4A017] hover:underline flex items-center gap-1 font-mono"
            >
              <span>SEE ALL ALERTS</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* List of High-Value Actionable Alerts */}
          <div className="divide-y divide-white/10">
            {metrics.recentAlerts.map((alert) => {
              const isHigh = alert.severity === 'High';
              return (
                <div
                  key={alert.id}
                  onClick={() => navigate('/alerts')}
                  className="p-3.5 hover:bg-white/[0.06] transition-colors cursor-pointer flex items-start gap-3 text-xs"
                >
                  <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                    isHigh ? 'bg-red-500/20 text-[#E4232D] border border-red-500/30' : 'bg-amber-500/20 text-[#D4A017] border border-amber-500/30'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">
                        {alert.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9.5px] font-bold text-[#D4A017]">
                          {alert.confidence}% Conf
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold border ${
                          isHigh ? 'bg-red-950/80 text-rose-300 border-rose-800' : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-slate-300 line-clamp-2 mt-1 leading-snug">
                      {alert.description}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-slate-400">
                      <span className="text-slate-300 font-semibold">Target: {alert.target_id || 'Syndicate Cell'}</span>
                      <span>Ref: {(alert.evidence_refs || [])[0] || 'CDR Log'}</span>
                      <span className="ml-auto text-[#D4A017] font-semibold">Open Alert →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: LIVE TACTICAL GIS HOTSPOT MAP (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-white/[0.08] text-white border-b border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#D4A017]" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                High Crime Activity Zones (Map)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-300">
              {metrics.hotspots.length} SECTORS
            </span>
          </div>

          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
            {/* Tactical Live Map Surface */}
            <div className="relative w-full h-64 bg-[#061121] rounded-md overflow-hidden border border-white/15 flex items-center justify-center">
              {/* Tactical Precision Grid */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#38bdf8_1px,transparent_1px),linear-gradient(to_bottom,#38bdf8_1px,transparent_1px)] bg-[size:24px_24px]"></div>

              {/* Coastal Topography Vector */}
              <svg className="absolute inset-0 w-full h-full stroke-cyan-800/40 stroke-[1.2] fill-none pointer-events-none">
                <path d="M 80,10 Q 130,60 120,110 T 110,170 Q 90,210 80,240" />
                <path d="M 120,110 Q 160,120 200,130" />
              </svg>

              {/* Hotspot Pulse Markers */}
              {metrics.hotspots.map((hs) => {
                const isSelected = selectedHotspot?.name === hs.name;
                const isHigh = hs.activeAlerts > 2;

                return (
                  <button
                    key={hs.name}
                    onClick={() => setSelectedHotspot(hs)}
                    style={{ left: `${Math.max(10, Math.min(90, ((hs.lng - 72.80) / 0.15) * 100))}%`, top: `${Math.max(10, Math.min(90, (1 - (hs.lat - 18.90) / 0.30) * 100))}%` }}
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
                            ? 'bg-[#E4232D] border-red-300 ring-2 ring-red-500/30'
                            : 'bg-[#D4A017] border-amber-300'
                        } ${isSelected ? 'ring-2 ring-white scale-125' : ''}`}
                      >
                        {hs.caseCount}
                      </span>
                    </span>
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-[#061121] text-[8.5px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/20 shadow-lg">
                      {hs.name} ({hs.caseCount} FIRs)
                    </span>
                  </button>
                );
              })}

              {/* Real-looking GIS Telemetry Readout */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded border border-white/15 text-[8.5px] font-mono text-cyan-300 backdrop-blur-sm">
                LAT: 19.0760° N | LON: 72.8777° E | GRID: BKC-S4
              </div>
            </div>

            {/* Selected Hotspot Intelligence Brief */}
            {selectedHotspot ? (
              <div className="p-3 bg-white/[0.07] backdrop-blur-sm rounded-md border border-white/15 text-xs">
                <div className="flex items-center justify-between font-bold text-white">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E4232D]" />
                    <span className="text-xs">{selectedHotspot.name}</span>
                  </div>
                  <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    selectedHotspot.activeAlerts > 2 ? 'bg-red-950/80 text-rose-300 border-rose-800' : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}>
                    {selectedHotspot.topCategory || 'Crime Sector'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 mt-1.5">
                  Station Jurisdiction: <strong className="text-white">{selectedHotspot.station}</strong>
                </div>

                {/* Heat Intensity Bar */}
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-1">
                    <span>AREA ACTIVITY LEVEL</span>
                    <span className="font-bold text-white">{selectedHotspot.caseCount} Reported Crimes</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-[#D4A017]"
                      style={{ width: `${Math.min(100, (selectedHotspot.caseCount / 50) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">Zone: Mumbai Metro Region</span>
                  <button
                    onClick={() => navigate('/cases')}
                    className="text-[#D4A017] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>View Cases</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/[0.05] rounded-md border border-white/10 text-xs text-center text-slate-400 font-mono">
                No active hotspot sectors detected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. AI-INFERRED INTELLIGENCE FINDINGS (Hero Card + Secondary Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Key Patterns & Connections Found by AI
            </h2>
            <span className="text-[10px] text-slate-300 font-mono">
              (AI Inferred Findings)
            </span>
          </div>
          <span className="text-[10px] text-slate-300 font-mono">
            Engine: CIU-LinkPrediction-v2.4
          </span>
        </div>

        {aiFindingsList.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* FEATURED PRIMARY FINDING (7 Cols) */}
            {featuredFinding && (
              <div className="lg:col-span-7 glass-card rounded-lg border border-white/25 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#D4A017] text-[#0A192F] font-mono font-bold text-[10px]">
                        KEY PATTERN FOUND
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">ID: {featuredFinding.id || featuredFinding.finding_id}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#D4A017]">
                      <span>{featuredFinding.confidence}% Match Confidence</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2.5">
                    {featuredFinding.finding || featuredFinding.title}
                  </h3>

                  {/* Multi-Step Correlation Vector Flow Diagram */}
                  <div className="my-3 p-3 bg-white/[0.06] backdrop-blur-sm rounded-md border border-white/15 text-white">
                    <span className="text-[9px] font-mono uppercase text-[#D4A017] font-bold block mb-1.5">
                      How AI Connected These Clues
                    </span>
                    <div className="flex items-center justify-between text-[10px] font-mono gap-1 text-slate-200">
                      <span className="px-2 py-1 rounded bg-white/[0.08] border border-white/15 truncate font-semibold">
                        {featuredFinding.caseId || featuredFinding.case_id || 'Case Lead'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4A017] flex-shrink-0" />
                      <span className="px-2 py-1 rounded bg-white/[0.08] border border-white/15 truncate font-semibold">
                        {featuredFinding.finding_type || 'Common Link'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4A017] flex-shrink-0" />
                      <span className="px-2 py-1 rounded bg-white/[0.08] border border-white/15 truncate text-emerald-400 font-bold">
                        {featuredFinding.confidence}% Certainty
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-200 bg-white/[0.06] p-3 rounded-md border border-white/15">
                    <strong className="text-[#D4A017]">Supporting Proof:</strong> {featuredFinding.evidence || featuredFinding.description}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Linked FIR: {featuredFinding.caseId || featuredFinding.case_id || 'Syndicate FIR'}
                  </span>
                  <button
                    onClick={() => navigate(`/graph?case_id=${featuredFinding.caseId || featuredFinding.case_id || ''}`)}
                    className="px-3 py-1.5 bg-white/[0.10] hover:bg-white/[0.18] text-white font-semibold text-xs rounded border border-white/20 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View on Knowledge Graph</span>
                    <ChevronRight className="w-3 h-3 text-[#D4A017]" />
                  </button>
                </div>
              </div>
            )}

            {/* SECONDARY FINDINGS (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {secondaryFindings.map((finding) => (
                <div
                  key={finding.id || finding.finding_id}
                  className="glass-card-interactive rounded-lg p-3.5 flex-1 flex flex-col justify-between cursor-pointer"
                  onClick={() => navigate(`/cases?id=${finding.caseId || finding.case_id || ''}`)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/[0.08] text-[#D4A017] border border-white/15 uppercase">
                        {finding.finding_type || 'AI PATTERN CLUE'}
                      </span>
                      <span className="text-[10.5px] font-mono font-bold text-[#D4A017]">
                        {finding.confidence}% Certainty
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {finding.finding || finding.title}
                    </h4>
                    <div className="mt-2 text-[11px] text-slate-300 bg-white/[0.06] p-2 rounded border border-white/10">
                      <strong className="text-slate-100">Why Flagged:</strong> {finding.evidence || finding.description}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] text-slate-400">{finding.caseId || finding.case_id}</span>
                    <span className="font-bold text-[#D4A017] hover:underline flex items-center gap-0.5 text-xs">
                      <span>View Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-lg p-6 text-center">
            <Sparkles className="w-8 h-8 text-[#D4A017] mx-auto mb-2" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">No New Clues Detected Yet</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Upload new FIRs or explore the network to generate live pattern matches across cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
