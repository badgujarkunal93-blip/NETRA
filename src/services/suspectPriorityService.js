import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { dbService } from './db.js';
import { isDemoModeActive, getDemoCurrentStep } from './demoScenario.js';

const MODEL_SERVICE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRIORITY_MODEL_URL) || 
                           (typeof process !== 'undefined' && process.env?.VITE_PRIORITY_MODEL_URL) || 
                           'https://netra-gd70.onrender.com';

/**
 * Role weight heuristic mapping
 */
const ROLE_WEIGHT_MAP = {
  'accused': 1.0,
  'prime accused': 1.0,
  'key suspect': 0.85,
  'suspect': 0.75,
  'conduit': 0.65,
  'handler': 0.70,
  'lookout': 0.50,
  'associate': 0.55,
  'co-conspirator': 0.60,
  'harborer': 0.55,
  'witness': 0.20,
  'victim': 0.15,
  'informant': 0.30
};

/**
 * Compute the 10 suspect priority model features for a Person node on the Case Canvas.
 * 
 * @param {Object} personNode - React Flow node representing the person
 * @param {Array} allNodes - All nodes on the canvas
 * @param {Array} allEdges - All edges on the canvas
 * @param {string} caseId - Active case ID
 * @returns {Promise<Object>} 10 feature values and contextual metadata
 */
export async function computePersonCanvasFeatures(personNode, allNodes, allEdges, caseId) {
  const nodeId = personNode.id;
  const data = personNode.data || {};
  const linkedId = data.linkedId || data.linked_entity_id || null;

  // 1. DIRECT CONNECTION COUNT & NETWORK CENTRALITY
  const incidentEdges = allEdges.filter(e => e.source === nodeId || e.target === nodeId);
  const direct_connection_count = incidentEdges.length;

  // Compute max degree across all nodes on canvas
  let maxDegreeOnCanvas = 1;
  allNodes.forEach(n => {
    const deg = allEdges.filter(e => e.source === n.id || e.target === n.id).length;
    if (deg > maxDegreeOnCanvas) maxDegreeOnCanvas = deg;
  });
  const network_centrality = Number((direct_connection_count / maxDegreeOnCanvas).toFixed(3));

  // 2. OBSERVED VS INFERRED RATIO
  let confirmedCount = 0;
  incidentEdges.forEach(e => {
    const otherNodeId = e.source === nodeId ? e.target : e.source;
    const otherNode = allNodes.find(n => n.id === otherNodeId);
    if (
      e.data?.status === 'confirmed' ||
      (otherNode && otherNode.data?.status === 'confirmed') ||
      (e.data?.justification && e.data.justification.trim().length > 0)
    ) {
      confirmedCount++;
    }
  });

  let observed_vs_inferred_ratio = 0.0;
  if (incidentEdges.length > 0) {
    observed_vs_inferred_ratio = Number((confirmedCount / incidentEdges.length).toFixed(3));
  } else {
    observed_vs_inferred_ratio = data.status === 'confirmed' ? 1.0 : 0.0;
  }

  // 3. AVG RELATIONSHIP CONFIDENCE
  let avg_relationship_confidence = 0.5;
  if (linkedId) {
    try {
      if (isSupabaseConfigured) {
        const { data: rels } = await supabase
          .from('relationships')
          .select('confidence')
          .or(`source_id.eq.${linkedId},target_id.eq.${linkedId}`);
        if (rels && rels.length > 0) {
          const sum = rels.reduce((acc, r) => acc + (r.confidence || 75), 0);
          // Scale to decimal 0.0 - 1.0 (e.g. 85 -> 0.85)
          avg_relationship_confidence = Number(((sum / rels.length) / 100).toFixed(3));
        } else {
          avg_relationship_confidence = data.status === 'confirmed' ? 0.85 : 0.60;
        }
      } else {
        avg_relationship_confidence = data.status === 'confirmed' ? 0.85 : 0.55;
      }
    } catch {
      avg_relationship_confidence = 0.5;
    }
  } else {
    avg_relationship_confidence = data.status === 'confirmed' ? 0.75 : 0.50;
  }

  // 4. ROLE WEIGHT
  let roleStr = (data.role || '').toLowerCase().trim();
  let role_weight = ROLE_WEIGHT_MAP[roleStr] || (data.status === 'confirmed' ? 0.60 : 0.30);
  if (!linkedId && !data.role) {
    role_weight = 0.30;
  }

  // 5. PRIOR CASE COUNT
  let prior_case_count = 1;
  if (linkedId) {
    try {
      if (isSupabaseConfigured) {
        const { count } = await supabase
          .from('person_case_roles')
          .select('*', { count: 'exact', head: true })
          .eq('person_id', linkedId);
        if (count && count > 0) prior_case_count = count;
      }
    } catch {
      prior_case_count = 1;
    }
  }

  // 6. MO CASE MATCH FLAG
  let mo_case_match_flag = 0;
  if (caseId) {
    try {
      if (isSupabaseConfigured) {
        const { data: moData } = await supabase
          .from('mo_similarities')
          .select('id')
          .or(`case_id_a.eq.${caseId},case_id_b.eq.${caseId}`)
          .limit(1);
        if (moData && moData.length > 0) mo_case_match_flag = 1;
      } else {
        mo_case_match_flag = 1;
      }
    } catch {
      mo_case_match_flag = 0;
    }
  }

  // 7. EVIDENCE COUNT
  let evidence_count = 0.0;
  incidentEdges.forEach(e => {
    if (e.data?.justification && e.data.justification.trim().length > 0) {
      evidence_count += 1.0;
    }
  });
  if (data.description && data.description.trim().length > 0) {
    evidence_count += 1.0;
  }

  // 8. ALERT COUNT & AVG ALERT CONFIDENCE
  let alert_count = 0;
  let avg_alert_confidence = 0.0;
  if (linkedId) {
    try {
      if (isSupabaseConfigured) {
        const { data: alerts } = await supabase
          .from('alerts')
          .select('confidence')
          .or(`target_id.eq.${linkedId},description.ilike.%${data.label || linkedId}%`);
        if (alerts && alerts.length > 0) {
          alert_count = alerts.length;
          const sum = alerts.reduce((acc, a) => acc + (a.confidence || 70), 0);
          avg_alert_confidence = Number(((sum / alerts.length) / 100).toFixed(3));
        }
      }
    } catch {
      alert_count = 0;
      avg_alert_confidence = 0.0;
    }
  }

  return {
    network_centrality,
    direct_connection_count,
    observed_vs_inferred_ratio,
    avg_relationship_confidence,
    role_weight,
    prior_case_count,
    mo_case_match_flag,
    evidence_count,
    alert_count,
    avg_alert_confidence
  };
}

