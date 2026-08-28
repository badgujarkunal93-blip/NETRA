import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import { 
  FolderSearch, 
  Plus, 
  UserPlus, 
  FileText, 
  Box, 
  GitBranch, 
  History, 
  Save, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  Search, 
  Download, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  TrendingUp,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { dbService } from '../services/db';
import { analyzeAllCanvasPersons } from '../services/suspectPriorityService';
import PersonCardNode from '../components/canvas/PersonCardNode';
import NoteCardNode from '../components/canvas/NoteCardNode';
import EntityCardNode from '../components/canvas/EntityCardNode';
import EdgeJustificationModal from '../components/canvas/EdgeJustificationModal';
import CanvasSnapshotsModal from '../components/canvas/CanvasSnapshotsModal';
import CaseNotesDrawer from '../components/canvas/CaseNotesDrawer';

// 1. Static custom node types for ReactFlow
const NODE_TYPES = {
  personCard: PersonCardNode,
  noteCard: NoteCardNode,
  entityCard: EntityCardNode
};

export default function CaseCanvas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCaseId = searchParams.get('case_id') || '';

  // Case Selection & Search State
  const [allCases, setAllCases] = useState([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [activeCaseData, setActiveCaseData] = useState(null);

  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [caseNotes, setCaseNotes] = useState('');
  const [snapshots, setSnapshots] = useState([]);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryAction = useRef(false);

  // Modals & Drawers
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [isSnapshotsModalOpen, setIsSnapshotsModalOpen] = useState(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);

  // Live Suspect Priority Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wakingUpNotice, setWakingUpNotice] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [analysisError, setAnalysisError] = useState(null);

  // Save Status
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'dirty'
  const saveTimeoutRef = useRef(null);

  // 2. Load Cases on Mount
  useEffect(() => {
    async function loadCases() {
      const cases = await dbService.getCases();
      setAllCases(cases);
      if (cases && cases.length > 0) {
        const urlCaseId = searchParams.get('case_id');
        const match = cases.find(c => c.id === urlCaseId || c.crime_no === urlCaseId);
        if (match) {
          if (selectedCaseId !== match.id) {
            setSearchParams({ case_id: match.id }, { replace: true });
          }
        } else if (!selectedCaseId || !cases.find(c => c.id === selectedCaseId)) {
          setSearchParams({ case_id: cases[0].id }, { replace: true });
        }
      }
    }
    loadCases();
  }, [selectedCaseId, setSearchParams]);

  // 3. Load Canvas when Case changes
  useEffect(() => {
    async function loadCanvas() {
      if (!selectedCaseId) {
        setNodes([]);
        setEdges([]);
        setActiveCaseData(null);
        return;
      }

      const caseDetails = await dbService.getCaseById(selectedCaseId);
      setActiveCaseData(caseDetails);

      const canvasData = await dbService.getCaseCanvas(selectedCaseId);
      const snaps = await dbService.getCanvasSnapshots(selectedCaseId);
      setSnapshots(snaps);

      // Inject change and delete handlers into nodes
      const preparedNodes = (canvasData.nodes || []).map(n => ({
        ...n,
        data: {
          ...n.data,
          onChange: handleNodeDataChange,
          onDelete: handleNodeDelete
        }
      }));

      // Prepare styled edges with label pills
      const preparedEdges = (canvasData.edges || []).map(e => ({
        ...e,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#D4A017', width: 14, height: 14 },
        style: { stroke: '#D4A017', strokeWidth: 2 },
        label: e.label || 'connected to',
        labelStyle: { fill: '#0A192F', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#D4A017', rx: 4, ry: 4, fillOpacity: 0.95 },
        labelBgPadding: [6, 2]
      }));

      setNodes(preparedNodes);
      setEdges(preparedEdges);
      setCaseNotes(canvasData.caseNotes || '');

      // Initialize History Stack
      setHistory([{ nodes: preparedNodes, edges: preparedEdges, caseNotes: canvasData.caseNotes || '' }]);
      setHistoryIndex(0);
      setSaveStatus('saved');
    }

    loadCanvas();
  }, [selectedCaseId]);

  // 4. Handle Node Data Modifications
  const handleNodeDataChange = useCallback((nodeId, newData) => {
    setNodes(nds => nds.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            ...newData
          }
        };
      }
      return n;
    }));
    triggerAutoSave();
  }, [setNodes]);

  // 5. Handle Node Delete
  const handleNodeDelete = useCallback((nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    triggerAutoSave();
  }, [setNodes, setEdges]);

  // 6. Push to History Stack for Undo/Redo
  const pushHistory = useCallback((currentNodes, currentEdges, currentNotes) => {
    if (isHistoryAction.current) return;
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      return [...newHist, { nodes: currentNodes, edges: currentEdges, caseNotes: currentNotes }].slice(-20);
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // 7. Debounced Autosave to Supabase / LocalStorage
  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (selectedCaseId) {
        await dbService.saveCaseCanvas(selectedCaseId, { nodes, edges, caseNotes });
        setSaveStatus('saved');
      }
    }, 1000);
  }, [selectedCaseId, nodes, edges, caseNotes]);

  // Trigger autosave when nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 && selectedCaseId) {
      triggerAutoSave();
    }
  }, [nodes.length, edges.length]);

  // 8. Add Content Toolbar Actions
  const handleAddPerson = () => {
    const newNode = {
      id: `node-person-${Date.now()}`,
      type: 'personCard',
      position: { x: 300 + Math.random() * 80, y: 250 + Math.random() * 80 },
      data: {
        label: 'New Suspect / Associate',
        role: 'Accused',
        description: '',
        status: 'hypothesis',
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    };
    setNodes(nds => [...nds, newNode]);
    pushHistory([...nodes, newNode], edges, caseNotes);
  };

  const handleAddNote = () => {
    const newNode = {
      id: `node-note-${Date.now()}`,
      type: 'noteCard',
      position: { x: 350 + Math.random() * 80, y: 300 + Math.random() * 80 },
      data: {
        label: 'Investigative Lead',
        description: '',
        status: 'hypothesis',
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    };
    setNodes(nds => [...nds, newNode]);
    pushHistory([...nodes, newNode], edges, caseNotes);
  };

  const handleAddEntity = () => {
    const newNode = {
      id: `node-entity-${Date.now()}`,
      type: 'entityCard',
      position: { x: 400 + Math.random() * 80, y: 350 + Math.random() * 80 },
      data: {
        label: 'Asset ID / Plate',
        nodeType: 'Phone',
        description: '',
        status: 'hypothesis',
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    };
    setNodes(nds => [...nds, newNode]);
    pushHistory([...nodes, newNode], edges, caseNotes);
  };

  // 9. Pull from Knowledge Graph (Bridge between facts & hypothesis)
  const handlePullFromKnowledgeGraph = async () => {
    if (!selectedCaseId) return;
    const { nodes: kgNodes, edges: kgEdges } = await dbService.pullKnowledgeGraphToCanvas(selectedCaseId);

    const preparedNodes = kgNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    }));

    const preparedEdges = kgEdges.map(e => ({
      ...e,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#D4A017', width: 14, height: 14 },
      style: { stroke: '#D4A017', strokeWidth: 2 },
      label: e.label || 'connected to',
      labelStyle: { fill: '#0A192F', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#D4A017', rx: 4, ry: 4, fillOpacity: 0.95 },
      labelBgPadding: [6, 2]
    }));

    setNodes(preparedNodes);
    setEdges(preparedEdges);
    pushHistory(preparedNodes, preparedEdges, caseNotes);
    triggerAutoSave();
  };

  // 10. Connection Drawing Handlers
  const onConnect = useCallback((params) => {
    setPendingConnection(params);
    setIsEdgeModalOpen(true);
  }, []);

  const handleConfirmEdge = ({ label, justification }) => {
    if (!pendingConnection) return;
    const newEdge = {
      ...pendingConnection,
      id: `edge-${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#D4A017', width: 14, height: 14 },
      style: { stroke: '#D4A017', strokeWidth: 2 },
      label,
      labelStyle: { fill: '#0A192F', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#D4A017', rx: 4, ry: 4, fillOpacity: 0.95 },
      labelBgPadding: [6, 2],
      data: { justification }
    };
    setEdges(eds => addEdge(newEdge, eds));
    pushHistory(nodes, [...edges, newEdge], caseNotes);
    setPendingConnection(null);
    triggerAutoSave();
  };

  // 11. Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setCaseNotes(prev.caseNotes);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => { isHistoryAction.current = false; }, 100);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setCaseNotes(next.caseNotes);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => { isHistoryAction.current = false; }, 100);
    }
  };

  // 12. Snapshot Handlers
  const handleSaveSnapshot = async (label) => {
    if (!selectedCaseId) return;
    const snap = await dbService.saveCanvasSnapshot(selectedCaseId, {
      label,
      nodes,
      edges,
      caseNotes
    });
    setSnapshots(prev => [snap, ...prev]);
  };

  const handleRestoreSnapshot = (snap) => {
    const restoredNodes = (snap.data.nodes || []).map(n => ({
      ...n,
      data: {
        ...n.data,
        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    }));
    setNodes(restoredNodes);
    setEdges(snap.data.edges || []);
    setCaseNotes(snap.data.caseNotes || '');
    pushHistory(restoredNodes, snap.data.edges || [], snap.data.caseNotes || '');
    triggerAutoSave();
  };

  // 13. Clear Canvas
  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    pushHistory([], [], caseNotes);
    setIsClearModalOpen(false);
    triggerAutoSave();
  };

  // Filtered case search list
  const filteredCases = allCases.filter(c => 
    c.crime_no.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    c.police_station.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    c.crime_category.toLowerCase().includes(caseSearchQuery.toLowerCase())
  );

  // Hypothesis & Person Metrics Calculation
  const personNodesCount = useMemo(() => {
    return nodes.filter(n => 
      n.type === 'personCard' || 
      (n.type === 'entityCard' && n.data?.nodeType === 'Person') || 
      n.data?.isPerson
    ).length;
  }, [nodes]);

  const confirmedCount = nodes.filter(n => n.data?.status === 'confirmed').length;
  const hypothesisCount = nodes.filter(n => n.data?.status === 'hypothesis').length;
  const justifiedEdgesCount = edges.filter(e => e.data?.justification && e.data.justification.length > 5).length;

  // 13. Live Suspect Priority Scoring Analysis
  const handleRunPriorityAnalysis = async () => {
    if (personNodesCount === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setWakingUpNotice(false);

    const coldStartTimer = setTimeout(() => {
      setWakingUpNotice(true);
    }, 7000);

    try {
      const results = await analyzeAllCanvasPersons(nodes, edges, selectedCaseId);
      clearTimeout(coldStartTimer);
      setWakingUpNotice(false);
      setAnalysisResults(results);

      // Update nodes in React Flow with returned priority scores and feature payloads
      setNodes(prev => prev.map(n => {
        const match = results.find(r => r.nodeId === n.id);
        if (match) {
          return {
            ...n,
            data: {
              ...n.data,
              priority_score: match.priority_score,
              priorityError: match.success ? null : (match.error || 'Model API Unavailable'),
              analyzedFeatures: match.features
            }
          };
        }
        return n;
      }));

      setIsAnalyzeModalOpen(true);
    } catch (err) {
      clearTimeout(coldStartTimer);
      setWakingUpNotice(false);
      setAnalysisError(err.message || 'Suspect Priority Model API call failed.');
      setIsAnalyzeModalOpen(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] bg-[#061121] rounded-lg overflow-hidden border border-[#132B4C] shadow-2xl select-none">
      {/* 1. TOP CASE SELECTOR & ACTION TOOLBAR */}
      <div className="bg-[#0A192F] border-b border-[#132B4C] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30 flex-shrink-0">
        {/* Left: Case Selector Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
              className="px-3 py-1.5 bg-[#0E223D] hover:bg-[#132B4C] text-white border border-[#254F85] rounded text-xs font-semibold flex items-center gap-2 transition-colors min-w-[260px] justify-between shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <FolderSearch className="w-3.5 h-3.5 text-[#D4A017] flex-shrink-0" />
                <span className="truncate font-mono">
                  {activeCaseData ? `${activeCaseData.crime_no} • ${activeCaseData.police_station}` : 'Select Registered Case...'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">▼</span>
            </button>

            {/* Dropdown */}
            {isCaseDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-96 bg-[#0E223D] border border-[#254F85] rounded-md shadow-2xl py-1.5 z-50">
                <div className="p-2 border-b border-[#1C3B64]">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search crime no, station, category..."
                      value={caseSearchQuery}
                      onChange={(e) => setCaseSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 bg-[#071120] border border-[#1C3B64] rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#D4A017]"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {filteredCases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSearchParams({ case_id: c.id });
                        setIsCaseDropdownOpen(false);
                        setCaseSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors border-b border-[#1C3B64]/50 last:border-0 ${
                        selectedCaseId === c.id ? 'bg-[#132B4C] text-[#D4A017] font-bold' : 'text-slate-200 hover:bg-[#132B4C]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] truncate">{c.crime_no}</div>
                        <div className="text-[10px] text-slate-400 truncate">{c.police_station} • {c.crime_major_head}</div>
                      </div>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[#071120] text-amber-300 border border-amber-900/50">
                        {c.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Autosave & Verification Telemetry */}
          {selectedCaseId && (
            <div className="hidden lg:flex items-center gap-2 text-[10.5px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></span>
              <span className="text-slate-300">
                {saveStatus === 'saved' ? 'AUTOSAVED' : 'SAVING TO SUPABASE...'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{confirmedCount} Verified</span>
              <span className="text-amber-400 font-bold">{hypothesisCount} Hypothesis</span>
            </div>
          )}
        </div>

        {/* Right: Working Whiteboard Action Toolbar */}
        {selectedCaseId && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Add Person Card */}
            <button
              onClick={handleAddPerson}
              className="px-2.5 py-1.5 bg-[#0E223D] hover:bg-[#132B4C] text-white text-xs font-semibold rounded border border-[#254F85] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Add Person of Interest Card"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Add Person</span>
            </button>

            {/* Add Evidence Note */}
            <button
              onClick={handleAddNote}
              className="px-2.5 py-1.5 bg-[#0E223D] hover:bg-[#132B4C] text-[#FEF3C7] text-xs font-semibold rounded border border-[#524E2A] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Add Evidence / Working Lead Note"
            >
              <FileText className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Add Note</span>
            </button>

            {/* Add Entity Card */}
            <button
              onClick={handleAddEntity}
              className="px-2.5 py-1.5 bg-[#0E223D] hover:bg-[#132B4C] text-white text-xs font-semibold rounded border border-[#254F85] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Add Phone, Vehicle or Asset Card"
            >
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Entity</span>
            </button>

            <span className="w-px h-5 bg-[#1C3B64] mx-1"></span>

            {/* Pull from Knowledge Graph */}
            <button
              onClick={handlePullFromKnowledgeGraph}
              className="px-2.5 py-1.5 bg-[#0E223D] hover:bg-[#132B4C] text-[#D4A017] text-xs font-bold rounded border border-[#D4A017]/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Import known suspects, phones, and evidence from database into whiteboard"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Known Clues</span>
            </button>

            {/* Undo / Redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-[#132B4C] transition-colors"
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-[#132B4C] transition-colors"
              title="Redo"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-5 bg-[#1C3B64] mx-1"></span>

            {/* Version Snapshots */}
            <button
              onClick={() => setIsSnapshotsModalOpen(true)}
              className="px-2 py-1.5 text-slate-300 hover:text-white text-xs font-medium rounded hover:bg-[#132B4C] transition-colors flex items-center gap-1 border border-transparent hover:border-[#1C3B64]"
              title="Saved Whiteboard Versions & History"
            >
              <History className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="hidden md:inline">Saved Versions ({snapshots.length})</span>
            </button>

            {/* Case Narrative Notes */}
            <button
              onClick={() => setIsNotesDrawerOpen(true)}
              className="px-2 py-1.5 text-slate-300 hover:text-white text-xs font-medium rounded hover:bg-[#132B4C] transition-colors flex items-center gap-1 border border-transparent hover:border-[#1C3B64]"
              title="Investigator Notes & Hypotheses"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Case Notes</span>
            </button>

            {/* AI Suspect Priority Scoring */}
            <div className="relative group">
              <button
                onClick={handleRunPriorityAnalysis}
                disabled={personNodesCount === 0 || isAnalyzing}
                className={`px-3 py-1.5 font-bold text-xs rounded border transition-all flex items-center gap-1.5 shadow-sm ${
                  personNodesCount === 0
                    ? 'bg-[#0E223D] text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                    : isAnalyzing
                    ? 'bg-[#1C3B64] text-amber-300 border-amber-400 animate-pulse'
                    : 'bg-[#132B4C] hover:bg-[#1C3B64] text-[#D4A017] border-[#D4A017] hover:shadow-[#D4A017]/20'
                }`}
                title={
                  personNodesCount === 0
                    ? 'Add at least 1 person card to rank suspects with AI'
                    : 'Rank suspects by importance with AI'
                }
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>{wakingUpNotice ? 'Waking up engine...' : 'Scoring suspects...'}</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5 text-[#D4A017]" />
                    <span>Rank Suspects {personNodesCount > 0 ? `(${personNodesCount})` : ''}</span>
                  </>
                )}
              </button>
              {personNodesCount === 0 && (
                <div className="absolute right-0 top-full mt-1.5 w-60 p-2 bg-[#0A192F] border border-[#254F85] rounded text-[10.5px] text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-sans">
                  ⚠️ Add at least one Person card to the whiteboard to rank suspects with AI.
                </div>
              )}
            </div>

            {/* Clear Canvas */}
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-[#132B4C] transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN REACT FLOW WHITEBOARD CANVAS */}
      <div className="flex-1 relative w-full h-full">
        {!selectedCaseId ? (
          /* Empty Case State */
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#061121] text-slate-300 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#0A192F] border border-[#132B4C] flex items-center justify-center text-[#D4A017] shadow-xl">
              <Layers className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Investigative Case Canvas
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Free-form hypothesis whiteboard for CIU investigators. Add custom suspect cards, evidence notes, and manual relationship links backed by justification evidence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {allCases.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSearchParams({ case_id: c.id })}
                  className="px-3 py-2 bg-[#0E223D] hover:bg-[#132B4C] text-white border border-[#254F85] rounded text-xs font-mono transition-colors text-left"
                >
                  <div className="font-bold text-[#D4A017]">{c.crime_no}</div>
                  <div className="text-[10px] text-slate-400">{c.police_station}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* React Flow Canvas Workspace */
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            fitView
            attributionPosition="bottom-left"
            className="bg-[#061121]"
          >
            <Background color="#1C3B64" gap={20} size={1} />
            <Controls className="!bg-[#0A192F] !border-[#132B4C] text-white" />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'personCard') return '#10B981';
                if (n.type === 'noteCard') return '#F59E0B';
                return '#38BDF8';
              }}
              maskColor="rgba(6, 17, 33, 0.75)"
              className="!bg-[#0A192F] !border-[#132B4C] !rounded-md overflow-hidden"
            />
          </ReactFlow>
        )}
      </div>

      {/* 3. EDGE JUSTIFICATION MODAL */}
      <EdgeJustificationModal
        isOpen={isEdgeModalOpen}
        onClose={() => {
          setIsEdgeModalOpen(false);
          setPendingConnection(null);
        }}
        onConfirm={handleConfirmEdge}
        sourceNode={nodes.find(n => n.id === pendingConnection?.source)}
        targetNode={nodes.find(n => n.id === pendingConnection?.target)}
      />

      {/* 4. CANVAS SNAPSHOTS & HISTORY MODAL */}
      <CanvasSnapshotsModal
        isOpen={isSnapshotsModalOpen}
        onClose={() => setIsSnapshotsModalOpen(false)}
        snapshots={snapshots}
        onSaveSnapshot={handleSaveSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
      />

      {/* 5. CASE NARRATIVE NOTES DRAWER */}
      <CaseNotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
        caseNotes={caseNotes}
        onChangeNotes={(val) => {
          setCaseNotes(val);
          triggerAutoSave();
        }}
        onSave={triggerAutoSave}
      />

      {/* 6. CLEAR CANVAS CONFIRMATION MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-[#0A192F] rounded-lg shadow-2xl border border-red-900/80 p-5 max-w-sm w-full space-y-3 text-white">
            <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Clear Entire Case Canvas?</span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              This will remove all working cards and manual hypothesis links from this whiteboard. A snapshot will be saved so you can restore if needed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#132B4C] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCanvas}
                className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. LIVE AI SUSPECT PRIORITY RANKING & FEATURE INSPECTOR MODAL */}
      {isAnalyzeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-[#0A192F] rounded-lg shadow-2xl border border-[#254F85] max-w-2xl w-full max-h-[90vh] flex flex-col text-white overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#071120] border-b border-[#1C3B64] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#0E223D] border border-[#D4A017] flex items-center justify-center text-[#D4A017]">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Who to Investigate First (AI Suspect Ranking)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-800" title="Machine learning model: XGBoost">
                      AI MODEL
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Ranks suspects by how connected they are to crimes, phone numbers, and other suspects.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunPriorityAnalysis}
                  disabled={isAnalyzing}
                  className="px-2.5 py-1 rounded bg-[#132B4C] hover:bg-[#1C3B64] text-[#D4A017] border border-[#D4A017]/50 text-[10.5px] font-mono font-bold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'Re-scoring...' : 'Re-Run'}</span>
                </button>
                <button
                  onClick={() => setIsAnalyzeModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#132B4C] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 font-sans">
              {/* Mandatory Non-Dismissible Advisory Disclaimer */}
              <div className="p-3 bg-amber-950/35 border border-amber-500/50 rounded-md flex items-start gap-2.5 text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[10.5px] uppercase tracking-wider text-amber-300 font-mono">
                    Advisory Guide for Officers — Not Courtroom Proof
                  </div>
                  <p className="text-[10.5px] text-amber-100/90 leading-relaxed font-sans mt-0.5">
                    Suspect scores are AI-generated based on whiteboard connections, verified status, and registered police records. Must be independently verified by the investigating officer before making operational decisions.
                  </p>
                </div>
              </div>

              {/* Error Notice if any */}
              {analysisError && (
                <div className="p-3 bg-rose-950/50 border border-rose-600 rounded-md text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Summary Stats Strip */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-[#0E223D] p-2 rounded border border-[#1C3B64]">
                  <div className="text-[10px] text-slate-400">PERSONS RANKED</div>
                  <div className="text-sm font-bold text-white mt-0.5">{analysisResults.length}</div>
                </div>
                <div className="bg-[#0E223D] p-2 rounded border border-[#1C3B64]">
                  <div className="text-[10px] text-slate-400">URGENT LEADS (≥70)</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">
                    {analysisResults.filter(r => r.priority_score >= 70).length}
                  </div>
                </div>
                <div className="bg-[#0E223D] p-2 rounded border border-[#1C3B64]">
                  <div className="text-[10px] text-slate-400">AI ENGINE STATUS</div>
                  <div className="text-[10px] font-bold text-emerald-400 mt-1 truncate">
                    Online (XGBoost Live)
                  </div>
                </div>
              </div>

              {/* Ranked Suspect List */}
              <div className="space-y-2.5">
                <div className="text-[10.5px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                  Suspect Priority Order (Highest Attention First)
                </div>

                {analysisResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-[#0E223D] rounded border border-[#1C3B64]">
                    No Person of Interest cards detected on canvas.
                  </div>
                ) : (
                  analysisResults.map((item, idx) => (
                    <div 
                      key={item.nodeId} 
                      className="bg-[#0E223D] p-3.5 rounded-lg border border-[#1C3B64] space-y-2.5 hover:border-[#254F85] transition-all"
                    >
                      {/* Top Row: Name, Rank, Status, and Priority Score */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 border ${
                            idx === 0
                              ? 'bg-[#D4A017]/20 border-[#D4A017] text-[#D4A017]'
                              : 'bg-[#132B4C] border-[#254F85] text-slate-300'
                          }`}>
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {item.linkedId && (
                                <span title="Linked to database record" className="text-[#D4A017] text-[9.5px] font-mono px-1 rounded bg-[#071120] border border-[#1C3B64]">
                                  DB-LINKED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-[#D4A017] uppercase font-semibold">{item.role}</span>
                              <span>•</span>
                              <span className={item.status === 'confirmed' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                                {item.status === 'confirmed' ? 'CONFIRMED FACT' : 'UNCONFIRMED CLUE'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Priority Score Display */}
                        <div>
                          {item.success && item.priority_score != null ? (
                            <div className="flex flex-col items-end">
                              <span className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold flex items-center gap-1 border shadow-md ${
                                item.priority_score >= 70
                                  ? 'bg-rose-500/25 text-rose-300 border-rose-500/60'
                                  : item.priority_score >= 40
                                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/60'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                <Sparkles className="w-3 h-3 text-[#D4A017]" />
                                <span>SCORE: {item.priority_score}</span>
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                                {item.priority_score >= 70 ? 'URGENT ATTENTION' : item.priority_score >= 40 ? 'MODERATE PRIORITY' : 'LOW PRIORITY'}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-red-950/60 text-rose-300 border border-red-800 rounded text-[10px] font-mono">
                              {item.error || 'Failed'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reasoning Inputs Grid (Raw feature values used for inference) */}
                      {item.features && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-[#1C3B64]/60 text-[10px] font-mono">
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="How much of a bridge this person is between different groups">
                            <div className="text-slate-400 text-[8.5px]">BRIDGE FACTOR</div>
                            <div className="text-white font-bold">{item.features.network_centrality}</div>
                          </div>
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="Number of direct links to phones, vehicles, or cases">
                            <div className="text-slate-400 text-[8.5px]">DIRECT LINKS</div>
                            <div className="text-white font-bold">{item.features.direct_connection_count} edges</div>
                          </div>
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="Percentage of connections confirmed by physical evidence vs AI pattern clues">
                            <div className="text-slate-400 text-[8.5px]">VERIFIED FACTS</div>
                            <div className="text-emerald-400 font-bold">
                              {Math.round(item.features.observed_vs_inferred_ratio * 100)}% verified
                            </div>
                          </div>
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="Importance weight based on role in FIR (accused vs witness)">
                            <div className="text-slate-400 text-[8.5px]">ROLE WEIGHT</div>
                            <div className="text-amber-400 font-bold">{item.features.role_weight}</div>
                          </div>
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="Number of previous police cases where this person appeared">
                            <div className="text-slate-400 text-[8.5px]">PAST CASES</div>
                            <div className="text-white font-bold">{item.features.prior_case_count} case(s)</div>
                          </div>
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="How similar this crime spree method is to other known cases">
                            <div className="text-slate-400 text-[8.5px]">METHOD MATCH</div>
                            <div className="text-cyan-400 font-bold">{item.features.mo_spree_similarity || 0}</div>
                          </div>
                          <div className="bg-[#071120] p-1.5 rounded border border-[#132B4C]" title="Number of unresolved system warnings for this person">
                            <div className="text-slate-400 text-[8.5px]">OPEN ALERTS</div>
                            <div className="text-white font-bold">
                              {item.features.alert_count} active
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#071120] border-t border-[#1C3B64] flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] font-mono text-slate-400">
                Inference Model: XGBoost Regressor (10 features)
              </span>
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="px-4 py-1.5 rounded bg-[#D4A017] text-[#0A192F] font-bold text-xs hover:bg-[#F59E0B] transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
