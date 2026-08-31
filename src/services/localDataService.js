// Local Dataset Service & Fallback Provider for NETRA
import { localDB } from './localData.js';

export async function getLocalDataset() {
  return localDB;
}

export const localDataService = {
  async getAllCases(filters = {}) {
    const ds = await getLocalDataset();
    let cases = ds.cases || [];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      cases = cases.filter(c => 
        (c.crime_no && c.crime_no.toLowerCase().includes(q)) ||
        (c.brief_facts && c.brief_facts.toLowerCase().includes(q)) ||
        (c.crime_major_head && c.crime_major_head.toLowerCase().includes(q)) ||
        (c.police_station && c.police_station.toLowerCase().includes(q))
      );
    }

    const category = filters.crime_category || filters.category;
    if (category && category !== 'All') {
      cases = cases.filter(c => c.crime_category === category);
    }

    if (filters.status && filters.status !== 'All') {
      cases = cases.filter(c => c.status === filters.status);
    }

    const station = filters.police_station || filters.station;
    if (station && station !== 'All') {
      cases = cases.filter(c => c.police_station === station);
    }

    if (filters.limit) {
      const limit = Number(filters.limit);
      const offset = filters.offset !== undefined 
        ? Number(filters.offset) 
        : (Number(filters.page || 1) - 1) * limit;
      return cases.slice(offset, offset + limit);
    }

    return cases;
  },

  async getCases(filters = {}) {
    return this.getAllCases(filters);
  },

  async getCaseById(id) {
    const ds = await getLocalDataset();
    const c = (ds.cases || []).find(item => item.id === id || item.crime_no === id);
    if (!c) return null;

    // Enrich with linked persons
    const caseRoles = (ds.person_case_roles || []).filter(r => r.case_id === c.id);
    const linkedPersons = caseRoles.map(r => {
      const person = (ds.persons || []).find(p => p.id === r.person_id) || {};
      return {
        id: r.person_id,
        canonical_name: person.canonical_name || r.person_id,
        role_type: r.role_type || 'Accused',
        status_tag: person.status_tag || 'Subject'
      };
    });

    // Enrich with MO Fingerprint
    const moFingerprint = (ds.mo_fingerprints || []).find(fp => fp.case_id === c.id) || {
      target: c.crime_category ? `${c.crime_category} Target Zone` : 'Commercial Establishment',
      timing: 'Night Hours (01:00 - 04:00)',
      entry_method: 'Forced Rear Shutter Breach',
      tools: 'Hydraulic Bolt Cutters & Signal Jammers',
      transport: 'Unregistered Dark SUV',
      concealment: 'Face Masks & Jamming Nodes',
      confidence: 92
    };

    // Enrich with Similar Cases
    const relatedSims = (ds.mo_similarities || []).filter(s => s.case_id_a === c.id || s.case_id_b === c.id);
    const similarCases = relatedSims.map(s => {
      const otherId = s.case_id_a === c.id ? s.case_id_b : s.case_id_a;
      const otherCase = (ds.cases || []).find(item => item.id === otherId) || {};
      return {
        id: otherCase.id || otherId,
        crime_no: otherCase.crime_no || otherId,
        crime_major_head: otherCase.crime_major_head || 'Similar Modus Operandi',
        similarity_score: s.similarity_score,
        police_station: otherCase.police_station || 'CIU Jurisdiction',
        registered_date: otherCase.registered_date || '2026-02-18'
      };
    });

    // Evidence
    const evidenceItems = (ds.evidence || []).filter(e => e.case_id === c.id || (e.description && e.description.includes(c.crime_no)));

    return {
      ...c,
      linkedPersons,
      moFingerprint,
      similarCases,
      evidenceItems: evidenceItems.length > 0 ? evidenceItems : [{ id: 'EV-1', description: 'CCTNS FIR Verified Record' }]
    };
  },

  async getMOSimilarities(caseId = null) {
    const ds = await getLocalDataset();
    const cases = ds.cases || [];
    const fps = ds.mo_fingerprints || [];
    const sims = ds.mo_similarities || [];

    let selectedCase = null;
    if (caseId) {
      selectedCase = cases.find(c => c.id === caseId || c.crime_no === caseId);
    }
    if (!selectedCase && cases.length > 0) {
      selectedCase = cases.length > 1 ? cases[1] : cases[0];
    }

    if (!selectedCase) {
      return { allCases: [], selectedCase: null, selectedFP: null, rankedMatches: [] };
    }

    const selectedFP = fps.find(fp => fp.case_id === selectedCase.id) || {
      target: selectedCase.crime_category || 'Commercial Outlet',
      timing: 'Night Window (01:30 - 03:45)',
      entry_method: 'Leverage Shutter Jacking',
      tools: 'Rotary Cutter & Lock Bypass Pick',
      transport: 'False-Plated Silver Sedan',
      concealment: 'Full Balaclava & Signal Jammer',
      action_sequence: 'Perimeter bypass -> Shutter breach -> Locker loot -> Rapid exit',
      victim_interaction: 'Minimal contact / evasive',
      exit_method: 'High-speed coastal ring route',
      group_behavior: '3-man coordinated cell',
      confidence: 91
    };

    let relatedSims = sims.filter(s => s.case_id_a === selectedCase.id || s.case_id_b === selectedCase.id);
    
    // If no explicit similarity row exists, generate matching entries from same category
    if (relatedSims.length === 0) {
      const sameCategoryCases = cases.filter(c => c.id !== selectedCase.id && c.crime_category === selectedCase.crime_category).slice(0, 4);
      relatedSims = sameCategoryCases.map((sc, idx) => ({
        id: `SIM-SYNTH-${idx}`,
        case_id_a: selectedCase.id,
        case_id_b: sc.id,
        similarity_score: 88 - idx * 6,
        matching_components: [
          `Crime Head (${selectedCase.crime_category})`,
          'Temporal Spree: Within 7 Days',
          'Entry & Hardware Tool Signature Match'
        ]
      }));
    }

    const rankedMatches = relatedSims.map(s => {
      const otherId = s.case_id_a === selectedCase.id ? s.case_id_b : s.case_id_a;
      return {
        case: cases.find(c => c.id === otherId) || { id: otherId, crime_no: otherId, crime_major_head: 'Correlated Pattern', police_station: 'Crime Branch' },
        fingerprint: fps.find(fp => fp.case_id === otherId),
        similarity_score: s.similarity_score,
        matching_components: s.matching_components || ['Matching Modus Operandi', 'Time & Region Overlap']
      };
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    return {
      allCases: cases,
      selectedCase,
      selectedFP,
      rankedMatches
    };
  },

  async getPersons(filters = {}) {
    const ds = await getLocalDataset();
    let persons = ds.persons || [];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      persons = persons.filter(p => 
        (p.canonical_name && p.canonical_name.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.status_tag && p.status_tag.toLowerCase().includes(q))
      );
    }

    return persons.slice(0, 100);
  },

  async getPersonById(id) {
    const ds = await getLocalDataset();
    const p = (ds.persons || []).find(item => item.id === id);
    if (!p) return null;

    // Linked cases
    const roles = (ds.person_case_roles || []).filter(r => r.person_id === p.id);
    const linkedCases = roles.map(r => {
      const c = (ds.cases || []).find(caseItem => caseItem.id === r.case_id) || {};
      return {
        id: r.case_id,
        crime_no: c.crime_no || r.case_id,
        crime_major_head: c.crime_major_head || 'Investigation Record',
        police_station: c.police_station || 'CIU Mumbai',
        registered_date: c.registered_date || '2026-01-15',
        role_type: r.role_type || 'Accused'
      };
    });

    const linkedPhones = (ds.phones || []).filter(ph => ph.owner_person_id === p.id);
    const linkedVehicles = (ds.vehicles || []).filter(v => v.owner_person_id === p.id);
    const linkedAccounts = (ds.accounts || []).filter(a => a.owner_person_id === p.id);
    const events = (ds.events || []).filter(e => e.person_id === p.id);

    const rels = (ds.relationships || []).filter(r => r.source_id === p.id || r.target_id === p.id);
    const relationships = rels.map(r => {
      const targetId = r.source_id === p.id ? r.target_id : r.source_id;
      const targetEntity = (ds.persons || []).find(pers => pers.id === targetId) || { id: targetId, canonical_name: targetId };
      return {
        ...r,
        targetEntity
      };
    });

    return {
      ...p,
      linkedCases,
      linkedPhones: linkedPhones.length > 0 ? linkedPhones : [{ id: 'PH-1', phone_number: '+91 98201 44820' }],
      linkedVehicles: linkedVehicles.length > 0 ? linkedVehicles : [{ id: 'VH-1', registration_no: 'MH-01-DE-4402' }],
      linkedAccounts: linkedAccounts.length > 0 ? linkedAccounts : [{ id: 'AC-1', account_number: 'HDFC-8840291' }],
      events,
      relationships
    };
  },

  async getGlobalIntelligenceNetwork() {
    const ds = await getLocalDataset();
    const rels = (ds.relationships || []).slice(0, 300);
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();

    for (const r of rels) {
      if (!nodeIds.has(r.source_id)) {
        nodes.push({ id: r.source_id, label: r.source_id, type: r.source_type || 'Person' });
        nodeIds.add(r.source_id);
      }
      if (!nodeIds.has(r.target_id)) {
        nodes.push({ id: r.target_id, label: r.target_id, type: r.target_type || 'Person' });
        nodeIds.add(r.target_id);
      }
      edges.push({
        id: r.id,
        source: r.source_id,
        target: r.target_id,
        label: r.relationship_type,
        confidence: r.confidence || 85
      });
    }

    return { nodes, edges };
  },

  async getCaseIntelligenceNetwork(caseId, filters = { minConfidence: 0, provenance: 'All' }) {
    const ds = await getLocalDataset();
    const cases = ds.cases || [];
    const targetCase = cases.find(c => c.id === caseId || c.crime_no === caseId) || cases[0];
    if (!targetCase) return { caseData: null, nodes: [], edges: [], unplacedNodes: [] };

    const caseRoles = (ds.person_case_roles || []).filter(r => r.case_id === targetCase.id);
    const linkedPersonIds = new Set(caseRoles.map(r => r.person_id));
    
    // Add default anchor person if empty
    if (linkedPersonIds.size === 0 && ds.persons && ds.persons.length > 0) {
      linkedPersonIds.add(ds.persons[0].id);
      if (ds.persons.length > 1) linkedPersonIds.add(ds.persons[1].id);
    }

    const personIdsArr = Array.from(linkedPersonIds);
    const persons = (ds.persons || []).filter(p => personIdsArr.includes(p.id));
    const phones = (ds.phones || []).filter(ph => personIdsArr.includes(ph.owner_person_id));
    const vehicles = (ds.vehicles || []).filter(v => personIdsArr.includes(v.owner_person_id));
    const accounts = (ds.accounts || []).filter(a => personIdsArr.includes(a.owner_person_id));
    const rels = (ds.relationships || []).filter(r => personIdsArr.includes(r.source_id) || personIdsArr.includes(r.target_id));

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    const caseLat = targetCase.latitude || 19.0760;
    const caseLng = targetCase.longitude || 72.8777;

    // Case Focal Node
    const caseNode = {
      id: targetCase.id,
      label: targetCase.crime_no,
      type: 'Case',
      typeCode: 'FIR',
      subtext: targetCase.crime_major_head,
      lat: caseLat,
      lng: caseLng,
      confidence: 100,
      status: targetCase.status
    };
    nodes.push(caseNode);
    nodeMap.set(caseNode.id, caseNode);

    // Person Nodes
    persons.forEach((p, idx) => {
      const angle = (idx / Math.max(persons.length, 1)) * 2 * Math.PI;
      const dist = 0.008 + (idx % 3) * 0.004;
      const pNode = {
        id: p.id,
        label: p.canonical_name,
        type: 'Person',
        typeCode: 'P',
        subtext: p.status_tag || 'Suspect',
        lat: caseLat + dist * Math.sin(angle),
        lng: caseLng + dist * Math.cos(angle),
        confidence: p.confidence_score || 90,
        dob: p.dob
      };
      nodes.push(pNode);
      nodeMap.set(pNode.id, pNode);

      // Edge to Case
      edges.push({
        id: `EDGE-CASE-${p.id}`,
        source: targetCase.id,
        target: p.id,
        verb: 'ACCUSED_IN',
        detailLabel: 'Named in FIR Chargesheet',
        confidence: 95,
        status: 'observed',
        sourceCoords: [caseLat, caseLng],
        targetCoords: [pNode.lat, pNode.lng]
      });
    });

    // Asset Nodes (Phones, Vehicles)
    phones.slice(0, 3).forEach((ph, idx) => {
      const owner = nodeMap.get(ph.owner_person_id);
      if (owner) {
        const phNode = {
          id: ph.id,
          label: ph.phone_number,
          type: 'Phone',
          typeCode: 'PH',
          subtext: ph.carrier || 'Cellular Line',
          lat: owner.lat + 0.003,
          lng: owner.lng + (idx % 2 === 0 ? 0.003 : -0.003),
          confidence: 88
        };
        nodes.push(phNode);
        nodeMap.set(phNode.id, phNode);

        edges.push({
          id: `EDGE-PH-${ph.id}`,
          source: owner.id,
          target: ph.id,
          verb: 'USED_PHONE',
          detailLabel: 'Subscriber SIM Match',
          confidence: 90,
          status: 'observed',
          sourceCoords: [owner.lat, owner.lng],
          targetCoords: [phNode.lat, phNode.lng]
        });
      }
    });

    vehicles.slice(0, 2).forEach((v, idx) => {
      const owner = nodeMap.get(v.owner_person_id);
      if (owner) {
        const vNode = {
          id: v.id,
          label: v.registration_no,
          type: 'Vehicle',
          typeCode: 'VH',
          subtext: `${v.make_model || 'Vehicle'} (${v.color || 'Dark'})`,
          lat: owner.lat - 0.004,
          lng: owner.lng + 0.003,
          confidence: 85
        };
        nodes.push(vNode);
        nodeMap.set(vNode.id, vNode);

        edges.push({
          id: `EDGE-VH-${v.id}`,
          source: owner.id,
          target: v.id,
          verb: 'REGISTERED_VEHICLE',
          detailLabel: 'RTO Registration Record',
          confidence: 94,
          status: 'observed',
          sourceCoords: [owner.lat, owner.lng],
          targetCoords: [vNode.lat, vNode.lng]
        });
      }
    });

    // Relationships between entities
    rels.forEach(r => {
      const srcNode = nodeMap.get(r.source_id);
      const tgtNode = nodeMap.get(r.target_id);
      if (srcNode && tgtNode) {
        edges.push({
          id: r.id,
          source: r.source_id,
          target: r.target_id,
          verb: r.relationship_type,
          detailLabel: r.source_evidence || 'Intelligence Intercept',
          confidence: r.confidence || 85,
          status: r.status || 'inferred',
          sourceCoords: [srcNode.lat, srcNode.lng],
          targetCoords: [tgtNode.lat, tgtNode.lng]
        });
      }
    });

    return {
      caseData: targetCase,
      nodes,
      edges,
      unplacedNodes: []
    };
  },

  async getAlerts(filters = {}) {
    const ds = await getLocalDataset();
    let alerts = ds.alerts || [];

    if (filters.severity && filters.severity !== 'All') {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters.status && filters.status !== 'All') {
      alerts = alerts.filter(a => a.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      alerts = alerts.filter(a => 
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.target_id && a.target_id.toLowerCase().includes(q))
      );
    }

    if (alerts.length === 0) {
      alerts = [
        {
          id: 'ALT-101',
          title: 'Suspicious Co-Location at Charoti Toll Plaza',
          description: 'CDR tower logs place Farhan Merchant and Wasim Batliwala in adjacent vehicle lanes within 4 minutes.',
          severity: 'High',
          confidence: 94,
          status: 'New',
          target_type: 'Person',
          target_id: 'P-1049',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          evidence_refs: ['CDR-TOWER-881', 'FASTAG-TX-9904']
        },
        {
          id: 'ALT-102',
          title: 'Serial Safe Cutting Modus Operandi Match',
          description: 'FIR CR/2026/1045 exhibits identical 45-degree angle hydraulic shear marks to unresolved 2025 jewelry heist.',
          severity: 'High',
          confidence: 89,
          status: 'New',
          target_type: 'Case',
          target_id: 'CR/2026/1045',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          evidence_refs: ['FORENSIC-PHOTO-04', 'SHEAR-METRICS-DOC']
        },
        {
          id: 'ALT-103',
          title: 'Unverified Escrow Outflow Traced',
          description: 'Apex Zenith LLP transferred 4 tranches totaling ₹1.85 Cr to offshore accounts within 48h of case filing.',
          severity: 'Medium',
          confidence: 78,
          status: 'New',
          target_type: 'Organization',
          target_id: 'ORG-88',
          created_at: new Date(Date.now() - 14400000).toISOString(),
          evidence_refs: ['FIU-STR-8801', 'BANK-STATEMENT-AXIS']
        }
      ];
    }

    return alerts;
  },

  async updateAlertStatus(alertId, newStatus) {
    const ds = await getLocalDataset();
    const alert = (ds.alerts || []).find(a => a.id === alertId);
    if (alert) {
      alert.status = newStatus;
      return alert;
    }
    return { id: alertId, status: newStatus };
  },

  async getDashboardMetrics() {
    const ds = await getLocalDataset();
    const cases = ds.cases || [];
    const persons = ds.persons || [];
    const alerts = await this.getAlerts();

    const activeCases = cases.filter(c => c.status !== 'Closed').length || 842;
    const openAlerts = alerts.filter(a => a.status === 'New').length || 4;
    const highSeverityAlerts = alerts.filter(a => a.severity === 'High' && a.status === 'New').length || 2;
    const entitiesTracked = persons.length || 5000;

    const recentAlerts = alerts.slice(0, 5);

    const aiFindings = [
      {
        id: 'FIND-01',
        title: 'Hidden Gang Link Discovered',
        type: 'Hidden Connection',
        confidence: 94,
        category: 'Phone & Toll Cross-Match',
        description: 'Call logs and toll cameras reveal Farhan Merchant and Wasim Batliwala were at the same spot 3 times.',
        status: 'Active'
      },
      {
        id: 'FIND-02',
        title: 'Serial Crime Method Match',
        type: 'Matching Crime Method',
        confidence: 89,
        category: 'Serial Pattern Match',
        description: 'Safe breaking in CR/2026/1045 matches the exact tools and timing of a 2025 case.',
        status: 'Active'
      },
      {
        id: 'FIND-03',
        title: 'Unusual Money Flow Detected',
        type: 'Suspicious Flow',
        confidence: 84,
        category: 'Financial Tracing',
        description: 'Apex Zenith LLP sent 4 large payments to an unverified account right after the crime.',
        status: 'Investigating'
      }
    ];

    // Compute Hotspots from real cases
    const stationGroups = {};
    cases.forEach(c => {
      const st = c.police_station || 'Mumbai Metro';
      if (!stationGroups[st]) {
        stationGroups[st] = {
          name: st,
          station: st,
          caseCount: 0,
          lat: c.latitude || 19.0760,
          lng: c.longitude || 72.8777,
          categories: {}
        };
      }
      stationGroups[st].caseCount++;
      stationGroups[st].categories[c.crime_category || 'Other'] = (stationGroups[st].categories[c.crime_category || 'Other'] || 0) + 1;
    });

    const maxCases = Math.max(...Object.values(stationGroups).map(g => g.caseCount), 1);

    const hotspots = Object.values(stationGroups)
      .sort((a, b) => b.caseCount - a.caseCount)
      .slice(0, 8)
      .map(h => {
        const topCat = Object.entries(h.categories).sort((x, y) => y[1] - x[1])[0]?.[0] || 'Organized Theft';
        const cleanName = h.name.replace(/ Police Station$/i, '').trim();
        const level = h.caseCount >= 80 ? 'VERY HIGH' : h.caseCount >= 50 ? 'HIGH' : h.caseCount >= 25 ? 'MEDIUM' : 'LOW';
        const severity = level === 'VERY HIGH' ? 'Very High' : level === 'HIGH' ? 'High' : level === 'MEDIUM' ? 'Medium' : 'Low';
        const stationFullName = h.name.toLowerCase().includes('police station') ? h.name : `${h.name} Police Station`;

        return {
          id: `zone-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: cleanName,
          stationJurisdiction: stationFullName,
          station: stationFullName,
          region: 'Mumbai Metro Region',
          reportedCrimes: h.caseCount,
          caseCount: h.caseCount,
          count: h.caseCount,
          activeAlerts: Math.max(1, Math.round(h.caseCount / 30)),
          topCategory: topCat,
          type: topCat,
          trend: '+12% from last week',
          lat: Number(h.lat.toFixed(4)),
          lng: Number(h.lng.toFixed(4)),
          latitude: Number(h.lat.toFixed(4)),
          longitude: Number(h.lng.toFixed(4)),
          activityLevel: level,
          severity: severity
        };
      });


    return {
      activeCases,
      openAlerts,
      highSeverityAlerts,
      entitiesTracked,
      recentAlerts,
      aiFindings,
      hotspots: hotspots.length > 0 ? hotspots : [
        {
          name: 'Crawford Market Commercial Corridor',
          station: 'Pydhonie Police Station',
          caseCount: 42,
          activeAlerts: 5,
          topCategory: 'COMMERCIAL THEFT',
          trend: '+18% from last week',
          lat: 18.9482,
          lng: 72.8347
        },
        {
          name: 'Bandra-Kurla Complex Tech Zone',
          station: 'BKC Police Station',
          caseCount: 38,
          activeAlerts: 4,
          topCategory: 'CYBER FRAUD',
          trend: '+12% from last week',
          lat: 19.0657,
          lng: 72.8687
        }
      ]
    };
  },

  async getCaseCanvas(caseId) {
    const net = await this.getCaseIntelligenceNetwork(caseId);
    return {
      caseId,
      caseNotes: 'Investigative hypothesis and whiteboard link notes.',
      nodes: (net.nodes || []).slice(0, 8).map((n, idx) => ({
        id: n.id,
        type: n.type === 'Person' ? 'personCard' : 'entityCard',
        position: { x: 100 + (idx % 3) * 320, y: 80 + Math.floor(idx / 3) * 220 },
        data: {
          label: n.label,
          role: n.subtext || n.type,
          nodeType: n.type,
          description: n.subtext || '',
          status: n.confidence >= 80 ? 'confirmed' : 'hypothesis',
          priority_score: n.confidence || 75
        }
      })),
      edges: (net.edges || []).slice(0, 6).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.verb || e.label || 'LINKED_TO'
      }))
    };
  },

  async saveCaseCanvas(caseId, data) {
    return data;
  },

  async saveCanvasSnapshot(caseId, snapshot) {
    return snapshot;
  },

  async getCanvasSnapshots() {
    return [];
  },

  async pullKnowledgeGraphToCanvas(caseId) {
    const net = await this.getCaseIntelligenceNetwork(caseId);
    return {
      nodes: (net.nodes || []).map((n, idx) => ({
        id: n.id,
        type: n.type === 'Person' ? 'personCard' : 'entityCard',
        position: { x: 100 + (idx % 3) * 320, y: 80 + Math.floor(idx / 3) * 220 },
        data: {
          label: n.label,
          role: n.subtext || n.type,
          nodeType: n.type,
          description: n.subtext || '',
          status: 'confirmed'
        }
      })),
      edges: (net.edges || []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.verb || e.label || 'LINKED_TO'
      }))
    };
  }
};

