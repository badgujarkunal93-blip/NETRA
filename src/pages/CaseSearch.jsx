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
  FileUp
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
  const stations = ['All', 'Bandra Police Station', 'Colaba Police Station', 'Dharavi Police Station', 'Andheri East Cyber Cell', 'Worli Police Station', 'Kurla Police Station', 'Dadar Police Station'];

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      {/* 1. TOP FILTER CONTROLS BAR */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-sm flex-shrink-0 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-[#0A192F] uppercase tracking-wide">
              Case & FIR Registry Dossier
            </h1>
            <p className="text-xs text-slate-500">
              Query registered crimes, extracted modus operandi tags, and cross-case evidence links.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search crime no, brief facts, suspect name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] text-[#0F172A]"
            />
          </div>
        </div>

        {/* Filter Dropdown Selectors */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#0A192F]" />
            FILTERS:
          </span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0A192F] font-medium focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0A192F] font-medium focus:outline-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>Status: {st}</option>
            ))}
          </select>

          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="px-2 py-1 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0A192F] font-medium focus:outline-none"
          >
            {stations.map((st) => (
              <option key={st} value={st}>Station: {st}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10.5px] text-slate-500 font-mono">
              <strong>{cases.length}</strong> Records Found
            </span>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1 bg-[#0A192F] hover:bg-[#132B4C] text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5 border border-[#132B4C]"
            >
              <FileUp className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Ingest FIR PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MASTER-DETAIL VIEW (LEFT LIST + RIGHT DETAILS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Scrollable FIR List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-[#0A192F] px-3.5 py-2 text-white flex items-center justify-between border-b border-[#132B4C]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              FIR Registry ({cases.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">PILOT JURISDICTION</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {cases.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching case records found.
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                const statusBadge =
                  c.status === 'Open'
                    ? 'border-amber-300 text-[#92400E] bg-[#FEF3C7]'
                    : c.status === 'Under Investigation'
                    ? 'bg-[#0A192F] text-white'
                    : c.status === 'Chargesheet Filed'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#F1F5F9] border-l-3 border-[#0A192F]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-[#0A192F]">
                        {c.crime_no}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusBadge}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 truncate">
                      {c.crime_major_head}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#B91C1C]" />
                        {c.police_station}
                      </span>
                      <span className="font-mono">{c.registered_date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Full Case Detail Dossier (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-y-auto p-4 flex flex-col justify-between">
          {selectedCase ? (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 text-[9.5px] font-mono font-bold rounded bg-[#0A192F] text-white">
                        {selectedCase.case_no}
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-mono">
                        Registered: {selectedCase.registered_date}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-[#0A192F] mt-1">
                      {selectedCase.crime_no} — {selectedCase.crime_major_head}
                    </h2>
                    <div className="text-xs font-medium text-[#B45309] mt-0.5">
                      {selectedCase.crime_category} • {selectedCase.crime_minor_head}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0A192F] text-white">
                      {selectedCase.status}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#B91C1C]" />
                      {selectedCase.police_station}
                    </span>
                  </div>
                </div>
              </div>

              {/* Brief Facts Narrative */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0A192F]" />
                  Brief Facts of the FIR
                </h3>
                <div className="p-3 bg-[#F8FAFC] rounded border-l-3 border-[#0A192F] text-xs text-slate-700 leading-relaxed font-sans border border-slate-200">
                  {selectedCase.brief_facts}
                </div>
              </div>

              {/* Extracted MO Intelligence */}
              {selectedCase.moFingerprint && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                      Extracted Modus Operandi (MO) Attributes
                    </h3>
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
                      {selectedCase.moFingerprint.confidence}% Extraction Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Target:</span>
                      <span className="font-medium text-[#0A192F]">{selectedCase.moFingerprint.target}</span>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Timing Window:</span>
                      <span className="font-medium text-[#0A192F]">{selectedCase.moFingerprint.timing}</span>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Entry Method:</span>
                      <span className="font-medium text-[#0A192F]">{selectedCase.moFingerprint.entry_method}</span>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Tools & Hardware:</span>
                      <span className="font-medium text-[#0A192F]">{selectedCase.moFingerprint.tools}</span>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Transport / Escape:</span>
                      <span className="font-medium text-[#0A192F]">{selectedCase.moFingerprint.transport}</span>
                    </div>
                    <div className="p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Concealment:</span>
                      <span className="font-medium text-[#0A192F]">{selectedCase.moFingerprint.concealment}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Persons & Roles */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0A192F]" />
                  Linked Persons of Interest & Roles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.linkedPersons && selectedCase.linkedPersons.length > 0 ? (
                    selectedCase.linkedPersons.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/entities?id=${p.id}`)}
                        className="px-2.5 py-1 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-medium text-[#0A192F] flex items-center gap-2 transition-colors"
                      >
                        <span className="w-4 h-4 rounded bg-[#0A192F] text-[#D4A017] text-[9px] font-mono flex items-center justify-center font-bold">
                          {p.canonical_name[0]}
                        </span>
                        <span>{p.canonical_name}</span>
                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-700">
                          {p.role_type}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No persons linked yet.</span>
                  )}
                </div>
              </div>

              {/* Similar Cases by MO Match */}
              {selectedCase.similarCases && selectedCase.similarCases.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-[#B45309]" />
                      Similar Cases by Modus Operandi (MO Correlation)
                    </h3>
                    <button
                      onClick={() => navigate(`/mo-similarity?id=${selectedCase.id}`)}
                      className="text-[11px] font-semibold text-[#B45309] hover:underline flex items-center gap-1"
                    >
                      <span>Full MO Comparison</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCase.similarCases.map((sim) => (
                      <div
                        key={sim.id}
                        onClick={() => handleSelectCase(sim.id)}
                        className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-mono font-bold text-[#0A192F]">{sim.crime_no}</span>
                          <span className="text-[10px] font-mono font-bold text-[#92400E]">
                            {sim.similarity_score}% Match
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-600 truncate">{sim.crime_major_head}</div>
                        <div className="text-[9.5px] text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#B91C1C]" />
                          {sim.police_station}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Select a case from the registry to inspect dossier.
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
