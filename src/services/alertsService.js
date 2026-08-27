import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export const alertsService = {
  async getAlerts(filters = {}) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    let query = supabase.from('alerts').select('*');
    if (filters.severity && filters.severity !== 'All') {
      query = query.eq('severity', filters.severity);
    }
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async updateAlertStatus(alertId, newStatus) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    const { data, error } = await supabase
      .from('alerts')
      .update({ status: newStatus })
      .eq('id', alertId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async getDashboardMetrics() {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    
    // 1. Fetch Cases with geographic & crime details for hotspot aggregation
    const { data: cases, error: casesErr } = await supabase
      .from('cases')
      .select('id, crime_no, status, latitude, longitude, police_station, crime_major_head, crime_category');
      
    // 2. Fetch Persons count
    const { count: personsCount, error: personsErr } = await supabase
      .from('persons')
      .select('*', { count: 'exact', head: true });
      
    // 3. Fetch Alerts
    const { data: alerts, error: alertsErr } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (casesErr || personsErr || alertsErr) throw new Error("Data service unavailable");

    const activeCases = (cases || []).filter(c => c.status !== 'Closed').length;
    const openAlerts = (alerts || []).filter(a => a.status === 'New').length;
    const highSeverityAlerts = (alerts || []).filter(a => a.severity === 'High' && a.status === 'New').length;
    const entitiesTracked = personsCount || 0;
    
    const recentAlerts = (alerts || []).slice(0, 5);

    // 4. Query AI Findings (Real query against findings / AI output table)
    let aiFindings = [];
    try {
      const { data: findingsData, error: findingsErr } = await supabase
        .from('findings')
        .select('*')
        .order('confidence', { ascending: false })
        .limit(6);
        
      if (!findingsErr && Array.isArray(findingsData) && findingsData.length > 0) {
        aiFindings = findingsData.map(f => ({
          id: f.id || f.finding_id,
          finding_id: f.finding_id || f.id,
          icon: (f.finding_type || '').toLowerCase().includes('finan') ? 'dollar' :
                (f.finding_type || '').toLowerCase().includes('mo') || (f.finding_type || '').toLowerCase().includes('tool') ? 'tool' : 'network',
          finding: f.title || f.finding || f.description || 'Intelligence Correlation Pattern',
          title: f.title || f.finding || f.description,
          description: f.description || f.title,
          confidence: Number(f.confidence) || 0,
          evidence_ids: f.evidence_ids || f.evidence_refs || [],
          evidence: f.description || (f.evidence_refs ? f.evidence_refs.join(', ') : 'Evidence links correlated in graph.'),
          case_id: f.case_id || f.target_id || f.caseId,
          caseId: f.case_id || f.target_id || f.caseId,
          finding_type: f.finding_type || 'AI_FINDING',
          created_at: f.created_at || new Date().toISOString()
        }));
      }
    } catch (e) {
      // Return empty array if findings do not exist yet (never hardcoded fallback)
      aiFindings = [];
    }

    // 5. Dynamic Hotspot Aggregation from real case data and locations
    const hotspots = [];
    const validCases = (cases || []).filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number');
    
    if (validCases.length > 0) {
      const groups = new Map();
      
      validCases.forEach(c => {
        const key = c.police_station ? c.police_station.trim() : `${c.latitude.toFixed(2)},${c.longitude.toFixed(2)}`;
        if (!groups.has(key)) {
          groups.set(key, {
            name: c.police_station ? c.police_station.replace(/ Police Station$/i, '').trim() : 'Sector Cluster',
            cases: [],
            lats: [],
            lngs: [],
            majorHeads: {}
          });
        }
        const g = groups.get(key);
        g.cases.push(c);
        g.lats.push(c.latitude);
        g.lngs.push(c.longitude);
        if (c.crime_major_head) {
          g.majorHeads[c.crime_major_head] = (g.majorHeads[c.crime_major_head] || 0) + 1;
        }
      });

      // Sort clusters by case count descending
      const sortedGroups = Array.from(groups.values()).sort((a, b) => b.cases.length - a.cases.length);
      
      // Calculate overall lat/lng bounds for normalized map grid projection
      const allLats = validCases.map(c => c.latitude);
      const allLngs = validCases.map(c => c.longitude);
      const minLat = Math.min(...allLats);
      const maxLat = Math.max(...allLats);
      const minLng = Math.min(...allLngs);
      const maxLng = Math.max(...allLngs);
      const latRange = maxLat - minLat || 0.1;
      const lngRange = maxLng - minLng || 0.1;

      sortedGroups.slice(0, 6).forEach((g, idx) => {
        const avgLat = g.lats.reduce((a, b) => a + b, 0) / g.lats.length;
        const avgLng = g.lngs.reduce((a, b) => a + b, 0) / g.lngs.length;
        
        let topType = 'General Offenses';
        let maxCount = 0;
        for (const [type, count] of Object.entries(g.majorHeads)) {
          if (count > maxCount && type) {
            maxCount = count;
            topType = type;
          }
        }

        // Derive severity dynamically from case density and status
        const hasEscalated = g.cases.some(c => c.status === 'Escalated' || c.status === 'Under Investigation');
        const count = g.cases.length;
        let severity = 'Low';
        if (count >= 4 || (count >= 2 && hasEscalated)) {
          severity = 'High';
        } else if (count >= 2) {
          severity = 'Medium';
        }

        // Map onto normalized 2D tactical grid percentages
        const normX = Math.round(15 + ((avgLng - minLng) / lngRange) * 70);
        const normY = Math.round(85 - ((avgLat - minLat) / latRange) * 70);

        hotspots.push({
          id: `HS-${String(idx + 1).padStart(2, '0')}`,
          name: g.name,
          count: count,
          type: topType,
          lat: Number(avgLat.toFixed(4)),
          lng: Number(avgLng.toFixed(4)),
          severity,
          x: Math.max(10, Math.min(90, normX)),
          y: Math.max(10, Math.min(90, normY))
        });
      });
    }

    return {
      activeCases,
      openAlerts,
      highSeverityAlerts,
      entitiesTracked,
      recentAlerts,
      aiFindings,
      hotspots
    };
  }
};
