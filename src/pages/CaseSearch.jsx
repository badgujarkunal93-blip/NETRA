import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  FileText, 
  Users, 
  Fingerprint, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Shield,
  Clock,
  Layers,
  FileUp,
  ExternalLink,
  Compass,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Share2,
  Printer,
  ChevronDown
} from 'lucide-react';
import { dbService } from '../services/db';
import FIRUploadModal from '../components/ingestion/FIRUploadModal';

export default function CaseSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Filters initialized from URL search params if present
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');
  const [selectedStation, setSelectedStation] = useState(
    searchParams.get('station') || searchParams.get('police_station') || searchParams.get('location') || 'All'
  );

  const urlCaseId = searchParams.get('id');


  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      try {
        const data = await dbService.getCases({
          search: searchTerm,
          category: selectedCategory,
          status: selectedStatus,
          police_station: selectedStation
        });
        setCases(data || []);

        const targetId = urlCaseId || (data && data.length > 0 ? data[0].id : null);
        if (targetId) {
          const fullDetail = await dbService.getCaseById(targetId);
          setSelectedCase(fullDetail);
        } else {
          setSelectedCase(null);
        }
      } catch (err) {
        console.error("Failed to load cases:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [searchTerm, selectedCategory, selectedStatus, selectedStation, urlCaseId]);

  const handleSelectCase = async (caseId) => {
    setSearchParams({ id: caseId });
    const fullDetail = await dbService.getCaseById(caseId);
    setSelectedCase(fullDetail);
  };

  const categories = ['All', 'Organized Financial Crime', 'Property Crime', 'Contraband Trafficking', 'Cybercrime', 'Vehicle Theft Ring', 'Arms & Ammunition'];
  const statuses = ['All', 'Under Investigation', 'Open', 'Chargesheet Filed', 'Closed'];
  const stations = ['All', 'Bandra Police Station', 'Colaba Police Station', 'Dharavi Police Station', 'Andheri East Cyber Cell', 'Worli Police Station', 'Kurla Police Station', 'Byculla Police Station', 'Juhu Police Station', 'Borivali Police Station', 'Malad Police Station'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Under Investigation':
        return 'bg-[#071A33] text-white border-[#071A33]';
      case 'Open':
        return 'bg-amber-50 text-[#D97706] border-amber-300 font-bold';
      case 'Chargesheet Filed':
        return 'bg-[#F4F7FB] text-[#071A33] border-[#0B2341]/20 font-bold';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-[#071A33] border-slate-200';
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('accused')) return 'bg-red-50 text-[#DC2626] border-red-200 font-bold';
    if (r.includes('suspect')) return 'bg-amber-50 text-[#D97706] border-amber-200 font-bold';
    if (r.includes('victim') || r.includes('complainant')) return 'bg-slate-100 text-[#071A33] border-slate-200';
    return 'bg-slate-100 text-[#071A33] border-slate-200';
  };

  return (
    <div className="space-y-3.5 max-w-[1400px] mx-auto h-[calc(100vh-5.5rem)] flex flex-col">
      {/* 1. UNIFIED INVESTIGATION SEARCH & FILTER BAR */}
      <div className="glass-card p-3.5 rounded-lg flex-shrink-0 space-y-2.5 border border-[#0B2341]/12 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#071A33] uppercase tracking-wider font-mono">
                Case Records & Crime Files
              </h1>
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/50" title="CCTNS Form II Police Registry">
                POLICE REGISTRY
              </span>
            </div>
            <p className="text-[11.5px] text-[#071A33]/70 mt-0.5 font-medium">
              Browse reported crimes, see how crimes were committed, and find connections to other cases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-[#071A33]/45 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search case number, title, police station, facts..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#0B2341]/20 rounded-md focus:outline-none focus:border-[#F5B800] text-[#071A33] placeholder-[#071A33]/45 transition-colors"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-2 text-[10px] text-[#071A33]/50 hover:text-[#071A33]"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 bg-[#071A33] hover:bg-[#0B2341] text-white font-semibold text-xs rounded-md transition-colors flex items-center gap-1.5 border border-[#071A33] shadow-xs flex-shrink-0"
            >
              <FileUp className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>Upload New FIR (PDF)</span>
            </button>
          </div>
        </div>

        {/* Structured Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#0B2341]/10 text-xs">
          <span className="text-[10px] font-bold text-[#071A33]/70 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#F5B800]" />
            Filters:
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white border border-[#0B2341]/20 rounded text-[#071A33] font-medium focus:outline-none focus:border-[#F5B800]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white border border-[#0B2341]/20 rounded text-[#071A33] font-medium focus:outline-none focus:border-[#F5B800]"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>Status: {st}</option>
            ))}
          </select>

          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white border border-[#0B2341]/20 rounded text-[#071A33] font-medium focus:outline-none focus:border-[#F5B800]"
          >
            {stations.map((st) => (
              <option key={st} value={st}>Station: {st}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-[#071A33]/60 font-mono">
              Showing <strong className="text-[#071A33]">{cases.length}</strong> registered cases
            </span>
          </div>
        </div>
      </div>

      {/* 2. MASTER-DETAIL INVESTIGATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT PANE: Scannable FIR Registry List (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-lg flex flex-col min-h-0 overflow-hidden border border-[#0B2341]/12 bg-white">
          <div className="p-3 bg-[#F4F7FB] border-b border-[#0B2341]/10 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-bold text-[#071A33] font-mono uppercase tracking-wide">
              Registered FIR Records ({cases.length})
            </span>
            <span className="text-[10px] text-[#071A33]/60 font-mono">Select case to view</span>
          </div>

          <div className="overflow-y-auto divide-y divide-[#0B2341]/10 flex-1">
            {cases.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#071A33]/60 font-mono">
                No registered cases matching criteria.
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className={`p-3 transition-all cursor-pointer border-l-4 ${
                      isSelected
                        ? 'bg-[#FFFBEB] border-l-[#F5B800] shadow-xs'
                        : 'hover:bg-[#F4F7FB] border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#071A33]">
                          {c.crime_no}
                        </span>
                        <span className="text-[9.5px] font-mono text-[#071A33]/60">
                          ({c.fir_number || 'FIR-Pending'})
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-[#071A33] mt-1 line-clamp-1">
                      {c.crime_major_head}
                    </h3>

                    <p className="text-[11px] text-[#071A33]/75 line-clamp-2 mt-0.5 font-sans leading-relaxed">
                      {c.brief_facts}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#071A33]/60">
                      <span className="flex items-center gap-1 text-[#071A33] font-medium">
                        <MapPin className="w-2.5 h-2.5 text-[#DC2626]" />
                        {c.police_station}
                      </span>
                      <span>{c.registered_date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Complete Case Investigation Dossier (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-lg flex flex-col min-h-0 overflow-hidden border border-[#0B2341]/12 bg-white">
          {selectedCase ? (
            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              
              {/* DOSSIER SECTION 1: HEADER & PRIMARY IDENTIFIERS */}
              <div className="pb-3 border-b border-[#0B2341]/10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#071A33] text-white border border-[#071A33]">
                        {selectedCase.crime_no}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#071A33] px-2 py-0.5 rounded bg-[#F4F7FB] border border-[#0B2341]/15">
                        FIR: {selectedCase.fir_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${getStatusBadge(selectedCase.status)}`}>
                        {selectedCase.status}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-[#071A33] mt-2">
                      {selectedCase.crime_major_head}
                    </h2>

                    <div className="text-xs text-[#071A33]/70 flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-semibold text-[#071A33]">{selectedCase.police_station}</span>
                      <span>•</span>
                      <span>Registered: {selectedCase.registered_date}</span>
                      <span>•</span>
                      <span className="font-mono text-[#071A33]/80 font-medium">Acts: {selectedCase.acts_sections || 'IPC/BNS Sections'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/canvas?case_id=${selectedCase.id}`)}
                      className="px-2.5 py-1.5 bg-[#071A33] hover:bg-[#0B2341] text-white text-[11px] font-semibold rounded border border-[#071A33] flex items-center gap-1 transition-colors shadow-xs"
                      title="Open Case Canvas Investigative Whiteboard"
                    >
                      <Layers className="w-3 h-3 text-[#F5B800]" />
                      <span>Case Canvas</span>
                    </button>

                    <button
                      onClick={() => navigate(`/graph?caseId=${selectedCase.id}`)}
                      className="px-2.5 py-1.5 bg-white hover:bg-[#F4F7FB] text-[#071A33] text-[11px] font-bold rounded border border-[#0B2341]/20 flex items-center gap-1 transition-colors shadow-xs"
                      title="Explore Knowledge Graph"
                    >
                      <Compass className="w-3 h-3 text-[#D97706]" />
                      <span>Knowledge Graph</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DOSSIER SECTION 2: CASE INTELLIGENCE EXECUTIVE SUMMARY */}
              <div className="p-3.5 bg-[#F4F7FB] rounded-lg border border-[#0B2341]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#071A33] font-mono flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#F5B800]" />
                    Case Overview & Connected Clues
                  </span>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold" title="Directly recorded from police FIR">
                      SOURCE: VERIFIED
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200 font-bold" title="Extracted using natural language processing (NLP)">
                      AI ANALYSIS: ACTIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2 bg-white rounded border border-[#0B2341]/10 shadow-xs">
                    <span className="text-[9.5px] font-mono text-[#071A33]/60 uppercase block font-semibold">People Involved</span>
                    <span className="font-bold text-[#071A33] text-xs">
                      {selectedCase.linkedPersons?.length || 0} Suspects & Persons
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-[#0B2341]/10 shadow-xs" title="How accurately the AI extracted the crime method">
                    <span className="text-[9.5px] font-mono text-[#071A33]/60 uppercase block font-semibold">Method Extraction</span>
                    <span className="font-bold text-[#D97706] text-xs">
                      {selectedCase.moFingerprint?.confidence || 90}% Confidence
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-[#0B2341]/10 shadow-xs" title="Cases committed with a matching method">
                    <span className="text-[9.5px] font-mono text-[#071A33]/60 uppercase block font-semibold">Similar Crime Cases</span>
                    <span className="font-bold text-[#071A33] text-xs">
                      {selectedCase.similarCases?.length || 0} Matches Found
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-[#0B2341]/10 shadow-xs">
                    <span className="text-[9.5px] font-mono text-[#071A33]/60 uppercase block font-semibold">Evidence Pieces</span>
                    <span className="font-bold text-[#071A33] text-xs">
                      {selectedCase.evidenceItems?.length || 1} Items Recorded
                    </span>
                  </div>
                </div>
              </div>

              {/* DOSSIER SECTION 3: WHAT HAPPENED (BRIEF FACTS NARRATIVE) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#071A33] font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#F5B800]" />
                    1. What Happened (Official Complaint Summary)
                  </h3>
                  <span className="text-[9.5px] font-mono text-[#071A33]/60 font-semibold">
                    COMPLAINANT RECORD
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-md border border-[#0B2341]/12 border-l-4 border-l-[#F5B800] text-xs text-[#071A33] leading-relaxed font-sans shadow-xs">
                  {selectedCase.brief_facts || 'Official CCTNS Form II registered FIR summary on file.'}
                </div>
              </div>

              {/* DOSSIER SECTION 4: HOW THE CRIME WAS CARRIED OUT (STRUCTURED MO SUMMARY) */}
              {selectedCase.moFingerprint && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5B800]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#071A33] font-mono">
                        2. How the Crime Was Committed (Modus Operandi Breakdown)
                      </h3>
                    </div>
                    <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/50">
                      AI ANALYSIS • {selectedCase.moFingerprint.confidence}% CONFIDENCE
                    </span>
                  </div>

                  {/* Behavioral Flow Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    
                    {/* Target */}
                    <div className="p-2.5 bg-white border border-[#0B2341]/12 rounded-md shadow-xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-[#071A33]/60 block mb-0.5">
                        1. Target / Victim Profile
                      </span>
                      <div className="font-bold text-[#071A33] leading-snug">
                        {selectedCase.moFingerprint.target}
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="p-2.5 bg-white border border-[#0B2341]/12 rounded-md shadow-xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-[#071A33]/60 block mb-0.5">
                        2. Operational Timing Window
                      </span>
                      <div className="font-bold text-[#071A33] leading-snug">
                        {selectedCase.moFingerprint.timing}
                      </div>
                    </div>

                    {/* Entry Method */}
                    <div className="p-2.5 bg-white border border-[#0B2341]/12 rounded-md shadow-xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-[#071A33]/60 block mb-0.5">
                        3. Entry / Infiltration Method
                      </span>
                      <div className="font-bold text-[#071A33] leading-snug">
                        {selectedCase.moFingerprint.entry_method}
                      </div>
                    </div>

                    {/* Tools & Hardware */}
                    <div className="p-2.5 bg-white border border-[#0B2341]/12 rounded-md shadow-xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-[#071A33]/60 block mb-0.5">
                        4. Tools & Hardware Signature
                      </span>
                      <div className="font-bold text-[#071A33] leading-snug">
                        {selectedCase.moFingerprint.tools}
                      </div>
                    </div>

                    {/* Transport / Escape */}
                    <div className="p-2.5 bg-white border border-[#0B2341]/12 rounded-md shadow-xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-[#071A33]/60 block mb-0.5">
                        5. Transport & Getaway Mode
                      </span>
                      <div className="font-bold text-[#071A33] leading-snug">
                        {selectedCase.moFingerprint.transport}
                      </div>
                    </div>

                    {/* Concealment */}
                    <div className="p-2.5 bg-white border border-[#0B2341]/12 rounded-md shadow-xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-[#071A33]/60 block mb-0.5">
                        6. Concealment & Counter-Surveillance
                      </span>
                      <div className="font-bold text-[#071A33] leading-snug">
                        {selectedCase.moFingerprint.concealment}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOSSIER SECTION 5: WHO IS INVOLVED (LINKED PERSONS & ROLES) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#071A33] font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#F5B800]" />
                    3. Linked Persons of Interest & Accused Roles
                  </h3>
                  <span className="text-[9.5px] font-mono text-[#071A33]/60 font-semibold">
                    FORMAL CHARGESHEET ROLES
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCase.linkedPersons && selectedCase.linkedPersons.length > 0 ? (
                    selectedCase.linkedPersons.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/entities?id=${p.id}`)}
                        className="p-3 rounded-md bg-white hover:bg-[#F4F7FB] border border-[#0B2341]/12 hover:border-[#0B2341]/25 cursor-pointer transition-all flex items-center justify-between group shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#071A33] text-[#F5B800] text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0 border border-[#0B2341]">
                            {p.canonical_name ? p.canonical_name[0] : 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#071A33] truncate group-hover:text-[#D97706]">
                              {p.canonical_name}
                            </div>
                            <div className="text-[10px] text-[#071A33]/70 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${getRoleBadge(p.role_type)}`}>
                                {p.role_type || 'Accused'}
                              </span>
                              <span className="text-[#071A33]/40">•</span>
                              <span className="truncate text-[#071A33] font-medium">{p.status_tag || 'Subject'}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#071A33]/40 group-hover:text-[#071A33] transition-transform group-hover:translate-x-0.5 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-3 text-xs text-[#071A33]/60 italic bg-[#F4F7FB] rounded border border-[#0B2341]/10">
                      No suspects or persons formally tagged in this FIR record yet.
                    </div>
                  )}
                </div>
              </div>

              {/* DOSSIER SECTION 6: WHAT OTHER INTELLIGENCE & EVIDENCE EXISTS */}
              {selectedCase.similarCases && selectedCase.similarCases.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#0B2341]/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-[#F5B800]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#071A33] font-mono">
                        4. Serial Modus Operandi Correlations & Pattern Matches
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate(`/mo-similarity?id=${selectedCase.id}`)}
                      className="text-[10.5px] font-bold text-[#071A33] hover:text-[#D97706] flex items-center gap-1 font-mono"
                    >
                      <span>Explore MO Matching</span>
                      <ArrowRight className="w-3 h-3 text-[#F5B800]" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCase.similarCases.slice(0, 4).map((sim) => (
                      <div
                        key={sim.id}
                        onClick={() => handleSelectCase(sim.id)}
                        className="p-3 bg-white border border-[#0B2341]/12 hover:border-[#0B2341]/30 rounded-md cursor-pointer transition-all shadow-xs group hover:bg-[#F4F7FB]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-[#071A33] group-hover:underline">
                            {sim.crime_no}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                            {sim.similarity_score}% Match
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-[#071A33] truncate">
                          {sim.crime_major_head}
                        </div>
                        <div className="text-[10px] text-[#071A33]/70 mt-1.5 flex items-center justify-between font-mono pt-1 border-t border-[#0B2341]/10">
                          <span className="flex items-center gap-1 truncate text-[#071A33] font-medium">
                            <MapPin className="w-3 h-3 text-[#DC2626] flex-shrink-0" />
                            {sim.police_station}
                          </span>
                          <span className="text-[#071A33]/50">{sim.registered_date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#071A33]/60 space-y-2 py-12">
              <FolderOpen className="w-8 h-8 text-[#071A33]/40" />
              <p className="text-xs font-medium text-[#071A33]/70">Select a case from the registry index on the left to inspect the investigative dossier.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ingest FIR Modal */}
      <FIRUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
