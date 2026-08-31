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
      try {
        const res = await dbService.getMOSimilarities(selectedCaseId);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load MO similarities:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMOData();
  }, [selectedCaseId]);

  const handleSelectCase = (cId) => {
    setSelectedCaseId(cId);
    setSearchParams({ id: cId });
  };

  if (loading || !data || !data.selectedCase) {
    return (
      <div className="flex items-center justify-center h-96 text-xs font-semibold text-[#071A33]/70">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#0B2341]/20 border-t-[#F5B800] rounded-full animate-spin"></div>
          <span>Comparing crime methods against registered cases...</span>
        </div>
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
    { label: 'Target / Victim Profile', value: selectedFP.target },
    { label: 'Time of Operation', value: selectedFP.timing },
    { label: 'Entry & Approach Method', value: selectedFP.entry_method },
    { label: 'Tools & Weapons Used', value: selectedFP.tools },
    { label: 'Getaway & Transport Vehicle', value: selectedFP.transport },
    { label: 'Disguise & Masking', value: selectedFP.concealment },
    { label: 'Step-by-Step Action', value: selectedFP.action_sequence },
    { label: 'Victim Interaction & Force', value: selectedFP.victim_interaction },
    { label: 'Escape Route & Exit', value: selectedFP.exit_method },
    { label: 'Gang Roles & Behavior', value: selectedFP.group_behavior },
  ] : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. TOP CASE SELECTION & SUMMARY BAR */}
      <div className="glass-card p-4 rounded-lg space-y-3 border border-[#0B2341]/12 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/50">
                MO MATCHING
              </span>
              <span className="text-xs font-mono font-bold text-[#071A33]">
                {selectedCase.crime_category}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#071A33]">
              {selectedCase.crime_no} — {selectedCase.crime_major_head}
            </h1>
            <p className="text-xs text-[#071A33]/70 font-medium mt-0.5">
              {selectedCase.brief_facts}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#071A33]/70">
              Select Primary Case:
            </span>
            <select
              value={selectedCase.id}
              onChange={(e) => handleSelectCase(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#0B2341]/20 rounded text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#F5B800]"
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
        <div className="lg:col-span-6 glass-card rounded-lg overflow-hidden flex flex-col border border-[#0B2341]/12 bg-white">
          <div className="bg-[#F4F7FB] px-4 py-3 text-[#071A33] flex items-center justify-between border-b border-[#0B2341]/10">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-[#F5B800]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#071A33]">
                How the Crime Was Committed (10 Key Steps)
              </span>
            </div>
            {selectedFP && (
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#F5B800]/50" title="AI confidence in extracted crime method details">
                {selectedFP.confidence}% Conf
              </span>
            )}
          </div>

          <div className="p-4 space-y-2.5 flex-1 overflow-y-auto divide-y divide-[#0B2341]/10">
            {fingerprintAttributes.map((attr, idx) => (
              <div key={idx} className="pt-2 first:pt-0">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#071A33]/60 font-mono">
                  {attr.label}
                </div>
                <div className="text-xs font-bold text-[#071A33] mt-0.5 leading-snug">
                  {attr.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Ranked Similar Cases & Matching Matrix (6 Cols) */}
        <div className="lg:col-span-6 glass-card rounded-lg overflow-hidden flex flex-col border border-[#0B2341]/12 bg-white">
          <div className="bg-[#F4F7FB] px-4 py-3 text-[#071A33] flex items-center justify-between border-b border-[#0B2341]/10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F5B800]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#071A33]">
                Cases Committed in a Similar Way ({rankedMatches.length})
              </span>
            </div>
            <span className="text-[9.5px] font-mono font-bold text-[#D97706]">AI METHOD MATCH</span>
          </div>

          <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto">
            {rankedMatches.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#071A33]/60 font-mono">
                No similar-method crimes identified for this case.
              </div>
            ) : (
              rankedMatches.map((match, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-md bg-[#F4F7FB] border border-[#0B2341]/10 hover:border-[#0B2341]/25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#071A33]">
                          {match.case?.crime_no}
                        </span>
                        <span className="text-[10px] text-[#071A33]/60 font-mono">
                          {match.case?.police_station}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#071A33] mt-0.5">
                        {match.case?.crime_major_head}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-mono font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-xs" title="How similar the crime method is to other cases">
                        {match.similarity_score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Matching Components */}
                  <div className="mt-2 pt-2 border-t border-[#0B2341]/10">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#071A33]/70 block mb-1">
                      Matching Crime Tactics:
                    </span>
                    <div className="space-y-0.5">
                      {match.matching_components?.map((comp, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-1.5 text-xs text-[#071A33]">
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="text-[11px] font-medium">{comp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-[#0B2341]/10 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[#071A33]/60 font-mono">Registered: {match.case?.registered_date}</span>
                    <button
                      onClick={() => navigate(`/cases?id=${match.case?.id}`)}
                      className="text-[#071A33] hover:text-[#D97706] font-bold text-[10.5px] flex items-center gap-0.5"
                    >
                      <span>View Case File</span>
                      <ChevronRight className="w-3 h-3 text-[#F5B800]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: 2D EMBEDDING SCATTER CLUSTER PLOT */}
      <div className="glass-card p-4 rounded-lg border border-[#0B2341]/12 bg-white">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#0B2341]/10">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#F5B800]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#071A33]">
              How Similar Crimes Group Together
            </h3>
            <span className="text-[10px] text-[#071A33]/60 font-mono">
              (2D Modus Operandi Cluster Map)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10.5px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5B800] ring-1 ring-[#071A33]"></span>
              <span className="font-bold text-[#071A33]">Selected Case ({selectedCase.crime_no})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#071A33] border border-[#0B2341]"></span>
              <span className="text-[#071A33]/70 font-medium">Other Registered Cases</span>
            </div>
          </div>
        </div>

        <div className="w-full h-60 bg-[#071A33] rounded-md p-2 border border-[#0B2341] shadow-inner">
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
                      <div className="bg-[#FFFFFF] text-[#071A33] p-2 rounded shadow-md text-xs border border-[#0B2341]/20">
                        <div className="font-mono font-bold text-[#071A33]">{item.crime_no}</div>
                        <div className="text-[10.5px] text-[#071A33]/80">{item.category}</div>
                        <div className="text-[9.5px] text-[#071A33]/60 mt-0.5 font-mono">Cluster: ({item.x}, {item.y})</div>
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
                    fill={entry.isCurrent ? '#F5B800' : '#1C457A'}
                    stroke={entry.isCurrent ? '#FFFFFF' : '#60A5FA'}
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
