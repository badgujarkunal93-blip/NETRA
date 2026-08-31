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
      <div className="glass-card p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30 border border-[#0B2341]/12 bg-white">
        <div>
          <h1 className="text-base font-bold text-[#071A33] uppercase tracking-wide flex items-center gap-2">
            <span>Person Dossier & Profile</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/50 font-bold" title="CCTNS Police Registry Record">
              POLICE REGISTRY
            </span>
          </h1>
          <p className="text-xs text-[#071A33]/70 font-medium mt-0.5">
            Search across registered persons of interest, suspect aliases, and connected cases.
          </p>
        </div>

        {/* Search & Type-Ahead Combobox */}
        <div ref={searchContainerRef} className="relative w-full sm:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#071A33]/45 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder={selectedPerson ? `${selectedPerson.canonical_name} (${selectedPerson.status_tag})` : 'Search actionable persons...'}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-[#0B2341]/20 rounded focus:outline-none focus:border-[#F5B800] text-[#071A33] font-medium placeholder-[#071A33]/45"
            />
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-[#071A33]/50 hover:text-[#071A33]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-[#F5B800] absolute right-2.5 top-2 animate-spin" />
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#0B2341]/20 rounded-md shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-[#0B2341]/10">
              <div className="p-2 bg-[#F4F7FB] text-[10px] font-mono text-[#071A33]/70 font-bold uppercase tracking-wider flex justify-between">
                <span>Matching Persons ({persons.length})</span>
                <span className="text-[#D97706]">Live Search</span>
              </div>

              {persons.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#071A33]/60 font-sans">
                  No registered persons found matching "{searchTerm}".
                </div>
              ) : (
                persons.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPerson(p.id)}
                    className={`w-full text-left p-2.5 hover:bg-[#F4F7FB] transition-colors flex items-center justify-between gap-2 ${
                      selectedPerson?.id === p.id ? 'bg-[#FFFBEB] font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-[#071A33] text-[#F5B800] border border-[#071A33] flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {p.canonical_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#071A33] truncate">
                          {p.canonical_name}
                        </div>
                        <div className="text-[10px] font-mono text-[#071A33]/70 flex items-center gap-1.5 truncate">
                          <span className="text-[#D97706] font-semibold">{p.id}</span>
                          <span>•</span>
                          <span>{p.primaryRole || p.status_tag}</span>
                          {p.caseCount > 0 && (
                            <span className="text-emerald-700 font-bold">({p.caseCount} Cases)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border ${
                        p.status_tag === 'Key Suspect' || p.status_tag === 'Accused'
                          ? 'bg-red-50 text-[#DC2626] border-red-200'
                          : p.status_tag === 'Under Surveillance'
                          ? 'bg-amber-50 text-[#D97706] border-amber-200'
                          : 'bg-slate-100 text-[#071A33] border-slate-200'
                      }`}>
                        {p.status_tag}
                      </span>
                      <span className="text-[9px] font-mono text-[#071A33]/60 mt-0.5">
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
          <div className="glass-card p-4 rounded-lg border border-[#0B2341]/12 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded bg-[#071A33] text-[#F5B800] flex items-center justify-center font-mono font-bold text-lg border border-[#071A33] flex-shrink-0 overflow-hidden shadow-sm">
                  {selectedPerson.photo_url ? (
                    <img src={selectedPerson.photo_url} alt={selectedPerson.canonical_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedPerson.canonical_name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-[#071A33]">
                      {selectedPerson.canonical_name}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[#F4F7FB] text-[#071A33] text-[10.5px] font-mono font-bold border border-[#0B2341]/15">
                      {selectedPerson.status_tag}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-[#D97706] text-[10.5px] font-mono font-bold border border-amber-200" title="How sure the AI is this is the same person across cases">
                      {selectedPerson.confidence_score}% Match Confidence
                    </span>
                  </div>

                  {/* Alias Tags */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap text-xs">
                    <span className="text-[10px] font-bold text-[#071A33]/70 uppercase tracking-wider">Known Aliases:</span>
                    {selectedPerson.aliases && selectedPerson.aliases.map((alias, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-[#F4F7FB] border border-[#0B2341]/15 text-[#071A33] font-mono text-[10.5px] font-medium">
                        "{alias}"
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => navigate(`/graph?focus=${selectedPerson.id}`)}
                  className="px-3 py-1.5 bg-[#071A33] hover:bg-[#0B2341] text-white font-semibold text-xs rounded transition-colors flex items-center gap-1.5 border border-[#071A33] shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#F5B800]" />
                  <span>Open in Knowledge Graph</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. THREE-PANEL DOSSIER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Biographical Attributes & Tagged Assets (3 Cols) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="glass-card p-4 rounded-lg space-y-3 border border-[#0B2341]/12 bg-white">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[#071A33] border-b border-[#0B2341]/10 pb-1.5">
                  Personal Details
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10.5px] text-[#071A33]/60 block font-medium">Date of Birth / Age:</span>
                    <span className="font-bold text-[#071A33]">{selectedPerson.dob || 'Unknown'} (Approx 44 Yrs)</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-[#071A33]/60 block font-medium">Gender:</span>
                    <span className="font-bold text-[#071A33]">{selectedPerson.gender || 'Male'}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-[#071A33]/60 block font-medium">Jurisdiction Zone:</span>
                    <span className="font-bold text-[#071A33]">Mumbai Metropolitan Area</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-[#071A33]/60 block font-medium">Linked FIRs Count:</span>
                    <span className="font-mono font-bold text-[#D97706]">{selectedPerson.linkedCases?.length || 0} Cases</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#0B2341]/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#071A33] mb-1.5">
                    Linked Phones, Vehicles & Accounts
                  </h4>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-[#F4F7FB] rounded border border-[#0B2341]/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#071A33]/80 font-medium">
                        <Smartphone className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Phones:</span>
                      </div>
                      <span className="font-mono font-bold text-[#071A33]">{selectedPerson.linkedPhones?.length || 0}</span>
                    </div>
                    <div className="p-2 bg-[#F4F7FB] rounded border border-[#0B2341]/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#071A33]/80 font-medium">
                        <Car className="w-3.5 h-3.5 text-[#071A33]" />
                        <span>Vehicles:</span>
                      </div>
                      <span className="font-mono font-bold text-[#071A33]">{selectedPerson.linkedVehicles?.length || 0}</span>
                    </div>
                    <div className="p-2 bg-[#F4F7FB] rounded border border-[#0B2341]/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#071A33]/80 font-medium">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Bank Accounts:</span>
                      </div>
                      <span className="font-mono font-bold text-[#071A33]">{selectedPerson.linkedAccounts?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER: Tabbed Navigation (Timeline, Relationships, Cases, Evidence) (6 Cols) */}
            <div className="lg:col-span-6 glass-card rounded-lg overflow-hidden flex flex-col border border-[#0B2341]/12 bg-white">
              {/* Tabs */}
              <div className="flex border-b border-[#0B2341]/10 bg-[#F4F7FB] px-3">
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
                        ? 'border-[#F5B800] text-[#071A33] bg-white rounded-t'
                        : 'border-transparent text-[#071A33]/60 hover:text-[#071A33]'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-[#F5B800]' : 'text-[#071A33]/60'}`} />
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
                      <div className="relative pl-5 border-l-2 border-[#0B2341]/15 space-y-4">
                        {selectedPerson.events.map((evt) => (
                          <div key={evt.id} className="relative">
                            <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#F5B800] border-2 border-white shadow-xs flex items-center justify-center">
                            </div>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="font-bold text-[#071A33]">{evt.event_type}</span>
                              <span className="text-[10px] text-[#071A33]/60 font-mono">
                                {new Date(evt.event_time).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-[#071A33]/85 leading-relaxed bg-[#F4F7FB] p-2.5 rounded border border-[#0B2341]/10">
                              {evt.description}
                            </p>
                            <div className="mt-1 text-[10px] text-[#071A33]/70 flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-[#DC2626]" />
                              <span>{evt.location_text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[#071A33]/60 italic text-center py-6">
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
                            className="p-3 rounded-md bg-[#F4F7FB] border border-[#0B2341]/10"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#071A33]">
                                    {rel.targetEntity?.canonical_name || rel.targetEntity?.name || rel.target_id}
                                  </span>
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                    isInferred ? 'bg-amber-50 text-[#D97706] border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {isInferred ? 'AI CLUE' : 'OBSERVED'}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-[#D97706]">
                                    {rel.confidence}% Conf
                                  </span>
                                </div>
                                <div className="text-xs font-medium text-[#071A33]/80 mt-0.5">
                                  {rel.relationship_type}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-[10.5px] text-[#071A33]/80 bg-white p-2 rounded border border-[#0B2341]/10 shadow-xs">
                              <strong className="text-[#071A33]">Evidence:</strong> {rel.source_evidence}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-[#071A33]/60 italic text-center py-6">
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
                        className="p-3 bg-white hover:bg-[#F4F7FB] rounded-md border border-[#0B2341]/12 cursor-pointer transition-colors flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#071A33]">{c.crime_no}</span>
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/50">
                              Role: {c.role_type}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[#071A33] mt-0.5">{c.crime_major_head}</div>
                          <div className="text-[10px] text-[#071A33]/70 mt-0.5">{c.police_station} • {c.registered_date}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#071A33]/45" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. EVIDENCE */}
                {activeTab === 'evidence' && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-[#F4F7FB] border border-[#0B2341]/10 rounded-md">
                      <div className="font-bold text-[#071A33] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#F5B800]" />
                        <span>DOC-FORENSIC-881 — Telecom CDR Cross-Match Report</span>
                      </div>
                      <div className="text-[10.5px] text-[#071A33]/80 mt-1">
                        Correlated voice call timestamps with Charoti toll plaza FASTag sensor crossings.
                      </div>
                    </div>
                    <div className="p-3 bg-[#F4F7FB] border border-[#0B2341]/10 rounded-md">
                      <div className="font-bold text-[#071A33] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#F5B800]" />
                        <span>FIU-IND STR-8801 — Suspicious Outflow Tracing</span>
                      </div>
                      <div className="text-[10.5px] text-[#071A33]/80 mt-1">
                        Four tranches totaling ₹1.85 Cr transferred to unverified escrow account.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Connected Entities Preview (3 Cols) */}
            <div className="lg:col-span-3 glass-card p-4 rounded-lg flex flex-col justify-between border border-[#0B2341]/12 bg-white">
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[#071A33] mb-2 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-[#F5B800]" />
                  Connected Clues & Links Preview
                </h3>

                {/* Tactical Mini Visual Canvas */}
                <div className="w-full h-40 bg-[#071A33] rounded-md relative overflow-hidden border border-[#0B2341] flex items-center justify-center p-2 shadow-inner">
                  <div className="w-8 h-8 rounded-full bg-[#F5B800] text-[#071A33] font-mono font-bold text-xs flex items-center justify-center border border-white z-10 shadow-md">
                    {selectedPerson.canonical_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="absolute top-3 left-4 w-6 h-6 rounded-full bg-[#0E2A4D] text-white text-[8px] font-mono flex items-center justify-center border border-[#1C457A]">
                    P1
                  </div>
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#0E2A4D] text-white text-[8px] font-mono flex items-center justify-center border border-[#1C457A]">
                    ORG
                  </div>
                  <div className="absolute bottom-3 left-6 w-6 h-6 rounded-full bg-[#0E2A4D] text-white text-[8px] font-mono flex items-center justify-center border border-[#1C457A]">
                    VEH
                  </div>
                  <div className="absolute bottom-3 right-6 w-6 h-6 rounded-full bg-[#0E2A4D] text-white text-[8px] font-mono flex items-center justify-center border border-[#1C457A]">
                    ACC
                  </div>

                  <svg className="absolute inset-0 w-full h-full stroke-cyan-600/60 stroke-[1] pointer-events-none">
                    <line x1="50%" y1="50%" x2="25%" y2="20%" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" />
                    <line x1="50%" y1="50%" x2="30%" y2="78%" />
                    <line x1="50%" y1="50%" x2="75%" y2="80%" strokeDasharray="3 3" />
                  </svg>
                </div>

                <div className="mt-3 text-[10.5px] text-[#071A33]/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Direct Links:</span>
                    <strong className="text-[#071A33] font-mono">{selectedPerson.relationships?.length || 0} Connections</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network Position:</span>
                    <strong className="text-[#D97706] font-mono" title="Connects multiple groups and cases">Key Bridge Person</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/graph?focus=${selectedPerson.id}`)}
                className="w-full mt-4 py-2 bg-[#071A33] hover:bg-[#0B2341] text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-[#071A33] shadow-xs"
              >
                <span>Open in Knowledge Graph</span>
                <ArrowRight className="w-3 h-3 text-[#F5B800]" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
