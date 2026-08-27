import { localDB } from './localData.js';

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
        edges.push({ id: `ROLE-${r.id}`, source: r.person_id, target: caseNode.id, verb: 'INVOLVED_IN', label: 'INVOLVED_IN', detailLabel: r.role_type });
      }
    });

    relationships.forEach(r => {
      if (nodeMap.has(r.source_id) && nodeMap.has(r.target_id)) {
        edges.push({ id: r.id, source: r.source_id, target: r.target_id, verb: 'ASSOCIATED_WITH', label: 'ASSOCIATED_WITH', detailLabel: r.relationship_type });
      }
    });

    return { caseData: targetCase, nodes, edges, unplacedNodes: [] };
  },

  async getCaseCanvas(caseId) {
    return { caseId, nodes: [], edges: [], caseNotes: '' };
  },

  async saveCaseCanvas(caseId, { nodes, edges, caseNotes }) {
    return { caseId, nodes, edges, caseNotes };
  },

  async saveCanvasSnapshot(caseId, snapshot) {
    return snapshot;
  },

  async getCanvasSnapshots(caseId) {
    return [];
  },

  async pullKnowledgeGraphToCanvas(caseId) {
    return { nodes: [], edges: [] };
  }
};
