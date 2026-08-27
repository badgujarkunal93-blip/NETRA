import { localDB } from './localData.js';

export const alertsService = {
  async getAlerts(filters = {}) {
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
    // In-memory only update for demo
    const alert = localDB.alerts.find(a => a.id === alertId);
    if (alert) alert.status = newStatus;
    return alert || null;
  },

  async getDashboardMetrics() {
    const cases = localDB.cases;
    const persons = localDB.persons;
    const alerts = [...localDB.alerts].sort((a, b) =>
      new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    const activeCases = cases.filter(c => c.status !== 'Closed').length;
    const openAlerts = alerts.filter(a => a.status === 'New').length;
    const highSeverityAlerts = alerts.filter(a => a.severity === 'High' && a.status === 'New').length;
    const entitiesTracked = persons.length;
    const recentAlerts = alerts.slice(0, 5);

    // AI Findings from local data
    const rawFindings = localDB.findings || [];
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
          const hasEscalated = g.cases.some(c => c.status === 'Escalated' || c.status === 'Under Investigation');
          const count = g.cases.length;
          const severity = count >= 4 || (count >= 2 && hasEscalated) ? 'High' : count >= 2 ? 'Medium' : 'Low';
          const normX = Math.round(15 + ((avgLng - minLng) / lngRange) * 70);
          const normY = Math.round(85 - ((avgLat - minLat) / latRange) * 70);
          hotspots.push({
            id: `HS-${String(idx + 1).padStart(2, '0')}`,
            name: g.name, count, type: topType,
            lat: Number(avgLat.toFixed(4)), lng: Number(avgLng.toFixed(4)),
            severity,
            x: Math.max(10, Math.min(90, normX)),
            y: Math.max(10, Math.min(90, normY))
          });
        });
    }

    return { activeCases, openAlerts, highSeverityAlerts, entitiesTracked, recentAlerts, aiFindings, hotspots };
  }
};
