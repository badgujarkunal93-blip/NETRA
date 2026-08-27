import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export const casesService = {
  async getAllCases(filters = {}) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    let query = supabase.from('cases').select('*');
    
    // 1. Search filter across crime_no and brief_facts
    if (filters.search) {
      query = query.or(`crime_no.ilike.%${filters.search}%,brief_facts.ilike.%${filters.search}%`);
    }

    // 2. Category filter (column in cases table is crime_category)
    const category = filters.crime_category || filters.category;
    if (category && category !== 'All') {
      query = query.eq('crime_category', category);
    }

    // 3. Status filter
    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    // 4. Police Station filter
    const station = filters.police_station || filters.station;
    if (station && station !== 'All') {
      query = query.eq('police_station', station);
    }

    // 5. Result limits & pagination
    if (filters.limit) {
      const limit = Number(filters.limit);
      if (filters.offset !== undefined || filters.page !== undefined) {
        const offset = filters.offset !== undefined 
          ? Number(filters.offset) 
          : (Number(filters.page || 1) - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getCases(filters = {}) {
    return this.getAllCases(filters);
  },
  
  async getCaseById(id) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    const { data, error } = await supabase.from('cases').select('*').or(`id.eq.${id},crime_no.eq.${id}`).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async getMOSimilarities(caseId = null) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    
    const { data: cases, error: caseErr } = await supabase.from('cases').select('*');
    const { data: fps, error: fpErr } = await supabase.from('mo_fingerprints').select('*');
    const { data: sims, error: simErr } = await supabase.from('mo_similarities').select('*');
    
    if (caseErr || fpErr || simErr) throw new Error("Data service unavailable");

    let selectedCase = null;
    if (caseId) {
      selectedCase = (cases || []).find(c => c.id === caseId || c.crime_no === caseId);
    }
    if (!selectedCase && cases && cases.length > 0) {
      selectedCase = cases.length > 1 ? cases[1] : cases[0];
    }

    if (!selectedCase) {
      return { allCases: [], selectedCase: null, selectedFP: null, rankedMatches: [] };
    }

    const selectedFP = (fps || []).find(fp => fp.case_id === selectedCase.id) || null;
    const relatedSims = (sims || []).filter(s => s.case_id_a === selectedCase.id || s.case_id_b === selectedCase.id);
    
    const rankedMatches = relatedSims.map(s => {
      const otherId = s.case_id_a === selectedCase.id ? s.case_id_b : s.case_id_a;
      return {
        case: cases.find(c => c.id === otherId),
        fingerprint: fps.find(fp => fp.case_id === otherId),
        similarity_score: s.similarity_score,
        matching_components: s.matching_components
      };
    }).sort((a, b) => b.similarity_score - a.similarity_score);

    return {
      allCases: cases || [],
      selectedCase,
      selectedFP,
      rankedMatches
    };
  }
};
