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
import CrimeActivityMap from '../components/dashboard/CrimeActivityMap';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function loadData() {
      try {
        const data = await dbService.getDashboardMetrics();
        if (data) {
          setMetrics(data);
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
          <div className="w-6 h-6 border-2 border-[#0B2341]/20 border-t-[#F5B800] rounded-full animate-spin"></div>
          <div className="text-[11px] font-mono text-[#071A33] uppercase tracking-wider font-semibold">
            Loading live intelligence dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Mini Sparkline SVG Generator
  const renderSparkline = (points, color = '#0B2341') => {
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
          strokeWidth="2"
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
      sparkColor: '#0B2341',
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
      sparkColor: '#DC2626',
      path: '/alerts'
    },
    {
      title: 'Tracked Suspects',
      subTitle: 'People of Interest',
      value: metrics.entitiesTracked,
      trendText: '+6 newly linked in network',
      trendPositive: true,
      sparklineData: [18, 21, 24, 26, 29, 31, 34],
      sparkColor: '#071A33',
      path: '/entities'
    },
    {
      title: 'Connected Clues',
      subTitle: 'Network Links & Evidence',
      value: '142',
      trendText: '47 AI pattern clues • 95 confirmed facts',
      trendPositive: true,
      sparklineData: [90, 105, 112, 120, 128, 136, 142],
      sparkColor: '#F5B800',
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
      <div className="glass-card rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#0B2341]/15 shadow-xs">
        <div className="flex items-center gap-3.5">
          <img 
            src="/app_logo.png" 
            alt="CIU Command Crest" 
            className="w-10 h-10 rounded object-contain bg-[#071A33] p-1 border border-[#F5B800] shadow-sm flex-shrink-0"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight uppercase text-[#071A33]">
              Investigator Command Center
            </h1>
            <p className="text-xs text-[#071A33]/70 mt-0.5 font-medium">
              Real-time police cases, suspect connections, and pattern alerts in one unified workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/graph')}
            className="px-3.5 py-2 bg-[#F5B800] hover:bg-[#FFB000] text-[#071A33] font-bold text-xs rounded transition-all flex items-center gap-1.5 shadow-sm border border-[#0B2341]/10"
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
            className="glass-card-interactive p-4 rounded-lg cursor-pointer flex flex-col justify-between border border-[#0B2341]/12 bg-white"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#071A33]/80">
                  {card.title}
                </span>
                <span className="text-[9.5px] font-mono text-[#071A33]/55">
                  {card.subTitle}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div className={`text-3xl font-extrabold font-mono tracking-tight ${card.isAlert ? 'text-[#DC2626]' : 'text-[#071A33]'}`}>
                  {card.value}
                </div>
                {/* Embedded Mini Trend Sparkline */}
                <div className="opacity-90 pl-2">
                  {renderSparkline(card.sparklineData, card.sparkColor)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#0B2341]/10 flex items-center justify-between text-[11px]">
              <span className={`truncate font-medium ${card.isAlert ? 'text-[#DC2626] font-semibold' : 'text-[#071A33]/70'}`}>
                {card.trendText}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#071A33]/50 flex-shrink-0 ml-1" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. ASYMMETRIC MAIN SECTION: ALERTS FEED (7 Cols) & TACTICAL GIS MAP (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: DOMINANT INTELLIGENCE ALERTS QUEUE (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-lg overflow-hidden flex flex-col border border-[#0B2341]/12 bg-white">
          {/* Header */}
          <div className="bg-[#F4F7FB] px-4 py-3 flex items-center justify-between border-b border-[#0B2341]/10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F5B800]" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-[#071A33]">
                  Important Alerts & Clues
                </span>
                <span className="text-[10px] text-[#071A33]/60 ml-2 font-mono">
                  {metrics.recentAlerts.length} Active Notifications
                </span>
              </div>
            </div>
            <Link
              to="/alerts"
              className="text-[11px] font-bold text-[#071A33] hover:text-[#D97706] flex items-center gap-1 font-mono transition-colors"
            >
              <span>SEE ALL ALERTS</span>
              <ChevronRight className="w-3 h-3 text-[#F5B800]" />
            </Link>
          </div>

          {/* List of High-Value Actionable Alerts */}
          <div className="divide-y divide-[#0B2341]/10">
            {metrics.recentAlerts.map((alert) => {
              const isHigh = alert.severity === 'High';
              return (
                <div
                  key={alert.id}
                  onClick={() => navigate('/alerts')}
                  className="p-3.5 hover:bg-[#F4F7FB] transition-colors cursor-pointer flex items-start gap-3 text-xs"
                >
                  <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                    isHigh ? 'bg-red-50 text-[#DC2626] border border-red-200' : 'bg-amber-50 text-[#D97706] border border-amber-200'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#071A33] text-xs truncate">
                        {alert.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9.5px] font-bold text-[#D97706]">
                          {alert.confidence}% Conf
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold border ${
                          isHigh ? 'bg-red-50 text-[#DC2626] border-red-200' : 'bg-amber-50 text-[#D97706] border-amber-200'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-[#071A33]/80 line-clamp-2 mt-1 leading-snug">
                      {alert.description}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-[#071A33]/60">
                      <span className="text-[#071A33] font-semibold">Target: {alert.target_id || 'Syndicate Cell'}</span>
                      <span>Ref: {(alert.evidence_refs || [])[0] || 'CDR Log'}</span>
                      <span className="ml-auto text-[#071A33] font-bold hover:underline">Open Alert →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: LIVE TACTICAL GIS HOTSPOT MAP (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <CrimeActivityMap
            hotspots={metrics?.hotspots || []}
            loading={loading}
          />
        </div>
      </div>

      {/* 4. AI-INFERRED INTELLIGENCE FINDINGS (Hero Card + Secondary Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5B800]" />
            <h2 className="text-xs font-bold text-[#071A33] uppercase tracking-wider">
              Key Patterns & Connections Found by AI
            </h2>
            <span className="text-[10px] text-[#071A33]/60 font-mono">
              (AI Inferred Findings)
            </span>
          </div>
          <span className="text-[10px] text-[#071A33]/60 font-mono">
            Engine: CIU-LinkPrediction-v2.4
          </span>
        </div>

        {aiFindingsList.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* FEATURED PRIMARY FINDING (7 Cols) */}
            {featuredFinding && (
              <div className="lg:col-span-7 glass-card rounded-lg border border-[#0B2341]/12 p-4 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#0B2341]/10">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#F5B800] text-[#071A33] font-mono font-bold text-[10px]">
                        KEY PATTERN FOUND
                      </span>
                      <span className="text-[10px] font-mono text-[#071A33]/60">ID: {featuredFinding.id || featuredFinding.finding_id}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#D97706]">
                      <span>{featuredFinding.confidence}% Match Confidence</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#071A33] mt-2.5">
                    {featuredFinding.finding || featuredFinding.title}
                  </h3>

                  {/* Multi-Step Correlation Vector Flow Diagram */}
                  <div className="my-3 p-3 bg-[#F4F7FB] rounded-md border border-[#0B2341]/10 text-[#071A33]">
                    <span className="text-[9px] font-mono uppercase text-[#D97706] font-bold block mb-1.5">
                      How AI Connected These Clues
                    </span>
                    <div className="flex items-center justify-between text-[10px] font-mono gap-1 text-[#071A33]">
                      <span className="px-2 py-1 rounded bg-white border border-[#0B2341]/15 truncate font-bold shadow-xs">
                        {featuredFinding.caseId || featuredFinding.case_id || 'Case Lead'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#F5B800] flex-shrink-0" />
                      <span className="px-2 py-1 rounded bg-white border border-[#0B2341]/15 truncate font-bold shadow-xs">
                        {featuredFinding.finding_type || 'Common Link'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#F5B800] flex-shrink-0" />
                      <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 truncate text-emerald-700 font-bold shadow-xs">
                        {featuredFinding.confidence}% Certainty
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#071A33]/85 bg-[#F4F7FB] p-3 rounded-md border border-[#0B2341]/10">
                    <strong className="text-[#D97706]">Supporting Proof:</strong> {featuredFinding.evidence || featuredFinding.description}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#0B2341]/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#071A33]/70">
                    Linked FIR: {featuredFinding.caseId || featuredFinding.case_id || 'Syndicate FIR'}
                  </span>
                  <button
                    onClick={() => navigate(`/graph?case_id=${featuredFinding.caseId || featuredFinding.case_id || ''}`)}
                    className="px-3 py-1.5 bg-[#071A33] hover:bg-[#0B2341] text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shadow-sm border border-[#0B2341]"
                  >
                    <span>View on Knowledge Graph</span>
                    <ChevronRight className="w-3 h-3 text-[#F5B800]" />
                  </button>
                </div>
              </div>
            )}

            {/* SECONDARY FINDINGS (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {secondaryFindings.map((finding) => (
                <div
                  key={finding.id || finding.finding_id}
                  className="glass-card-interactive rounded-lg p-3.5 flex-1 flex flex-col justify-between cursor-pointer border border-[#0B2341]/12 bg-white"
                  onClick={() => navigate(`/cases?id=${finding.caseId || finding.case_id || ''}`)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/40 uppercase">
                        {finding.finding_type || 'AI PATTERN CLUE'}
                      </span>
                      <span className="text-[10.5px] font-mono font-bold text-[#D97706]">
                        {finding.confidence}% Certainty
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#071A33] leading-snug">
                      {finding.finding || finding.title}
                    </h4>
                    <div className="mt-2 text-[11px] text-[#071A33]/80 bg-[#F4F7FB] p-2 rounded border border-[#0B2341]/10">
                      <strong className="text-[#071A33]">Why Flagged:</strong> {finding.evidence || finding.description}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#0B2341]/10 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] text-[#071A33]/60">{finding.caseId || finding.case_id}</span>
                    <span className="font-bold text-[#071A33] hover:text-[#D97706] flex items-center gap-0.5 text-xs">
                      <span>View Details</span>
                      <ChevronRight className="w-3 h-3 text-[#F5B800]" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-lg p-6 text-center border border-[#0B2341]/12 bg-white">
            <Sparkles className="w-8 h-8 text-[#F5B800] mx-auto mb-2" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#071A33]">No New Clues Detected Yet</h3>
            <p className="text-xs text-[#071A33]/70 mt-1 max-w-md mx-auto">
              Upload new FIRs or explore the network to generate live pattern matches across cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
