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
    const { data: cases, error: casesErr } = await supabase.from('cases').select('status');
    const { count: personsCount, error: personsErr } = await supabase.from('persons').select('*', { count: 'exact', head: true });
    const { data: alerts, error: alertsErr } = await supabase.from('alerts').select('*');
    
    if (casesErr || personsErr || alertsErr) throw new Error("Data service unavailable");

    const activeCases = (cases || []).filter(c => c.status !== 'Closed').length;
    const openAlerts = (alerts || []).filter(a => a.status === 'New').length;
    const highSeverityAlerts = (alerts || []).filter(a => a.severity === 'High' && a.status === 'New').length;
    const entitiesTracked = personsCount || 0;
    
    const recentAlerts = (alerts || []).slice(0, 5);

    // AI Inferred Findings
    const aiFindings = [
      {
        id: 'FND-01',
        icon: 'network',
        finding: 'Transit Hub Cluster: Bandra & Dharavi networks share common logistics conduit',
        confidence: 88,
        evidence: '3 mutual burner SIM hops & Charoti toll plaza FASTag correlations',
        caseId: 'CASE-2026-0811'
      },
      {
        id: 'FND-02',
        icon: 'tool',
        finding: 'Safe-Cracking Signature: Pneumatic shear & RF jammer signature identical in Colaba and Bandra',
        confidence: 89,
        evidence: 'Tool mark striations & RF spectrum sweep records match within 0.05mm tolerance',
        caseId: 'CASE-2026-0924'
      },
      {
        id: 'FND-03',
        icon: 'dollar',
        finding: 'Mule Layering Velocity: ₹4.8Cr drained across 38 accounts routed through Nariman Point shell advisory',
        confidence: 91,
        evidence: 'FIU-IND Suspicious Transaction Report #STR-8801',
        caseId: 'CASE-2026-0615'
      }
    ];

    // Hotspot zones on Mumbai map
    const hotspots = [
      { id: 'HS-01', name: 'Bandra-BKC Corridor', count: 4, type: 'Financial & Safe Breach', lat: 19.0600, lng: 72.8360, severity: 'High', x: 48, y: 38 },
      { id: 'HS-02', name: 'Colaba - Fort District', count: 3, type: 'Vault & Cyber Shell', lat: 18.9220, lng: 72.8347, severity: 'High', x: 42, y: 88 },
      { id: 'HS-03', name: 'Dharavi - Sion Transit Hub', count: 2, type: 'Contraband Movement', lat: 19.0434, lng: 72.8567, severity: 'Medium', x: 55, y: 46 },
      { id: 'HS-04', name: 'Andheri MIDC - SEEPZ', count: 3, type: 'Cyber SIM Hijack & Crypto', lat: 19.1136, lng: 72.8697, severity: 'High', x: 58, y: 24 },
      { id: 'HS-05', name: 'Kurla CST Road Belts', count: 2, type: 'Auto Theft Dismantling', lat: 19.0726, lng: 72.8845, severity: 'Medium', x: 62, y: 40 },
      { id: 'HS-06', name: 'Worli Sea-Face Commercial', count: 1, type: 'Extortion VoIP Traces', lat: 19.0178, lng: 72.8178, severity: 'Low', x: 38, y: 62 }
    ];

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
