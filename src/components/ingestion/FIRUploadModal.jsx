import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Users, 
  Smartphone, 
  Car, 
  Fingerprint, 
  Compass, 
  ExternalLink,
  Loader2,
  FolderSearch
} from 'lucide-react';
import { dbService } from '../../services/db';

const SAMPLE_PRESETS = [
  {
    title: 'Bandra BKC Hawala Shell Network',
    crimeNo: 'CR/2026/0811-BND',
    station: 'Bandra Police Station',
    category: 'Organized Financial Crime',
    text: `FIRST INFORMATION REPORT (CCTNS Form II)
District: MUMBAI CITY POLICE | Police Station: Bandra Police Station
Crime No: CR/2026/0811-BND | FIR No: FIR-402/2026 | Date: 2026-07-14
Acts: IPC 420, 468, 471, 120B (Cheating, Forgery & Criminal Conspiracy)
Complainant: Suresh Narvekar, Assistant Commissioner of Sales Tax
Accused / Suspects: Farhan Merchant alias Babloo, Tariq Al-Mansoor, Zeeshan Qureshi
Linked Phone Numbers: +91-98201-99881, +91-98205-44321
Tagged Vehicles: MH-02-DN-8819 (Skoda Octavia White)
Brief Facts & Modus Operandi: Investigation into a syndicate operating 14 fake import-export billing firms in Bandra Kurla Complex (BKC). Funds routed via overseas mule accounts in UAE before remitting to real estate holdings in suburban Mumbai. Primary operator Farhan Merchant identified using multiple burner SIMs (+91-98201-99881) and coordinating through shell firm Apex Global Advisory Pvt Ltd.`
  },
  {
    title: 'Colaba Diamond Vault Heist',
    crimeNo: 'CR/2026/0924-CLB',
    station: 'Colaba Police Station',
    category: 'Property Crime',
    text: `FIRST INFORMATION REPORT (CCTNS Form II)
District: MUMBAI CITY POLICE | Police Station: Colaba Police Station
Crime No: CR/2026/0924-CLB | FIR No: FIR-118/2026 | Date: 2026-08-02
Acts: IPC 395, 397, 457 (Armed Dacoity & Vault Housebreaking by Night)
Complainant: Dhanraj Mehta, Chief Security Officer, Royal Gems Vaults
Accused / Suspects: Rajesh Sawant alias Raju Cutter, Imtiaz Shaikh, Vicky Sharma
Linked Phone Numbers: +91-98202-33441, +91-98207-66552
Tagged Vehicles: MH-01-BK-4091 (Pulsar 220 Black), MH-01-EF-1102 (Yamaha FZ)
Brief Facts & Modus Operandi: Four masked operatives breached private vault facility in Colaba after subduing night guard with stun devices. Vault door opened via specialized pneumatic cutting tools. Suspects fled on two black motorcycles (MH-01-BK-4091) toward South Bombay sea-link exit. Striation marks match pneumatic hydraulic shears used by Rajesh Sawant gang.`
  },
  {
    title: 'Dharavi 90-Ft Rd NDPS Mephedrone Interception',
    crimeNo: 'CR/2026/0740-DHR',
    station: 'Dharavi Police Station',
    category: 'Contraband Trafficking',
    text: `FIRST INFORMATION REPORT (CCTNS Form II)
District: MUMBAI CITY POLICE | Police Station: Dharavi Police Station
Crime No: CR/2026/0740-DHR | FIR No: FIR-305/2026 | Date: 2026-06-20
Acts: NDPS Act Sec 8(c), 21(c), 29 (Commercial Quantity Synthetic Drugs)
Complainant: Inspector Vikram Patil, Anti-Narcotics Cell Mumbai
Accused / Suspects: Bilal Khan alias Chhota Bilal, Altaf Memon
Linked Phone Numbers: +91-98203-77889
Tagged Vehicles: MH-04-AZ-9901 (Eicher Commercial Tempo)
Brief Facts & Modus Operandi: Interception of 12.5 kg suspected commercial-grade Mephedrone concealed within hollowed industrial textile rolls in transit from Palghar border to transit godown near 90 Feet Road, Dharavi. Carrier vehicle intercepted with burner phone linked to interstate logistics cell.`
  }
];

