import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Users, 
  Smartphone, 
  Car, 
  CreditCard, 
  Share2, 
  Clock, 
  MapPin, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Shield, 
  FolderSearch,
  ChevronRight,
  Search,
  CheckCircle2,
  X,
  Layers,
  Loader2
} from 'lucide-react';
import { dbService } from '../services/db';

export default function EntityProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const urlPersonId = searchParams.get('id');

  // Debounced Search on Supabase
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const list = await dbService.getPersons({ search: searchTerm });
      if (active) {
        setPersons(list);
        setIsSearching(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Initial Load / URL Parameter Sync
  useEffect(() => {
    async function loadSelected() {
      setLoading(true);
      if (urlPersonId) {
        const fullDetail = await dbService.getPersonById(urlPersonId);
        if (fullDetail) {
          setSelectedPerson(fullDetail);
        }
      } else if (!selectedPerson) {
        const initialList = await dbService.getPersons();
        if (initialList.length > 0) {
          const firstDetail = await dbService.getPersonById(initialList[0].id);
          setSelectedPerson(firstDetail);
          setPersons(initialList);
        }
      }
      setLoading(false);
    }
    loadSelected();
  }, [urlPersonId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPerson = async (pId) => {
    setIsDropdownOpen(false);
    setSearchParams({ id: pId });
    setLoading(true);
    const fullDetail = await dbService.getPersonById(pId);
    setSelectedPerson(fullDetail);
    setLoading(false);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & ASYNCHRONOUS TYPE-AHEAD ENTITY SEARCH */}
      <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30">
        <div>
          <h1 className="text-base font-bold text-[#0A192F] uppercase tracking-wide flex items-center gap-2">
            <span>Entity Dossier: Person of Interest</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-300">
              CCTNS REGISTRY
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Searchable registry across 2,014 actionable persons of interest, aliases, and case networks.
          </p>
        </div>

        {/* Search & Type-Ahead Combobox */}
        <div ref={searchContainerRef} className="relative w-full sm:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder={selectedPerson ? `${selectedPerson.canonical_name} (${selectedPerson.status_tag})` : 'Search 2,014 actionable persons...'}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded focus:outline-none focus:border-[#0A192F] text-[#0F172A] font-medium placeholder-slate-500"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 animate-spin" />
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#CBD5E1] rounded-md shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-slate-100">
              <div className="p-2 bg-slate-50 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider flex justify-between">
                <span>Matching Persons ({persons.length})</span>
                <span className="text-[#0A192F]">Live Supabase Search</span>
              </div>

              {persons.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-sans">
                  No registered persons found matching "{searchTerm}".
                </div>
              ) : (
                persons.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPerson(p.id)}
                    className={`w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                      selectedPerson?.id === p.id ? 'bg-amber-50/60 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-[#0A192F] text-[#D4A017] flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {p.canonical_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0A192F] truncate">
                          {p.canonical_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 truncate">
                          <span className="text-[#D4A017] font-semibold">{p.id}</span>
                          <span>•</span>
                          <span>{p.primaryRole || p.status_tag}</span>
                          {p.caseCount > 0 && (
                            <span className="text-emerald-700 font-bold">({p.caseCount} Cases)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${
                        p.status_tag === 'Key Suspect' || p.status_tag === 'Accused'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : p.status_tag === 'Under Surveillance'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {p.status_tag}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {p.confidence_score}% Conf
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPerson && (
        <>
          {/* 2. PERSON DOSSIER HEADER BANNER */}
          <div className="bg-white p-4 rounded-md border border-[#E2E8F0] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded bg-[#0A192F] text-[#D4A017] flex items-center justify-center font-mono font-bold text-lg border border-[#132B4C] flex-shrink-0 overflow-hidden">
                  {selectedPerson.photo_url ? (
                    <img src={selectedPerson.photo_url} alt={selectedPerson.canonical_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedPerson.canonical_name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-[#0A192F]">
                      {selectedPerson.canonical_name}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[#0A192F] text-white text-[10.5px] font-mono font-bold border border-[#132B4C]">
                      {selectedPerson.status_tag}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[10.5px] font-mono font-bold border border-[#FCD34D]">
                      {selectedPerson.confidence_score}% Identity Conf
                    </span>
                  </div>

                  {/* Alias Tags */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Known Aliases:</span>
                    {selectedPerson.aliases && selectedPerson.aliases.map((alias, idx) => (
                      <span key={idx} className="px-1.5 py-0.2 rounded bg-[#F1F5F9] border border-slate-200 text-slate-700 font-mono text-[10.5px]">
                        "{alias}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => navigate(`/graph?focus=${selectedPerson.id}`)}
                  className="px-3 py-1.5 bg-[#0A192F] hover:bg-[#132B4C] text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 border border-[#132B4C]"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>Explore in Knowledge Graph</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. THREE-PANEL DOSSIER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Biographical Attributes & Tagged Assets (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-sm space-y-3">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                  Biographical Profile
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Date of Birth / Age:</span>
                    <span className="font-semibold text-[#0A192F]">{selectedPerson.dob || 'Unknown'} (Approx 44 Yrs)</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Gender:</span>
                    <span className="font-semibold text-[#0A192F]">{selectedPerson.gender || 'Male'}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Jurisdiction Zone:</span>
                    <span className="font-semibold text-[#0A192F]">Mumbai Metropolitan Area</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Linked FIRs Count:</span>
                    <span className="font-mono font-bold text-[#0A192F]">{selectedPerson.linkedCases?.length || 0} Cases</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Tagged Asset Holdings
                  </h4>
                  <div className="space-y-1.5">
                    <div className="p-1.5 bg-[#F8FAFC] rounded border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Registered Phones:</span>
                      </div>
                      <span className="font-mono font-bold text-[#0A192F]">{selectedPerson.linkedPhones?.length || 0}</span>
                    </div>
                    <div className="p-1.5 bg-[#F8FAFC] rounded border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Car className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tagged Vehicles:</span>
                      </div>
                      <span className="font-mono font-bold text-[#0A192F]">{selectedPerson.linkedVehicles?.length || 0}</span>
                    </div>
                    <div className="p-1.5 bg-[#F8FAFC] rounded border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bank Accounts:</span>
                      </div>
                      <span className="font-mono font-bold text-[#0A192F]">{selectedPerson.linkedAccounts?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER: Tabbed Navigation (Timeline, Relationships, Cases, Evidence) (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
              {/* Clean Underlined Tabs */}
              <div className="flex border-b border-[#E2E8F0] bg-white px-3">
                {[
                  { id: 'timeline', label: 'Timeline', icon: Clock },
                  { id: 'relationships', label: 'Relationships', icon: Share2 },
                  { id: 'cases', label: 'Linked Cases', icon: FolderSearch },
                  { id: 'evidence', label: 'Evidence Logs', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#0A192F] text-[#0A192F]'
                        : 'border-transparent text-slate-500 hover:text-[#0A192F]'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Body */}
              <div className="p-4 flex-1 overflow-y-auto">
                {/* 1. TIMELINE */}
                {activeTab === 'timeline' && (
                  <div className="space-y-3">
                    {selectedPerson.events && selectedPerson.events.length > 0 ? (
                      <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                        {selectedPerson.events.map((evt) => (
                          <div key={evt.id} className="relative">
                            <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#0A192F] border-2 border-white shadow-sm flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-[#D4A017]"></span>
                            </div>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="font-semibold text-[#0A192F]">{evt.event_type}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(evt.event_time).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed bg-[#F8FAFC] p-2 rounded border border-slate-200">
                              {evt.description}
                            </p>
                            <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#B91C1C]" />
                              <span>{evt.location_text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center py-6">
                        No recorded timeline events for this subject.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. RELATIONSHIPS */}
                {activeTab === 'relationships' && (
                  <div className="space-y-2.5">
                    {selectedPerson.relationships && selectedPerson.relationships.length > 0 ? (
                      selectedPerson.relationships.map((rel) => {
                        const isInferred = rel.status === 'inferred';
                        return (
                          <div
                            key={rel.id}
                            className={`p-3 rounded border ${
                              isInferred
                                ? 'bg-[#FEF3C7]/20 border-[#FCD34D]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#0A192F]">
                                    {rel.targetEntity?.canonical_name || rel.targetEntity?.name || rel.target_id}
                                  </span>
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                    isInferred ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]' : 'bg-[#0A192F] text-white'
                                  }`}>
                                    {isInferred ? 'AI INFERRED' : 'OBSERVED'}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-[#92400E]">
                                    {rel.confidence}% Conf
                                  </span>
                                </div>
                                <div className="text-xs font-medium text-slate-800 mt-0.5">
                                  {rel.relationship_type}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1.5 text-[10.5px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                              <strong className="text-slate-800">Evidence:</strong> {rel.source_evidence}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 italic text-center py-6">
                        No direct network relationships cataloged.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CASES */}
                {activeTab === 'cases' && (
                  <div className="space-y-2">
                    {selectedPerson.linkedCases && selectedPerson.linkedCases.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/cases?id=${c.id}`)}
                        className="p-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded border border-[#E2E8F0] cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#0A192F]">{c.crime_no}</span>
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                              Role: {c.role_type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 mt-0.5">{c.crime_major_head}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{c.police_station} • {c.registered_date}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. EVIDENCE */}
                {activeTab === 'evidence' && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <div className="font-semibold text-[#0A192F] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>DOC-FORENSIC-881 — Telecom CDR Cross-Match Report</span>
                      </div>
                      <div className="text-[10.5px] text-slate-600 mt-0.5">
                        Correlated voice call timestamps with Charoti toll plaza FASTag sensor crossings.
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded">
                      <div className="font-semibold text-[#0A192F] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>FIU-IND STR-8801 — Suspicious Outflow Tracing</span>
                      </div>
                      <div className="text-[10.5px] text-slate-600 mt-0.5">
                        Four tranches totaling ₹1.85 Cr transferred to unverified escrow account.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Connected Entities Preview (3 Cols) */}
            <div className="lg:col-span-3 bg-white p-3.5 rounded-md border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-[#0A192F]" />
                  Connected Entities Preview
                </h3>

                {/* Restrained Mini Visual Canvas */}
                <div className="w-full h-40 bg-[#0A192F] rounded relative overflow-hidden border border-[#132B4C] flex items-center justify-center p-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4A017] text-[#0A192F] font-mono font-bold text-xs flex items-center justify-center border border-white z-10">
                    {selectedPerson.canonical_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="absolute top-3 left-4 w-6 h-6 rounded-full bg-[#132B4C] text-white text-[8px] font-mono flex items-center justify-center border border-slate-400">
                    P1
                  </div>
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#132B4C] text-white text-[8px] font-mono flex items-center justify-center border border-slate-400">
                    ORG
                  </div>
                  <div className="absolute bottom-3 left-6 w-6 h-6 rounded-full bg-[#132B4C] text-white text-[8px] font-mono flex items-center justify-center border border-slate-400">
                    VEH
                  </div>
                  <div className="absolute bottom-3 right-6 w-6 h-6 rounded-full bg-[#132B4C] text-white text-[8px] font-mono flex items-center justify-center border border-slate-400">
                    ACC
                  </div>

                  <svg className="absolute inset-0 w-full h-full stroke-slate-400 stroke-[1] pointer-events-none">
                    <line x1="50%" y1="50%" x2="25%" y2="20%" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" />
                    <line x1="50%" y1="50%" x2="30%" y2="78%" />
                    <line x1="50%" y1="50%" x2="75%" y2="80%" strokeDasharray="3 3" />
                  </svg>
                </div>

                <div className="mt-2.5 text-[10.5px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Direct Links:</span>
                    <strong className="text-[#0A192F] font-mono">{selectedPerson.relationships?.length || 0} Connections</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Topology:</span>
                    <strong className="text-[#B45309] font-mono">Multi-Hop Hub</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/graph?focus=${selectedPerson.id}`)}
                className="w-full mt-3 py-1.5 bg-[#0A192F] hover:bg-[#132B4C] text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 border border-[#132B4C]"
              >
                <span>Open in Knowledge Graph</span>
                <ArrowRight className="w-3 h-3 text-[#D4A017]" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
