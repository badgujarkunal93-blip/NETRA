import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { localDB } from './localData.js';
import { 
  isDemoModeActive, 
  getDemoCurrentStep, 
  getDemoAlerts, 
  getDemoDashboardMetrics 
} from './demoScenario.js';

export const alertsService = {
  async getAlerts(filters = {}) {
    if (isDemoModeActive()) {
      const step = getDemoCurrentStep();
      return getDemoAlerts(step, filters);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('alerts').select('*');
        if (filters.severity && filters.severity !== 'All') {
          query = query.eq('severity', filters.severity);
        }
        if (filters.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }
        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {}
    }

    let rows = [...localDB.alerts];

    if (filters.severity && filters.severity !== 'All') {
      rows = rows.filter(a => a.severity === filters.severity);
    }
    if (filters.status && filters.status !== 'All') {
      rows = rows.filter(a => a.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }

    return rows;
  },

  async updateAlertStatus(alertId, newStatus) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('alerts').update({ status: newStatus }).eq('id', alertId).select().single();
        if (!error && data) return data;
      } catch (err) {}
    }

    const alert = localDB.alerts.find(a => a.id === alertId);
    if (alert) alert.status = newStatus;
    return alert || null;
  },

  async getDashboardMetrics() {
    if (isDemoModeActive()) {
      const step = getDemoCurrentStep();
      return getDemoDashboardMetrics(step);
    }

    let cases = localDB.cases;
    let persons = localDB.persons;
    let alerts = [...localDB.alerts].sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    let rawFindings = localDB.findings || [];

    if (isSupabaseConfigured && supabase) {
      try {
        const [casesRes, personsRes, alertsRes, findingsRes] = await Promise.all([
          supabase.from('cases').select('*'),
          supabase.from('persons').select('id', { count: 'exact', head: true }),
          supabase.from('alerts').select('*').order('created_at', { ascending: false }),
          supabase.from('findings').select('*').order('created_at', { ascending: false }).limit(6)
        ]);

        if (!casesRes.error && Array.isArray(casesRes.data)) {
          cases = casesRes.data;
        }
        if (!personsRes.error && typeof personsRes.count === 'number') {
          persons = new Array(personsRes.count).fill({});
        }
        if (!alertsRes.error && Array.isArray(alertsRes.data)) {
          alerts = alertsRes.data;
        }
        if (!findingsRes.error && Array.isArray(findingsRes.data)) {
          rawFindings = findingsRes.data;
        }
      } catch (e) {
        console.warn('Supabase getDashboardMetrics query failed, using local DB:', e);
      }
    }

    const activeCases = cases.filter(c => c.status !== 'Closed').length;
    const openAlerts = alerts.filter(a => a.status === 'New').length;
    const highSeverityAlerts = alerts.filter(a => a.severity === 'High' && a.status === 'New').length;
    const entitiesTracked = persons.length;
    const recentAlerts = alerts.slice(0, 5);

    // AI Findings mapping
    const aiFindings = rawFindings.slice(0, 6).map(f => ({
      id: f.id || f.finding_id,
      finding_id: f.finding_id || f.id,
      icon: (f.finding_type || '').toLowerCase().includes('finan') ? 'dollar' :
            (f.finding_type || '').toLowerCase().includes('mo') ? 'tool' : 'network',
      finding: f.title || f.finding || f.description || 'Intelligence Correlation Pattern',
      title: f.title || f.finding || f.description,
      description: f.description || f.title,
      confidence: Number(f.confidence) || 0,
      evidence_ids: f.evidence_ids || f.evidence_refs || [],
      evidence: f.description || 'Evidence links correlated in graph.',
      case_id: f.case_id || f.target_id || f.caseId,
      caseId: f.case_id || f.target_id || f.caseId,
      finding_type: f.finding_type || 'AI_FINDING',
      created_at: f.created_at || new Date().toISOString()
    }));

    // Hotspot aggregation
    const hotspots = [];
    const validCases = cases.filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number');

    if (validCases.length > 0) {
      const groups = new Map();
      validCases.forEach(c => {
        const key = c.police_station ? c.police_station.trim() : `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;
        if (!groups.has(key)) {
          groups.set(key, { name: (c.police_station || 'Sector').replace(/ Police Station$/i, '').trim(), cases: [], lats: [], lngs: [], majorHeads: {} });
        }
        const g = groups.get(key);
        g.cases.push(c);
        g.lats.push(c.latitude);
        g.lngs.push(c.longitude);
        if (c.crime_major_head) g.majorHeads[c.crime_major_head] = (g.majorHeads[c.crime_major_head] || 0) + 1;
      });

      const allLats = validCases.map(c => c.latitude);
      const allLngs = validCases.map(c => c.longitude);
      const minLat = Math.min(...allLats), maxLat = Math.max(...allLats);
      const minLng = Math.min(...allLngs), maxLng = Math.max(...allLngs);
      const latRange = maxLat - minLat || 0.1;
      const lngRange = maxLng - minLng || 0.1;

      Array.from(groups.values())
        .sort((a, b) => b.cases.length - a.cases.length)
        .slice(0, 6)
        .forEach((g, idx) => {
          const avgLat = g.lats.reduce((a, b) => a + b, 0) / g.lats.length;
          const avgLng = g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length;
          let topType = 'General Offenses', maxCount = 0;
          for (const [type, count] of Object.entries(g.majorHeads)) {
            if (count > maxCount && type) { maxCount = count; topType = type; }
          }
          const count = g.cases.length;
          const hasEscalated = g.cases.some(c => c.status === 'Escalated' || c.status === 'Under Investigation');
          const severity = (count >= 4 || (count >= 2 && hasEscalated)) ? 'High' : count >= 2 ? 'Medium' : 'Low';
          const severityUpper = count >= 80 ? 'VERY HIGH' : severity.toUpperCase();
          const stationFullName = g.name.toLowerCase().includes('police station') ? g.name : `${g.name} Police Station`;
          const normX = Math.round(15 + ((avgLng - minLng) / lngRange) * 70);
          const normY = Math.round(85 - ((avgLat - minLat) / latRange) * 70);

          hotspots.push({
            id: `zone-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: g.name,
            stationJurisdiction: stationFullName,
            station: stationFullName,
            region: 'Mumbai Metro Region',
            reportedCrimes: count,
            caseCount: count,
            count,
            type: topType,
            topCategory: topType,
            lat: Number(avgLat.toFixed(4)),
            lng: Number(avgLng.toFixed(4)),
            latitude: Number(avgLat.toFixed(4)),
            longitude: Number(avgLng.toFixed(4)),
            severity,
            activityLevel: severityUpper,
            x: Math.max(10, Math.min(90, normX)),
            y: Math.max(10, Math.min(90, normY))
          });
        });
    }

    return { activeCases, openAlerts, highSeverityAlerts, entitiesTracked, recentAlerts, aiFindings, hotspots };
  }
};
