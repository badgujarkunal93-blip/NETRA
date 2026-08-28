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

  // Debounced Search
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const list = await dbService.getPersons({ search: searchTerm });
        if (active) {
          setPersons(list || []);
        }
      } catch (err) {
        console.error("Failed to search persons:", err);
      } finally {
        if (active) setIsSearching(false);
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
      try {
        if (urlPersonId) {
          const fullDetail = await dbService.getPersonById(urlPersonId);
          if (fullDetail) {
            setSelectedPerson(fullDetail);
          }
        } else if (!selectedPerson) {
          const initialList = await dbService.getPersons();
          if (initialList && initialList.length > 0) {
            const firstDetail = await dbService.getPersonById(initialList[0].id);
            setSelectedPerson(firstDetail);
            setPersons(initialList);
          }
        }
      } catch (err) {
        console.error("Failed to load selected person:", err);
      } finally {
        setLoading(false);
      }
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
      <div className="glass-card p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <span>Person Dossier & Profile</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#0A192F] text-[#D4A017] border border-[#1C3B64]" title="CCTNS Police Registry Record">
              POLICE REGISTRY
            </span>
          </h1>
          <p className="text-xs text-slate-300">
            Search across registered persons of interest, suspect aliases, and connected cases.
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
              placeholder={selectedPerson ? `${selectedPerson.canonical_name} (${selectedPerson.status_tag})` : 'Search actionable persons...'}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white/[0.08] border border-white/15 rounded focus:outline-none focus:border-[#D4A017] text-white font-medium placeholder-slate-400"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 animate-spin" />
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A192F]/95 backdrop-blur-xl border border-white/20 rounded-md shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-white/5">
              <div className="p-2 bg-white/[0.06] text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider flex justify-between">
                <span>Matching Persons ({persons.length})</span>
                <span className="text-[#D4A017]">Live Search</span>
              </div>

              {persons.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-300 font-sans">
                  No registered persons found matching "{searchTerm}".
                </div>
              ) : (
                persons.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPerson(p.id)}
                    className={`w-full text-left p-2.5 hover:bg-white/[0.12] transition-colors flex items-center justify-between gap-2 ${
                      selectedPerson?.id === p.id ? 'bg-white/[0.12] font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-white/10 text-[#D4A017] border border-white/15 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {p.canonical_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {p.canonical_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1.5 truncate">
                          <span className="text-[#D4A017] font-semibold">{p.id}</span>
                          <span>•</span>
                          <span>{p.primaryRole || p.status_tag}</span>
                          {p.caseCount > 0 && (
                            <span className="text-emerald-400 font-bold">({p.caseCount} Cases)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${
                        p.status_tag === 'Key Suspect' || p.status_tag === 'Accused'
                          ? 'bg-red-950/80 text-rose-300 border-rose-800'
                          : p.status_tag === 'Under Surveillance'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-white/10 text-slate-200 border-white/15'
                      }`}>
                        {p.status_tag}
                      </span>
                      <span className="text-[9px] font-mono text-slate-300 mt-0.5">
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
          <div className="glass-card p-4 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded bg-white/10 text-[#D4A017] flex items-center justify-center font-mono font-bold text-lg border border-white/20 flex-shrink-0 overflow-hidden">
                  {selectedPerson.photo_url ? (
                    <img src={selectedPerson.photo_url} alt={selectedPerson.canonical_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedPerson.canonical_name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-white">
                      {selectedPerson.canonical_name}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-white/[0.08] text-white text-[10.5px] font-mono font-bold border border-white/15">
                      {selectedPerson.status_tag}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10.5px] font-mono font-bold border border-amber-800" title="How sure the AI is this is the same person across cases">
                      {selectedPerson.confidence_score}% Match Confidence
                    </span>
                  </div>

                  {/* Alias Tags */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-xs">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Known Aliases:</span>
                    {selectedPerson.aliases && selectedPerson.aliases.map((alias, idx) => (
                      <span key={idx} className="px-1.5 py-0.2 rounded bg-white/[0.08] border border-white/15 text-slate-200 font-mono text-[10.5px]">
                        "{alias}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => navigate(`/graph?focus=${selectedPerson.id}`)}
                  className="px-3 py-1.5 bg-white/[0.12] hover:bg-white/[0.20] text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 border border-white/20 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>Open in Knowledge Graph</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. THREE-PANEL DOSSIER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Biographical Attributes & Tagged Assets (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="glass-card p-4 rounded-lg space-y-3">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300 border-b border-white/10 pb-1.5">
                  Personal Details
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10.5px] text-slate-300 block">Date of Birth / Age:</span>
                    <span className="font-semibold text-white">{selectedPerson.dob || 'Unknown'} (Approx 44 Yrs)</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-300 block">Gender:</span>
                    <span className="font-semibold text-white">{selectedPerson.gender || 'Male'}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-300 block">Jurisdiction Zone:</span>
                    <span className="font-semibold text-white">Mumbai Metropolitan Area</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-300 block">Linked FIRs Count:</span>
                    <span className="font-mono font-bold text-[#D4A017]">{selectedPerson.linkedCases?.length || 0} Cases</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Linked Phones, Vehicles & Accounts
                  </h4>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-white/[0.07] rounded border border-white/15 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Smartphone className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>Phones:</span>
                      </div>
                      <span className="font-mono font-bold text-white">{selectedPerson.linkedPhones?.length || 0}</span>
                    </div>
                    <div className="p-2 bg-white/[0.07] rounded border border-white/15 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Car className="w-3.5 h-3.5 text-sky-400" />
                        <span>Vehicles:</span>
                      </div>
                      <span className="font-mono font-bold text-white">{selectedPerson.linkedVehicles?.length || 0}</span>
                    </div>
                    <div className="p-2 bg-white/[0.07] rounded border border-white/15 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Bank Accounts:</span>
                      </div>
                      <span className="font-mono font-bold text-white">{selectedPerson.linkedAccounts?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER: Tabbed Navigation (Timeline, Relationships, Cases, Evidence) (6 Cols) */}
            <div className="lg:col-span-6 glass-card rounded-lg overflow-hidden flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-white/10 bg-white/[0.06] px-3">
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
                        ? 'border-[#D4A017] text-[#D4A017]'
                        : 'border-transparent text-slate-400 hover:text-white'
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
                      <div className="relative pl-5 border-l-2 border-white/15 space-y-4">
                        {selectedPerson.events.map((evt) => (
                          <div key={evt.id} className="relative">
                            <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#D4A017] border-2 border-[#0A192F] shadow-sm flex items-center justify-center">
                            </div>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="font-semibold text-white">{evt.event_type}</span>
                              <span className="text-[10px] text-slate-300 font-mono">
                                {new Date(evt.event_time).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed bg-white/[0.07] p-2.5 rounded border border-white/15">
                              {evt.description}
                            </p>
                            <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#E4232D]" />
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
                            className="p-3 rounded-md bg-white/[0.07] backdrop-blur-sm border border-white/15"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {rel.targetEntity?.canonical_name || rel.targetEntity?.name || rel.target_id}
                                  </span>
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                    isInferred ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                  }`}>
                                    {isInferred ? 'AI CLUE' : 'OBSERVED'}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-[#D4A017]">
                                    {rel.confidence}% Conf
                                  </span>
                                </div>
                                <div className="text-xs font-medium text-slate-300 mt-0.5">
                                  {rel.relationship_type}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-[10.5px] text-slate-300 bg-white/[0.06] p-2 rounded border border-white/10">
                              <strong className="text-slate-100">Evidence:</strong> {rel.source_evidence}
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
                        className="p-3 bg-white/[0.07] hover:bg-white/[0.14] rounded-md border border-white/15 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white">{c.crime_no}</span>
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-[#D4A017] border border-white/15">
                              Role: {c.role_type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 mt-0.5">{c.crime_major_head}</div>
                          <div className="text-[10px] text-slate-300 mt-0.5">{c.police_station} • {c.registered_date}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. EVIDENCE */}
                {activeTab === 'evidence' && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white/[0.07] border border-white/15 rounded-md">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>DOC-FORENSIC-881 — Telecom CDR Cross-Match Report</span>
                      </div>
                      <div className="text-[10.5px] text-slate-300 mt-1">
                        Correlated voice call timestamps with Charoti toll plaza FASTag sensor crossings.
                      </div>
                    </div>
                    <div className="p-3 bg-white/[0.07] border border-white/15 rounded-md">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>FIU-IND STR-8801 — Suspicious Outflow Tracing</span>
                      </div>
                      <div className="text-[10.5px] text-slate-300 mt-1">
                        Four tranches totaling ₹1.85 Cr transferred to unverified escrow account.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Connected Entities Preview (3 Cols) */}
            <div className="lg:col-span-3 glass-card p-4 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-[#D4A017]" />
                  Connected Clues & Links Preview
                </h3>

                {/* Restrained Mini Visual Canvas */}
                <div className="w-full h-40 bg-[#061121] rounded-md relative overflow-hidden border border-white/15 flex items-center justify-center p-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4A017] text-[#0A192F] font-mono font-bold text-xs flex items-center justify-center border border-white z-10 shadow-md">
                    {selectedPerson.canonical_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="absolute top-3 left-4 w-6 h-6 rounded-full bg-white/10 text-white text-[8px] font-mono flex items-center justify-center border border-white/20">
                    P1
                  </div>
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/10 text-white text-[8px] font-mono flex items-center justify-center border border-white/20">
                    ORG
                  </div>
                  <div className="absolute bottom-3 left-6 w-6 h-6 rounded-full bg-white/10 text-white text-[8px] font-mono flex items-center justify-center border border-white/20">
                    VEH
                  </div>
                  <div className="absolute bottom-3 right-6 w-6 h-6 rounded-full bg-white/10 text-white text-[8px] font-mono flex items-center justify-center border border-white/20">
                    ACC
                  </div>

                  <svg className="absolute inset-0 w-full h-full stroke-slate-500 stroke-[1] pointer-events-none">
                    <line x1="50%" y1="50%" x2="25%" y2="20%" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" />
                    <line x1="50%" y1="50%" x2="30%" y2="78%" />
                    <line x1="50%" y1="50%" x2="75%" y2="80%" strokeDasharray="3 3" />
                  </svg>
                </div>

                <div className="mt-3 text-[10.5px] text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Direct Links:</span>
                    <strong className="text-white font-mono">{selectedPerson.relationships?.length || 0} Connections</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network Position:</span>
                    <strong className="text-[#D4A017] font-mono" title="Connects multiple groups and cases">Key Bridge Person</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/graph?focus=${selectedPerson.id}`)}
                className="w-full mt-4 py-2 bg-white/[0.12] hover:bg-white/[0.20] text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-white/20 shadow-sm"
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
