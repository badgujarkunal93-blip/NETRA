import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export const entitiesService = {
  async getPersons(filters = {}) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    let query = supabase.from('persons').select('*');
    
    if (filters.search) {
      query = query.or(`canonical_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getPersonById(id) {
    if (!isSupabaseConfigured) throw new Error("Data service unavailable");
    const { data, error } = await supabase.from('persons').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
};
