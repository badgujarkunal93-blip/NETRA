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
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedStation, setSelectedStation] = useState('All');

  const urlCaseId = searchParams.get('id');

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      const data = await dbService.getCases({
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        police_station: selectedStation
      });
      setCases(data);

      const targetId = urlCaseId || (data.length > 0 ? data[0].id : null);
      if (targetId) {
        const fullDetail = await dbService.getCaseById(targetId);
        setSelectedCase(fullDetail);
      } else {
        setSelectedCase(null);
      }
      setLoading(false);
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
        return 'bg-[#0A192F] text-white border-[#0A192F]';
      case 'Open':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'Chargesheet Filed':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('accused')) return 'bg-red-50 text-red-800 border-red-200 font-semibold';
    if (r.includes('suspect')) return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    if (r.includes('victim') || r.includes('complainant')) return 'bg-blue-50 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-3.5 max-w-[1400px] mx-auto h-[calc(100vh-5.5rem)] flex flex-col">
      {/* 1. UNIFIED INVESTIGATION SEARCH & FILTER BAR */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex-shrink-0 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider font-mono">
                Case & FIR Registry Dossier
              </h1>
              <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                CCTNS FORM II
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Query registered crimes, examine extracted modus operandi behavioral signatures, and explore cross-case intelligence links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crime no, title, station, facts..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#0A192F] focus:bg-white text-slate-900 transition-colors"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 bg-[#0A192F] hover:bg-[#132B4C] text-white font-semibold text-xs rounded-md transition-colors flex items-center gap-1.5 border border-[#132B4C] shadow-xs flex-shrink-0"
            >
              <FileUp className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Ingest FIR PDF</span>
            </button>
          </div>
        </div>

        {/* Structured Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#0A192F]" />
            Filters:
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium focus:outline-none focus:border-slate-400"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium focus:outline-none focus:border-slate-400"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>Status: {st}</option>
            ))}
          </select>

          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium focus:outline-none focus:border-slate-400"
          >
            {stations.map((st) => (
              <option key={st} value={st}>Station: {st}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-mono">
              Showing <strong className="text-slate-800">{cases.length}</strong> registered cases
            </span>
          </div>
        </div>
      </div>

      {/* 2. MASTER-DETAIL INVESTIGATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT PANE: Scannable FIR Registry List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-[#0A192F] px-3.5 py-2 text-white flex items-center justify-between border-b border-[#132B4C] flex-shrink-0">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                FIR Master Index ({cases.length})
              </span>
            </div>
            <span className="text-[9.5px] text-slate-300 font-mono bg-[#132B4C] px-1.5 py-0.5 rounded">
              PILOT CIU
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {cases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching case records found. Try adjusting search or filters.
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-100/90 border-l-4 border-[#0A192F] shadow-xs'
                        : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Primary Identity Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-[#0A192F] tracking-tight">
                        {c.crime_no}
                      </span>
                      <span className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </div>

                    {/* Crime Major Head Title */}
                    <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                      {c.crime_major_head}
                    </div>

                    {/* Supporting Metadata Strip */}
                    <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500 pt-1.5 border-t border-slate-100/80 font-sans">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-[#B91C1C] flex-shrink-0" />
                        <span className="truncate">{c.police_station}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {c.registered_date}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Continuous Investigative Case Record Dossier (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm overflow-y-auto p-5 flex flex-col">
          {selectedCase ? (
            <div className="space-y-5">
              
              {/* DOSSIER SECTION 1: CASE IDENTITY & QUICK ACTIONS */}
              <div className="pb-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wide">
                        {selectedCase.case_no || 'FIR-RECORD'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        OFFICIAL CCTNS FORM II REGISTRY
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-[#0A192F] tracking-tight">
                      {selectedCase.crime_no} — {selectedCase.crime_major_head}
                    </h2>
                    <div className="text-xs font-medium text-[#B45309]">
                      {selectedCase.crime_category} • {selectedCase.crime_minor_head}
                    </div>
                  </div>

                  {/* Status & Station Block */}
                  <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded text-[10.5px] font-mono font-bold border ${getStatusBadge(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                    <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium mt-0.5">
                      <MapPin className="w-3 h-3 text-[#B91C1C]" />
                      {selectedCase.police_station}
                    </span>
                  </div>
                </div>

                {/* Key Timestamps & Provenance Strip */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-slate-700">Registered:</strong> {selectedCase.registered_date}
                    </span>
                    {selectedCase.incident_from && (
                      <span>
                        <strong className="text-slate-700">Incident Window:</strong> {selectedCase.incident_from.split('T')[0]} to {selectedCase.incident_to ? selectedCase.incident_to.split('T')[0] : 'Open'}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions Toolbar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/canvas?caseId=${selectedCase.id}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded border border-slate-300 flex items-center gap-1 transition-colors"
                      title="Open Case Canvas Investigative Whiteboard"
                    >
                      <Layers className="w-3 h-3 text-[#0A192F]" />
                      <span>Case Canvas</span>
                    </button>

                    <button
                      onClick={() => navigate(`/graph?caseId=${selectedCase.id}`)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded border border-slate-300 flex items-center gap-1 transition-colors"
                      title="Explore Knowledge Graph & Spatial Corridor"
                    >
                      <Compass className="w-3 h-3 text-[#B91C1C]" />
                      <span>Map Graph</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* DOSSIER SECTION 2: CASE INTELLIGENCE EXECUTIVE SUMMARY */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0A192F]" />
                    Case Intelligence Summary & Signal Matrix
                  </span>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      SOURCE: VERIFIED
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                      DERIVED: NLP MO
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase block font-semibold">Subject Mapping</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedCase.linkedPersons?.length || 0} Persons Linked
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase block font-semibold">MO Confidence</span>
                    <span className="font-bold text-amber-700 text-xs">
                      {selectedCase.moFingerprint?.confidence || 90}% Extraction
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase block font-semibold">Serial Crime Matches</span>
                    <span className="font-bold text-[#0A192F] text-xs">
                      {selectedCase.similarCases?.length || 0} Correlated Cases
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[9.5px] font-mono text-slate-400 uppercase block font-semibold">Evidentiary Items</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {selectedCase.evidenceItems?.length || 1} Registered Items
                    </span>
                  </div>
                </div>
              </div>

              {/* DOSSIER SECTION 3: WHAT HAPPENED (BRIEF FACTS NARRATIVE) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0A192F]" />
                    1. Recorded Complaint Narrative (Source Facts)
                  </h3>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    COMPLAINANT RECORD
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/90 rounded-md border border-slate-200 border-l-4 border-l-[#0A192F] text-xs text-slate-800 leading-relaxed font-sans shadow-2xs">
                  {selectedCase.brief_facts || 'Official CCTNS Form II registered FIR summary on file.'}
                </div>
              </div>

              {/* DOSSIER SECTION 4: HOW THE CRIME WAS CARRIED OUT (STRUCTURED MO SUMMARY) */}
              {selectedCase.moFingerprint && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                        2. Extracted Modus Operandi (Behavioral Signature)
                      </h3>
                    </div>
                    <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      DERIVED INTELLIGENCE • {selectedCase.moFingerprint.confidence}% CONFIDENCE
                    </span>
                  </div>

                  {/* Behavioral Flow Breakdown (Target -> Timing -> Entry -> Tools -> Transport -> Concealment) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    
                    {/* Target */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block mb-0.5">
                        1. Target / Victim Profile
                      </span>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {selectedCase.moFingerprint.target}
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block mb-0.5">
                        2. Operational Timing Window
                      </span>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {selectedCase.moFingerprint.timing}
                      </div>
                    </div>

                    {/* Entry Method */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block mb-0.5">
                        3. Entry / Infiltration Method
                      </span>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {selectedCase.moFingerprint.entry_method}
                      </div>
                    </div>

                    {/* Tools & Hardware */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block mb-0.5">
                        4. Tools & Hardware Signature
                      </span>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {selectedCase.moFingerprint.tools}
                      </div>
                    </div>

                    {/* Transport / Escape */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block mb-0.5">
                        5. Transport & Getaway Mode
                      </span>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {selectedCase.moFingerprint.transport}
                      </div>
                    </div>

                    {/* Concealment */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block mb-0.5">
                        6. Concealment & Counter-Surveillance
                      </span>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {selectedCase.moFingerprint.concealment}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOSSIER SECTION 5: WHO IS INVOLVED (LINKED PERSONS & ROLES) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0A192F]" />
                    3. Linked Persons of Interest & Accused Roles
                  </h3>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    FORMAL CHARGESHEET ROLES
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedCase.linkedPersons && selectedCase.linkedPersons.length > 0 ? (
                    selectedCase.linkedPersons.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/entities?id=${p.id}`)}
                        className="p-3 rounded-md bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#0A192F] text-[#D4A017] text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                            {p.canonical_name ? p.canonical_name[0] : 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate group-hover:text-[#0A192F]">
                              {p.canonical_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${getRoleBadge(p.role_type)}`}>
                                {p.role_type || 'Accused'}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="truncate">{p.status_tag || 'Subject'}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-3 text-xs text-slate-400 italic bg-slate-50 rounded border border-slate-200">
                      No suspects or persons formally tagged in this FIR record yet.
                    </div>
                  )}
                </div>
              </div>

              {/* DOSSIER SECTION 6: WHAT OTHER INTELLIGENCE & EVIDENCE EXISTS */}
              {selectedCase.similarCases && selectedCase.similarCases.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-[#B45309]" />
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                        4. Serial Modus Operandi Correlations & Pattern Matches
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate(`/mo-similarity?id=${selectedCase.id}`)}
                      className="text-[10.5px] font-semibold text-[#B45309] hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Explore Correlation Matrix</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCase.similarCases.slice(0, 4).map((sim) => (
                      <div
                        key={sim.id}
                        onClick={() => handleSelectCase(sim.id)}
                        className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-md cursor-pointer transition-all shadow-2xs group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-[#0A192F] group-hover:underline">
                            {sim.crime_no}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            {sim.similarity_score}% Match
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-700 truncate">
                          {sim.crime_major_head}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between font-mono pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#B91C1C] flex-shrink-0" />
                            {sim.police_station}
                          </span>
                          <span className="text-slate-400">{sim.registered_date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-12">
              <FolderOpen className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">Select a case from the registry index on the left to inspect the investigative dossier.</p>
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
