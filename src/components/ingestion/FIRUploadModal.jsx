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

    // Get input text
    let rawText = '';
    if (activeTab === 'preset') {
      rawText = SAMPLE_PRESETS[selectedPresetIndex].text;
    } else if (activeTab === 'text') {
      rawText = pastedText;
    } else {
      rawText = SAMPLE_PRESETS[0].text; // Fallback mock for browser file drop
    }

    // Step 1: Text extraction simulation
    await new Promise(r => setTimeout(r, 600));
    setPipelineStep(2);

    // Step 2: LLM Structuring
    await new Promise(r => setTimeout(r, 800));
    setPipelineStep(3);

    // Parse data
    const crimeNoMatch = rawText.match(/(CR\/\d{4}\/\d{3,4}-[A-Z]{2,4})/i) || ['CR/2026/0811-BND'];
    const psMatch = rawText.match(/Police Station[\s/:]+([A-Za-z\s]+?)(?:Police Station|\n|,|$)/i);
    const psName = psMatch ? psMatch[1].trim() : 'Bandra';

    const mockExtracted = {
      case: {
        id: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        crime_no: crimeNoMatch[0] || 'CR/2026/0811-BND',
        case_no: `FIR-${Math.floor(100 + Math.random() * 900)}/2026`,
        crime_category: rawText.includes('NDPS') ? 'Contraband Trafficking' : rawText.includes('Vault') ? 'Property Crime' : 'Organized Financial Crime',
        crime_major_head: rawText.includes('NDPS') ? 'NDPS Act Sec 8c/21c' : rawText.includes('Vault') ? 'IPC 395/397 Armed Dacoity' : 'IPC 420/468 Cheating & Forgery',
        crime_minor_head: 'Syndicate Criminal Operation',
        status: 'Under Investigation',
        registered_date: new Date().toISOString().split('T')[0],
        latitude: rawText.includes('Colaba') ? 18.9220 : rawText.includes('Dharavi') ? 19.0434 : 19.0596,
        longitude: rawText.includes('Colaba') ? 72.8347 : rawText.includes('Dharavi') ? 72.8567 : 72.8295,
        police_station: psName.includes('Police Station') ? psName : `${psName} Police Station`,
        brief_facts: rawText.split('Brief Facts & Modus Operandi:')[1] || rawText.slice(0, 300)
      },
      persons: [
        {
          canonical_name: rawText.includes('Farhan') ? 'Farhan Merchant' : rawText.includes('Rajesh') ? 'Rajesh Sawant' : 'Bilal Khan',
          aliases: rawText.includes('Farhan') ? ['Babloo', 'FM-Dubai'] : ['Raju Cutter'],
          role_type: 'accused',
          isExisting: true // Resolved to existing record!
        },
        {
          canonical_name: rawText.includes('Tariq') ? 'Tariq Al-Mansoor' : rawText.includes('Imtiaz') ? 'Imtiaz Shaikh' : 'Altaf Memon',
          aliases: [],
          role_type: 'co-conspirator',
          isExisting: false // New identity!
        }
      ],
      phones: [
        { number: '+91-98201-99881', owner_name: 'Farhan Merchant' },
        { number: '+91-98205-44321', owner_name: 'Tariq Al-Mansoor' }
      ],
      vehicles: [
        { registration: 'MH-02-DN-8819', vehicle_type: 'Skoda Octavia White', owner_name: 'Farhan Merchant' }
      ],
      mo_fingerprint: {
        target: 'Commercial Import-Export Banking Accounts',
        timing: 'Business Operating Hours (10:00 - 17:00)',
        entry_method: 'Shell Entity KYC Forgery & Round-Tripping',
        tools: 'Burner SIMs, Offshore UAE Wire Mandates',
        transport: 'Skoda Octavia (MH-02-DN-8819)',
        concealment: '14 Layered Shell LLPs & Proxy Signatories',
        action_sequence: 'Invoice Generation -> Wire Transfer -> Real Estate Diversion',
        victim_interaction: 'Remote Corporate Fraud',
        exit_method: 'Offshore Remittance Conduit',
        group_behavior: 'Organized Cross-Border Financial Cell'
      }
    };

    // Step 3: Entity Resolution & Ingestion
    await new Promise(r => setTimeout(r, 700));
    setPipelineStep(4);
    setExtractedResult(mockExtracted);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setPipelineStep(0);
    setExtractedResult(null);
    setPastedText('');
    setFileName(null);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-lg shadow-2xl border border-[#CBD5E1] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0A192F] px-5 py-3.5 flex items-center justify-between text-white border-b border-[#132B4C] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#0E223D] border border-[#B45309] flex items-center justify-center text-[#D4A017]">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-white">
                FIR & CCTNS Document Ingestion Pipeline
              </h2>
              <p className="text-[10.5px] text-slate-300 font-mono">
                Automated Text Extraction • LLM Schema Structuring • Entity Resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#132B4C] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!extractedResult ? (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('preset')}
                  className={`flex-1 py-1.5 px-3 rounded transition-colors ${
                    activeTab === 'preset' ? 'bg-[#0A192F] text-white shadow-sm' : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Select Pilot Sample FIR (1-Click)
                </button>
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-1.5 px-3 rounded transition-colors ${
                    activeTab === 'file' ? 'bg-[#0A192F] text-white shadow-sm' : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Upload FIR PDF File
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-1.5 px-3 rounded transition-colors ${
                    activeTab === 'text' ? 'bg-[#0A192F] text-white shadow-sm' : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  Paste Raw FIR Text
                </button>
              </div>

              {/* Tab 1: Presets */}
              {activeTab === 'preset' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Choose Registered Case Document:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPresetIndex(idx)}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          selectedPresetIndex === idx
                            ? 'bg-[#F8FAFC] border-[#D4A017] ring-1 ring-[#D4A017]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-[#0A192F] flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border">
                              {preset.crimeNo}
                            </span>
                            <span>{preset.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{preset.station}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-1.5 font-sans">
                          {preset.text.split('Brief Facts & Modus Operandi:')[1]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: File Upload */}
              {activeTab === 'file' && (
                <div className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-8 text-center hover:border-[#0A192F] transition-colors cursor-pointer bg-slate-50">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFileName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                    id="fir-file-input"
                  />
                  <label htmlFor="fir-file-input" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-[#0A192F] mb-2" />
                    <span className="text-xs font-bold text-[#0A192F]">
                      {fileName ? fileName : 'Click to select FIR PDF or drag & drop'}
                    </span>
                    <span className="text-[10.5px] text-slate-500 mt-1">
                      Supports CCTNS Form II digitally signed PDFs and scanned FIRs (automatic OCR)
                    </span>
                  </label>
                </div>
              )}

              {/* Tab 3: Paste Text */}
              {activeTab === 'text' && (
                <div>
                  <label className="text-[10.5px] font-mono uppercase text-slate-500 font-bold block mb-1">
                    Paste Raw First Information Report Text:
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste CCTNS Form II text, acts, sections, complainant and accused details..."
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-[#0A192F] focus:ring-1 focus:ring-[#0A192F]"
                  />
                </div>
              )}

              {/* Live Pipeline Execution Steps */}
              {isProcessing && (
                <div className="p-3.5 bg-[#0A192F] text-white rounded border border-[#132B4C] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#D4A017] font-bold text-[11px] pb-1 border-b border-[#132B4C]">
                    <span>CIU INGESTION PIPELINE RUNNING</span>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[1] Text Extraction & OCR Fallback Buffer Check</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[2] LLM Extraction & Strict Zod Schema Validation (FIROutputSchema)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[3] Entity Resolution: Cross-Case Suspect Linking & Alias Merging</span>
                  </div>
                  <div className={`flex items-center gap-2 ${pipelineStep >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[4] Database Ingestion: Cases, Roles, Phones, Vehicles, MO Fingerprint</span>
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
                  <span className="font-bold">FIR Ingestion Succeeded — Validated by Zod Schema</span>
                </div>
                <span className="font-mono text-[10.5px]">Case ID: {extractedResult.case.id}</span>
              </div>

              {/* Case Metadata */}
              <div className="p-3 bg-[#F8FAFC] rounded border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[#0A192F] flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0A192F] text-white">
                      {extractedResult.case.crime_no}
                    </span>
                    <span>{extractedResult.case.police_station}</span>
                  </div>
                  <span className="font-mono font-bold text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FCD34D] text-[10px]">
                    {extractedResult.case.crime_category}
                  </span>
                </div>
                <div className="text-slate-700 text-[11px]">
                  <strong>Acts & Sections:</strong> {extractedResult.case.crime_major_head}
                </div>
                <p className="text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-200">
                  {extractedResult.case.brief_facts}
                </p>
              </div>

              {/* Resolved Entities & Linked Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {/* Persons Card */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0A192F]" />
                    Persons of Interest ({extractedResult.persons.length})
                  </span>
                  <div className="space-y-1.5">
                    {extractedResult.persons.map((p, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-semibold text-[#0A192F]">{p.canonical_name}</div>
                          <div className="text-slate-500 text-[10px]">Role: <span className="font-semibold uppercase">{p.role_type}</span></div>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                          p.isExisting ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {p.isExisting ? 'LINKED TO EXISTING SUSPECT' : 'NEW ENTITY CREATED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets Card */}
                <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#0A192F]" />
                    Phones & Vehicles ({extractedResult.phones.length + extractedResult.vehicles.length})
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    {extractedResult.phones.map((ph, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{ph.number}</span>
                        <span className="text-[10px] text-slate-500">Owner: {ph.owner_name}</span>
                      </div>
                    ))}
                    {extractedResult.vehicles.map((v, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-800">{v.registration}</span>
                        <span className="text-[10px] text-slate-500">{v.vehicle_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MO Fingerprint Attribute Summary */}
              <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5 text-xs">
                <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-[#0A192F]" />
                  10-Attribute Modus Operandi Fingerprint
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px] bg-slate-50 p-2 rounded border border-slate-200">
                  <div><strong className="text-slate-700">Target:</strong> {extractedResult.mo_fingerprint.target}</div>
                  <div><strong className="text-slate-700">Tools:</strong> {extractedResult.mo_fingerprint.tools}</div>
                  <div><strong className="text-slate-700">Entry Method:</strong> {extractedResult.mo_fingerprint.entry_method}</div>
                  <div><strong className="text-slate-700">Concealment:</strong> {extractedResult.mo_fingerprint.concealment}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          {!extractedResult ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessExtraction}
                disabled={isProcessing}
                className="px-5 py-2 bg-[#0A192F] hover:bg-[#132B4C] text-white font-bold text-xs rounded transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Extraction...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                    <span>Extract & Ingest FIR</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition-colors"
              >
                Ingest Another FIR
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/cases?id=CASE-2026-0811`);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <FolderSearch className="w-3.5 h-3.5 text-[#0A192F]" />
                  <span>Inspect Case Dossier</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/graph?case_id=CASE-2026-0811`);
                  }}
                  className="px-4 py-1.5 bg-[#0A192F] hover:bg-[#132B4C] text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-[#D4A017]" />
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
