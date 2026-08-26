import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Fingerprint, 
  Sparkles, 
  Check, 
  MapPin, 
  Layers, 
  ArrowRight, 
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { dbService } from '../services/db';

export default function MOSimilarity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('id') || 'CASE-2026-0924');

  useEffect(() => {
    async function loadMOData() {
      setLoading(true);
      const res = await dbService.getMOSimilarities(selectedCaseId);
      setData(res);
      setLoading(false);
    }
    loadMOData();
  }, [selectedCaseId]);

  const handleSelectCase = (cId) => {
    setSelectedCaseId(cId);
    setSearchParams({ id: cId });
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-xs font-semibold text-[#0A192F]">
        Analyzing Modus Operandi Fingerprints...
      </div>
    );
  }

  const { allCases, selectedCase, selectedFP, rankedMatches } = data;

  // Embedding Space Scatter Plot Data
  const scatterPlotData = allCases.map((c, i) => {
    let cx = 50;
    let cy = 50;
    if (c.crime_category.includes('Property')) { cx = 25 + (i % 3) * 6; cy = 70 + (i % 2) * 8; }
    else if (c.crime_category.includes('Financial') || c.crime_category.includes('Cyber')) { cx = 75 + (i % 3) * 6; cy = 30 + (i % 2) * 8; }
    else if (c.crime_category.includes('Contraband') || c.crime_category.includes('Arms')) { cx = 35 + (i % 2) * 8; cy = 25 + (i % 3) * 7; }
    else { cx = 60 + (i % 3) * 5; cy = 75 + (i % 2) * 6; }

    const isCurrent = c.id === selectedCase.id;

    return {
      id: c.id,
      crime_no: c.crime_no,
      category: c.crime_category,
      x: cx,
      y: cy,
      isCurrent
    };
  });

  const fingerprintAttributes = selectedFP ? [
    { label: 'Target Profile', value: selectedFP.target },
    { label: 'Operational Timing', value: selectedFP.timing },
    { label: 'Entry / Approach Method', value: selectedFP.entry_method },
    { label: 'Tools & Hardware Signature', value: selectedFP.tools },
    { label: 'Transport / Escape Mode', value: selectedFP.transport },
    { label: 'Concealment & Masking', value: selectedFP.concealment },
    { label: 'Action Sequence', value: selectedFP.action_sequence },
    { label: 'Victim Interaction', value: selectedFP.victim_interaction },
    { label: 'Exit / Egress Technique', value: selectedFP.exit_method },
    { label: 'Group Hierarchy & Cell Behavior', value: selectedFP.group_behavior },
  ] : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TOP CASE SELECTION & SUMMARY BAR */}
      <div className="bg-white p-4 rounded-md border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0A192F] text-white">
                MO ANALYTICS
              </span>
              <span className="text-xs font-mono font-bold text-[#B45309]">
                {selectedCase.crime_category}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#0A192F]">
              {selectedCase.crime_no} — {selectedCase.crime_major_head}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCase.brief_facts}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Select Primary Case:
            </span>
            <select
              value={selectedCase.id}
              onChange={(e) => handleSelectCase(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs font-bold text-[#0A192F] focus:outline-none"
            >
              {allCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crime_no} ({c.police_station})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. CENTER SECTION: FINGERPRINT (LEFT) + RANKED SIMILAR CASES (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: MO Fingerprint (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#0A192F] px-3.5 py-2.5 text-white flex items-center justify-between border-b border-[#132B4C]">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Modus Operandi Fingerprint Matrix
              </span>
            </div>
            {selectedFP && (
              <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E]">
                {selectedFP.confidence}% Conf
              </span>
            )}
          </div>

          <div className="p-3.5 space-y-2 flex-1 overflow-y-auto divide-y divide-slate-100">
            {fingerprintAttributes.map((attr, idx) => (
              <div key={idx} className="pt-2 first:pt-0">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  {attr.label}
                </div>
                <div className="text-xs font-medium text-[#0A192F] mt-0.5 leading-snug">
                  {attr.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Ranked Similar Cases & Matching Matrix (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-md border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#0A192F] px-3.5 py-2.5 text-white flex items-center justify-between border-b border-[#132B4C]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ranked MO Similarity Matches ({rankedMatches.length})
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-slate-400">HEURISTIC CORRELATION</span>
          </div>

          <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
            {rankedMatches.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No high-similarity cases identified for this crime profile.
              </div>
            ) : (
              rankedMatches.map((match, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0A192F]">
                          {match.case?.crime_no}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {match.case?.police_station}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mt-0.5">
                        {match.case?.crime_major_head}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm font-mono font-bold text-[#92400E] bg-white px-2 py-0.5 rounded border border-amber-200 shadow-sm">
                        {match.similarity_score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Matching Components */}
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Matching MO Components:
                    </span>
                    <div className="space-y-0.5">
                      {match.matching_components?.map((comp, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-1.5 text-xs text-[#0A192F]">
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="text-[11px]">{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">Reg: {match.case?.registered_date}</span>
                    <button
                      onClick={() => navigate(`/cases?id=${match.case?.id}`)}
                      className="text-[#B45309] hover:underline font-semibold text-[10.5px] flex items-center gap-0.5"
                    >
                      <span>Inspect FIR Dossier</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: 2D EMBEDDING SCATTER CLUSTER PLOT */}
      <div className="bg-white p-4 rounded-md border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#0A192F]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A192F]">
              2D Modus Operandi Cluster & Embedding Scatter Space
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10.5px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017] ring-1 ring-[#0A192F]"></span>
              <span className="font-semibold text-[#0A192F]">Selected Case ({selectedCase.crime_no})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#0A192F]"></span>
              <span className="text-slate-500">Other FIRs in Registry</span>
            </div>
          </div>
        </div>

        <div className="w-full h-60 bg-[#F8FAFC] rounded p-2 border border-[#E2E8F0]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: 15 }}>
              <XAxis type="number" dataKey="x" name="Tactical Dimension X" domain={[0, 100]} hide />
              <YAxis type="number" dataKey="y" name="Target Dimension Y" domain={[0, 100]} hide />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#0A192F] text-white p-2 rounded shadow-md text-xs border border-[#132B4C]">
                        <div className="font-mono font-bold text-[#D4A017]">{item.crime_no}</div>
                        <div className="text-[10.5px] text-slate-300">{item.category}</div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5 font-mono">Cluster: ({item.x}, {item.y})</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Cases" data={scatterPlotData} onClick={(entry) => handleSelectCase(entry.id)}>
                {scatterPlotData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? '#D4A017' : '#0A192F'}
                    stroke={entry.isCurrent ? '#0A192F' : '#ffffff'}
                    strokeWidth={entry.isCurrent ? 2 : 1}
                    r={entry.isCurrent ? 8 : 5}
                    className="cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
