import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { casesService } from './casesService.js';
import { localDataService } from './localDataService.js';
import { 
  isDemoModeActive, 
  getDemoCurrentStep, 
  getDemoCaseIntelligenceNetwork, 
  getDemoGlobalIntelligenceNetwork,
  getDemoCaseCanvas
} from './demoScenario.js';

export const graphService = {
  async getGlobalIntelligenceNetwork(filters = {}) {
    if (isDemoModeActive()) {
      const step = getDemoCurrentStep();
      return getDemoGlobalIntelligenceNetwork(step, filters);
    }

    if (!isSupabaseConfigured) {
      return localDataService.getGlobalIntelligenceNetwork(filters);
    }

    try {
      const { data: rels, error } = await supabase.from('relationships').select('*').limit(500);
      if (error) throw new Error(error.message);

      const nodes = [];
      const edges = [];
      const nodeIds = new Set();

      for (const r of (rels || [])) {
        if (!nodeIds.has(r.source_id)) {
          nodes.push({ id: r.source_id, label: r.source_id, type: r.source_type || 'Entity' });
          nodeIds.add(r.source_id);
        }
        if (!nodeIds.has(r.target_id)) {
          nodes.push({ id: r.target_id, label: r.target_id, type: r.target_type || 'Entity' });
          nodeIds.add(r.target_id);
        }
        edges.push({
          id: r.id,
          source: r.source_id,
          target: r.target_id,
          label: r.relationship_type,
          verb: r.relationship_type,
          detailLabel: r.source_evidence || r.relationship_type,
          confidence: r.confidence || 85,
          status: r.status || 'observed'
        });
      }
      return { nodes, edges };
    } catch {
      return localDataService.getGlobalIntelligenceNetwork(filters);
    }
  },

  async getCaseIntelligenceNetwork(caseId, filters = { minConfidence: 0, provenance: 'All' }) {
    if (isDemoModeActive() || (caseId && String(caseId).startsWith('DEMO-'))) {
      const step = getDemoCurrentStep();
      return getDemoCaseIntelligenceNetwork(caseId, step, filters);
    }

    if (!isSupabaseConfigured) {
      return localDataService.getCaseIntelligenceNetwork(caseId, filters);
    }

    try {
      // 1. Fetch target case
      const { data: targetCase, error: caseErr } = await supabase
        .from('cases')
        .select('*')
        .or(`id.eq.${caseId},crime_no.eq.${caseId}`)
        .maybeSingle();

      if (caseErr || !targetCase) {
        return localDataService.getCaseIntelligenceNetwork(caseId, filters);
      }

      // 2. Fetch direct associations (roles and events)
      const { data: caseRoles } = await supabase.from('person_case_roles').select('*').eq('case_id', targetCase.id);
      const { data: events } = await supabase.from('events').select('*').eq('case_id', targetCase.id);

      const linkedPersonIds = new Set((caseRoles || []).map(r => r.person_id).filter(Boolean));
      (events || []).forEach(e => { if (e.person_id) linkedPersonIds.add(e.person_id); });

      const personIdsArr = Array.from(linkedPersonIds);
      let persons = [], phones = [], vehicles = [], accounts = [], organizations = [], relationships = [];

      if (personIdsArr.length > 0) {
        // Direct Person records
        const pRes = await supabase.from('persons').select('*').in('id', personIdsArr);
        persons = pRes.data || [];

        // Direct Asset records
        const phRes = await supabase.from('phones').select('*').in('owner_person_id', personIdsArr);
        phones = phRes.data || [];

        const vRes = await supabase.from('vehicles').select('*').in('owner_person_id', personIdsArr);
        vehicles = vRes.data || [];

        const aRes = await supabase.from('accounts').select('*').in('owner_person_id', personIdsArr);
        accounts = aRes.data || [];

        // 1-Hop Relationships
        const rRes1 = await supabase.from('relationships').select('*').in('source_id', personIdsArr);
        const rRes2 = await supabase.from('relationships').select('*').in('target_id', personIdsArr);
        relationships = [...(rRes1.data || []), ...(rRes2.data || [])];

        // Deduplicate relationships
        const relMap = new Map();
        relationships.forEach(r => relMap.set(r.id, r));
        relationships = Array.from(relMap.values());

        // Gather 2nd-degree entity IDs from relationships
        const extraPersonIds = [];
        const extraOrgIds = [];
        relationships.forEach(r => {
          if (r.source_type === 'Person' && !linkedPersonIds.has(r.source_id)) extraPersonIds.push(r.source_id);
          if (r.target_type === 'Person' && !linkedPersonIds.has(r.target_id)) extraPersonIds.push(r.target_id);
          if (r.source_type === 'Organization') extraOrgIds.push(r.source_id);
          if (r.target_type === 'Organization') extraOrgIds.push(r.target_id);
        });

        if (extraPersonIds.length > 0) {
          const epRes = await supabase.from('persons').select('*').in('id', extraPersonIds.slice(0, 10));
          if (epRes.data) persons = [...persons, ...epRes.data];
        }

        if (extraOrgIds.length > 0) {
          const orgRes = await supabase.from('organizations').select('*').in('id', extraOrgIds.slice(0, 10));
          organizations = orgRes.data || [];
        }
      }

      // Deduplicate persons
      const pMap = new Map();
      persons.forEach(p => pMap.set(p.id, p));
      persons = Array.from(pMap.values());

      const nodes = [];
      const edges = [];
      const nodeMap = new Map();

      const caseLat = targetCase.latitude || 19.0760;
      const caseLng = targetCase.longitude || 72.8777;

      // 1. Focal Case Node
      const caseNode = {
        id: targetCase.id,
        label: targetCase.crime_no,
        shortLabel: targetCase.crime_no.split('/')[2] || targetCase.crime_no,
        type: 'Case',
        typeCode: 'FIR',
        subtext: `${targetCase.police_station || 'Mumbai Station'} • ${targetCase.crime_major_head || targetCase.crime_category || 'Crime'}`,
        lat: caseLat,
        lng: caseLng,
        confidence: 100,
        isFocal: true
      };
      nodes.push(caseNode);
      nodeMap.set(caseNode.id, caseNode);

      // 2. Person Nodes
      persons.forEach((p, idx) => {
        const role = (caseRoles || []).find(r => r.person_id === p.id);
        const angle = (idx / Math.max(1, persons.length)) * 2 * Math.PI;
        const dist = 0.007 + (idx % 3) * 0.003;
        const pLat = caseLat + dist * Math.sin(angle);
        const pLng = caseLng + dist * Math.cos(angle);

        const pNode = {
          id: p.id,
          label: p.canonical_name || `Suspect ${p.id}`,
          shortLabel: (p.canonical_name || p.id).split(' ')[0],
          type: 'Person',
          typeCode: 'PER',
          subtext: role?.role_type || p.status_tag || 'Key Suspect',
          lat: pLat,
          lng: pLng,
          confidence: p.confidence_score || 85,
          dob: p.dob,
          gender: p.gender,
          aliases: p.aliases
        };
        nodes.push(pNode);
        nodeMap.set(pNode.id, pNode);

        // Edge between Case and Person
        const edgeId = `ROLE-${targetCase.id}-${p.id}`;
        edges.push({
          id: edgeId,
          source: p.id,
          target: caseNode.id,
          verb: role ? 'INVOLVED_IN' : 'ASSOCIATED_WITH',
          label: role ? 'INVOLVED_IN' : 'ASSOCIATED_WITH',
          detailLabel: role?.role_type || 'Associated Entity',
          confidence: p.confidence_score || 90,
          status: 'observed',
          sourceCoords: [pLat, pLng],
          targetCoords: [caseLat, caseLng]
        });
      });

      // 3. Organization Nodes
      organizations.forEach((org, idx) => {
        const angle = ((idx + 0.5) / Math.max(1, organizations.length)) * 2 * Math.PI;
        const orgLat = caseLat + 0.012 * Math.sin(angle);
        const orgLng = caseLng + 0.012 * Math.cos(angle);

        const orgNode = {
          id: org.id,
          label: org.name || org.id,
          shortLabel: (org.name || org.id).slice(0, 14),
          type: 'Organization',
          typeCode: 'ORG',
          subtext: org.type || 'Enterprise',
          lat: orgLat,
          lng: orgLng,
          confidence: 92
        };
        nodes.push(orgNode);
        nodeMap.set(orgNode.id, orgNode);
      });

      // 4. Phone Asset Nodes
      phones.slice(0, 6).forEach((ph, idx) => {
        const owner = nodeMap.get(ph.owner_person_id) || caseNode;
        const phLat = owner.lat + 0.003;
        const phLng = owner.lng + (idx % 2 === 0 ? 0.0035 : -0.0035);

        const phNode = {
          id: ph.id,
          label: ph.phone_number || ph.id,
          shortLabel: (ph.phone_number || ph.id).slice(-6),
          type: 'Phone',
          typeCode: 'PH',
          subtext: ph.carrier ? `${ph.carrier} SIM` : 'Cellular Line',
          lat: phLat,
          lng: phLng,
          confidence: 90
        };
        nodes.push(phNode);
        nodeMap.set(phNode.id, phNode);

        edges.push({
          id: `EDGE-PH-${ph.id}`,
          source: owner.id,
          target: ph.id,
          verb: 'USED_PHONE',
          label: 'USED_PHONE',
          detailLabel: ph.carrier ? `${ph.carrier} CDR Link` : 'Subscriber Match',
          confidence: 92,
          status: 'observed',
          sourceCoords: [owner.lat, owner.lng],
          targetCoords: [phLat, phLng]
        });
      });

      // 5. Vehicle Asset Nodes
      vehicles.slice(0, 4).forEach((v, idx) => {
        const owner = nodeMap.get(v.owner_person_id) || caseNode;
        const vLat = owner.lat - 0.0035;
        const vLng = owner.lng + (idx % 2 === 0 ? 0.003 : -0.003);

        const vNode = {
          id: v.id,
          label: v.registration_no || v.id,
          shortLabel: v.registration_no || v.id,
          type: 'Vehicle',
          typeCode: 'VEH',
          subtext: `${v.make_model || 'Vehicle'} (${v.color || 'Dark'})`,
          lat: vLat,
          lng: vLng,
          confidence: 94
        };
        nodes.push(vNode);
        nodeMap.set(vNode.id, vNode);

        edges.push({
          id: `EDGE-VEH-${v.id}`,
          source: owner.id,
          target: v.id,
          verb: 'REGISTERED_VEHICLE',
          label: 'REGISTERED_VEHICLE',
          detailLabel: 'RTO Vehicle Registration',
          confidence: 95,
          status: 'observed',
          sourceCoords: [owner.lat, owner.lng],
          targetCoords: [vLat, vLng]
        });
      });

      // 6. Bank Account Asset Nodes
      accounts.slice(0, 4).forEach((a, idx) => {
        const owner = nodeMap.get(a.owner_person_id) || caseNode;
        const aLat = owner.lat + 0.004;
        const aLng = owner.lng + (idx % 2 === 0 ? -0.0035 : 0.0035);

        const aNode = {
          id: a.id,
          label: a.account_number || a.id,
          shortLabel: (a.account_number || a.id).slice(-6),
          type: 'Account',
          typeCode: 'ACC',
          subtext: `${a.bank_name || 'Bank'} (${a.account_type || 'Savings'})`,
          lat: aLat,
          lng: aLng,
          confidence: 88
        };
        nodes.push(aNode);
        nodeMap.set(aNode.id, aNode);

        edges.push({
          id: `EDGE-ACC-${a.id}`,
          source: owner.id,
          target: a.id,
          verb: 'OWNS_ACCOUNT',
          label: 'OWNS_ACCOUNT',
          detailLabel: `${a.bank_name || 'Bank'} KYC Link`,
          confidence: 90,
          status: 'observed',
          sourceCoords: [owner.lat, owner.lng],
          targetCoords: [aLat, aLng]
        });
      });

      // 7. Event / Forensic Locations
      (events || []).slice(0, 4).forEach((e, idx) => {
        const eLat = e.latitude || (caseLat + 0.005 * (idx === 0 ? 1 : -1));
        const eLng = e.longitude || (caseLng + 0.005 * (idx % 2 === 0 ? 1 : -1));

        const eNode = {
          id: e.id,
          label: e.location_name || e.event_type || 'Incident Location',
          shortLabel: (e.location_name || e.event_type || 'Location').slice(0, 15),
          type: 'Location',
          typeCode: 'LOC',
          subtext: e.description || e.event_type || 'Event',
          lat: eLat,
          lng: eLng,
          confidence: 95
        };
        nodes.push(eNode);
        nodeMap.set(eNode.id, eNode);

        edges.push({
          id: `EDGE-EVT-${e.id}`,
          source: caseNode.id,
          target: e.id,
          verb: 'OCCURRED_AT',
          label: 'OCCURRED_AT',
          detailLabel: e.event_type || 'Forensic Scene',
          confidence: 96,
          status: 'observed',
          sourceCoords: [caseLat, caseLng],
          targetCoords: [eLat, eLng]
        });
      });

      // 8. Inter-entity Relationships
      relationships.forEach(r => {
        const srcNode = nodeMap.get(r.source_id);
        const tgtNode = nodeMap.get(r.target_id);
        if (srcNode && tgtNode) {
          edges.push({
            id: r.id,
            source: r.source_id,
            target: r.target_id,
            verb: r.relationship_type || 'ASSOCIATED_WITH',
            label: r.relationship_type || 'ASSOCIATED_WITH',
            detailLabel: r.source_evidence || r.relationship_type || 'Intelligence Link',
            confidence: r.confidence || 85,
            status: r.status || 'inferred',
            first_seen: r.first_seen,
            last_seen: r.last_seen,
            sourceCoords: [srcNode.lat, srcNode.lng],
            targetCoords: [tgtNode.lat, tgtNode.lng]
          });
        }
      });

      // 9. Apply Analytical Filters
      const minConf = filters.minConfidence || 0;
      const prov = filters.provenance || 'All';

      const filteredEdges = edges.filter(e => {
        if (e.confidence && e.confidence < minConf) return false;
        if (prov === 'Observed Only' && e.status !== 'observed') return false;
        if (prov === 'AI-Inferred Only' && e.status !== 'inferred') return false;
        return true;
      });

      // Deduplicate edges
      const edgeDedup = new Map();
      filteredEdges.forEach(e => edgeDedup.set(`${e.source}-${e.target}-${e.verb}`, e));
      const finalEdges = Array.from(edgeDedup.values());

      return {
        caseData: targetCase,
        nodes,
        edges: finalEdges,
        unplacedNodes: []
      };
    } catch (err) {
      console.error("graphService.getCaseIntelligenceNetwork failed, falling back to local dataset:", err);
      return localDataService.getCaseIntelligenceNetwork(caseId, filters);
    }
  },

  async getCaseCanvas(caseId) {
    if (isDemoModeActive() || (caseId && String(caseId).startsWith('DEMO-'))) {
      const step = getDemoCurrentStep();
      return getDemoCaseCanvas(caseId, step);
    }

    if (!isSupabaseConfigured) {
      return localDataService.getCaseCanvas(caseId);
    }

    try {
      const { data: canvas } = await supabase
        .from('case_canvases')
        .select('*')
        .eq('case_id', caseId)
        .maybeSingle();

      if (canvas && canvas.id) {
        const { data: dbNodes } = await supabase.from('canvas_nodes').select('*').eq('canvas_id', canvas.id);
        const { data: dbEdges } = await supabase.from('canvas_edges').select('*').eq('canvas_id', canvas.id);

        if (dbNodes && dbNodes.length > 0) {
          return {
            caseId,
            caseNotes: canvas.case_notes || '',
            nodes: dbNodes.map(n => ({
              id: n.id,
              type: n.node_type || (n.linked_entity_type === 'Person' ? 'personCard' : 'entityCard'),
              position: { x: n.position_x || 100, y: n.position_y || 100 },
              data: {
                label: n.label,
                description: n.description || '',
                status: n.status || 'confirmed',
                nodeType: n.linked_entity_type || (n.node_type === 'personCard' ? 'Person' : 'Entity'),
                linkedId: n.linked_entity_id || n.id,
                role: n.linked_entity_type === 'Person' ? 'Suspect' : (n.description || 'Entity')
              }
            })),
            edges: (dbEdges || []).map(e => ({
              id: e.id,
              source: e.source_node_id,
              target: e.target_node_id,
              label: e.relationship_label || 'connected to',
              data: {
                justification: e.justification || '',
                status: 'confirmed'
              }
            }))
          };
        }
      }

      // Default Canvas Generation from Intelligence Network
      const net = await this.getCaseIntelligenceNetwork(caseId);
      return {
        caseId,
        caseNotes: 'Investigative hypothesis and whiteboard link notes for this case.',
        nodes: (net.nodes || []).slice(0, 10).map((n, idx) => ({
          id: n.id,
          type: n.type === 'Person' ? 'personCard' : 'entityCard',
          position: { x: 80 + (idx % 3) * 340, y: 80 + Math.floor(idx / 3) * 240 },
          data: {
            label: n.label,
            role: n.subtext || n.type,
            nodeType: n.type,
            description: n.subtext || '',
            status: (n.confidence && n.confidence >= 80) ? 'confirmed' : 'hypothesis',
            priority_score: n.confidence || 75,
            linkedId: n.id
          }
        })),
        edges: (net.edges || []).slice(0, 8).map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.verb || e.label || 'LINKED_TO',
          data: {
            justification: e.detailLabel || 'Imported from Intelligence Network',
            status: e.status || 'confirmed'
          }
        }))
      };
    } catch {
      return localDataService.getCaseCanvas(caseId);
    }
  },

  async saveCaseCanvas(caseId, { nodes, edges, caseNotes }) {
    if (isDemoModeActive() || (caseId && String(caseId).startsWith('DEMO-'))) {
      console.log('Demo Mode: canvas save skipped');
      return { caseId, nodes, edges, caseNotes };
    }

    if (!isSupabaseConfigured) {
      return localDataService.saveCaseCanvas(caseId, { nodes, edges, caseNotes });
    }

    try {
      const canvasId = `CANV-${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      
      // 1. Upsert Case Canvas Header
      await supabase.from('case_canvases').upsert({
        id: canvasId,
        case_id: caseId,
        case_notes: caseNotes || '',
        updated_at: new Date().toISOString()
      });

      // 2. Persist Nodes
      if (nodes && nodes.length > 0) {
        await supabase.from('canvas_nodes').delete().eq('canvas_id', canvasId);

        const nodeRecords = nodes.map(n => ({
          id: n.id,
          canvas_id: canvasId,
          node_type: n.type,
          position_x: Math.round(n.position?.x || 100),
          position_y: Math.round(n.position?.y || 100),
          label: n.data?.label || 'Unnamed Node',
          description: n.data?.description || '',
          linked_entity_type: n.data?.nodeType || (n.type === 'personCard' ? 'Person' : 'Entity'),
          linked_entity_id: n.data?.linkedId || n.id,
          status: n.data?.status || 'hypothesis'
        }));

        await supabase.from('canvas_nodes').insert(nodeRecords);
      }

      // 3. Persist Edges
      if (edges && edges.length > 0) {
        await supabase.from('canvas_edges').delete().eq('canvas_id', canvasId);

        const edgeRecords = edges.map(e => ({
          id: e.id,
          canvas_id: canvasId,
          source_node_id: e.source,
          target_node_id: e.target,
          relationship_label: e.label || 'connected to',
          justification: e.data?.justification || ''
        }));

        await supabase.from('canvas_edges').insert(edgeRecords);
      }

      return { caseId, nodes, edges, caseNotes };
    } catch (err) {
      console.warn("Failed to persist canvas to Supabase, saving locally:", err);
      return localDataService.saveCaseCanvas(caseId, { nodes, edges, caseNotes });
    }
  },

  async saveCanvasSnapshot(caseId, snapshot) {
    try {
      const storageKey = `netra_canvas_snapshots_${caseId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updated = [snapshot, ...existing].slice(0, 20);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return snapshot;
    } catch {
      return snapshot;
    }
  },

  async getCanvasSnapshots(caseId) {
    try {
      const storageKey = `netra_canvas_snapshots_${caseId}`;
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  },

  async pullKnowledgeGraphToCanvas(caseId) {
    if (isDemoModeActive() || (caseId && String(caseId).startsWith('DEMO-'))) {
      const step = getDemoCurrentStep();
      return getDemoCaseCanvas(caseId, step);
    }

    const net = await this.getCaseIntelligenceNetwork(caseId);
    return {
      nodes: (net.nodes || []).map((n, idx) => ({
        id: n.id,
        type: n.type === 'Person' ? 'personCard' : 'entityCard',
        position: { x: 80 + (idx % 3) * 340, y: 80 + Math.floor(idx / 3) * 240 },
        data: {
          label: n.label,
          role: n.subtext || n.type,
          nodeType: n.type,
          description: n.subtext || '',
          status: (n.confidence && n.confidence >= 80) ? 'confirmed' : 'hypothesis',
          priority_score: n.confidence || 75,
          linkedId: n.id
        }
      })),
      edges: (net.edges || []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.verb || e.label || 'LINKED_TO',
        data: {
          justification: e.detailLabel || 'Imported from Intelligence Network',
          status: e.status || 'confirmed'
        }
      }))
    };
  }
};
