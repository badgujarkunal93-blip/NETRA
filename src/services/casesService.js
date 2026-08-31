import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { localDB, filterRows } from './localData.js';

export const casesService = {
  async getAllCases(filters = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('cases').select('*');

        if (filters.search) {
          const q = filters.search.trim();
          query = query.or(`crime_no.ilike.%${q}%,brief_facts.ilike.%${q}%`);
        }

        const category = filters.crime_category || filters.category;
        if (category && category !== 'All') {
          query = query.eq('crime_category', category);
        }

        if (filters.status && filters.status !== 'All') {
          query = query.eq('status', filters.status);
        }

        const station = filters.police_station || filters.station;
        if (station && station !== 'All') {
          query = query.eq('police_station', station);
        }

        if (filters.limit) {
          const limit = Number(filters.limit);
          const page = Number(filters.page || 1);
          const offset = filters.offset !== undefined ? Number(filters.offset) : (page - 1) * limit;
          query = query.range(offset, offset + limit - 1);
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getAllCases failed, falling back to local dataset', err);
      }
    }

    let rows = [...localDB.cases];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(c =>
        (c.crime_no || '').toLowerCase().includes(q) ||
        (c.case_no || '').toLowerCase().includes(q) ||
        (c.brief_facts || '').toLowerCase().includes(q) ||
        (c.police_station || '').toLowerCase().includes(q)
      );
    }

    const category = filters.crime_category || filters.category;
    if (category && category !== 'All') {
      rows = rows.filter(c => c.crime_category === category);
    }

    if (filters.status && filters.status !== 'All') {
      rows = rows.filter(c => c.status === filters.status);
    }

    const station = filters.police_station || filters.station;
    if (station && station !== 'All') {
      rows = rows.filter(c => c.police_station === station);
    }

    if (filters.limit) {
      const limit = Number(filters.limit);
      const offset = filters.offset !== undefined
        ? Number(filters.offset)
        : (Number(filters.page || 1) - 1) * limit;
      rows = rows.slice(offset, offset + limit);
    }

    return rows;
  },

  async getCases(filters = {}) {
    return this.getAllCases(filters);
  },

  async getCaseById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('cases').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return localDB.cases.find(c => c.id === id || c.crime_no === id) || null;
  },


  async getMOSimilarities(caseId = null) {
    const cases = localDB.cases;
    const fps = localDB.mo_fingerprints;
    const sims = localDB.mo_similarities;

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

    const selectedFP = fps.find(fp => fp.case_id === selectedCase.id) || null;
    const relatedSims = sims.filter(
      s => s.case_id_a === selectedCase.id || s.case_id_b === selectedCase.id
    );

    const rankedMatches = relatedSims.map(s => {
      const otherId = s.case_id_a === selectedCase.id ? s.case_id_b : s.case_id_a;
      return {
        case: cases.find(c => c.id === otherId),
        fingerprint: fps.find(fp => fp.case_id === otherId),
        similarity_score: s.similarity_score,
        matching_components: s.matching_components
      };
    }).filter(m => m.case).sort((a, b) => b.similarity_score - a.similarity_score);

    return { allCases: cases, selectedCase, selectedFP, rankedMatches };
  }
};
