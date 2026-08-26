import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
                    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
                    '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
                       (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
                       '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('demo-sih-ciu') && !supabaseAnonKey.includes('dummy_key')
);

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

