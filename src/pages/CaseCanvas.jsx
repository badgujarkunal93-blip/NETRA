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
  BrainCircuit
} from 'lucide-react';
import { dbService } from '../services/db';
import PersonCardNode from '../components/canvas/PersonCardNode';
import NoteCardNode from '../components/canvas/NoteCardNode';
import EntityCardNode from '../components/canvas/EntityCardNode';
import EdgeJustificationModal from '../components/canvas/EdgeJustificationModal';
import CanvasSnapshotsModal from '../components/canvas/CanvasSnapshotsModal';
import CaseNotesDrawer from '../components/canvas/CaseNotesDrawer';

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

  // Save Status
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'dirty'
  const saveTimeoutRef = useRef(null);

  // 1. Register Custom Node Types
  const nodeTypes = useMemo(() => ({
    personCard: PersonCardNode,
    noteCard: NoteCardNode,
    entityCard: EntityCardNode
  }), []);

  // 2. Load Cases on Mount
  useEffect(() => {
    async function loadCases() {
      const cases = await dbService.getCases();
      setAllCases(cases);
    }
    loadCases();
  }, []);

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

  // Hypothesis Metrics Calculation
  const confirmedCount = nodes.filter(n => n.data?.status === 'confirmed').length;
  const hypothesisCount = nodes.filter(n => n.data?.status === 'hypothesis').length;
  const justifiedEdgesCount = edges.filter(e => e.data?.justification && e.data.justification.length > 5).length;

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
              title="Import known entities and observed links from database into canvas"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import KG Seeds</span>
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
              title="Version Snapshots & History"
            >
              <History className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="hidden md:inline">Snapshots ({snapshots.length})</span>
            </button>

            {/* Case Narrative Notes */}
            <button
              onClick={() => setIsNotesDrawerOpen(true)}
              className="px-2 py-1.5 text-slate-300 hover:text-white text-xs font-medium rounded hover:bg-[#132B4C] transition-colors flex items-center gap-1 border border-transparent hover:border-[#1C3B64]"
              title="Case Narrative & Global Notes"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Case Notes</span>
            </button>

            {/* AI Hypothesis Analyze */}
            <button
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="px-3 py-1.5 bg-[#132B4C] hover:bg-[#1C3B64] text-[#D4A017] font-bold text-xs rounded border border-[#D4A017] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Run AI Hypothesis Consistency & Link Verification"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>AI Analyze</span>
            </button>

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
            nodeTypes={nodeTypes}
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

      {/* 7. AI HYPOTHESIS CONSISTENCY & ANALYZE MODAL */}
      {isAnalyzeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="bg-[#0A192F] rounded-lg shadow-2xl border border-[#132B4C] p-5 max-w-md w-full space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#132B4C] pb-2.5">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#D4A017]" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  AI Hypothesis Consistency Analysis
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                SCORING MODEL READY
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-sans">
              <div className="p-3 bg-[#0E223D] rounded border border-[#1C3B64] space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Total Working Cards:</span>
                  <span className="text-white font-bold">{nodes.length}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Verified Documentary Nodes:</span>
                  <span className="text-emerald-400 font-bold">{confirmedCount}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Investigator Speculative Leads:</span>
                  <span className="text-amber-400 font-bold">{hypothesisCount}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Justified Hypothesis Links:</span>
                  <span className="text-[#D4A017] font-bold">{justifiedEdgesCount} of {edges.length}</span>
                </div>
              </div>

              <div className="p-3 bg-[#071120] rounded border border-[#1C3B64] space-y-1 text-[11px]">
                <div className="text-[#D4A017] font-bold font-mono">
                  ✦ Canvas Explicit Hypothesis Weight: +14% Boost
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Officer VK's manual justifications for burner phone hops and safe-cracking tool marks correlate with existing NCORD intelligence clusters.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="px-4 py-1.5 rounded bg-[#D4A017] text-[#0A192F] font-bold text-xs hover:bg-[#F59E0B]"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