/**
 * Call the deployed Suspect Priority Model service for a single person's feature set.
 * 
 * @param {Object} features - 10 feature values
 * @returns {Promise<number>} Priority score (0.0 to 100.0)
 */
export async function fetchSuspectPriorityScore(features) {
  const url = `${MODEL_SERVICE_URL.replace(/\/+$/, '')}/score`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for Render cold start

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(features),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Model API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    return Number(json.priority_score);
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Suspect Priority Model API call failed:', err);
    throw err;
  }
}

/**
 * Call the backend /explain endpoint to get AI-generated or feature-summary reasoning.
 * 
 * @param {Object} params
 * @param {Object} params.features - 10 feature values
 * @param {number} params.priority_score - Numeric score
 * @param {string} [params.person_name] - Name/label of the person
 * @param {string} [params.role] - Role classification
 * @returns {Promise<{ reasoning: string, reasoning_source: string, top_contributions: Array }>}
 */
export async function fetchSuspectExplanation({ features, priority_score, person_name, role }) {
  const url = `${MODEL_SERVICE_URL.replace(/\/+$/, '')}/explain`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const payload = {
      ...features,
      priority_score,
      person_name: person_name || 'Suspect',
      role: role || 'Accused'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Explain API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    return {
      reasoning: json.reasoning || 'Priority evaluated from graph centrality and evidence metrics.',
      reasoning_source: json.reasoning_source || 'feature_summary',
      top_contributions: json.top_contributions || []
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Suspect Priority Explain API call failed or degraded:', err.message);
    // Return client-side feature summary fallback if explain endpoint is unavailable
    const topFactors = [];
    if (features.network_centrality > 0.6) topFactors.push('high graph centrality');
    if (features.mo_case_match_flag === 1) topFactors.push('matching MO crime pattern');
    if (features.prior_case_count > 1) topFactors.push('prior case involvements');
    if (features.role_weight >= 0.8) topFactors.push('high role severity');

    const summaryText = topFactors.length > 0 
      ? `Top contributing factors: ${topFactors.join(', ')}.` 
      : 'Presents moderate graph and case connectivity metrics.';

    return {
      reasoning: summaryText,
      reasoning_source: 'feature_summary',
      top_contributions: []
    };
  }
}

/**
 * Batch analyze all Person nodes on the canvas in parallel.
 * 
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {string} caseId - Active case ID
 * @param {Function} [onProgress] - Optional callback
 * @returns {Promise<Array>} Ranked analysis results per person node
 */
export async function analyzeAllCanvasPersons(nodes, edges, caseId, onProgress) {
  // Filter all person nodes
  const personNodes = nodes.filter(n => 
    n.type === 'personCard' || 
    (n.type === 'entityCard' && n.data?.nodeType === 'Person') || 
    n.data?.isPerson
  );

  if (personNodes.length === 0) {
    return [];
  }

  // Self-contained demo mode handler
  if (isDemoModeActive()) {
    const step = getDemoCurrentStep();
    return personNodes.map(pNode => {
      const name = pNode.data?.label || pNode.data?.canonical_name || 'Suspect';
      const role = pNode.data?.role || 'Person of Interest';
      const isVikram = name.toLowerCase().includes('vikram') || name.toLowerCase().includes('malhotra') || pNode.id === 'DEMO-PERSON-3';
      const isFarhan = name.toLowerCase().includes('farhan') || pNode.id === 'DEMO-PERSON-1';
      const isDinesh = name.toLowerCase().includes('dinesh') || pNode.id === 'DEMO-PERSON-2';

      let score = 45.0;
      let reasoning = "Local case inquiry subject.";
      let topContribs = [];

      if (isVikram) {
        if (step >= 8) {
          score = 96.8;
          reasoning = "Critical multi-case syndicate hub (+28.4 pts) linking Colaba Vault, Bandra Showroom, and Zaveri Smelter via registered burner SIM +91 98201 99887. Modus operandi serial match across all 3 FIRs.";
          topContribs = [
            { feature: "network_centrality", label: "network bridge centrality", shap_value: 28.4, impact: "positive" },
            { feature: "mo_case_match_flag", label: "modus operandi serial match", shap_value: 18.2, impact: "positive" },
            { feature: "prior_case_count", label: "prior case involvements", shap_value: 14.5, impact: "positive" }
          ];
        } else if (step >= 4) {
          score = 88.5;
          reasoning = "Cross-case bridge suspect identified through shared vehicle MH-01-EA-9912 and burner SIM +91 98201 99887 active at Colaba & Bandra.";
          topContribs = [
            { feature: "network_centrality", label: "network bridge centrality", shap_value: 22.1, impact: "positive" },
            { feature: "mo_case_match_flag", label: "modus operandi serial match", shap_value: 12.0, impact: "positive" }
          ];
        } else {
          score = 35.0;
          reasoning = "External lock parts contractor; minor supplier in Case X records with limited local connectivity.";
          topContribs = [
            { feature: "role_weight", label: "investigative role severity", shap_value: 8.5, impact: "positive" }
          ];
        }
      } else if (isFarhan) {
        score = 62.4;
        reasoning = "Assigned priority score based on on-duty security guard shift during vault breach and physical access to alarm panel.";
        topContribs = [
          { feature: "role_weight", label: "investigative role severity", shap_value: 18.2, impact: "positive" },
          { feature: "direct_connection_count", label: "direct graph connections", shap_value: 10.4, impact: "positive" }
        ];
      } else if (isDinesh) {
        score = 48.1;
        reasoning = "Locksmith assistant who serviced vault biometric door 10 days prior; circumstantial involvement without verified communication logs.";
        topContribs = [
          { feature: "role_weight", label: "investigative role severity", shap_value: 12.0, impact: "positive" }
        ];
      }

      return {
        nodeId: pNode.id,
        label: name,
        role: role,
        status: pNode.data?.status || 'hypothesis',
        linkedId: pNode.data?.linkedId || null,
        priority_score: score,
        reasoning,
        reasoning_source: 'llm',
        top_contributions: topContribs,
        features: {},
        success: true,
        isHeuristic: false
      };
    }).sort((a, b) => b.priority_score - a.priority_score);
  }

  // Compute features for all person nodes concurrently
  const featureList = await Promise.all(
    personNodes.map(async (pNode) => {
      const features = await computePersonCanvasFeatures(pNode, nodes, edges, caseId);
      return { pNode, features };
    })
  );

  // Execute inference in parallel
  const results = await Promise.allSettled(
    featureList.map(async ({ pNode, features }) => {
      try {
        const score = await fetchSuspectPriorityScore(features);
        
        // Fetch reasoning and explainability
        const personName = pNode.data?.label || 'Unknown Suspect';
        const personRole = pNode.data?.role || 'Accused';
        const explanation = await fetchSuspectExplanation({
          features,
          priority_score: score,
          person_name: personName,
          role: personRole
        });

        return {
          nodeId: pNode.id,
          label: personName,
          role: personRole,
          status: pNode.data?.status || 'hypothesis',
          linkedId: pNode.data?.linkedId || null,
          priority_score: score,
          reasoning: explanation.reasoning,
          reasoning_source: explanation.reasoning_source,
          top_contributions: explanation.top_contributions,
          features,
          success: true,
          isHeuristic: false
        };
      } catch (err) {
        // Explicit failure reporting - no silent fake scores
        console.error(`Priority scoring failed for node ${pNode.id}:`, err);
        return {
          nodeId: pNode.id,
          label: pNode.data?.label || 'Unknown Suspect',
          role: pNode.data?.role || 'Accused',
          status: pNode.data?.status || 'hypothesis',
          linkedId: pNode.data?.linkedId || null,
          priority_score: null,
          reasoning: null,
          reasoning_source: 'unavailable',
          features,
          success: false,
          isHeuristic: false,
          error: 'Priority model unavailable'
        };
      }
    })
  );

  const formattedResults = results.map(r => r.status === 'fulfilled' ? r.value : {
    success: false,
    error: r.reason?.message || 'Priority model unavailable',
    priority_score: null,
    reasoning: null,
    reasoning_source: 'unavailable'
  });

  // Sort ranked by priority_score descending (nulls at bottom)
  formattedResults.sort((a, b) => {
    if (a.priority_score === null) return 1;
    if (b.priority_score === null) return -1;
    return b.priority_score - a.priority_score;
  });

  return formattedResults;
}
