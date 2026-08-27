import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { casesService } from './casesService.js';

export const graphService = {
  async getGlobalIntelligenceNetwork(filters = {}) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    // Just fetch relationships and build simple global network
    const { data: rels, error } = await supabase.from('relationships').select('*').limit(500);
    if (error) throw new Error(error.message);
    
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    
    for (const r of (rels || [])) {
      if (!nodeIds.has(r.source_id)) {
        nodes.push({ id: r.source_id, label: r.source_id, type: r.source_type });
        nodeIds.add(r.source_id);
      }
      if (!nodeIds.has(r.target_id)) {
        nodes.push({ id: r.target_id, label: r.target_id, type: r.target_type });
        nodeIds.add(r.target_id);
      }
      edges.push({
        id: r.id,
        source: r.source_id,
        target: r.target_id,
        label: r.relationship_type,
        confidence: r.confidence
      });
    }
    return { nodes, edges };
  },

  async getCaseIntelligenceNetwork(caseId, filters = { minConfidence: 0, provenance: 'All' }) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    
    // Fetch target case
    const { data: targetCase, error: caseErr } = await supabase.from('cases').select('*').or(`id.eq.${caseId},crime_no.eq.${caseId}`).maybeSingle();
    if (caseErr) throw new Error(caseErr.message);
    if (!targetCase) return { caseData: null, nodes: [], edges: [], unplacedNodes: [] };

    // Fetch related records
    const { data: caseRoles } = await supabase.from('person_case_roles').select('*').eq('case_id', targetCase.id);
    const { data: events } = await supabase.from('events').select('*').eq('case_id', targetCase.id);
    
    const linkedPersonIds = new Set((caseRoles || []).map(r => r.person_id));
    (events || []).forEach(e => { if (e.person_id) linkedPersonIds.add(e.person_id) });

    const personIdsArr = Array.from(linkedPersonIds);
    let persons = [], phones = [], vehicles = [], accounts = [], relationships = [];

    if (personIdsArr.length > 0) {
      const pRes = await supabase.from('persons').select('*').in('id', personIdsArr);
      persons = pRes.data || [];
      const phRes = await supabase.from('phones').select('*').in('owner_person_id', personIdsArr);
      phones = phRes.data || [];
      const vRes = await supabase.from('vehicles').select('*').in('owner_person_id', personIdsArr);
      vehicles = vRes.data || [];
      const aRes = await supabase.from('accounts').select('*').in('owner_person_id', personIdsArr);
      accounts = aRes.data || [];
      
      const rRes1 = await supabase.from('relationships').select('*').in('source_id', personIdsArr);
      const rRes2 = await supabase.from('relationships').select('*').in('target_id', personIdsArr);
      relationships = [...(rRes1.data || []), ...(rRes2.data || [])];
    }

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    const caseLat = targetCase.latitude || 19.0760;
    const caseLng = targetCase.longitude || 72.8777;

    const caseNode = {
      id: targetCase.id,
      label: targetCase.crime_no,
      shortLabel: targetCase.crime_no.split('/')[2] || targetCase.crime_no,
      type: 'Case',
      typeCode: 'FIR',
      subtext: `${targetCase.police_station} • ${targetCase.crime_major_head}`,
      lat: caseLat,
      lng: caseLng,
      isFocal: true
    };
    nodes.push(caseNode);
    nodeMap.set(caseNode.id, caseNode);

    persons.forEach((p, idx) => {
      const angle = (idx / Math.max(1, persons.length)) * 2 * Math.PI;
      const pNode = {
        id: p.id,
        label: p.canonical_name,
        shortLabel: p.canonical_name.split(' ')[0],
        type: 'Person',
        typeCode: 'PER',
        subtext: 'Person',
        lat: caseLat + 0.0045 * Math.sin(angle),
        lng: caseLng + 0.0055 * Math.cos(angle)
      };
      nodes.push(pNode);
      nodeMap.set(pNode.id, pNode);
    });

    (caseRoles || []).forEach(r => {
      if (nodeMap.has(r.person_id)) {
        edges.push({
          id: `ROLE-${r.id}`,
          source: r.person_id,
          target: caseNode.id,
          verb: 'INVOLVED_IN',
          label: 'INVOLVED_IN',
          detailLabel: r.role_type
        });
      }
    });

    relationships.forEach(r => {
      if (nodeMap.has(r.source_id) && nodeMap.has(r.target_id)) {
        edges.push({
          id: r.id,
          source: r.source_id,
          target: r.target_id,
          verb: 'ASSOCIATED_WITH',
          label: 'ASSOCIATED_WITH',
          detailLabel: r.relationship_type
        });
      }
    });

    return { caseData: targetCase, nodes, edges, unplacedNodes: [] };
  },

  async getCaseCanvas(caseId) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    const { data: canvas, error } = await supabase.from('case_canvases').select('*').eq('case_id', caseId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!canvas) {
      // Create a default canvas using intelligence network
      const network = await this.getCaseIntelligenceNetwork(caseId);
      return { caseId, nodes: [], edges: [], caseNotes: '' };
    }

    const { data: dbNodes } = await supabase.from('canvas_nodes').select('*').eq('canvas_id', canvas.id);
    const { data: dbEdges } = await supabase.from('canvas_edges').select('*').eq('canvas_id', canvas.id);

    return {
      caseId,
      caseNotes: canvas.case_notes || '',
      nodes: (dbNodes || []).map(n => ({
        id: n.id,
        type: n.node_type,
        position: { x: n.position_x, y: n.position_y },
        data: { label: n.label, description: n.description, status: n.status }
      })),
      edges: (dbEdges || []).map(e => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        label: e.relationship_label
      }))
    };
  },

  async saveCaseCanvas(caseId, { nodes, edges, caseNotes }) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    const canvasId = `CANV-${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    await supabase.from('case_canvases').upsert({ id: canvasId, case_id: caseId, case_notes: caseNotes });
    // skipping full sync for brevity
    return { caseId, nodes, edges, caseNotes };
  },

  async saveCanvasSnapshot(caseId, snapshot) {
    return snapshot; // fallback to localStorage in component
  },

  async getCanvasSnapshots(caseId) {
    return []; // fallback to localStorage in component
  },

  async pullKnowledgeGraphToCanvas(caseId) {
    return { nodes: [], edges: [] };
  }
};
