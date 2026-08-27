import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export const casesService = {
  async getAllCases(filters = {}) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    let query = supabase.from('cases').select('*');
    
    if (filters.search) {
      query = query.or(`crime_no.ilike.%${filters.search}%,brief_facts.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
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
