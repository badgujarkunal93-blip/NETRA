import { localDB } from './localData.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';

export const graphService = {
  async getGlobalIntelligenceNetwork(filters = {}) {
    const rels = localDB.relationships.slice(0, 500);
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();

    for (const r of rels) {
      if (!nodeIds.has(r.source_id)) {
        nodes.push({ id: r.source_id, label: r.source_id, type: r.source_type });
        nodeIds.add(r.source_id);
      }
      if (!nodeIds.has(r.target_id)) {
        nodes.push({ id: r.target_id, label: r.target_id, type: r.target_type });
        nodeIds.add(r.target_id);
      }
      edges.push({ id: r.id, source: r.source_id, target: r.target_id, label: r.relationship_type, confidence: r.confidence });
    }
    return { nodes, edges };
  },

  async getCaseIntelligenceNetwork(caseId, filters = { minConfidence: 0, provenance: 'All' }) {
    const targetCase = localDB.cases.find(c => c.id === caseId || c.crime_no === caseId);
    if (!targetCase) return { caseData: null, nodes: [], edges: [], unplacedNodes: [] };

    const caseRoles = localDB.person_case_roles.filter(r => r.case_id === targetCase.id);
    const events = localDB.events.filter(e => e.case_id === targetCase.id);

    const linkedPersonIds = new Set(caseRoles.map(r => r.person_id));
    events.forEach(e => { if (e.person_id) linkedPersonIds.add(e.person_id); });
    const personIdsArr = Array.from(linkedPersonIds);

    const persons = localDB.persons.filter(p => personIdsArr.includes(p.id));
    const phones = localDB.phones.filter(p => personIdsArr.includes(p.owner_person_id));
    const vehicles = localDB.vehicles.filter(v => personIdsArr.includes(v.owner_person_id));
    const accounts = localDB.accounts.filter(a => personIdsArr.includes(a.owner_person_id));
    const relationships = localDB.relationships.filter(
      r => personIdsArr.includes(r.source_id) || personIdsArr.includes(r.target_id)
    );

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    const caseLat = targetCase.latitude || 19.0760;
    const caseLng = targetCase.longitude || 72.8777;

    const caseNode = {
      id: targetCase.id,
      label: targetCase.crime_no,
      shortLabel: (targetCase.crime_no || '').split('/')[2] || targetCase.crime_no,
      type: 'Case', typeCode: 'FIR',
      subtext: `${targetCase.police_station} • ${targetCase.crime_major_head}`,
      lat: caseLat, lng: caseLng, isFocal: true
    };
    nodes.push(caseNode);
    nodeMap.set(caseNode.id, caseNode);

    persons.forEach((p, idx) => {
      const angle = (idx / Math.max(1, persons.length)) * 2 * Math.PI;
      const pNode = {
        id: p.id, label: p.canonical_name,
        shortLabel: (p.canonical_name || '').split(' ')[0],
        type: 'Person', typeCode: 'PER',
        subtext: p.status_tag || 'Person',
        lat: caseLat + 0.0045 * Math.sin(angle),
        lng: caseLng + 0.0055 * Math.cos(angle)
      };
      nodes.push(pNode);
      nodeMap.set(pNode.id, pNode);
    });

    caseRoles.forEach(r => {
      if (nodeMap.has(r.person_id)) {
        const src = nodeMap.get(r.person_id);
        const tgt = caseNode;
        edges.push({ 
          id: `ROLE-${r.id}`, 
          source: r.person_id, 
          target: caseNode.id, 
          sourceCoords: [src.lat, src.lng],
          targetCoords: [tgt.lat, tgt.lng],
          verb: 'INVOLVED_IN', 
          label: 'INVOLVED_IN', 
          detailLabel: r.role_type,
          confidence: 100,
          status: 'observed'
        });
      }
    });

    relationships.forEach(r => {
      if (nodeMap.has(r.source_id) && nodeMap.has(r.target_id)) {
        const src = nodeMap.get(r.source_id);
        const tgt = nodeMap.get(r.target_id);
        edges.push({ 
          id: r.id, 
          source: r.source_id, 
          target: r.target_id, 
          sourceCoords: [src.lat, src.lng],
          targetCoords: [tgt.lat, tgt.lng],
          verb: 'ASSOCIATED_WITH', 
          label: 'ASSOCIATED_WITH', 
          detailLabel: r.relationship_type,
          confidence: r.confidence_score || 85,
          status: r.status || 'observed'
        });
      }
    });

    return { caseData: targetCase, nodes, edges, unplacedNodes: [] };
  },

  // --- CASE CANVAS INVESTIGATIVE WHITEBOARD ---
  async getCaseCanvas(caseId) {
    const storageKey = `ciu_canvas_${caseId}`;

    // 1. If Supabase is configured, fetch directly from Supabase first
    if (isSupabaseConfigured) {
      try {
        const canvasId = `CANV-${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const { data: canvas } = await supabase
          .from('case_canvases')
          .select('*')
          .eq('id', canvasId)
          .single();

        if (canvas) {
          const { data: dbNodes } = await supabase
            .from('canvas_nodes')
            .select('*')
            .eq('canvas_id', canvasId);

          const { data: dbEdges } = await supabase
            .from('canvas_edges')
            .select('*')
            .eq('canvas_id', canvasId);

          if (dbNodes && dbNodes.length > 0) {
            const formattedNodes = dbNodes.map(n => ({
              id: n.id,
              type: n.node_type || 'noteCard',
              position: { x: Number(n.position_x) || 0, y: Number(n.position_y) || 0 },
              data: {
                label: n.label,
                description: n.description,
                nodeType: n.linked_entity_type,
                linkedId: n.linked_entity_id,
                status: n.status || 'hypothesis'
              }
            }));

            const formattedEdges = (dbEdges || []).map(e => ({
              id: e.id,
              source: e.source_node_id,
              target: e.target_node_id,
              label: e.relationship_label || 'connected to',
              data: {
                justification: e.justification || ''
              }
            }));

            return {
              caseId,
              nodes: formattedNodes,
              edges: formattedEdges,
              caseNotes: canvas.case_notes || '',
              updatedAt: canvas.updated_at
            };
          }
        }
      } catch (err) {
        console.warn('Supabase getCaseCanvas query notice:', err.message);
      }
    }

    // 2. Fallback to localStorage
    let stored = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) stored = JSON.parse(raw);
    } catch {}

    if (stored && stored.nodes && stored.nodes.length > 0) return stored;

    // If no existing canvas, generate initial default hypothesis cards
    const initialNetwork = await this.getCaseIntelligenceNetwork(caseId);
    const nodes = [];
    const edges = [];

    // Add case focal node
    nodes.push({
      id: `node-${caseId}`,
      type: 'entityCard',
      position: { x: 380, y: 180 },
      data: {
        label: initialNetwork.caseData ? initialNetwork.caseData.crime_no : caseId,
        subLabel: initialNetwork.caseData ? initialNetwork.caseData.police_station : 'Registered Case',
        description: initialNetwork.caseData ? initialNetwork.caseData.brief_facts : 'Primary registered FIR under investigation.',
        nodeType: 'Case',
        status: 'confirmed',
        linkedId: caseId
      }
    });

    // Add primary accused
    const persons = (initialNetwork.nodes || []).filter(n => n.type === 'Person').slice(0, 2);
    persons.forEach((p, idx) => {
      const pNodeId = `node-${p.id}`;
      nodes.push({
        id: pNodeId,
        type: 'personCard',
        position: { x: 120 + idx * 520, y: 340 },
        data: {
          label: p.label,
          role: p.subtext || 'Accused',
          description: `Key operative linked to ${initialNetwork.caseData?.crime_no || 'case'}. Known status: ${p.subtext || 'Active'}.`,
          status: 'confirmed',
          linkedId: p.id
        }
      });

      edges.push({
        id: `edge-${p.id}-${caseId}`,
        source: pNodeId,
        target: `node-${caseId}`,
        label: 'named in FIR',
        data: {
          justification: 'Formally listed as primary suspect in initial chargesheet.'
        }
      });
    });

    // Add initial working hypothesis sticky note
    nodes.push({
      id: `node-note-1`,
      type: 'noteCard',
      position: { x: 420, y: 460 },
      data: {
        label: 'Investigator Working Lead',
        description: 'Burner SIM activations in suburban tower coincide with getaway timeline. Check mutual CDR hops with transit node.',
        status: 'hypothesis'
      }
    });

    const defaultCanvas = {
      caseId,
      nodes,
      edges,
      caseNotes: 'Investigative Hypothesis: Syndicate operated via layered burner SIMs with financial remittances routed through shell logistics entities. Awaiting bank KYC extract.',
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultCanvas));
    } catch {}

    return defaultCanvas;
  },

  async saveCaseCanvas(caseId, { nodes, edges, caseNotes }) {
    const storageKey = `ciu_canvas_${caseId}`;
    const canvasData = {
      caseId,
      nodes,
      edges,
      caseNotes: caseNotes || '',
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage as quick local cache
    try {
      localStorage.setItem(storageKey, JSON.stringify(canvasData));
    } catch {}

    // Save directly to Supabase tables
    if (isSupabaseConfigured) {
      try {
        const canvasId = `CANV-${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        await supabase.from('case_canvases').upsert({
          id: canvasId,
          case_id: caseId,
          case_notes: caseNotes || '',
          updated_at: new Date().toISOString()
        });

        // Sync nodes
        if (nodes && nodes.length > 0) {
          const dbNodes = nodes.map(n => ({
            id: n.id,
            canvas_id: canvasId,
            node_type: n.type || 'noteCard',
            position_x: n.position?.x || 0,
            position_y: n.position?.y || 0,
            label: n.data?.label || 'Card',
            description: n.data?.description || '',
            linked_entity_type: n.data?.nodeType || null,
            linked_entity_id: n.data?.linkedId || null,
            status: n.data?.status || 'hypothesis'
          }));
          await supabase.from('canvas_nodes').delete().eq('canvas_id', canvasId);
          await supabase.from('canvas_nodes').upsert(dbNodes);
        }

        // Sync edges
        if (edges && edges.length > 0) {
          const dbEdges = edges.map(e => ({
            id: e.id,
            canvas_id: canvasId,
            source_node_id: e.source,
            target_node_id: e.target,
            relationship_label: e.label || 'linked to',
            justification: e.data?.justification || ''
          }));
          await supabase.from('canvas_edges').delete().eq('canvas_id', canvasId);
          await supabase.from('canvas_edges').upsert(dbEdges);
        }
      } catch (err) {
        console.warn('Supabase canvas sync notice:', err.message);
      }
    }

    return canvasData;
  },

  async saveCanvasSnapshot(caseId, { label, nodes, edges, caseNotes }) {
    const snapKey = `ciu_canvas_snaps_${caseId}`;
    let list = [];
    try {
      const raw = localStorage.getItem(snapKey);
      if (raw) list = JSON.parse(raw);
    } catch {}

    const snapshot = {
      id: `snap-${Date.now()}`,
      label: label || `Snapshot ${list.length + 1}`,
      createdAt: new Date().toISOString(),
      nodesCount: nodes.length,
      edgesCount: edges.length,
      data: { nodes, edges, caseNotes }
    };

    list.unshift(snapshot);
    try {
      localStorage.setItem(snapKey, JSON.stringify(list.slice(0, 10)));
    } catch {}

    return snapshot;
  },

  async getCanvasSnapshots(caseId) {
    const snapKey = `ciu_canvas_snaps_${caseId}`;
    try {
      const raw = localStorage.getItem(snapKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  async pullKnowledgeGraphToCanvas(caseId) {
    const network = await this.getCaseIntelligenceNetwork(caseId);
    const nodes = [];
    const edges = [];

    // Case anchor
    nodes.push({
      id: `node-${caseId}`,
      type: 'entityCard',
      position: { x: 450, y: 150 },
      data: {
        label: network.caseData ? network.caseData.crime_no : caseId,
        subLabel: network.caseData ? network.caseData.police_station : 'Case FIR',
        description: network.caseData ? network.caseData.brief_facts : 'Primary Case Anchor',
        nodeType: 'Case',
        status: 'confirmed',
        linkedId: caseId
      }
    });

    // Linked entities in concentric/grid layout
    (network.nodes || []).filter(n => n.type !== 'Case').forEach((n, idx) => {
      const total = Math.max(1, (network.nodes || []).length - 1);
      const angle = (idx / total) * 2 * Math.PI;
      const x = 450 + 380 * Math.cos(angle);
      const y = 350 + 260 * Math.sin(angle);

      const isPerson = n.type === 'Person';
      const nodeType = isPerson ? 'personCard' : n.type === 'Location' ? 'noteCard' : 'entityCard';

      nodes.push({
        id: `node-${n.id}`,
        type: nodeType,
        position: { x: Math.max(50, x), y: Math.max(50, y) },
        data: {
          label: n.label,
          role: n.subtext || n.type,
          subLabel: n.subtext,
          description: n.description || `${n.type} entity linked to investigation. Status: ${n.subtext || 'Active'}.`,
          nodeType: n.type,
          status: 'confirmed',
          linkedId: n.id
        }
      });
    });

    // Edges
    (network.edges || []).forEach(e => {
      edges.push({
        id: `edge-${e.id}`,
        source: `node-${e.source}`,
        target: `node-${e.target}`,
        label: e.verb || e.label || 'connected to',
        data: {
          justification: e.detailLabel || `Observed relationship in case telemetry records.`
        }
      });
    });

    return { nodes, edges };
  }
};