export default function FIRUploadModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'text' | 'file'
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState(null);

  // Pipeline Status State
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0 = idle, 1 = text, 2 = llm, 3 = entity resolution, 4 = complete
  const [extractedResult, setExtractedResult] = useState(null);

  if (!isOpen) return null;

  const handleProcessExtraction = async () => {
    setIsProcessing(true);
    setPipelineStep(1);

    let formData = new FormData();
    if (activeTab === 'preset') {
      formData.append('raw_text', SAMPLE_PRESETS[selectedPresetIndex].text);
    } else if (activeTab === 'text') {
      formData.append('raw_text', pastedText);
    } else {
      const fileInput = document.getElementById('fir-file-input');
      if (fileInput && fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
      } else {
        formData.append('raw_text', SAMPLE_PRESETS[0].text);
      }
    }

    try {
      setPipelineStep(2);
      const baseUrl = import.meta.env.VITE_PRIORITY_MODEL_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/fir/ingest`, {
        method: 'POST',
        body: formData
      });
      
      setPipelineStep(3);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server responded with ${res.status}`);
      }
      
      const data = await res.json();
      setPipelineStep(4);
      
      const extracted = data.extracted;
      
      setExtractedResult({
        case: extracted.case,
        persons: extracted.persons.map(p => ({
          canonical_name: p.name,
          aliases: p.aliases || [],
          role_type: p.role,
          isExisting: false
        })),
        phones: extracted.phones || [],
        vehicles: extracted.vehicles || [],
        mo_fingerprint: extracted.mo_fingerprint
      });
    } catch (error) {
      console.error("Ingestion failed:", error);
      alert("Pipeline Failed: " + error.message);
      setPipelineStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPipelineStep(0);
    setExtractedResult(null);
    setPastedText('');
    setFileName(null);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071A33]/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-lg shadow-2xl border border-[#0B2341]/20 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#071A33] px-5 py-3.5 flex items-center justify-between text-white border-b border-[#0B2341] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#0E2A4D] border border-[#F5B800] flex items-center justify-center text-[#F5B800]">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-white">
                Import & Read Police FIR
              </h2>
              <p className="text-[11px] text-slate-300 font-sans">
                Upload an FIR and the system reads it, pulls out names, phones, vehicles, and links them to your existing cases.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#0E2A4D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!extractedResult ? (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F4F7FB] rounded border border-[#0B2341]/10 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('preset')}
                  className={`flex-1 py-1.5 px-3 rounded transition-colors ${
                    activeTab === 'preset' ? 'bg-[#071A33] text-white shadow-xs' : 'text-[#071A33]/70 hover:text-[#071A33]'
                  }`}
                >
                  Select Sample FIR (1-Click)
                </button>
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-1.5 px-3 rounded transition-colors ${
                    activeTab === 'file' ? 'bg-[#071A33] text-white shadow-xs' : 'text-[#071A33]/70 hover:text-[#071A33]'
                  }`}
                >
                  Upload FIR PDF File
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-1.5 px-3 rounded transition-colors ${
                    activeTab === 'text' ? 'bg-[#071A33] text-white shadow-xs' : 'text-[#071A33]/70 hover:text-[#071A33]'
                  }`}
                >
                  Paste FIR Text
                </button>
              </div>

              {/* Tab 1: Presets */}
              {activeTab === 'preset' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#071A33]/60 font-bold block">
                    Choose Registered Case Document:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPresetIndex(idx)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          selectedPresetIndex === idx
                            ? 'bg-[#FFFBEB] border-[#F5B800] ring-1 ring-[#F5B800]'
                            : 'bg-white border-[#0B2341]/15 hover:border-[#0B2341]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-[#071A33] flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F4F7FB] text-[#071A33] border border-[#0B2341]/10 font-bold">
                              {preset.crimeNo}
                            </span>
                            <span>{preset.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#071A33]/60 font-medium">{preset.station}</span>
                        </div>
                        <p className="text-[11px] text-[#071A33]/75 line-clamp-2 mt-1.5 font-sans">
                          {preset.text.split('Brief Facts & Modus Operandi:')[1]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: File Upload */}
              {activeTab === 'file' && (
                <div className="border-2 border-dashed border-[#0B2341]/25 rounded-lg p-8 text-center hover:border-[#F5B800] transition-colors cursor-pointer bg-[#F4F7FB]">
                  <input
                    type="file"
                    accept=".pdf"
                    id="fir-file-input"
                    onChange={(e) => setFileName(e.target.files[0]?.name || null)}
                    className="hidden"
                  />
                  <label htmlFor="fir-file-input" className="cursor-pointer block space-y-2">
                    <Upload className="w-8 h-8 text-[#071A33]/40 mx-auto" />
                    <div className="text-xs font-bold text-[#071A33]">
                      {fileName ? fileName : 'Choose FIR PDF Document or Drag & Drop'}
                    </div>
                    <p className="text-[11px] text-[#071A33]/60">
                      Standard CCTNS FIR scans (English & Marathi bilingual supported)
                    </p>
                  </label>
                </div>
              )}

              {/* Tab 3: Paste Text */}
              {activeTab === 'text' && (
                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#071A33]/60 font-bold block mb-1">
                    Paste First Information Report Text:
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste complaint text, acts, sections, complainant and accused details..."
                    className="w-full p-3 text-xs font-mono bg-white border border-[#0B2341]/20 rounded focus:outline-none focus:border-[#F5B800] text-[#071A33]"
                  />
                </div>
              )}

              {/* Live Pipeline Execution Steps */}
              {isProcessing && (
                <div className="p-3.5 bg-[#071A33] text-white rounded border border-[#0B2341] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#F5B800] font-bold text-[11px] pb-1 border-b border-[#133560]">
                    <span>AI PROCESSING IN PROGRESS</span>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 1 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[1] Reading document text...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[2] Extracting suspect names, roles, and crime details with AI...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[3] Matching names, phones, and vehicles against police database...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 4 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[4] Saving linked records to case registry...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Structured Extraction Results Preview */
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">FIR Successfully Processed & Linked</span>
                </div>
                <span className="font-mono text-[10.5px]">Case ID: {extractedResult.case.id}</span>
              </div>

              {/* Case Metadata */}
              <div className="p-3 bg-[#F4F7FB] rounded border border-[#0B2341]/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[#071A33] flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#071A33] text-white">
                      {extractedResult.case.crime_no}
                    </span>
                    <span>{extractedResult.case.police_station}</span>
                  </div>
                  <span className="font-mono font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                    {extractedResult.case.crime_category}
                  </span>
                </div>
                <div className="text-[#071A33] text-[11px]">
                  <strong>Acts & Sections:</strong> {extractedResult.case.crime_major_head}
                </div>
                <p className="text-[#071A33]/80 text-[11px] bg-white p-2 rounded border border-[#0B2341]/10 shadow-xs">
                  {extractedResult.case.brief_facts}
                </p>
              </div>

              {/* Resolved Entities & Linked Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {/* Persons Card */}
                <div className="p-3 bg-white rounded border border-[#0B2341]/12 space-y-2 shadow-xs">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-[#071A33] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#F5B800]" />
                    Persons of Interest ({extractedResult.persons.length})
                  </span>
                  <div className="space-y-1.5">
                    {extractedResult.persons.map((p, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#F4F7FB] border border-[#0B2341]/10 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-bold text-[#071A33]">{p.canonical_name}</div>
                          <div className="text-[#071A33]/60 text-[10px]">Role: <span className="font-bold uppercase text-[#071A33]">{p.role_type}</span></div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                          p.isExisting ? 'bg-amber-50 text-[#D97706] border border-amber-200' : 'bg-slate-100 text-[#071A33] border border-slate-300'
                        }`}>
                          {p.isExisting ? 'LINKED TO EXISTING SUSPECT' : 'NEW ENTITY CREATED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets Card */}
                <div className="p-3 bg-white rounded border border-[#0B2341]/12 space-y-2 shadow-xs">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-[#071A33] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#F5B800]" />
                    Phones & Vehicles ({extractedResult.phones.length + extractedResult.vehicles.length})
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    {extractedResult.phones.map((ph, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-[#F4F7FB] border border-[#0B2341]/10 flex items-center justify-between">
                        <span className="font-mono font-bold text-[#071A33]">{ph.number}</span>
                        <span className="text-[10px] text-[#071A33]/60">Owner: {ph.owner_name}</span>
                      </div>
                    ))}
                    {extractedResult.vehicles.map((v, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-[#F4F7FB] border border-[#0B2341]/10 flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-800">{v.registration}</span>
                        <span className="text-[10px] text-[#071A33]/60">{v.vehicle_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MO Fingerprint Attribute Summary */}
              <div className="p-3 bg-white rounded border border-[#0B2341]/12 space-y-1.5 text-xs shadow-xs">
                <span className="font-bold text-[10.5px] uppercase tracking-wider text-[#071A33] flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-[#F5B800]" />
                  10-Attribute Modus Operandi Fingerprint
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px] bg-[#F4F7FB] p-2 rounded border border-[#0B2341]/10">
                  <div><strong className="text-[#071A33]">Target:</strong> {extractedResult.mo_fingerprint.target}</div>
                  <div><strong className="text-[#071A33]">Tools:</strong> {extractedResult.mo_fingerprint.tools}</div>
                  <div><strong className="text-[#071A33]">Entry Method:</strong> {extractedResult.mo_fingerprint.entry_method}</div>
                  <div><strong className="text-[#071A33]">Concealment:</strong> {extractedResult.mo_fingerprint.concealment}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F4F7FB] border-t border-[#0B2341]/10 flex items-center justify-between flex-shrink-0">
          {!extractedResult ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-[#F4F7FB] text-[#071A33] font-semibold text-xs rounded border border-[#0B2341]/20 transition-colors shadow-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessExtraction}
                disabled={isProcessing}
                className="px-5 py-2 bg-[#071A33] hover:bg-[#0B2341] text-white font-bold text-xs rounded transition-colors flex items-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Extraction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#F5B800]" />
                    <span>Extract & Ingest FIR</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F4F7FB] text-[#071A33] font-semibold text-xs rounded border border-[#0B2341]/20 transition-colors shadow-xs"
              >
                Ingest Another FIR
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/cases?id=CASE-2026-0811`);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#F4F7FB] text-[#071A33] font-bold text-xs rounded border border-[#0B2341]/20 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FolderSearch className="w-3.5 h-3.5 text-[#071A33]" />
                  <span>Inspect Case Dossier</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/graph?case_id=CASE-2026-0811`);
                  }}
                  className="px-4 py-1.5 bg-[#071A33] hover:bg-[#0B2341] text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5 text-[#F5B800]" />
                  <span>Inspect on Geospatial Map</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
